import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const BURNOUT_THRESHOLD_MINS = 480; // one 8-hour shift's worth of assigned active work

/**
 * Work Center utilization/queue/idle status, plus an operator burnout
 * heuristic — pure rule-based aggregation over real Work Order + assignee
 * data, no ML. The threshold is a named constant, not a hidden magic number.
 */
export async function getProductionHealth() {
  const workCenters = await prisma.workCenter.findMany();
  const activeWorkOrders = await prisma.moWorkOrder.findMany({
    where: { manufacturingOrder: { status: "in_progress" } },
  });

  const workCenterStats = workCenters.map((wc) => {
    const wos = activeWorkOrders.filter((w) => w.workCenterId === wc.id);
    const activeMins = wos.reduce((sum, w) => sum + (w.realDurationMins ?? w.expectedDurationMins), 0);
    const utilizationPct = wc.shiftCapacityMins > 0 ? Math.round((activeMins / wc.shiftCapacityMins) * 100) : 0;
    return { id: wc.id, name: wc.name, utilizationPct, queueLength: wos.length, idle: wos.length === 0 };
  });

  const activeMOs = await prisma.manufacturingOrder.findMany({
    where: { status: "in_progress" },
    include: { workOrders: true, assignee: true },
  });

  const minsByAssignee = new Map<number, { name: string; totalMins: number }>();
  for (const mo of activeMOs) {
    if (!mo.assigneeId || !mo.assignee) continue;
    const mins = mo.workOrders.reduce((sum, w) => sum + (w.realDurationMins ?? w.expectedDurationMins), 0);
    const existing = minsByAssignee.get(mo.assigneeId) ?? { name: mo.assignee.name, totalMins: 0 };
    existing.totalMins += mins;
    minsByAssignee.set(mo.assigneeId, existing);
  }

  const burnoutFlags = Array.from(minsByAssignee.entries())
    .filter(([, v]) => v.totalMins > BURNOUT_THRESHOLD_MINS)
    .map(([userId, v]) => ({ userId, name: v.name, totalMins: v.totalMins, thresholdMins: BURNOUT_THRESHOLD_MINS }));

  return { workCenters: workCenterStats, burnoutFlags };
}
