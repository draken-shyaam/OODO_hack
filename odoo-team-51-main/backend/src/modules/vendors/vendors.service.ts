import { PrismaClient, Severity } from "@prisma/client";
import { AppError } from "../../middleware/errorHandler";
import { generateReference } from "../../utils/generateReference";
import { getVendorPerformance } from "../../engines/vendorPerformanceEngine";

const prisma = new PrismaClient();

export async function listVendors(search?: string) {
  return prisma.vendor.findMany({
    where: search ? { name: { contains: search } } : undefined,
    orderBy: { name: "asc" },
  });
}

export async function getVendor(id: number) {
  const vendor = await prisma.vendor.findUnique({ where: { id } });
  if (!vendor) throw new AppError(404, "Vendor not found");
  return vendor;
}

export async function createVendor(data: { name: string; address?: string; contact?: string }) {
  const count = await prisma.vendor.count();
  const reference = generateReference("VEND", count);
  return prisma.vendor.create({ data: { ...data, reference } });
}

export async function updateVendor(id: number, data: { name?: string; address?: string; contact?: string }) {
  return prisma.vendor.update({ where: { id }, data });
}

export async function deleteVendor(id: number) {
  await prisma.vendor.delete({ where: { id } });
}

export async function addQualityIncident(vendorId: number, description: string, severity: Severity) {
  await prisma.vendor.findUniqueOrThrow({ where: { id: vendorId } }).catch(() => {
    throw new AppError(404, "Vendor not found");
  });
  return prisma.vendorQualityIncident.create({ data: { vendorId, description, severity } });
}

export async function getPerformance(vendorId: number) {
  return getVendorPerformance(vendorId);
}
