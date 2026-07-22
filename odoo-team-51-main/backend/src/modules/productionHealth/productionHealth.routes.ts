import { Router } from "express";
import { PermissionModule } from "@prisma/client";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/rbac.middleware";
import { getProductionHealth } from "../../engines/productionHealthEngine";

export const productionHealthRouter = Router();
productionHealthRouter.use(authMiddleware);

productionHealthRouter.get(
  "/",
  requirePermission(PermissionModule.manufacturing, "Product to Manufacture", "canView"),
  async (req, res) => res.json(await getProductionHealth())
);
