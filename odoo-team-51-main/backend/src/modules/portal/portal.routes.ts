import { Router } from "express";
import { portalAuthMiddleware } from "../../middleware/portalAuth.middleware";
import { validateRequest } from "../../middleware/validateRequest";
import { createReviewSchema, createMessageSchema } from "./portal.validation";
import * as portalService from "./portal.service";

// Every route here uses portalAuthMiddleware — the isolated customer JWT,
// never the internal one. req.customer.customerId scopes every query so a
// customer can only ever see their own data.
export const portalRouter = Router();
portalRouter.use(portalAuthMiddleware);

portalRouter.get("/me", async (req, res) => res.json(await portalService.getMyProfile(req.customer!.customerId)));

portalRouter.get("/orders", async (req, res) => res.json(await portalService.listMyOrders(req.customer!.customerId)));
portalRouter.get("/orders/:id", async (req, res) =>
  res.json(await portalService.getMyOrder(req.customer!.customerId, Number(req.params.id)))
);

portalRouter.get("/reviews", async (req, res) => res.json(await portalService.listMyReviews(req.customer!.customerId)));
portalRouter.post("/reviews", validateRequest(createReviewSchema), async (req, res) =>
  res.status(201).json(await portalService.createReview(req.customer!.customerId, req.body.salesOrderId, req.body.rating, req.body.comment))
);

portalRouter.get("/messages", async (req, res) => res.json(await portalService.listMyMessages(req.customer!.customerId)));
portalRouter.post("/messages", validateRequest(createMessageSchema), async (req, res) =>
  res.status(201).json(await portalService.createMessage(req.customer!.customerId, req.body.message))
);
