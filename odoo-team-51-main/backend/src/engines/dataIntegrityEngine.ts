import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Negative stock / missing-ledger / suspicious-movement checks — plain SQL
 * queries against real data, used by the daily cron job (Phase 8) and
 * composed into the "AI Operations Assistant" digest. Not a separate AI
 * system: it's the same kind of deterministic rule-checking as every other
 * engine in this folder.
 */
export async function checkDataIntegrity() {
  const negativeStockProducts = await prisma.product.findMany({
    where: { onHandQty: { lt: 0 } },
    select: { id: true, name: true, onHandQty: true },
  });

  const allProducts = await prisma.product.findMany({ select: { id: true, name: true } });
  const productsWithNoLedgerEntry: { id: number; name: string }[] = [];
  for (const product of allProducts) {
    const count = await prisma.stockLedger.count({ where: { productId: product.id } });
    if (count === 0) productsWithNoLedgerEntry.push(product);
  }

  // Crude absolute threshold for a hackathon demo — a production version
  // would compare against each product's own historical movement size
  // (e.g. > 3 standard deviations from its typical ledger entry).
  const SUSPICIOUS_QTY_THRESHOLD = 100000;
  const suspiciousEntries = await prisma.stockLedger.findMany({
    where: { qtyChange: { gt: SUSPICIOUS_QTY_THRESHOLD } },
    select: { id: true, productId: true, qtyChange: true, reason: true, createdAt: true },
  });

  return { negativeStockProducts, productsWithNoLedgerEntry, suspiciousEntries };
}
