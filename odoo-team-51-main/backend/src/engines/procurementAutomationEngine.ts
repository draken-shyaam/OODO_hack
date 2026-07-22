import { Prisma, LinkEntityType, Product } from "@prisma/client";
import { generateReference } from "../utils/generateReference";

type TxClient = Prisma.TransactionClient;

interface TriggerContext {
  triggerType: "sales_order" | "manufacturing_order";
  triggerId: number;
  userId: number;
}

/** A PIN VENDOR_SWITCH/EXPEDITE action applied at confirm time, overriding what the default procurement strategy would otherwise pick. */
export interface ProcurementOverride {
  vendorId?: number;
  expediteLeadDays?: number;
}

/**
 * Reserved Qty for a product, computed INSIDE a transaction. Mirrors
 * products.service's read-side version exactly — duplicated rather than
 * imported because this one must run against the transaction client (`tx`),
 * not the top-level Prisma client, so it sees uncommitted writes from
 * earlier in the same transaction.
 */
export async function computeReservedQtyTx(tx: TxClient, productId: number): Promise<number> {
  const soLines = await tx.salesOrderLine.findMany({
    where: { productId, salesOrder: { status: { in: ["confirmed", "partially_delivered"] } } },
  });
  const soReserved = soLines.reduce((sum, l) => sum + (Number(l.orderedQty) - Number(l.deliveredQty)), 0);

  const moComponents = await tx.moComponent.findMany({
    where: { productId, manufacturingOrder: { status: { in: ["confirmed", "in_progress"] } } },
  });
  const moReserved = moComponents.reduce((sum, c) => sum + Number(c.toConsumeQty), 0);

  return soReserved + moReserved;
}

/**
 * Call after any reservation-creating status change (Sales Order confirm,
 * Manufacturing Order confirm). If the product is now reserved beyond what's
 * on hand AND it's configured for auto-procurement, creates the matching
 * Purchase Order or Manufacturing Order for the shortfall, links it via
 * ProcurementLink, and — if it created an MO — recurses into THAT MO's own
 * components, since manufacturing the shortfall can itself reveal a further
 * shortage one level up the supply chain (this is what builds multi-hop
 * chains like SO -> MO -> PO for the Delay Tracer to walk).
 */
export async function checkAndTriggerProcurement(
  tx: TxClient,
  productId: number,
  ctx: TriggerContext,
  override?: ProcurementOverride
): Promise<void> {
  const product = await tx.product.findUnique({ where: { id: productId } });
  if (!product) return;

  const reserved = await computeReservedQtyTx(tx, productId);
  const shortfall = reserved - Number(product.onHandQty);
  if (shortfall <= 0) return;
  if (!product.procureOnDemand || !product.procurementMethod) return;

  if (product.procurementMethod === "purchase") {
    await createAutoPurchaseOrder(tx, product, shortfall, ctx, override);
  } else if (product.procurementMethod === "manufacturing") {
    await createAutoManufacturingOrder(tx, product, shortfall, ctx);
  }
}

async function createAutoPurchaseOrder(tx: TxClient, product: Product, shortfall: number, ctx: TriggerContext, override?: ProcurementOverride) {
  const vendorId = override?.vendorId ?? product.vendorId;
  if (!vendorId) return;

  // A VENDOR_SWITCH action means the PO's price/lead time come from THAT
  // vendor's quote, not the product's default cost price — otherwise
  // switching vendors in the PIN modal would have no real effect on the PO.
  const vendorOffer = await tx.vendorOffer.findUnique({ where: { vendorId_productId: { vendorId, productId: product.id } } });
  const costUnitPrice = vendorOffer ? vendorOffer.unitPrice : product.costPrice;
  const leadDays = override?.expediteLeadDays ?? vendorOffer?.leadTimeDays ?? product.leadTimeDays ?? 7;
  const dueDate = new Date(Date.now() + leadDays * 24 * 60 * 60 * 1000);

  const count = await tx.purchaseOrder.count();
  const po = await tx.purchaseOrder.create({
    data: {
      reference: generateReference("PO", count),
      vendorId,
      responsiblePersonId: ctx.userId,
      status: "confirmed",
      dueDate,
      lines: { create: [{ productId: product.id, orderedQty: shortfall, costUnitPrice }] },
    },
  });

  await tx.procurementLink.create({
    data: {
      parentType: LinkEntityType.purchase_order,
      parentId: po.id,
      childType: ctx.triggerType === "sales_order" ? LinkEntityType.sales_order : LinkEntityType.manufacturing_order,
      childId: ctx.triggerId,
      reason: "stock_shortage",
    },
  });

  await tx.auditLog.create({
    data: { module: "purchase", entity: "PurchaseOrder", recordId: po.id, recordRef: po.reference, action: "created", userId: ctx.userId },
  });
}

async function createAutoManufacturingOrder(tx: TxClient, product: Product, shortfall: number, ctx: TriggerContext) {
  if (!product.bomId) return;

  const bom = await tx.bom.findUnique({ where: { id: product.bomId }, include: { components: true, workOrderTemplates: true } });
  if (!bom) return;

  const ratio = shortfall / Number(bom.quantity);
  const count = await tx.manufacturingOrder.count();

  const mo = await tx.manufacturingOrder.create({
    data: {
      reference: generateReference("MO", count),
      finishedProductId: product.id,
      quantity: shortfall,
      bomId: bom.id,
      assigneeId: ctx.userId,
      status: "confirmed",
      components: {
        create: bom.components.map((c) => ({ productId: c.componentId, toConsumeQty: Number(c.toConsumeQty) * ratio })),
      },
      workOrders: {
        create: bom.workOrderTemplates.map((w) => ({
          operation: w.operation,
          workCenterId: w.workCenterId,
          expectedDurationMins: Math.round(Number(w.expectedDurationMins) * ratio),
        })),
      },
    },
    include: { components: true },
  });

  await tx.procurementLink.create({
    data: {
      parentType: LinkEntityType.manufacturing_order,
      parentId: mo.id,
      childType: ctx.triggerType === "sales_order" ? LinkEntityType.sales_order : LinkEntityType.manufacturing_order,
      childId: ctx.triggerId,
      reason: "stock_shortage",
    },
  });

  await tx.auditLog.create({
    data: { module: "manufacturing", entity: "ManufacturingOrder", recordId: mo.id, recordRef: mo.reference, action: "created", userId: ctx.userId },
  });

  // Recurse: this new MO just reserved its own components — check each one.
  for (const component of mo.components) {
    await checkAndTriggerProcurement(tx, component.productId, {
      triggerType: "manufacturing_order",
      triggerId: mo.id,
      userId: ctx.userId,
    });
  }
}
