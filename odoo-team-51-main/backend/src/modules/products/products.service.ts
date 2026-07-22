import { PrismaClient, Product } from "@prisma/client";
import { AppError } from "../../middleware/errorHandler";
import { generateReference } from "../../utils/generateReference";
import { getIO } from "../../sockets/socket.server";
import { SOCKET_EVENTS } from "../../sockets/events";

const prisma = new PrismaClient();

/**
 * Reserved Qty = (Ordered - Delivered) across this product's lines on
 * non-fully-delivered CONFIRMED Sales Orders, PLUS To-Consume across this
 * product's components on non-Done CONFIRMED/IN-PROGRESS Manufacturing
 * Orders. Draft orders never reserve — reservation starts at Confirm.
 */
async function computeReservedQty(productId: number): Promise<number> {
  const soLines = await prisma.salesOrderLine.findMany({
    where: { productId, salesOrder: { status: { in: ["confirmed", "partially_delivered"] } } },
  });
  const soReserved = soLines.reduce((sum, l) => sum + (Number(l.orderedQty) - Number(l.deliveredQty)), 0);

  const moComponents = await prisma.moComponent.findMany({
    where: { productId, manufacturingOrder: { status: { in: ["confirmed", "in_progress"] } } },
  });
  const moReserved = moComponents.reduce((sum, c) => sum + Number(c.toConsumeQty), 0);

  return soReserved + moReserved;
}

async function withComputedQty(product: Product) {
  const reservedQty = await computeReservedQty(product.id);
  return { ...product, reservedQty, freeToUseQty: Number(product.onHandQty) - reservedQty };
}

export async function listProducts(search?: string) {
  const products = await prisma.product.findMany({
    where: search ? { name: { contains: search } } : undefined,
    orderBy: { name: "asc" },
  });
  return Promise.all(products.map(withComputedQty));
}

export async function getProduct(id: number) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new AppError(404, "Product not found");
  return withComputedQty(product);
}

interface CreateProductInput {
  name: string;
  dimensions?: string;
  specifications?: string;
  leadTimeDays?: number;
  movementRate?: number;
  minOrderQty?: number;
  lowStockThreshold?: number;
  salesPrice: number;
  costPrice: number;
  procureOnDemand?: boolean;
  procurementMethod?: "purchase" | "manufacturing";
  vendorId?: number;
  bomId?: number;
}

export async function createProduct(data: CreateProductInput, userId?: number) {
  const count = await prisma.product.count();
  const reference = generateReference("PROD", count);
  const product = await prisma.product.create({ data: { ...data, reference } });
  await prisma.auditLog.create({
    data: { module: "product", entity: "Product", recordId: product.id, recordRef: product.reference, action: "created", userId },
  });
  return withComputedQty(product);
}

export async function updateProduct(id: number, data: Partial<CreateProductInput>, userId?: number) {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, "Product not found");

  // Prisma throws P2025 if the id doesn't exist; errorHandler maps that to 404.
  const product = await prisma.product.update({ where: { id }, data });

  const priceFields: { key: keyof CreateProductInput; label: string }[] = [
    { key: "salesPrice", label: "Sales Price" },
    { key: "costPrice", label: "Cost Price" },
  ];
  for (const { key, label } of priceFields) {
    if (data[key] !== undefined && String(existing[key]) !== String(data[key])) {
      await prisma.auditLog.create({
        data: {
          module: "product",
          entity: "Product",
          recordId: id,
          recordRef: product.reference,
          action: "updated",
          fieldChanged: label,
          oldValue: String(existing[key]),
          newValue: String(data[key]),
          userId,
        },
      });
    }
  }

  return withComputedQty(product);
}

export async function deleteProduct(id: number, userId?: number) {
  const existing = await prisma.product.findUnique({ where: { id } });
  await prisma.product.delete({ where: { id } });
  await prisma.auditLog.create({
    data: { module: "product", entity: "Product", recordId: id, recordRef: existing?.reference, action: "deleted", userId },
  });
}

export async function updateProductPhoto(id: number, photoUrl: string, userId?: number) {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, "Product not found");

  const product = await prisma.product.update({ where: { id }, data: { photoUrl } });
  await prisma.auditLog.create({
    data: { module: "product", entity: "Product", recordId: id, recordRef: product.reference, action: "updated", fieldChanged: "Photo", userId },
  });

  return withComputedQty(product);
}

/**
 * Stock Reconciliation: the ONLY way to directly change On Hand Qty outside
 * of a Sales/Purchase/Manufacturing transaction. Always writes a StockLedger
 * row (so the ledger and the product's onHandQty can never silently drift
 * apart) and an AuditLog row.
 */
export async function reconcileStock(productId: number, newOnHandQty: number, reason: string, userId: number) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new AppError(404, "Product not found");

  const qtyChange = newOnHandQty - Number(product.onHandQty);

  const updated = await prisma.$transaction(async (tx) => {
    const updatedProduct = await tx.product.update({ where: { id: productId }, data: { onHandQty: newOnHandQty } });
    await tx.stockLedger.create({
      data: { productId, qtyChange, refType: "reconciliation", refId: productId, reason, userId },
    });
    await tx.auditLog.create({
      data: {
        module: "product",
        entity: "Product",
        recordId: productId,
        recordRef: product.reference,
        action: "updated",
        fieldChanged: "On Hand Qty",
        oldValue: String(product.onHandQty),
        newValue: String(newOnHandQty),
        userId,
      },
    });
    return updatedProduct;
  });

  const result = await withComputedQty(updated);
  getIO().emit(SOCKET_EVENTS.STOCK_UPDATED, { productId, onHandQty: Number(result.onHandQty), freeToUseQty: result.freeToUseQty });

  return result;
}
