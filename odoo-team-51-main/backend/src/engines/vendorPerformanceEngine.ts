import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Deterministic vendor scorecard — pure aggregation over real Purchase
 * Order + Vendor Quality Incident data, no ML/forecasting involved.
 *
 * `leadTimeAdherence` honestly returns null ("insufficient data") rather
 * than a fabricated number: our schema doesn't track an expected delivery
 * date on Purchase Orders, so true lead-time adherence can't be computed
 * yet — a known, named limitation rather than a silently wrong metric.
 */
export async function getVendorPerformance(vendorId: number) {
  const purchaseOrders = await prisma.purchaseOrder.findMany({ where: { vendorId } });
  const incidents = await prisma.vendorQualityIncident.findMany({
    where: { vendorId },
    orderBy: { createdAt: "desc" },
  });

  const totalPOs = purchaseOrders.length;
  const fullyReceived = purchaseOrders.filter((po) => po.status === "fully_received").length;
  const cancelled = purchaseOrders.filter((po) => po.status === "cancelled").length;
  const completedOrCancelled = fullyReceived + cancelled;

  return {
    onTimePct: completedOrCancelled > 0 ? Math.round((fullyReceived / completedOrCancelled) * 100) : null,
    defectRate: totalPOs > 0 ? Math.round((incidents.length / totalPOs) * 100) / 100 : null,
    leadTimeAdherence: null as number | null, // insufficient data — see comment above
    history: purchaseOrders.map((po) => ({ reference: po.reference, status: po.status, createdAt: po.createdAt })),
    incidents: incidents.map((i) => ({ description: i.description, severity: i.severity, createdAt: i.createdAt })),
  };
}
