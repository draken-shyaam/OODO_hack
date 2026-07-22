import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function runLowStockAlertJob() {
  const candidates = await prisma.product.findMany({ where: { lowStockThreshold: { not: null } } });
  const alerts = candidates
    .filter((p) => p.lowStockThreshold !== null && Number(p.onHandQty) < Number(p.lowStockThreshold))
    .map((p) => ({ productId: p.id, name: p.name, onHandQty: p.onHandQty, lowStockThreshold: p.lowStockThreshold }));

  if (alerts.length > 0) {
    // eslint-disable-next-line no-console
    console.log("[Low Stock Alert]", JSON.stringify(alerts, null, 2));
  }
  return alerts;
}
