import { Router } from "express";
import { PermissionModule } from "@prisma/client";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requirePermission, requireAdmin } from "../../middleware/rbac.middleware";
import { validateRequest } from "../../middleware/validateRequest";
import { createSalesOrderSchema, updateSalesOrderSchema, deliverSalesOrderSchema, confirmSalesOrderSchema } from "./sales.validation";
import {
  listSalesOrdersHandler,
  getSalesOrderHandler,
  createSalesOrderHandler,
  updateSalesOrderHandler,
  deleteSalesOrderHandler,
  confirmSalesOrderHandler,
  deliverSalesOrderHandler,
  cancelSalesOrderHandler,
} from "./sales.controller";

export const salesRouter = Router();
salesRouter.use(authMiddleware);

salesRouter.get("/", requirePermission(PermissionModule.sales, "Customer", "canView"), listSalesOrdersHandler);
salesRouter.get("/:id", requirePermission(PermissionModule.sales, "Customer", "canView"), getSalesOrderHandler);
salesRouter.post("/", requirePermission(PermissionModule.sales, "Customer", "canCreate"), validateRequest(createSalesOrderSchema), createSalesOrderHandler);
salesRouter.patch("/:id", requirePermission(PermissionModule.sales, "Customer", "canEdit"), validateRequest(updateSalesOrderSchema), updateSalesOrderHandler);
salesRouter.delete("/:id", requirePermission(PermissionModule.sales, "Customer", "canDelete"), deleteSalesOrderHandler);

// Confirm/Approve is the hard-coded Admin-only rule — not part of the grid.
// Body is optional: an empty body is "Confirm as Normal" from the PIN modal.
salesRouter.post("/:id/confirm", requireAdmin, validateRequest(confirmSalesOrderSchema), confirmSalesOrderHandler);

salesRouter.post(
  "/:id/deliver",
  requirePermission(PermissionModule.sales, "Delivered Quantity", "canEdit"),
  validateRequest(deliverSalesOrderSchema),
  deliverSalesOrderHandler
);
salesRouter.post("/:id/cancel", requirePermission(PermissionModule.sales, "Status", "canEdit"), cancelSalesOrderHandler);
