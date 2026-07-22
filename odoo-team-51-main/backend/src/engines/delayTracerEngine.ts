import { PrismaClient } from "@prisma/client";
import { narrate } from "../llm/narrate";

const prisma = new PrismaClient();

type OrderType = "sales_order" | "purchase_order" | "manufacturing_order";

interface ChainRow {
  parentType: OrderType;
  parentId: number;
  childType: OrderType;
  childId: number;
  reason: string;
  depth: number;
}

type ChainRole = "symptom" | "link" | "root_cause";

interface AuditEvent {
  action: string;
  fieldChanged: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: Date;
}

interface EntitySummary {
  type: OrderType;
  id: number;
  reference: string;
  status: string;
  label: string;
  expectedDate: Date | null;
}

interface ChainNode extends EntitySummary {
  reason?: string;
  role: ChainRole;
  resolved: boolean;
  daysOverdue: number | null;
  auditEvents: AuditEvent[];
}

/**
 * The one query in the whole backend that uses `prisma.$queryRaw` instead
 * of the normal query builder — Prisma's client cannot generate a
 * `WITH RECURSIVE` CTE, so this is an intentional, isolated escape hatch.
 *
 * Direction (must match the convention documented on the ProcurementLink
 * model): `parent` = the blocker, `child` = the thing blocked by it. So to
 * find what's blocking a given order, we start by treating IT as the
 * child and walking up through each row's parent, then treating THAT
 * parent as the next child, and so on until a row has no parent — that
 * final node is the root cause.
 *
 * `depth < 10` both caps a runaway chain from bad seed/link data AND is the
 * cycle guard: a malformed A-blocks-B-blocks-A link can't loop forever
 * because the CTE simply stops contributing new rows past 10 hops.
 */
async function getRawChain(orderType: OrderType, orderId: number): Promise<ChainRow[]> {
  return prisma.$queryRaw<ChainRow[]>`
    WITH RECURSIVE chain AS (
      SELECT parentType, parentId, childType, childId, reason, 1 AS depth
      FROM procurement_links
      WHERE childType = ${orderType} AND childId = ${orderId}

      UNION ALL

      SELECT pl.parentType, pl.parentId, pl.childType, pl.childId, pl.reason, c.depth + 1
      FROM procurement_links pl
      JOIN chain c ON pl.childType = c.parentType AND pl.childId = c.parentId
      WHERE c.depth < 10
    )
    SELECT * FROM chain ORDER BY depth ASC;
  `;
}

/** Belt-and-suspenders cycle guard on top of the depth cap: if a (type, id) node
 * reappears further down a chain, the walk is cut there rather than displaying
 * the same node twice in a "deeper" position than it actually occupies. */
function dropRevisits(refs: { type: OrderType; id: number; reason?: string }[]) {
  const seen = new Set<string>();
  const out: typeof refs = [];
  for (const ref of refs) {
    const key = `${ref.type}:${ref.id}`;
    if (seen.has(key)) break;
    seen.add(key);
    out.push(ref);
  }
  return out;
}

const ENTITY_NAME: Record<OrderType, string> = {
  sales_order: "SalesOrder",
  purchase_order: "PurchaseOrder",
  manufacturing_order: "ManufacturingOrder",
};

async function getAuditTrail(type: OrderType, id: number): Promise<AuditEvent[]> {
  const rows = await prisma.auditLog.findMany({
    where: { entity: ENTITY_NAME[type], recordId: id },
    orderBy: { createdAt: "asc" },
    take: 5,
  });
  return rows.map((r) => ({ action: r.action, fieldChanged: r.fieldChanged, oldValue: r.oldValue, newValue: r.newValue, createdAt: r.createdAt }));
}

async function getEntitySummary(type: OrderType, id: number): Promise<EntitySummary | null> {
  if (type === "sales_order") {
    const so = await prisma.salesOrder.findUnique({ where: { id }, include: { customer: true } });
    if (!so) return null;
    return { type, id, reference: so.reference, status: so.status, label: `Sales Order ${so.reference} (${so.customer.name})`, expectedDate: so.dueDate };
  }
  if (type === "manufacturing_order") {
    const mo = await prisma.manufacturingOrder.findUnique({ where: { id }, include: { finishedProduct: true } });
    if (!mo) return null;
    return { type, id, reference: mo.reference, status: mo.status, label: `Manufacturing Order ${mo.reference} (${mo.finishedProduct.name} x${mo.quantity})`, expectedDate: mo.scheduleDate };
  }
  if (type === "purchase_order") {
    const po = await prisma.purchaseOrder.findUnique({ where: { id }, include: { vendor: true } });
    if (!po) return null;
    return { type, id, reference: po.reference, status: po.status, label: `Purchase Order ${po.reference} (${po.vendor.name})`, expectedDate: po.dueDate };
  }
  return null;
}

const TERMINAL_STATUSES = new Set([
  "fully_delivered", "fully_received", "done", "cancelled",
]);

function daysBetween(expected: Date, now: Date): number {
  return Math.floor((now.getTime() - expected.getTime()) / 86_400_000);
}

/** Deterministic template — no LLM involved. Always correct on its own. */
function buildExplanation(path: ChainNode[]): string {
  if (path.length === 0) return "Order not found.";

  if (path.length === 1) {
    return `${path[0].label} has no recorded procurement dependency in its chain — any delay isn't explained by a downstream shortage.`;
  }

  const root = path[path.length - 1];
  const rootIsResolved = root.resolved;

  // If the chain's starting order is itself already complete, this is a
  // historical trace, not a live "why is it late" — say so plainly instead
  // of implying an ongoing problem.
  const startIsResolved = path[0].resolved;
  const prefix = startIsResolved
    ? `${path[0].label} has already been completed (status: '${path[0].status.replace(/_/g, " ")}'). Here is the procurement chain that originally caused its delay: `
    : "";

  const sentences: string[] = [];
  for (let i = 0; i < path.length - 1; i++) {
    sentences.push(`${path[i].label} was delayed because it was blocked by ${path[i + 1].label}`);
  }

  const overdueClause = !rootIsResolved && root.daysOverdue !== null && root.daysOverdue > 0
    ? ` and is ${root.daysOverdue} day${root.daysOverdue === 1 ? "" : "s"} overdue`
    : "";
  sentences.push(
    rootIsResolved
      ? `${root.label} has since reached '${root.status.replace(/_/g, " ")}' and is now resolved`
      : `${root.label} is still '${root.status.replace(/_/g, " ")}'${overdueClause} — this is the current root cause`
  );

  return prefix + sentences.join(", which ") + ".";
}

export async function traceDelay(orderType: OrderType, orderId: number) {
  const rawChain = await getRawChain(orderType, orderId);

  const pathRefs = dropRevisits([
    { type: orderType, id: orderId },
    ...rawChain.map((row) => ({ type: row.parentType, id: row.parentId, reason: row.reason })),
  ]);

  const now = new Date();
  const chain: ChainNode[] = [];
  for (let i = 0; i < pathRefs.length; i++) {
    const ref = pathRefs[i];
    const summary = await getEntitySummary(ref.type, ref.id);
    if (!summary) continue;

    const resolved = TERMINAL_STATUSES.has(summary.status);
    const role: ChainRole = i === 0 ? "symptom" : i === pathRefs.length - 1 ? "root_cause" : "link";
    const auditEvents = await getAuditTrail(ref.type, ref.id);
    const daysOverdue = summary.expectedDate ? daysBetween(summary.expectedDate, now) : null;

    chain.push({ ...summary, reason: ref.reason, role, resolved, daysOverdue, auditEvents });
  }
  // A single-node chain is simultaneously its own symptom and root cause —
  // surfaced as root_cause so the frontend's "no further dependency" styling applies.
  if (chain.length === 1) chain[0].role = "root_cause";

  const explanation = buildExplanation(chain);

  // Narration only smooths the sentence — the `chain` array and the
  // deterministic `explanation` it was built from are always correct on
  // their own, with or without this call.
  const narratedExplanation = await narrate(explanation, "explaining why a supply chain order is delayed, to an operations manager");

  return {
    symptom: chain[0] ?? null,
    rootCause: chain[chain.length - 1] ?? null,
    chain,
    explanation: narratedExplanation,
  };
}
