import { PrismaClient } from "@prisma/client";
import { narrate } from "../llm/narrate";

const prisma = new PrismaClient();

function nextPeriod(period: string): string {
  const [y, m] = period.split("-").map(Number);
  const d = new Date(y, m, 1); // m is already 1-indexed -> rolls to next month
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Deterministic moving-average forecast over real Stock Ledger sales
 * decrements — no trained model. Honestly reports `insufficientData: true`
 * with empty arrays rather than fabricating a trend when there isn't enough
 * history yet (a fresh demo dataset created today will usually hit this).
 */
export async function getForecast(productId: number) {
  const salesMovements = await prisma.stockLedger.findMany({
    where: { productId, refType: "sales_order" },
    orderBy: { createdAt: "asc" },
  });

  const byMonth = new Map<string, number>();
  for (const entry of salesMovements) {
    const period = entry.createdAt.toISOString().slice(0, 7);
    byMonth.set(period, (byMonth.get(period) ?? 0) + Math.abs(Number(entry.qtyChange)));
  }
  const history = Array.from(byMonth.entries())
    .map(([period, qty]) => ({ period, qty }))
    .sort((a, b) => a.period.localeCompare(b.period));

  if (history.length < 3) {
    return {
      history,
      forecast: [],
      suggestedReorderQty: null,
      insufficientData: true,
      insight: "Not enough sales history yet to forecast this product reliably.",
    };
  }

  const window = history.slice(-3);
  const avgQty = window.reduce((sum, h) => sum + h.qty, 0) / window.length;
  const forecast = [{ period: nextPeriod(history[history.length - 1].period), qty: Math.round(avgQty) }];

  const product = await prisma.product.findUnique({ where: { id: productId } });
  const suggestedReorderQty = product ? Math.max(0, Math.round(avgQty - Number(product.onHandQty))) : null;

  const deterministicInsight = `Based on the last ${window.length} months, ${product?.name ?? "this product"} averages ${Math.round(avgQty)} units sold per month; suggested reorder quantity is ${suggestedReorderQty}.`;
  const insight = await narrate(deterministicInsight, "summarizing a demand forecast for a business owner");

  return { history, forecast, suggestedReorderQty, insufficientData: false, insight };
}
