import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireAdmin } from "../../middleware/rbac.middleware";
import { getAuditLogs } from "./audit.service";

// Admin-only per the wireframe's legend ("Admin can access everything
// including Audit Logs").
export const auditRouter = Router();
auditRouter.use(authMiddleware, requireAdmin);

auditRouter.get("/", async (req, res) => {
  res.json(
    await getAuditLogs({
      dateFrom: req.query.dateFrom as string,
      dateTo: req.query.dateTo as string,
      user: req.query.user as string,
      module: req.query.module as string,
      action: req.query.action as string,
      recordId: req.query.recordId as string,
      entity: req.query.entity as string,
      page: req.query.page as string,
    })
  );
});
