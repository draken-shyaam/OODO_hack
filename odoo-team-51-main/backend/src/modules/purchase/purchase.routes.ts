import { Router } from "express";
import { PermissionModule } from "@prisma/client";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requirePermission, requireAdmin } from "../../middleware/rbac.middleware";
import { validateRequest } from "../../middleware/validateRequest";
import { createPurchaseOrderSchema, updatePurchaseOrderSchema, receivePurchaseOrderSchema } from "./purchase.validation";
import {
  listPurchaseOrdersHandler,
  getPurchaseOrderHandler,
  createPurchaseOrderHandler,
  updatePurchaseOrderHandler,
  deletePurchaseOrderHandler,
  confirmPurchaseOrderHandler,
  receivePurchaseOrderHandler,
  cancelPurchaseOrderHandler,
} from "./purchase.controller";

export const purchaseRouter = Router();
purchaseRouter.use(authMiddleware);

purchaseRouter.get("/", requirePermission(PermissionModule.purchase, "Vendor", "canView"), listPurchaseOrdersHandler);
purchaseRouter.get("/:id", requirePermission(PermissionModule.purchase, "Vendor", "canView"), getPurchaseOrderHandler);
purchaseRouter.post("/", requirePermission(PermissionModule.purchase, "Vendor", "canCreate"), validateRequest(createPurchaseOrderSchema), createPurchaseOrderHandler);
purchaseRouter.patch("/:id", requirePermission(PermissionModule.purchase, "Vendor", "canEdit"), validateRequest(updatePurchaseOrderSchema), updatePurchaseOrderHandler);
purchaseRouter.delete("/:id", requirePermission(PermissionModule.purchase, "Vendor", "canDelete"), deletePurchaseOrderHandler);

// Confirm/Approve is the hard-coded Admin-only rule — not part of the grid.
purchaseRouter.post("/:id/confirm", requireAdmin, confirmPurchaseOrderHandler);

purchaseRouter.post(
  "/:id/receive",
  requirePermission(PermissionModule.purchase, "Received Quantity", "canEdit"),
  validateRequest(receivePurchaseOrderSchema),
  receivePurchaseOrderHandler
);
purchaseRouter.post("/:id/cancel", requirePermission(PermissionModule.purchase, "Vendor", "canEdit"), cancelPurchaseOrderHandler);
