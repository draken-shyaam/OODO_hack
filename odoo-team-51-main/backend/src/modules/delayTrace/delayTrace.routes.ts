import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { traceDelay } from "../../engines/delayTracerEngine";
import { AppError } from "../../middleware/errorHandler";

const VALID_ORDER_TYPES = ["sales_order", "purchase_order", "manufacturing_order"] as const;

export const delayTraceRouter = Router();
delayTraceRouter.use(authMiddleware);

delayTraceRouter.get("/:orderType/:orderId", async (req, res) => {
  const { orderType, orderId } = req.params;
  if (!VALID_ORDER_TYPES.includes(orderType as any)) {
    throw new AppError(400, `orderType must be one of: ${VALID_ORDER_TYPES.join(", ")}`);
  }
  res.json(await traceDelay(orderType as (typeof VALID_ORDER_TYPES)[number], Number(orderId)));
});
