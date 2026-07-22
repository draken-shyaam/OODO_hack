import { PrismaClient, AuditAction, PermissionModule, Prisma } from "@prisma/client";

const prisma = new PrismaClient();
const PAGE_SIZE = 10;

interface AuditFilters {
  dateFrom?: string;
  dateTo?: string;
  user?: string;
  module?: string;
  action?: string;
  recordId?: string;
  entity?: string;
  page?: string;
}

const VALID_MODULES = new Set(Object.values(PermissionModule));
const VALID_ACTIONS = new Set(Object.values(AuditAction));

export async function getAuditLogs(filters: AuditFilters) {
  const where: Prisma.AuditLogWhereInput = {
    ...(filters.dateFrom || filters.dateTo
      ? { createdAt: { ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}), ...(filters.dateTo ? { lte: new Date(`${filters.dateTo}T23:59:59.999`) } : {}) } }
      : {}),
    ...(filters.user ? { userId: Number(filters.user) } : {}),
    ...(filters.module && VALID_MODULES.has(filters.module as PermissionModule) ? { module: filters.module as PermissionModule } : {}),
    ...(filters.action && VALID_ACTIONS.has(filters.action as AuditAction) ? { action: filters.action as AuditAction } : {}),
    ...(filters.recordId ? { recordId: Number(filters.recordId) } : {}),
    ...(filters.entity ? { entity: filters.entity } : {}),
  };

  const page = Math.max(1, Number(filters.page) || 1);

  const [rows, total, created, updated, deleted] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.count({ where: { ...where, action: "created" } }),
    prisma.auditLog.count({ where: { ...where, action: "updated" } }),
    prisma.auditLog.count({ where: { ...where, action: "deleted" } }),
  ]);

  return {
    summary: { total, created, updated, deleted },
    rows,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}
