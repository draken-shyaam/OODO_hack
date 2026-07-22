import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { getDashboard } from "./dashboard.service";

export const dashboardRouter = Router();
dashboardRouter.use(authMiddleware);

dashboardRouter.get("/", async (req, res) => res.json(await getDashboard(req.user!.userId)));
