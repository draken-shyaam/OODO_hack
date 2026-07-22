import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Detects 2+ Draft Purchase Orders to the same vendor and suggests merging
 * them into one PO. Pure SQL grouping + threshold logic, no AI.
 */
export async function getBatchPurchaseSuggestions() {
  const draftPOs = await prisma.purchaseOrder.findMany({
    where: { status: "draft" },
    include: { lines: true, vendor: true },
  });

  const byVendor = new Map<number, typeof draftPOs>();
  for (const po of draftPOs) {
    const list = byVendor.get(po.vendorId) ?? [];
    list.push(po);
    byVendor.set(po.vendorId, list);
  }

  const suggestions = [];
  for (const [vendorId, pos] of byVendor.entries()) {
    if (pos.length < 2) continue;
    const suggestedMergedQty = pos.reduce(
      (sum, po) => sum + po.lines.reduce((lineSum, l) => lineSum + Number(l.orderedQty), 0),
      0
    );
    suggestions.push({
      vendorId,
      vendorName: pos[0].vendor.name,
      draftPoIds: pos.map((p) => p.id),
      draftPoReferences: pos.map((p) => p.reference),
      suggestedMergedQty,
    });
  }

  return suggestions;
}
