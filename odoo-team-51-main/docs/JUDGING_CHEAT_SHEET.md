# PINERP — Judging Round Cheat Sheet (1-hour team study)

How to study this in an hour: read "Architecture in 60 seconds" first (everyone), then
each person owns 2-3 features below and can explain file path + logic + the "if asked"
line cold. Skim the rest so nobody is blindsided by a question outside their area.

## Architecture in 60 seconds

- **Stack**: Node/Express + Prisma (MySQL) + Socket.io backend; React + Zustand + Tailwind v4 frontend.
- **Pattern**: every backend module = `*.routes.ts` → `*.controller.ts` → `*.service.ts` → `*.validation.ts` (zod). No exceptions — if asked "where's X", it's always one of these four files under `backend/src/modules/<name>/`.
- **Engines layer** (`backend/src/engines/*.ts`): pure-ish computation modules (forecasting, pareto, procurement automation, PIN, delay tracer, vendor performance, production health, data integrity, batch purchase). Engines are called BY services, never call each other's modules directly — keeps logic reusable/testable.
- **Auth**: HttpOnly JWT cookies (`pinerp_session` internal, `pinerp_portal_session` customer portal) — never localStorage, never in response body. Sliding expiry + absolute cap. See `backend/src/middleware/session.ts`.
- **All writes happen in `prisma.$transaction`** — status change + audit log + procurement trigger commit atomically; socket emit happens AFTER the transaction resolves (`.then()`), never inside it.
- **If asked "why no microservices"**: deliberate — modular monolith, single Prisma client, lets one transaction span Sales→Manufacturing→Purchase atomically. That's the actual reason cross-module consistency works.

---

## 1. Auth & Sessions
**Files**: `backend/src/modules/auth/*`, `backend/src/middleware/{auth,portalAuth}.middleware.ts`, `backend/src/middleware/session.ts`
**Logic**: bcrypt password hash → JWT signed with `JWT_INTERNAL_SECRET` (staff) or `JWT_PORTAL_SECRET` (customers) → set as HttpOnly+SameSite cookie via `setSessionCookie()`. Every authenticated request re-signs the cookie with a fresh idle window (sliding expiry) unless past the absolute cap (`refreshInternalToken`).
**If asked**: "How is this not vulnerable to XSS token theft?" → token never touches JS; `httpOnly: true` blocks `document.cookie` access entirely.

## 2. RBAC / Permission Grid
**Files**: `backend/src/middleware/rbac.middleware.ts`, `Permission` model in schema, `seed.ts` grant blocks
**Logic**: per-user, per-module, per-FIELD grid (`canCreate/canView/canEdit/canDelete`) — not a single role enum. `requirePermission()` middleware checks one field; `filterByFieldPermission()` strips disallowed fields from request bodies before they reach the service layer. Confirm/Approve actions are hardcoded admin-only (`requireAdmin`), bypassing the grid entirely.
**If asked**: "Why field-level not role-level?" → matches the wireframe's actual ask: e.g. a Sales Exec can edit Customer but never Total (system-computed).

## 3. Sales / Purchase / Manufacturing Orders + Procurement Automation
**Files**: `backend/src/modules/{sales,purchase,manufacturing}/*.service.ts`, `backend/src/engines/procurementAutomationEngine.ts`
**Logic**: confirming a Sales Order reserves stock (`computeReservedQtyTx`), then `checkAndTriggerProcurement()` checks `reserved - onHandQty`. If shortfall > 0 and product is `procureOnDemand`, auto-creates a PO (if `procurementMethod: purchase`) or MO (if `manufacturing`) — and an MO's own components recurse through the same check, building multi-hop chains (SO→MO→PO). Every auto-created order writes a `ProcurementLink` row (parent=blocker, child=blocked).
**If asked**: "What's Free-to-Use vs On-Hand?" → `freeToUseQty = onHandQty - reservedQty`, computed live in `products.service.ts`, never stored — this is what order-line "Short by X" badges check, NOT raw on-hand (prevents overselling reserved stock).

## 4. PIN — Market Signals Checkpoint
**Files**: `backend/src/engines/pinEngine.ts`, `backend/src/modules/pin/*`, `backend/src/modules/signals/*`, `frontend/src/features/sales/PinCheckpointModal.tsx`
**Logic**: Confirming an SO calls `GET /api/pin/signals` first. Signals (`MarketSignal` table) are clustered by `productId+signalType` within a 14-day window (`clusterSignals`). Confidence is **computed live, never stored**: 60% one reporter, +25% if ≥2 independent reporter *types*, -10% if oldest report > 7 days old, capped at 95%. Recommendations (EXPEDITE/VENDOR_SWITCH/QTY_ADJUST/ACCEPT_RISK) are generated from real `VendorOffer` rows (price/lead-time per vendor) — a product with no alt vendor never shows VENDOR_SWITCH.
**If asked**: "Is this AI?" → No. Pure rule-based aggregation over real DB rows, zero ML/LLM. "What if I check a box?" → `confirmSalesOrder` applies it inside the SAME transaction as confirm — VENDOR_SWITCH actually changes which vendor the auto-PO goes to (`procurementAutomationEngine`'s optional `override` param), logged to Audit Log as `PIN: VENDOR_SWITCH`.

## 5. Delay Tracer
**Files**: `backend/src/engines/delayTracerEngine.ts`, `frontend/src/features/delayTracer/DelayTracerModal.tsx`
**Logic**: One raw SQL `WITH RECURSIVE` CTE (Prisma can't generate recursive CTEs) walks `procurement_links` backward from the clicked order to the deepest unresolved blocker. Depth capped at 10 (also doubles as cycle guard). Each node tagged `role: symptom|link|root_cause`, enriched with real Audit Log rows + `daysOverdue`. Explanation sentence is a deterministic template, optionally smoothed by the LLM narrator (numbers never change).
**If asked**: "Live updates?" → modal subscribes to the existing `order:status_changed` socket event; if it matches the current root-cause node, it refetches — no polling, no new socket infra.

## 6. Insights (Forecasting / Pareto / Batch Purchase)
**Files**: `backend/src/engines/{forecastingEngine,paretoEngine,batchPurchaseOptimizer}.ts`, `frontend/src/features/insights/Insights.tsx`
**Logic**: **Forecast** = 3-month moving average over `StockLedger` rows where `refType="sales_order"`; honestly returns `insufficientData: true` rather than fabricating a trend under 3 months. **Pareto** = `(salesPrice - costPrice) × deliveredQty` per product, sorted, cumulative % ≤80 = top-20%. **Batch Purchase** = groups Draft POs by vendor, suggests merge if ≥2 drafts to the same vendor.
**If asked**: "Why insufficientData instead of a fake number?" → deliberate honesty signal — same posture as PIN's "no active signals" control case (Screws product, zero signals, explicit checkmark not silent omission).

## 7. Dashboard
**File**: `backend/src/modules/dashboard/dashboard.service.ts`, `frontend/src/features/dashboard/Dashboard.tsx`
**Logic**: `groupBy(status)` per module (Sales/Purchase/Manufacturing), once for All, once filtered by current `userId`. "Late" is NOT a stored status — computed live as `dueDate < now AND status not terminal`. Manufacturing's "In Progress" vs "To Close" split is derived per-order from `isReadyToClose()` (every component fully consumed), not a separate DB flag. Live-refreshes on `order:status_changed`/`stock:updated` socket events.

## 8. Production Health
**Files**: `backend/src/engines/productionHealthEngine.ts`, `frontend/src/features/productionHealth/ProductionHealth.tsx`
**Logic**: per Work Center, `utilization % = active work-order minutes / shiftCapacityMins`. Burnout flag if an operator's total assigned minutes > 480 (one shift). Redistribution suggestion = pairs an overloaded work center with an idle one.

## 9. Vendor Performance Scorecard
**Files**: `backend/src/engines/vendorPerformanceEngine.ts`, `frontend/src/features/vendors/VendorForm.tsx`
**Logic**: `onTimePct = fully_received / (fully_received + cancelled)`, `defectRate = quality incidents / total POs` (from `VendorQualityIncident`). Shows "Insufficient data" rather than 0% when a vendor has no order history yet — same honesty pattern as Insights.

## 10. Bill of Materials (BoM)
**File**: `backend/src/modules/bom/bom.service.ts`
**Logic**: a BoM has components (raw materials + qty) and work-order templates (operation + work center + duration). Auto-MO creation scales BOTH proportionally by `shortfall / bom.quantity` ratio — so a shortage of 3 units against a BOM written for 10 scales every component and every work order's expected duration by 0.3×.

## 11. Customers / Vendors / Work Centers
**Files**: `backend/src/modules/{customers,vendors,workCenters}/*`
**Logic**: standard CRUD with auto-generated references (`CUST-`, `VEND-`). Vendors additionally log `VendorQualityIncident` rows (feeds the performance scorecard). Work Centers are simple master data (`shiftCapacityMins`) referenced by BoM work-order templates and Production Health.

## 12. Audit Logs
**Files**: `backend/src/modules/audit/*`, `frontend/src/features/audit/AuditLogs.tsx`
**Logic**: every state-changing service call writes an `AuditLog` row (module, entity, recordId, action, fieldChanged, old/new value) inside the SAME transaction as the change. Filterable by date/user/module/action. Live-updates via `audit:entry_created` socket event.
**If asked**: "Tamper-proof?" → no separate immutability guarantee — it's a normal table; the honest answer is "applies the same DB integrity as everything else, not cryptographically sealed."

## 13. Customer Portal
**Files**: `backend/src/modules/portal/*`, `frontend/src/features/portal/*`, `portalAuthMiddleware`
**Logic**: fully separate auth (own JWT secret + cookie) from internal staff. Every query scoped to `customerId` pulled from the portal JWT — a customer can never query another customer's orders by guessing an ID. Customers can view their own orders, leave a review (only once an order is partially/fully delivered), and send/view portal messages.

## 14. Real-time (Socket.io)
**File**: `backend/src/sockets/events.ts`
**Events**: `order:status_changed`, `stock:updated`, `signal:created`, `audit:entry_created`. All broadcast globally (no rooms) — services emit AFTER their transaction commits, never inside it (so a rolled-back transaction can't emit a phantom event).

## 15. AI/LLM Layer
**File**: `backend/src/llm/narrate.ts`
**Logic**: Claude Haiku 4.5 via Anthropic SDK, gated by `LLM_NARRATION_ENABLED` + `ANTHROPIC_API_KEY`. Takes an already-correct deterministic sentence and only rephrases tone — never asked to compute numbers itself. Falls back silently to the original deterministic text on any error (no key, network failure, etc).
**If asked**: "What if the AI is down during the demo?" → nothing breaks, the app just shows the plain deterministic sentence — this is the headline answer to "is your AI layer a single point of failure."

## 16. Cron Jobs
**File**: `backend/src/jobs/{dailyReports,lowStockAlert}.job.ts`
**Logic**: Daily Reports (6am) chains data-integrity check + Pareto + LLM narration into one digest. Low Stock Alert (hourly) flags products where `onHandQty < lowStockThreshold`. Both currently log to console — production would wire these to email/Slack.

## 17. UI Theme System
**File**: `frontend/src/index.css`
**Logic**: dark/light via `.dark` class on `<html>`, toggled in `AppShell.tsx`, persisted to `localStorage`. All theme colors are CSS variables registered through `@theme inline` so Tailwind generates real `bg-card`/`text-foreground`/`border-border` utilities that swap automatically per mode — single source of truth, no per-component dark: overrides needed.

---

## Rapid-fire "gotcha" answers

- **"Show me the exact query for X"** → Delay Tracer's recursive CTE in `delayTracerEngine.ts` (`getRawChain`) is the one raw-SQL query in the whole backend; everything else is Prisma's query builder.
- **"What stops two people confirming the same order twice / double-spending stock?"** → status guard at the top of every service mutation (`if (so.status !== "draft") throw...`) plus the whole operation runs in one `$transaction`.
- **"Is anything in this app mocked/fake?"** → No — explicitly call out Insights' `insufficientData` flag and PIN's "no active signals" state as proof the system reports honestly rather than fabricating confidence/trends.
- **"How do PIN and Delay Tracer relate?"** → Delay Tracer explains delays from PINERP's OWN internal data (backward-looking). PIN surfaces risk from external field reports (forward-looking). Demo: trace a Dining Chair order blocked on Wooden Legs, then show PIN's Wooden Legs shortage signal — same root cause, two lenses.
- **"What's the single biggest architectural decision?"** → One Prisma transaction per state change, audit log + socket emit wired to that same transaction boundary — guarantees the UI, audit trail, and procurement chain can never disagree with each other.
