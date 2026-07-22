import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { InternalJwtPayload } from "../types/auth";
import { INTERNAL_SESSION_COOKIE, setSessionCookie, clearSessionCookie } from "./session";
import { refreshInternalToken } from "../modules/auth/auth.service";

/**
 * Verifies the internal session (Admin/User accounts only) from the HttpOnly
 * cookie and attaches req.user. Signed/verified against JWT_INTERNAL_SECRET —
 * a token issued for the customer portal (different secret/cookie) will fail
 * verification here, by design.
 *
 * Every successful check also slides the session's idle-expiration window
 * forward (re-issuing the cookie) — this is what makes the session expire
 * after inactivity rather than on a fixed timer from login.
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.[INTERNAL_SESSION_COOKIE];
  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_INTERNAL_SECRET) as InternalJwtPayload;

    const refreshed = refreshInternalToken(payload);
    if (!refreshed) {
      clearSessionCookie(res, INTERNAL_SESSION_COOKIE);
      res.status(401).json({ error: "Session expired — please log in again" });
      return;
    }

    req.user = { userId: payload.userId, isAdmin: payload.isAdmin, sessionStart: payload.sessionStart };
    setSessionCookie(res, INTERNAL_SESSION_COOKIE, refreshed);
    next();
  } catch {
    clearSessionCookie(res, INTERNAL_SESSION_COOKIE);
    res.status(401).json({ error: "Invalid or expired session" });
  }
}
