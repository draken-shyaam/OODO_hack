import { PrismaClient } from "@prisma/client";
import { AppError } from "../../middleware/errorHandler";

const prisma = new PrismaClient();

export async function listCustomers(search?: string) {
  return prisma.customer.findMany({
    where: search
      ? { OR: [{ name: { contains: search } }, { email: { contains: search } }] }
      : undefined,
    orderBy: { name: "asc" },
  });
}

export async function getCustomer(id: number) {
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) throw new AppError(404, "Customer not found");
  return customer;
}
