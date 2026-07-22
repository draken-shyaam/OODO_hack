import { PrismaClient } from "@prisma/client";
import {
  clusterSignals,
  computeConfidence,
  generateRecommendations,
  dedupeRecommendations,
  type PinRecommendation,
} from "../../engines/pinEngine";

const prisma = new PrismaClient();

async function computeFreeToUseQty(productId: number): Promise<number> {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return 0;

  const soLines = await prisma.salesOrderLine.findMany({
    where: { productId, salesOrder: { status: { in: ["confirmed", "partially_delivered"] } } },
  });
  const soReserved = soLines.reduce((sum, l) => sum + (Number(l.orderedQty) - Number(l.deliveredQty)), 0);

  const moComponents = await prisma.moComponent.findMany({
    where: { productId, manufacturingOrder: { status: { in: ["confirmed", "in_progress"] } } },
  });
  const moReserved = moComponents.reduce((sum, c) => sum + Number(c.toConsumeQty), 0);

  return Number(product.onHandQty) - (soReserved + moReserved);
}

export interface CheckpointItem {
  productId: number;
  qty: number;
}

export interface ProductPinResult {
  productId: number;
  productName: string;
  hasSignals: boolean;
  signals: {
    signalType: string;
    severity: string;
    confidence: number;
    corroborationCount: number;
    reporterTypes: string[];
    descriptions: string[];
  }[];
  recommendations: PinRecommendation[];
}

/**
 * The actual checkpoint fetch — one row per cart product, each with its
 * live-computed confidence and a flattened, deduplicated recommendation
 * list across every active signal cluster touching it. A product with zero
 * active signals still gets a row (hasSignals: false) so the frontend can
 * render an explicit "checked, found nothing" state instead of silently
 * omitting it — an omission reads as "maybe it forgot to check."
 */
export async function getCheckpoint(items: CheckpointItem[]): Promise<ProductPinResult[]> {
  const productIds = items.map((i) => i.productId);
  if (productIds.length === 0) return [];

  const now = new Date();
  const [products, vendors, signals, vendorOffers] = await Promise.all([
    prisma.product.findMany({ where: { id: { in: productIds } } }),
    prisma.vendor.findMany(),
    prisma.marketSignal.findMany({
      where: {
        productId: { in: productIds },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
    }),
    prisma.vendorOffer.findMany({ where: { productId: { in: productIds } } }),
  ]);

  const vendorNames = new Map(vendors.map((v) => [v.id, v.name]));
  const productById = new Map(products.map((p) => [p.id, p]));
  const offersByProduct = new Map<number, typeof vendorOffers>();
  for (const offer of vendorOffers) {
    const list = offersByProduct.get(offer.productId) ?? [];
    list.push(offer);
    offersByProduct.set(offer.productId, list);
  }

  const clusters = clusterSignals(signals);
  const clustersByProduct = new Map<number, typeof clusters>();
  for (const c of clusters) {
    const list = clustersByProduct.get(c.productId) ?? [];
    list.push(c);
    clustersByProduct.set(c.productId, list);
  }

  const results: ProductPinResult[] = [];
  for (const item of items) {
    const product = productById.get(item.productId);
    if (!product) continue;

    const productClusters = clustersByProduct.get(item.productId) ?? [];
    const freeToUseQty = await computeFreeToUseQty(item.productId);

    const ctx = {
      productId: item.productId,
      currentVendorId: product.vendorId,
      currentLeadTimeDays: product.leadTimeDays,
      currentCostPrice: Number(product.costPrice),
      requestedQty: item.qty,
      freeToUseQty,
      vendorOffers: offersByProduct.get(item.productId) ?? [],
      vendorNames,
    };

    const signalSummaries = productClusters.map((cluster) => ({
      signalType: cluster.signalType,
      severity: cluster.signals[cluster.signals.length - 1].severity,
      confidence: computeConfidence(cluster),
      corroborationCount: cluster.signals.length,
      reporterTypes: Array.from(new Set(cluster.signals.map((s) => s.sourceType))),
      descriptions: cluster.signals.map((s) => s.description),
    }));

    const allRecs = productClusters.flatMap((cluster) => generateRecommendations(cluster, ctx));
    const recommendations = productClusters.length > 0 ? dedupeRecommendations(allRecs) : [];

    results.push({
      productId: item.productId,
      productName: product.name,
      hasSignals: productClusters.length > 0,
      signals: signalSummaries,
      recommendations,
    });
  }

  return results;
}
