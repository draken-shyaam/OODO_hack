import { PrismaClient } from "@prisma/client";
import { AppError } from "../../middleware/errorHandler";
import { generateReference } from "../../utils/generateReference";

const prisma = new PrismaClient();

const includeAll = { components: true, workOrderTemplates: true } as const;

export async function listBoms(search?: string) {
  return prisma.bom.findMany({
    where: search
      ? { OR: [{ reference: { contains: search } }, { shortReference: { contains: search } }, { product: { name: { contains: search } } }] }
      : undefined,
    include: { product: true },
    orderBy: { reference: "asc" },
  });
}

export async function getBom(id: number) {
  const bom = await prisma.bom.findUnique({ where: { id }, include: includeAll });
  if (!bom) throw new AppError(404, "BoM not found");
  return bom;
}

interface ComponentInput {
  componentId: number;
  toConsumeQty: number;
}
interface WorkOrderTemplateInput {
  operation: string;
  workCenterId: number;
  expectedDurationMins: number;
}
interface CreateBomInput {
  productId: number;
  quantity: number;
  shortReference?: string;
  components: ComponentInput[];
  workOrderTemplates: WorkOrderTemplateInput[];
}

// BoM isn't its own grid module (it rides on Manufacturing's "BoM" field —
// see bom.routes.ts), and "bom" isn't a value in the PermissionModule enum,
// so every audit entry here is filed under module "manufacturing" with
// entity "Bom". The Logs button pairs that with `entity=Bom` so it never
// collides with ManufacturingOrder rows that happen to share a numeric id.
export async function createBom(data: CreateBomInput, userId?: number) {
  const count = await prisma.bom.count();
  const reference = generateReference("BOM", count);

  const bom = await prisma.bom.create({
    data: {
      reference,
      productId: data.productId,
      quantity: data.quantity,
      shortReference: data.shortReference,
      components: { create: data.components },
      workOrderTemplates: { create: data.workOrderTemplates },
    },
    include: includeAll,
  });

  await prisma.auditLog.create({
    data: { module: "manufacturing", entity: "Bom", recordId: bom.id, recordRef: bom.reference, action: "created", userId },
  });

  return bom;
}

interface UpdateBomInput {
  quantity?: number;
  shortReference?: string;
  components?: ComponentInput[];
  workOrderTemplates?: WorkOrderTemplateInput[];
}

export async function updateBom(id: number, data: UpdateBomInput, userId?: number) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.bom.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, "BoM not found");

    if (data.quantity !== undefined || data.shortReference !== undefined) {
      await tx.bom.update({
        where: { id },
        data: { ...(data.quantity !== undefined ? { quantity: data.quantity } : {}), ...(data.shortReference !== undefined ? { shortReference: data.shortReference } : {}) },
      });
    }
    if (data.components) {
      await tx.bomLine.deleteMany({ where: { bomId: id } });
      await tx.bomLine.createMany({ data: data.components.map((c) => ({ bomId: id, ...c })) });
    }
    if (data.workOrderTemplates) {
      await tx.bomWorkOrderTemplate.deleteMany({ where: { bomId: id } });
      await tx.bomWorkOrderTemplate.createMany({ data: data.workOrderTemplates.map((w) => ({ bomId: id, ...w })) });
    }

    await tx.auditLog.create({
      data: {
        module: "manufacturing",
        entity: "Bom",
        recordId: id,
        recordRef: existing.reference,
        action: "updated",
        fieldChanged: data.components ? "Components" : data.workOrderTemplates ? "Work Orders" : "Quantity",
        userId,
      },
    });

    const bom = await tx.bom.findUnique({ where: { id }, include: includeAll });
    if (!bom) throw new AppError(404, "BoM not found");
    return bom;
  });
}

export async function deleteBom(id: number, userId?: number) {
  const existing = await prisma.bom.findUnique({ where: { id } });
  await prisma.bom.delete({ where: { id } });
  await prisma.auditLog.create({
    data: { module: "manufacturing", entity: "Bom", recordId: id, recordRef: existing?.reference, action: "deleted", userId },
  });
}
