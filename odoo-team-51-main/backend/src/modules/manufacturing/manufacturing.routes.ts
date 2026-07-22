import { Router } from "express";
import { PermissionModule } from "@prisma/client";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/rbac.middleware";
import { validateRequest } from "../../middleware/validateRequest";
import {
  createManufacturingOrderSchema,
  updateManufacturingOrderSchema,
  updateComponentsSchema,
  updateWorkOrdersSchema,
} from "./manufacturing.validation";
import {
  listManufacturingOrdersHandler,
  getManufacturingOrderHandler,
  createManufacturingOrderHandler,
  updateManufacturingOrderHandler,
  deleteManufacturingOrderHandler,
  confirmManufacturingOrderHandler,
  startManufacturingOrderHandler,
  updateComponentsHandler,
  updateWorkOrdersHandler,
  produceManufacturingOrderHandler,
  cancelManufacturingOrderHandler,
} from "./manufacturing.controller";

export const manufacturingRouter = Router();
manufacturingRouter.use(authMiddleware);

manufacturingRouter.get("/", requirePermission(PermissionModule.manufacturing, "Product to Manufacture", "canView"), listManufacturingOrdersHandler);
manufacturingRouter.get("/:id", requirePermission(PermissionModule.manufacturing, "Product to Manufacture", "canView"), getManufacturingOrderHandler);
manufacturingRouter.post(
  "/",
  requirePermission(PermissionModule.manufacturing, "Product to Manufacture", "canCreate"),
  validateRequest(createManufacturingOrderSchema),
  createManufacturingOrderHandler
);
manufacturingRouter.patch(
  "/:id",
  requirePermission(PermissionModule.manufacturing, "Product to Manufacture", "canEdit"),
  validateRequest(updateManufacturingOrderSchema),
  updateManufacturingOrderHandler
);
manufacturingRouter.delete(
  "/:id",
  requirePermission(PermissionModule.manufacturing, "Product to Manufacture", "canDelete"),
  deleteManufacturingOrderHandler
);

// Note: Confirming a Manufacturing Order is NOT in the hard-coded admin-only
// list (that's only Sales/Purchase confirm + BoM edit) — it's gated by the
// regular "Production Entry" grid right per the wireframe's legend table.
manufacturingRouter.post(
  "/:id/confirm",
  requirePermission(PermissionModule.manufacturing, "Product to Manufacture", "canEdit"),
  confirmManufacturingOrderHandler
);
manufacturingRouter.post(
  "/:id/start",
  requirePermission(PermissionModule.manufacturing, "Product to Manufacture", "canEdit"),
  startManufacturingOrderHandler
);
manufacturingRouter.post(
  "/:id/produce",
  requirePermission(PermissionModule.manufacturing, "Finished Quantity", "canEdit"),
  produceManufacturingOrderHandler
);
manufacturingRouter.post(
  "/:id/cancel",
  requirePermission(PermissionModule.manufacturing, "Product to Manufacture", "canEdit"),
  cancelManufacturingOrderHandler
);
manufacturingRouter.patch(
  "/:id/components",
  requirePermission(PermissionModule.manufacturing, "Product to Manufacture", "canEdit"),
  validateRequest(updateComponentsSchema),
  updateComponentsHandler
);
manufacturingRouter.patch(
  "/:id/work-orders",
  requirePermission(PermissionModule.manufacturing, "Product to Manufacture", "canEdit"),
  validateRequest(updateWorkOrdersSchema),
  updateWorkOrdersHandler
);
