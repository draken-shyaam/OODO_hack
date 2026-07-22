import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest";
import {
  loginSchema,
  signupSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  portalLoginSchema,
  portalSignupSchema,
} from "./auth.validation";
import {
  loginHandler,
  signupHandler,
  logoutHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
  portalLoginHandler,
  portalSignupHandler,
  portalLogoutHandler,
} from "./auth.controller";

export const authRouter = Router();
authRouter.post("/login", validateRequest(loginSchema), loginHandler);
authRouter.post("/signup", validateRequest(signupSchema), signupHandler);
authRouter.post("/logout", logoutHandler);
authRouter.post("/forgot-password", validateRequest(forgotPasswordSchema), forgotPasswordHandler);
authRouter.post("/reset-password", validateRequest(resetPasswordSchema), resetPasswordHandler);

export const portalAuthRouter = Router();
portalAuthRouter.post("/login", validateRequest(portalLoginSchema), portalLoginHandler);
portalAuthRouter.post("/signup", validateRequest(portalSignupSchema), portalSignupHandler);
portalAuthRouter.post("/logout", portalLogoutHandler);
