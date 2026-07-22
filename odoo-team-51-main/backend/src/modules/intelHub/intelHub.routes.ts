import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireAdmin } from "../../middleware/rbac.middleware";
import { validateRequest } from "../../middleware/validateRequest";
import { createIntelPostSchema, verifyIntelPostSchema } from "./intelHub.validation";
import {
  createIntelPostHandler,
  listIntelPostsHandler,
  getIntelPostHandler,
  verifyIntelPostHandler,
  rejectIntelPostHandler,
  getLeaderboardHandler,
  getNotificationStateHandler,
  markIntelHubViewedHandler,
} from "./intelHub.controller";

export const intelHubRouter = Router();
intelHubRouter.use(authMiddleware);

// Any authenticated user can post or browse a lead — same "collective
// intelligence" posture as Market Signals; verification is the only
// admin-gated step, not participation itself.
intelHubRouter.get("/", listIntelPostsHandler);
intelHubRouter.post("/", validateRequest(createIntelPostSchema), createIntelPostHandler);
intelHubRouter.get("/leaderboard", getLeaderboardHandler);
intelHubRouter.get("/notifications", getNotificationStateHandler);
intelHubRouter.post("/mark-viewed", markIntelHubViewedHandler);
intelHubRouter.get("/:id", getIntelPostHandler);
intelHubRouter.post("/:id/verify", requireAdmin, validateRequest(verifyIntelPostSchema), verifyIntelPostHandler);
intelHubRouter.post("/:id/reject", requireAdmin, rejectIntelPostHandler);
