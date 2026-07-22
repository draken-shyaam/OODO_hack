import { Router } from "express";
import { PermissionModule } from "@prisma/client";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/rbac.middleware";
import { validateRequest } from "../../middleware/validateRequest";
import { createVendorSchema, updateVendorSchema, createQualityIncidentSchema } from "./vendors.validation";
import {
  listVendorsHandler,
  getVendorHandler,
  createVendorHandler,
  updateVendorHandler,
  deleteVendorHandler,
  addQualityIncidentHandler,
  getPerformanceHandler,
} from "./vendors.controller";

// Vendor isn't its own grid module — it's the "Vendor" field within the
// Purchase grid, so every route here is gated against PermissionModule.purchase.
export const vendorsRouter = Router();
vendorsRouter.use(authMiddleware);

vendorsRouter.get("/", requirePermission(PermissionModule.purchase, "Vendor", "canView"), listVendorsHandler);
vendorsRouter.get("/:id", requirePermission(PermissionModule.purchase, "Vendor", "canView"), getVendorHandler);
vendorsRouter.get("/:id/performance", requirePermission(PermissionModule.purchase, "Vendor", "canView"), getPerformanceHandler);
vendorsRouter.post(
  "/",
  requirePermission(PermissionModule.purchase, "Vendor", "canCreate"),
  validateRequest(createVendorSchema),
  createVendorHandler
);
vendorsRouter.patch(
  "/:id",
  requirePermission(PermissionModule.purchase, "Vendor", "canEdit"),
  validateRequest(updateVendorSchema),
  updateVendorHandler
);
vendorsRouter.delete("/:id", requirePermission(PermissionModule.purchase, "Vendor", "canDelete"), deleteVendorHandler);
vendorsRouter.post(
  "/:id/quality-incidents",
  requirePermission(PermissionModule.purchase, "Vendor", "canEdit"),
  validateRequest(createQualityIncidentSchema),
  addQualityIncidentHandler
);
