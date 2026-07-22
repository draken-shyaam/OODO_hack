import { Response } from "express";
import { env } from "../config/env";

// Two separate cookies for the two separate JWT secrets/audiences (internal
// users vs. portal customers) — mirrors the existing JWT_INTERNAL_SECRET /
// JWT_PORTAL_SECRET split, so one session can never be mistaken for the other.
export const INTERNAL_SESSION_COOKIE = "pinerp_session";
export const PORTAL_SESSION_COOKIE = "pinerp_portal_session";

export const IDLE_TIMEOUT_SECONDS = env.SESSION_IDLE_TIMEOUT_MINUTES * 60;
export const IDLE_TIMEOUT_MS = IDLE_TIMEOUT_SECONDS * 1000;
export const ABSOLUTE_TIMEOUT_MS = env.SESSION_ABSOLUTE_TIMEOUT_HOURS * 60 * 60 * 1000;

function baseCookieOptions() {
  const isProd = env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    // localhost:5173 <-> localhost:4000 differ only by port, which makes them
    // the same "site" per the cookie spec (site = scheme + registrable
    // domain, port excluded) — so "lax" still attaches on cross-port fetch
    // in dev. A real cross-site deployment (different registrable domains)
    // needs "none" + secure, which is what NODE_ENV=production switches to.
    sameSite: (isProd ? "none" : "lax") as "none" | "lax",
    path: "/",
  };
}

/** Issues/refreshes the session cookie with a sliding idle-timeout window. */
export function setSessionCookie(res: Response, name: string, token: string): void {
  res.cookie(name, token, { ...baseCookieOptions(), maxAge: IDLE_TIMEOUT_MS });
}

export function clearSessionCookie(res: Response, name: string): void {
  res.clearCookie(name, baseCookieOptions());
}
