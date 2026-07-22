import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { PortalJwtPayload } from "../types/auth";
import { PORTAL_SESSION_COOKIE, setSessionCookie, clearSessionCookie } from "./session";
import { refreshPortalToken } from "../modules/auth/auth.service";

/**
 * Verifies the customer-portal session from the HttpOnly cookie and attaches
 * req.customer. Signed/verified against JWT_PORTAL_SECRET — completely
 * isolated from JWT_INTERNAL_SECRET/its cookie, so an internal user's session
 * can never pass this check, and a customer's session can never pass
 * auth.middleware. Slides the idle-expiration window forward on every
 * successful check, same as auth.middleware.
 */
export function portalAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.[PORTAL_SESSION_COOKIE];
  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_PORTAL_SECRET) as PortalJwtPayload;

    const refreshed = refreshPortalToken(payload);
    if (!refreshed) {
      clearSessionCookie(res, PORTAL_SESSION_COOKIE);
      res.status(401).json({ error: "Session expired — please log in again" });
      return;
    }

    req.customer = { customerId: payload.customerId, sessionStart: payload.sessionStart };
    setSessionCookie(res, PORTAL_SESSION_COOKIE, refreshed);
    next();
  } catch {
    clearSessionCookie(res, PORTAL_SESSION_COOKIE);
    res.status(401).json({ error: "Invalid or expired session" });
  }
}
