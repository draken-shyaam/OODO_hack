import { InternalJwtPayload, PortalJwtPayload } from "./auth";

declare global {
  namespace Express {
    interface Request {
      /** Set by auth.middleware after verifying an internal JWT. */
      user?: InternalJwtPayload;
      /** Set by portalAuth.middleware after verifying a portal JWT. */
      customer?: PortalJwtPayload;
    }
  }
}

export {};
