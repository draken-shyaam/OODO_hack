import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Classic 80/20 profit analysis over real delivered Sales Order lines —
 * profit = (Sales Unit Price - Product Cost Price) x Delivered Qty.
 * Pure aggregation, no ML.
 */
export async function getParetoAnalysis() {
  const lines = await prisma.salesOrderLine.findMany({
    where: { deliveredQty: { gt: 0 } },
    include: { product: true },
  });

  if (lines.length === 0) {
    return { products: [], insufficientData: true };
  }

  const profitByProduct = new Map<number, { name: string; profit: number }>();
  for (const line of lines) {
    const margin = Number(line.salesUnitPrice) - Number(line.product.costPrice);
    const profit = margin * Number(line.deliveredQty);
    const existing = profitByProduct.get(line.productId) ?? { name: line.product.name, profit: 0 };
    existing.profit += profit;
    profitByProduct.set(line.productId, existing);
  }

  const sorted = Array.from(profitByProduct.entries())
    .map(([productId, v]) => ({ productId, name: v.name, profit: Math.round(v.profit * 100) / 100 }))
    .sort((a, b) => b.profit - a.profit);

  const totalProfit = sorted.reduce((sum, p) => sum + p.profit, 0);
  let cumulative = 0;
  const products = sorted.map((p) => {
    cumulative += p.profit;
    const cumulativePct = totalProfit > 0 ? Math.round((cumulative / totalProfit) * 10000) / 100 : 0;
    return { ...p, cumulativePct, isTop20: cumulativePct <= 80 };
  });

  return { products, insufficientData: false };
}
