import { useAuthStore } from '../store/authStore';
import { usePortalAuthStore } from '../store/portalAuthStore';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export class ApiError extends Error {
  status: number;
  details?: unknown;
  module?: string | null;
  field?: string | null;
  action?: string | null;

  constructor(status: number, message: string, details?: unknown, module?: string | null, field?: string | null, action?: string | null) {
    super(message);
    this.status = status;
    this.details = details;
    this.module = module;
    this.field = field;
    this.action = action;
  }
}

/**
 * Builds a query string, dropping undefined/null/empty values — naively
 * passing an object with an `undefined` value to `URLSearchParams` would
 * stringify it as the literal text "undefined", which breaks any backend
 * enum filter (e.g. `?status=undefined`) instead of omitting it.
 */
export function buildQuery(params: Record<string, string | number | undefined | null>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (entries.length === 0) return '';
  return '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
}

// Prisma's `Decimal` fields (money/quantity columns) serialize as JSON
// STRINGS, not numbers — this is deliberate on Prisma's side, to avoid
// silently losing precision. Every screen in this app treats these as
// real numbers (.toFixed(), arithmetic), so every response is normalized
// here, once, centrally — rather than scattering `Number(...)` calls
// across every component that happens to touch one of these fields.
const DECIMAL_FIELDS = new Set([
  'onHandQty', 'salesPrice', 'costPrice', 'orderedQty', 'deliveredQty', 'receivedQty',
  'salesUnitPrice', 'costUnitPrice', 'quantity', 'toConsumeQty', 'consumedQty',
  'movementRate', 'minOrderQty', 'lowStockThreshold', 'reservedQty', 'freeToUseQty',
]);

function normalizeDecimals(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalizeDecimals);
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      if (DECIMAL_FIELDS.has(key) && val !== null && (typeof val === 'string' || typeof val === 'number')) {
        out[key] = Number(val);
      } else {
        out[key] = normalizeDecimals(val);
      }
    }
    return out;
  }
  return value;
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Which store's session to invalidate on a 401 — the internal app's or the customer portal's. Both sessions live in separate HttpOnly cookies, sent automatically, so this no longer selects a token to attach. */
  portal?: boolean;
};

/**
 * Single fetch wrapper every API module funnels through — prefixes the
 * backend base URL, sends the HttpOnly session cookie automatically via
 * `credentials: 'include'` (never touches a token directly — there isn't
 * one in JS-reachable storage to touch), and turns the backend's documented
 * error shapes ({ error, module, field, action } on 403, { error, details }
 * on 400/404/409) into a typed ApiError instead of letting callers parse
 * JSON error bodies themselves.
 *
 * A 401 means the session cookie is missing/expired/invalid (idle timeout,
 * absolute timeout, or logged out elsewhere) — flips the relevant store to
 * "unauthenticated" so every ProtectedRoute reacts immediately, without
 * each caller having to handle that case individually.
 */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, portal = false } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    if (portal) usePortalAuthStore.getState().setUnauthenticated();
    else useAuthStore.getState().setUnauthenticated();
  }

  if (res.status === 204) return undefined as T;

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(res.status, json?.error ?? `Request failed (${res.status})`, json?.details, json?.module, json?.field, json?.action);
  }

  return normalizeDecimals(json) as T;
}

/**
 * `validateRequest` reports field-level zod failures as a generic
 * "Validation failed" `error` with a treeified `details` tree — this digs
 * out the first concrete field message so the UI can show something
 * actionable instead of the generic top-level text.
 */
export function extractApiErrorMessage(err: ApiError): string {
  const details = err.details as { properties?: Record<string, { errors?: string[] }>; errors?: string[] } | undefined;
  if (details?.properties) {
    for (const field of Object.values(details.properties)) {
      if (field?.errors?.length) return field.errors[0];
    }
  }
  if (details?.errors?.length) return details.errors[0];
  return err.message;
}
