import { PrismaClient } from "@prisma/client";
import { isReadyToClose } from "../manufacturing/manufacturing.service";

const prisma = new PrismaClient();

function toCountMap(rows: { status: string; _count: { _all: number } }[]): Record<string, number> {
  return Object.fromEntries(rows.map((r) => [r.status, r._count._all]));
}

/**
 * "Late" is additive, not a status of its own (matches the wireframe, where
 * the Late pill sits alongside the per-status pills rather than replacing
 * one) — an order counts as late if its dueDate has passed and it hasn't
 * reached a terminal state yet.
 */
async function countLateSalesOrders(where: { salesPersonId?: number }) {
  return prisma.salesOrder.count({
    where: { ...where, dueDate: { lt: new Date() }, status: { notIn: ["fully_delivered", "cancelled"] } },
  });
}

async function countLatePurchaseOrders(where: { responsiblePersonId?: number }) {
  return prisma.purchaseOrder.count({
    where: { ...where, dueDate: { lt: new Date() }, status: { notIn: ["fully_received", "cancelled"] } },
  });
}

/**
 * Manufacturing's "in_progress" bucket from the wireframe is split in two:
 * orders still being worked (`in_progress`) vs. orders where every
 * component has been fully consumed and are just waiting to be marked Done
 * (`to_close`). Neither is a stored status — both are derived here from the
 * same underlying `in_progress` rows, so the split can't drift out of sync
 * with reality the way a separate persisted flag could.
 */
async function splitInProgressManufacturingOrders(where: { assigneeId?: number }) {
  const rows = await prisma.manufacturingOrder.findMany({
    where: { ...where, status: "in_progress" },
    include: { components: true },
  });

  let inProgress = 0;
  let toClose = 0;
  for (const mo of rows) {
    if (isReadyToClose(mo)) toClose++;
    else inProgress++;
  }
  return { inProgress, toClose };
}

async function countLateManufacturingOrders(where: { assigneeId?: number }) {
  return prisma.manufacturingOrder.count({
    where: { ...where, scheduleDate: { lt: new Date() }, status: { notIn: ["done", "cancelled"] } },
  });
}

export async function getDashboard(userId: number) {
  const [
    salesAllRows, salesMineRows, salesAllLate, salesMineLate,
    purchaseAllRows, purchaseMineRows, purchaseAllLate, purchaseMineLate,
    mfgAllRows, mfgMineRows, mfgAllSplit, mfgMineSplit, mfgAllLate, mfgMineLate,
  ] = await Promise.all([
    prisma.salesOrder.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.salesOrder.groupBy({ by: ["status"], where: { salesPersonId: userId }, _count: { _all: true } }),
    countLateSalesOrders({}),
    countLateSalesOrders({ salesPersonId: userId }),

    prisma.purchaseOrder.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.purchaseOrder.groupBy({ by: ["status"], where: { responsiblePersonId: userId }, _count: { _all: true } }),
    countLatePurchaseOrders({}),
    countLatePurchaseOrders({ responsiblePersonId: userId }),

    prisma.manufacturingOrder.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.manufacturingOrder.groupBy({ by: ["status"], where: { assigneeId: userId }, _count: { _all: true } }),
    splitInProgressManufacturingOrders({}),
    splitInProgressManufacturingOrders({ assigneeId: userId }),
    countLateManufacturingOrders({}),
    countLateManufacturingOrders({ assigneeId: userId }),
  ]);

  const salesAll = toCountMap(salesAllRows);
  const salesMine = toCountMap(salesMineRows);
  const purchaseAll = toCountMap(purchaseAllRows);
  const purchaseMine = toCountMap(purchaseMineRows);
  const mfgAll = toCountMap(mfgAllRows);
  const mfgMine = toCountMap(mfgMineRows);

  mfgAll.in_progress = mfgAllSplit.inProgress;
  mfgAll.to_close = mfgAllSplit.toClose;
  mfgMine.in_progress = mfgMineSplit.inProgress;
  mfgMine.to_close = mfgMineSplit.toClose;

  return {
    sales: { all: { ...salesAll, late: salesAllLate }, my: { ...salesMine, late: salesMineLate } },
    purchase: { all: { ...purchaseAll, late: purchaseAllLate }, my: { ...purchaseMine, late: purchaseMineLate } },
    manufacturing: { all: { ...mfgAll, late: mfgAllLate }, my: { ...mfgMine, late: mfgMineLate } },
  };
}
