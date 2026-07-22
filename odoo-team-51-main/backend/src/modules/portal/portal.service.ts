import { PrismaClient } from "@prisma/client";
import { AppError } from "../../middleware/errorHandler";

const prisma = new PrismaClient();

export async function getMyProfile(customerId: number) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { id: true, name: true, email: true, phone: true, address: true },
  });
  if (!customer) throw new AppError(404, "Customer not found");
  return customer;
}

export async function listMyOrders(customerId: number) {
  return prisma.salesOrder.findMany({
    where: { customerId },
    include: { lines: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getMyOrder(customerId: number, orderId: number) {
  const so = await prisma.salesOrder.findFirst({
    where: { id: orderId, customerId },
    include: { lines: { include: { product: true } } },
  });
  if (!so) throw new AppError(404, "Order not found");
  return so;
}

export async function listMyReviews(customerId: number) {
  return prisma.customerReview.findMany({ where: { customerId }, orderBy: { createdAt: "desc" } });
}

export async function createReview(customerId: number, salesOrderId: number, rating: number, comment?: string) {
  const so = await prisma.salesOrder.findFirst({ where: { id: salesOrderId, customerId } });
  if (!so) throw new AppError(404, "Order not found");
  if (so.status !== "fully_delivered" && so.status !== "partially_delivered") {
    throw new AppError(400, "You can only review an order that has been delivered");
  }
  return prisma.customerReview.create({ data: { customerId, salesOrderId, rating, comment } });
}

export async function listMyMessages(customerId: number) {
  return prisma.customerCommunication.findMany({ where: { customerId }, orderBy: { createdAt: "desc" } });
}

export async function createMessage(customerId: number, message: string) {
  return prisma.customerCommunication.create({
    data: { customerId, channel: "portal_message", direction: "outbound", message },
  });
}
