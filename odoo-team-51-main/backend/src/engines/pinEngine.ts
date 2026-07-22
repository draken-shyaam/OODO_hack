import { MarketSignal, VendorOffer } from "@prisma/client";

// Pure, DB-free functions — same shape as forecastingEngine/paretoEngine:
// no I/O, so they can be reused by the checkpoint modal, a future "active
// risk" dashboard tile, and the seed script's own sanity checks.

const CORROBORATION_WINDOW_DAYS = 14;
const AGE_PENALTY_THRESHOLD_DAYS = 7;
const MULTI_SOURCE_BONUS = 25;
const SINGLE_SOURCE_BASE = 60;
const AGE_PENALTY = 10;
const CONFIDENCE_CAP = 95;

export interface SignalCluster {
  productId: number;
  signalType: MarketSignal["signalType"];
  signals: MarketSignal[];
}

/**
 * Groups a product's active signals into clusters by signal type, treating
 * any two signals of the same type reported within CORROBORATION_WINDOW_DAYS
 * of each other as corroborating reports on the same underlying risk rather
 * than independent events. This is what lets confidence move from 60% to
 * 85% the instant a second, independently-sourced report lands — no manual
 * re-tagging, no stored cluster id.
 */
export function clusterSignals(signals: MarketSignal[]): SignalCluster[] {
  const byType = new Map<string, MarketSignal[]>();
  for (const s of signals) {
    const key = `${s.productId}:${s.signalType}`;
    const list = byType.get(key) ?? [];
    list.push(s);
    byType.set(key, list);
  }

  const clusters: SignalCluster[] = [];
  for (const [key, list] of byType.entries()) {
    list.sort((a, b) => a.reportedAt.getTime() - b.reportedAt.getTime());
    let current: MarketSignal[] = [];
    for (const s of list) {
      if (current.length === 0) {
        current = [s];
        continue;
      }
      const last = current[current.length - 1];
      const gapDays = (s.reportedAt.getTime() - last.reportedAt.getTime()) / 86_400_000;
      if (gapDays <= CORROBORATION_WINDOW_DAYS) {
        current.push(s);
      } else {
        clusters.push({ productId: current[0].productId!, signalType: current[0].signalType, signals: current });
        current = [s];
      }
    }
    if (current.length) clusters.push({ productId: current[0].productId!, signalType: current[0].signalType, signals: current });
    void key;
  }
  return clusters;
}

/**
 * One reporter = 60%. A second, INDEPENDENT reporter type (not just a second
 * report from the same kind of source) adds 25%. A cluster whose oldest
 * report is more than 7 days old loses 10% — still active, just less fresh.
 * Capped at 95% because corroborated field reports are still not certainty.
 */
export function computeConfidence(cluster: SignalCluster): number {
  if (cluster.signals.length === 0) return 0;
  const reporterTypes = new Set(cluster.signals.map((s) => s.sourceType));
  let score = SINGLE_SOURCE_BASE;
  if (reporterTypes.size >= 2) score += MULTI_SOURCE_BONUS;

  const oldest = Math.min(...cluster.signals.map((s) => s.reportedAt.getTime()));
  const ageDays = (Date.now() - oldest) / 86_400_000;
  if (ageDays > AGE_PENALTY_THRESHOLD_DAYS) score -= AGE_PENALTY;

  return Math.max(0, Math.min(score, CONFIDENCE_CAP));
}

export type PinActionType = "EXPEDITE" | "VENDOR_SWITCH" | "QTY_ADJUST" | "ACCEPT_RISK";

export interface PinRecommendation {
  type: PinActionType;
  label: string;
  costImpact: number;
  timeImpactDays: number;
  vendorId?: number;
  suggestedQty?: number;
}

export interface ProductPinContext {
  productId: number;
  currentVendorId: number | null;
  currentLeadTimeDays: number | null;
  currentCostPrice: number;
  requestedQty: number;
  freeToUseQty: number;
  vendorOffers: VendorOffer[]; // every known vendor's quote for this product, including the current one
  vendorNames: Map<number, string>;
}

/**
 * Recommendations are generated per signal type from REAL rows (vendor
 * quotes, current stock), not picked off a fixed checklist — a product with
 * no alternate vendor on file never gets a VENDOR_SWITCH box, a manufactured
 * (non-purchased) product never gets EXPEDITE/VENDOR_SWITCH at all, since
 * neither action means anything for it.
 */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** "3 days faster" / "3 days slower" / omitted when there's no schedule change at all. */
function timeLabel(deltaDays: number): string {
  if (deltaDays === 0) return "no schedule change";
  return deltaDays > 0 ? `${deltaDays} days faster` : `${Math.abs(deltaDays)} days slower`;
}

/** "+₹50" / "-₹4" — sign always before the currency symbol, never between it and the number. */
function costLabel(delta: number): string {
  return delta >= 0 ? `+₹${delta}` : `-₹${Math.abs(delta)}`;
}

export function generateRecommendations(cluster: SignalCluster, ctx: ProductPinContext): PinRecommendation[] {
  const recs: PinRecommendation[] = [];
  const currentOffer = ctx.vendorOffers.find((o) => o.vendorId === ctx.currentVendorId);

  if (cluster.signalType === "shortage" || cluster.signalType === "delay") {
    if (currentOffer?.expediteAvailable) {
      const baseLead = currentOffer.leadTimeDays ?? ctx.currentLeadTimeDays ?? 0;
      const expediteLead = currentOffer.expediteLeadDays ?? baseLead;
      const daysFaster = baseLead - expediteLead;
      const fee = round2(Number(currentOffer.expediteFee ?? 0));
      recs.push({
        type: "EXPEDITE",
        label: `Expedite via ${ctx.vendorNames.get(currentOffer.vendorId) ?? "current vendor"} (+₹${fee} cost, ${timeLabel(daysFaster)})`,
        costImpact: fee,
        timeImpactDays: -daysFaster,
        vendorId: currentOffer.vendorId,
      });
    }

    const altOffer = ctx.vendorOffers
      .filter((o) => o.vendorId !== ctx.currentVendorId)
      .sort((a, b) => Number(a.unitPrice) - Number(b.unitPrice))[0];
    if (altOffer) {
      const currentUnitPrice = currentOffer ? Number(currentOffer.unitPrice) : ctx.currentCostPrice;
      const currentLead = currentOffer?.leadTimeDays ?? ctx.currentLeadTimeDays ?? 0;
      const costDelta = round2((Number(altOffer.unitPrice) - currentUnitPrice) * ctx.requestedQty);
      const daysFaster = currentLead - altOffer.leadTimeDays;
      recs.push({
        type: "VENDOR_SWITCH",
        label: `Switch to ${ctx.vendorNames.get(altOffer.vendorId) ?? "alternate vendor"} (${costLabel(costDelta)} cost, ${timeLabel(daysFaster)})`,
        costImpact: costDelta,
        timeImpactDays: -daysFaster,
        vendorId: altOffer.vendorId,
      });
    }

    if (ctx.requestedQty > ctx.freeToUseQty) {
      const suggestedQty = Math.max(0, Math.floor(ctx.freeToUseQty));
      recs.push({
        type: "QTY_ADJUST",
        label: `Reduce order to ${suggestedQty} units (currently in stock)`,
        costImpact: 0,
        timeImpactDays: 0,
        suggestedQty,
      });
    }
  }

  if (cluster.signalType === "price_change" && currentOffer) {
    const altOffer = ctx.vendorOffers
      .filter((o) => o.vendorId !== ctx.currentVendorId)
      .sort((a, b) => Number(a.unitPrice) - Number(b.unitPrice))[0];
    if (altOffer && Number(altOffer.unitPrice) < Number(currentOffer.unitPrice)) {
      const costDelta = round2((Number(altOffer.unitPrice) - Number(currentOffer.unitPrice)) * ctx.requestedQty);
      recs.push({
        type: "VENDOR_SWITCH",
        label: `Lock in lower price with ${ctx.vendorNames.get(altOffer.vendorId) ?? "alternate vendor"} (${costLabel(costDelta)} cost)`,
        costImpact: costDelta,
        timeImpactDays: 0,
        vendorId: altOffer.vendorId,
      });
    }
  }

  recs.push({ type: "ACCEPT_RISK", label: "Proceed without changes", costImpact: 0, timeImpactDays: 0 });
  return recs;
}

/** Dedup across a product's multiple signal clusters — same type+vendor keeps the larger-impact copy. */
export function dedupeRecommendations(all: PinRecommendation[]): PinRecommendation[] {
  const byKey = new Map<string, PinRecommendation>();
  for (const rec of all) {
    const key = `${rec.type}:${rec.vendorId ?? ""}`;
    const existing = byKey.get(key);
    if (!existing || Math.abs(rec.costImpact) + Math.abs(rec.timeImpactDays) > Math.abs(existing.costImpact) + Math.abs(existing.timeImpactDays)) {
      byKey.set(key, rec);
    }
  }
  return Array.from(byKey.values());
}

/**
 * Same baseline lead-time math the auto-procurement engine already uses
 * (vendor lead time, or the product's own lead time for manufactured goods),
 * with an applied EXPEDITE/VENDOR_SWITCH action's timeImpactDays layered on
 * top — never a second, independently-invented "promise date" calculation.
 */
export function estimateDeliveryDays(baseLeadTimeDays: number, appliedTimeImpactDays: number): number {
  return Math.max(1, Math.round(baseLeadTimeDays + appliedTimeImpactDays));
}
