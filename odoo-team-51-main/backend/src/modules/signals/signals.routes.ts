import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { validateRequest } from "../../middleware/validateRequest";
import { createSignalSchema } from "./signals.validation";
import * as signalsService from "./signals.service";

export const signalsRouter = Router();
signalsRouter.use(authMiddleware);

// Any authenticated user can report a signal (the whole point of "collective
// intelligence" — carpenters/dealers/employees etc. are just User accounts).
signalsRouter.get("/", async (req, res) => res.json(await signalsService.listSignals()));
signalsRouter.post("/", validateRequest(createSignalSchema), async (req, res) =>
  res.status(201).json(await signalsService.createSignal(req.body, req.user!.userId))
);

signalsRouter.get("/active", async (req, res) => {
  const productIds = ((req.query.productIds as string) ?? "").split(",").filter(Boolean).map(Number);
  const categories = ((req.query.categories as string) ?? "").split(",").filter(Boolean);
  res.json(await signalsService.getActiveSignals(productIds, categories));
});
