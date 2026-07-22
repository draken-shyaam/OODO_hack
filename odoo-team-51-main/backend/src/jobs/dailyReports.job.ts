import { PrismaClient } from "@prisma/client";
import { checkDataIntegrity } from "../engines/dataIntegrityEngine";
import { getParetoAnalysis } from "../engines/paretoEngine";
import { narrate } from "../llm/narrate";

const prisma = new PrismaClient();

/**
 * The "AI Operations Assistant" daily digest — NOT a separate system, just
 * composition of the existing deterministic engines into one summary.
 * Exported as a plain function (not just a cron callback) so it can be
 * called directly and verified on demand, not only at 6am.
 */
export async function runDailyReportJob() {
  const [integrity, pareto, totalProducts, openSalesOrders] = await Promise.all([
    checkDataIntegrity(),
    getParetoAnalysis(),
    prisma.product.count(),
    prisma.salesOrder.count({ where: { status: { in: ["draft", "confirmed", "partially_delivered"] } } }),
  ]);

  const topProfitProducts = pareto.products.filter((p) => p.isTop20).map((p) => p.name);

  const deterministicSummary =
    `${totalProducts} products tracked. ${integrity.negativeStockProducts.length} have negative stock, ` +
    `${integrity.productsWithNoLedgerEntry.length} have no ledger history. ${openSalesOrders} sales orders are still open. ` +
    (topProfitProducts.length > 0 ? `Top profit drivers: ${topProfitProducts.join(", ")}.` : "Not enough delivered sales yet to rank profit drivers.");

  const digest = {
    generatedAt: new Date().toISOString(),
    inventory: {
      totalProducts,
      negativeStockCount: integrity.negativeStockProducts.length,
      productsMissingLedgerEntry: integrity.productsWithNoLedgerEntry.length,
    },
    sales: { openOrders: openSalesOrders },
    strategy: { insufficientData: pareto.insufficientData, topProfitProducts },
    summary: await narrate(deterministicSummary, "daily operations digest for a business owner"),
  };

  // eslint-disable-next-line no-console
  console.log("[Daily Report]", JSON.stringify(digest, null, 2));
  return digest;
}
