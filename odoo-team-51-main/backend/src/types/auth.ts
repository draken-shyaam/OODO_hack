// Internal users (Admin/User) sign in via /api/auth/login and get a token
// verified by auth.middleware against JWT_INTERNAL_SECRET.
export interface InternalJwtPayload {
  userId: number;
  isAdmin: boolean;
  /**
   * Epoch seconds when this session was first created. Preserved unchanged
   * across every sliding refresh (see auth.service's refreshInternalToken)
   * so the absolute session cap can be enforced independent of activity —
   * `exp` alone only tracks the idle window, not how old the session is.
   */
  sessionStart: number;
}

// Tier A customers sign in via /api/portal/auth/login and get a token
// verified by portalAuth.middleware against a completely separate secret.
// This type intentionally shares NOTHING with InternalJwtPayload.
export interface PortalJwtPayload {
  customerId: number;
  sessionStart: number;
}
