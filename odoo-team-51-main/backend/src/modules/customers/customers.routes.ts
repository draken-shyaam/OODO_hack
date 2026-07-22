import { Router } from "express";
import { PermissionModule } from "@prisma/client";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/rbac.middleware";
import { listCustomersHandler, getCustomerHandler } from "./customers.controller";

// Customer isn't its own grid module — it's the "Customer" field within the
// Sales grid, mirroring how Vendor is gated against the Purchase grid.
export const customersRouter = Router();
customersRouter.use(authMiddleware);

customersRouter.get("/", requirePermission(PermissionModule.sales, "Customer", "canView"), listCustomersHandler);
customersRouter.get("/:id", requirePermission(PermissionModule.sales, "Customer", "canView"), getCustomerHandler);
