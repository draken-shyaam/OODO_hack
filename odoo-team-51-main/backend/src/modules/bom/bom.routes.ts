import { Router } from "express";
import { PermissionModule } from "@prisma/client";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requirePermission, requireAdmin } from "../../middleware/rbac.middleware";
import { validateRequest } from "../../middleware/validateRequest";
import { createBomSchema, updateBomSchema } from "./bom.validation";
import { listBomsHandler, getBomHandler, createBomHandler, updateBomHandler, deleteBomHandler } from "./bom.controller";

export const bomRouter = Router();
bomRouter.use(authMiddleware);

// Viewing a BoM rides on Manufacturing's "BoM" field view right.
bomRouter.get("/", requirePermission(PermissionModule.manufacturing, "BoM", "canView"), listBomsHandler);
bomRouter.get("/:id", requirePermission(PermissionModule.manufacturing, "BoM", "canView"), getBomHandler);

// "Edit BoM: Admin only" is a hard-coded rule (Section 5.2), not part of the
// configurable grid — every write below requires Admin, full stop.
bomRouter.post("/", requireAdmin, validateRequest(createBomSchema), createBomHandler);
bomRouter.patch("/:id", requireAdmin, validateRequest(updateBomSchema), updateBomHandler);
bomRouter.delete("/:id", requireAdmin, deleteBomHandler);
