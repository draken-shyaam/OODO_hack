import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { AppError } from "../../middleware/errorHandler";
import { getCheckpoint } from "./pin.service";

export const pinRouter = Router();
pinRouter.use(authMiddleware);

// GET /api/pin/signals?productIds=1,2,3&qtys=10,5,8
// Called by the Sales Order "Confirm" checkpoint modal, once per cart, with
// every line's product id and requested qty so recommendations (especially
// QTY_ADJUST and the cost/time deltas) are computed against this cart, not
// a generic per-product summary.
pinRouter.get("/signals", async (req, res) => {
  const productIds = ((req.query.productIds as string) ?? "").split(",").filter(Boolean).map(Number);
  const qtys = ((req.query.qtys as string) ?? "").split(",").filter(Boolean).map(Number);
  if (productIds.length === 0 || productIds.length !== qtys.length) {
    throw new AppError(400, "productIds and qtys must be equal-length comma lists");
  }

  const items = productIds.map((productId, i) => ({ productId, qty: qtys[i] }));
  res.json(await getCheckpoint(items));
});
