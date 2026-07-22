import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireAdmin } from "../../middleware/rbac.middleware";
import { validateRequest } from "../../middleware/validateRequest";
import { uploadPhoto } from "../../middleware/upload.middleware";
import { createUserSchema, updateUserSchema, updateMeSchema } from "./users.validation";
import {
  listUsersHandler,
  getUserHandler,
  createUserHandler,
  updateUserHandler,
  getMeHandler,
  updateMeHandler,
  updateMyPhotoHandler,
} from "./users.controller";

// Admin-only: list/view/create/update any user + their permission grid.
export const usersRouter = Router();
usersRouter.use(authMiddleware);
usersRouter.get("/", requireAdmin, listUsersHandler);
usersRouter.get("/:id", requireAdmin, getUserHandler);
usersRouter.post("/", requireAdmin, validateRequest(createUserSchema), createUserHandler);
usersRouter.patch("/:id", requireAdmin, validateRequest(updateUserSchema), updateUserHandler);

// Any logged-in user: their own profile only (Name/Address/Mobile editable,
// Email/Position are not accepted here regardless of who's asking).
export const meRouter = Router();
meRouter.use(authMiddleware);
meRouter.get("/", getMeHandler);
meRouter.patch("/", validateRequest(updateMeSchema), updateMeHandler);
meRouter.post("/photo", uploadPhoto, updateMyPhotoHandler);
