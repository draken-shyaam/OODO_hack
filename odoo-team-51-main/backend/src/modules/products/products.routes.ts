import { Router } from "express";
import { PermissionModule } from "@prisma/client";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/rbac.middleware";
import { validateRequest } from "../../middleware/validateRequest";
import { uploadProductPhoto } from "../../middleware/upload.middleware";
import { createProductSchema, updateProductSchema, reconcileStockSchema } from "./products.validation";
import {
  listProductsHandler,
  getProductHandler,
  createProductHandler,
  updateProductHandler,
  deleteProductHandler,
  updateProductPhotoHandler,
  reconcileStockHandler,
} from "./products.controller";

export const productsRouter = Router();
productsRouter.use(authMiddleware);

productsRouter.get("/", requirePermission(PermissionModule.product, "Product", "canView"), listProductsHandler);
productsRouter.get("/:id", requirePermission(PermissionModule.product, "Product", "canView"), getProductHandler);
productsRouter.post(
  "/",
  requirePermission(PermissionModule.product, "Product", "canCreate"),
  validateRequest(createProductSchema),
  createProductHandler
);
productsRouter.patch(
  "/:id",
  requirePermission(PermissionModule.product, "Product", "canEdit"),
  validateRequest(updateProductSchema),
  updateProductHandler
);
productsRouter.delete("/:id", requirePermission(PermissionModule.product, "Product", "canDelete"), deleteProductHandler);
productsRouter.post(
  "/:id/photo",
  requirePermission(PermissionModule.product, "Product", "canEdit"),
  uploadProductPhoto,
  updateProductPhotoHandler
);

// Stock reconciliation is gated on Edit rights to "On Hand Qty" specifically
// (not the generic Product edit right), since it bypasses normal PATCH.
productsRouter.post(
  "/:id/reconcile-stock",
  requirePermission(PermissionModule.product, "On Hand Qty", "canEdit"),
  validateRequest(reconcileStockSchema),
  reconcileStockHandler
);
