import { Request, Response, NextFunction } from "express";
import { PrismaClient, PermissionModule } from "@prisma/client";

const prisma = new PrismaClient();

export type PermissionAction = "canCreate" | "canView" | "canEdit" | "canDelete";

/**
 * Module-level "hard-coded" rules from the wireframe's legend table — these
 * are NOT configurable via the per-field grid, regardless of what an Admin
 * sets for a user. Checked before the granular grid is even consulted.
 */
const HARD_CODED_RULES = {
  confirmSalesOrPurchase: (isAdmin: boolean) => isAdmin,
  editBom: (isAdmin: boolean) => isAdmin,
};

/**
 * Requires the caller to be Admin, full stop. Use on routes the hard-coded
 * rules above gate (POST /api/sales/:id/confirm, POST /api/purchase/:id/confirm,
 * any write to /api/bom).
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  if (!req.user.isAdmin) {
    res.status(403).json({
      error: "Only an Admin can perform this action",
      module: null,
      field: null,
      action: "approve",
    });
    return;
  }
  next();
}

/**
 * Requires the logged-in user to have a specific action permitted on a
 * specific (module, field) pair, per the granular grid seeded in Permission.
 * Admins always pass — "Admin: Full access" is unconditional, exactly as
 * the wireframe's legend states, and is never overridden by grid rows.
 *
 * Permissions are re-read from the database on every request rather than
 * embedded in the JWT, so an Admin editing someone's grid takes effect
 * immediately without forcing that user to log in again.
 */
export function requirePermission(module: PermissionModule, field: string, action: PermissionAction) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    if (req.user.isAdmin) {
      next();
      return;
    }

    const permission = await prisma.permission.findUnique({
      where: { userId_module_field: { userId: req.user.userId, module, field } },
    });

    if (!permission || !permission[action]) {
      res.status(403).json({ error: "Permission denied", module, field, action });
      return;
    }

    next();
  };
}

/**
 * Looser check used to decide whether to even SHOW a module (e.g. hide a
 * Master Menu item server-side for list endpoints) — true if the user can
 * view at least one field of the module, or is Admin.
 */
export async function hasAnyViewAccess(userId: number, isAdmin: boolean, module: PermissionModule): Promise<boolean> {
  if (isAdmin) return true;
  const count = await prisma.permission.count({
    where: { userId, module, canView: true },
  });
  return count > 0;
}

/**
 * Strips any field the user does NOT have `action` rights to, per the
 * granular grid, before a create/update payload reaches the database.
 * Admins pass everything through untouched. Fields with no entry in
 * `fieldMap` (i.e. not part of the wireframe's grid at all — bolt-on
 * fields like Lead Time/Movement Rate) are conservatively stripped for
 * non-admins too, since there's no grid row to grant them.
 *
 * This is defense-in-depth: the frontend already disables fields a user
 * can't touch, but this guarantees the API itself enforces it even if
 * someone bypasses the UI.
 */
export async function filterByFieldPermission(
  userId: number,
  isAdmin: boolean,
  module: PermissionModule,
  action: "canCreate" | "canEdit",
  payload: Record<string, unknown>,
  fieldMap: Record<string, string>
): Promise<Record<string, unknown>> {
  if (isAdmin) return payload;

  const permissions = await prisma.permission.findMany({ where: { userId, module } });
  const allowedFields = new Set(permissions.filter((p) => p[action]).map((p) => p.field));

  const filtered: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    const label = fieldMap[key];
    if (label && allowedFields.has(label)) {
      filtered[key] = value;
    }
  }
  return filtered;
}

export { HARD_CODED_RULES };
