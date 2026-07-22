import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { getForecast } from "../../engines/forecastingEngine";
import { getParetoAnalysis } from "../../engines/paretoEngine";
import { getBatchPurchaseSuggestions } from "../../engines/batchPurchaseOptimizer";

// Read-only analytics — any authenticated user can view Insights (it never
// writes anything), so no per-field grid entry is needed for this module.
export const insightsRouter = Router();
insightsRouter.use(authMiddleware);

insightsRouter.get("/forecast/:productId", async (req, res) => res.json(await getForecast(Number(req.params.productId))));
insightsRouter.get("/pareto", async (req, res) => res.json(await getParetoAnalysis()));
insightsRouter.get("/batch-purchase-suggestions", async (req, res) => res.json(await getBatchPurchaseSuggestions()));
