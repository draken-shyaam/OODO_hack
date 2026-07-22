# PINERP — Technical Specification

**Project:** Mini ERP "From Demand to Delivery" (Shiv Furniture Works), expanded by the team into PINERP — an ERP that doesn't just record data, it digitizes the full Demand → Delivery lifecycle: inventory, procurement automation, manufacturing orchestration, demand prediction, risk/bottleneck identification, and real-time visibility.

This document is the single shared reference for the whole team. Frontend and backend members should both read Sections 1–2 fully; backend owns Sections 3–6 most closely; everyone should be able to defend Section 7 in front of a judge or interviewer.

---

## 1. Feature List

### Roles

| Role | Responsibility |
|---|---|
| Admin | Full system access; configures products, users, procurement settings; access to audit logs and all dashboards |
| Sales User | Creates/manages Sales Orders, tracks deliveries, sees Procurement Intelligence Network (PIN) insights before confirming demand |
| Purchase User | Manages Purchase Orders, handles vendor interactions, reviews vendor performance metrics |
| Manufacturing User | Executes Manufacturing Orders, completes Work Orders, monitors production queues |
| Inventory Manager | Monitors stock movements, handles stock reconciliation, receives low-stock/shortage alerts |
| Business Owner | Views strategic dashboards: forecasts, bottlenecks, profit insights |
| Tier A Customer (external) | Restricted portal: track order status, view delivery estimates, monitor reserved stock, leave reviews, view communication history |

### Module 1 — Product Master

One-liners for every field that makes a product an "intelligent entity" rather than a static catalog row:

- **Product Code / Name** — unique identifier and display name.
- **Dimensions / Specifications** — physical/technical attributes shown on product detail.
- **Lead Time** — expected days to procure/manufacture, used by the Forecasting Engine.
- **Cost Price / Sales Price** — margin inputs, used by the Pareto Profit Engine.
- **Vendor Product Mapping** — which vendor(s) supply this product, used by Procurement Automation.
- **Movement Rate** — how fast a product sells/consumes, used for reorder suggestions.
- **Minimum Order Quantity (MOQ)** — floor quantity for MTS replenishment.
- **Procurement Strategy** — MTS or MTO, decides when procurement triggers.
- **Procurement Type** — Purchase or Manufacturing, decides whether a shortage spawns a PO or an MO.
- **BoM Link** — attaches a Bill of Materials when Procurement Type = Manufacturing.
- **Preferred Vendor** — default vendor used for auto-created Purchase Orders.

### Module 2 — Sales + Procurement Intelligence Network (PIN)

- **Customer management** — create/search customers tied to orders.
- **Sales Order creation** — select customer, add products, set quantities.
- **Stock availability check** — validated against Free-to-Use Qty before confirmation.
- **Delivery tracking** — status progresses as goods ship.
- **Automatic reservation** — confirming an SO reserves stock immediately.
- **Procurement triggering** — a shortage on confirm auto-creates an MO/PO (see Module 4).
- **Workflow:** Customer Demand → Sales Order → Reserve Stock → Check Availability → Fulfillment.
- **PIN (Market Signals)** — before confirming an order, the Sales screen shows any active signals (shortage / price change / delay / availability) reported against the products in the cart, sourced from any authenticated user acting as a field reporter (carpenter, contractor, dealer, supplier, warehouse partner, transporter, employee, procurement partner). This is a real internal mechanism, not a literal external crowdsourcing network — see Section 5 for the exact table.

### Module 3 — Inventory & Stock Ledger

- **On Hand Quantity** — actual physical stock.
- **Reserved Quantity** — stock committed to open SOs/MOs.
- **Free-to-Use Quantity** — `On Hand − Reserved`; this is the number every availability check uses.
- **Real-time stock visibility** — pushed live via WebSocket on every change.
- **Low-stock alerts** — triggered when Free-to-Use crosses a configurable threshold.
- **Auto-suggested reorder quantities** — derived from Movement Rate + Lead Time.
- **Stock reconciliation** — Inventory Manager can adjust On Hand with a logged reason.
- **Shortage detection** — the trigger condition for Procurement Automation.
- **Stock Ledger** — append-only log of every movement: timestamp, user, transaction type, product, quantity, reason. Sales decreases stock, Purchase increases stock, Manufacturing consumes components and produces finished goods. This is the operational audit trail everything else is built on.

### Module 4 — Procurement Automation & Intelligence

- **Procurement Engine** — `Sales Order → Stock Shortage → Procurement Engine → Manufacturing OR Purchase`, decided by Procurement Strategy, Procurement Type, Vendor Mapping, and BoM.
- **Automatic PO/MO creation** — no manual intervention for routine shortages.
- **Reorder thresholds & suggested quantities** — configurable per product.
- **MTS Engine** — predicts demand, manufactures/purchases in advance, enables immediate fulfillment.
- **MTO Engine** — triggers production only after real demand arrives, minimizing inventory risk.
- **Forecasting Engine** ("AI-Enhanced Procurement") — 6–12 month procurement forecasting, MTO supply predictions, predictive MTS recommendations, seasonal trend detection — computed via moving-average/linear-regression statistics over real Stock Ledger/Sales history, **not** a trained ML model.
- **Batch Purchase Optimization** — detects fragmented POs to the same vendor in a time window and suggests merging them into one PO for bulk discounts, lower logistics cost, and reduced vendor overhead.
- **Vendor Performance Intelligence** — tracks on-time delivery %, defect rate, quality incidents, lead time adherence, and purchase history per vendor; the system prioritizes high-performing vendors when choosing where to route auto-created POs.
- **Profit-Driven Procurement Prioritization (Pareto Engine)** — identifies the ~10–20% of products generating ~80% of profit, then prioritizes their procurement, raises their safety stock, and prioritizes their associated vendors.

### Module 5 — Manufacturing

- **Workflow:** Sales Order → Manufacturing Order → Fetch BoM → Reserve Components → Generate Work Orders → Execute Operations → Update Inventory.
- **Bill of Materials (BoM)** — defines components, quantities, operations, durations, and work centers; the manufacturing blueprint.
- **Work Orders** — individual production steps (Cutting, Assembly, Painting, Packaging), assigned to operators and tracked individually.
- **Context-Aware Production Health Dashboard** — monitors operator workload, work center utilization, queue buildup, idle stations, and potential burnout risk; suggests task redistribution, work order reassignment, and load balancing. Optimizes people, not just processes.
- **Manufacturing Capacity Visualization** — charts work center utilization, throughput, capacity bottlenecks, and delayed queues for proactive production planning.

### "Why Is It Late?" Causal Delay Tracer

- **Causal Delay Tracer** — one click on any delayed order traces the dependency chain backward (e.g. SO delayed → MO blocked → screw shortage → PO pending → vendor delayed) and returns a plain-English explanation such as: *"SO-145 is delayed because Manufacturing Order MO-87 could not proceed due to insufficient screws. Purchase Order PO-22 remains unfulfilled by Vendor X."*
- **Procurement Link Graph** — an auto-generated relationship table storing SO→MO, SO→PO, and MO→PO links, used to construct the dependency chain.
- **Recursive Trace Engine** — uses a recursive SQL query (graph traversal) to walk the link graph backward to the root cause. No machine learning required.
- **Explanation Generator** — converts the structured trace into plain English via deterministic templates, with optional LLM polishing for nicer phrasing.

### Cross-Cutting Platform Features

- **Real-Time Visibility** — WebSockets push order status changes, stock updates, delays, procurement events, and audit events to every connected dashboard instantly, with no manual refresh.
- **Role-Based Access Control** — JWT + middleware; users only access the modules permitted by their role (see Roles table above).
- **Audit Log Module** — tracks status changes, quantity updates, price changes, deliveries, procurement events, manufacturing completion, and user actions, for end-to-end traceability.
- **AI Operations Assistant** — not a separate system; it packages outputs from the other deterministic engines into:
  - **Data Integrity Monitoring** — detects negative stock, missing stock records, suspicious inventory patterns.
  - **Automated Daily Reports** — summaries for inventory, sales, purchases, delays, and forecasting.
  - **Predictions** — demand trends, procurement requirements, MTO material needs (reuses the Forecasting Engine).
  - **Strategic Recommendations** — fast-moving products, profit drivers, procurement priorities (reuses the Pareto Engine + Vendor Performance Intelligence).
- **Real-Time Dashboard** — home screen aggregating Sales (totals/pending/delayed), Inventory (low-stock/critical shortages), Manufacturing (bottlenecks/utilization), Procurement (pending POs/vendor performance), and Strategy (top profit contributors/forecast insights), all live via WebSocket.
- **Tier A Customer Portal** — isolated external login (separate from internal RBAC) for customers to track orders, view delivery estimates, monitor reserved stock, leave reviews, and view communication history.

---

## 2. Full Project Folder Structure

Monorepo, built directly inside the existing project root (no extra nested folder):

```
odoo-team-51/
├── docs/
│   └── PINERP_SPEC.md
├── frontend/
│   ├── src/
│   │   ├── api/                 # salesApi.ts, inventoryApi.ts, procurementApi.ts, manufacturingApi.ts,
│   │   │                        # vendorApi.ts, auditApi.ts, portalApi.ts, dashboardApi.ts
│   │   ├── components/          # Navbar, Sidebar, AppShell, Table, Modal, Badge, ChartWrappers
│   │   ├── features/            # sales/, inventory/, procurement/, manufacturing/, vendors/,
│   │   │                        # dashboard/, audit/, portal/
│   │   ├── hooks/                # useSocket.ts, useAuth.ts, useRole.ts
│   │   ├── store/                 # Zustand: authStore.ts, cartStore.ts, dashboardStore.ts
│   │   ├── layouts/                # AppShell.tsx — fixed TopNav + Sidebar, scrollable content panel only
│   │   ├── routes/
│   │   ├── types/
│   │   └── main.tsx
│   ├── .env.example
│   ├── package.json
│   └── vite.config.ts
├── backend/
│   ├── src/
│   │   ├── modules/               # one folder per domain, each with routes.ts / controller.ts / service.ts / validation.ts
│   │   │   ├── products/
│   │   │   ├── sales/
│   │   │   ├── inventory/
│   │   │   ├── procurement/
│   │   │   ├── manufacturing/
│   │   │   ├── vendors/
│   │   │   ├── signals/           # PIN market signals
│   │   │   ├── audit/
│   │   │   ├── portal/            # Tier A customer endpoints
│   │   │   └── dashboard/
│   │   ├── engines/                # cross-cutting deterministic engines, called by many modules
│   │   │   ├── forecastingEngine.ts
│   │   │   ├── paretoEngine.ts
│   │   │   ├── vendorPerformanceEngine.ts
│   │   │   ├── productionHealthEngine.ts
│   │   │   ├── delayTracerEngine.ts
│   │   │   ├── batchPurchaseOptimizer.ts
│   │   │   └── dataIntegrityEngine.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts        # internal JWT verify
│   │   │   ├── rbac.middleware.ts        # per-route role check
│   │   │   ├── portalAuth.middleware.ts  # isolated Tier A customer JWT
│   │   │   ├── errorHandler.ts
│   │   │   └── validateRequest.ts
│   │   ├── sockets/
│   │   │   ├── socket.server.ts
│   │   │   └── events.ts            # central event-name registry
│   │   ├── jobs/
│   │   │   ├── dailyReports.job.ts  # node-cron
│   │   │   └── lowStockAlert.job.ts
│   │   ├── llm/
│   │   │   └── narrate.ts           # optional, feature-flagged narration layer
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   ├── config/
│   │   │   └── env.ts
│   │   └── app.ts / server.ts
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── .gitignore
├── package.json   # npm workspaces root + "dev" script running both servers via concurrently
└── README.md
```

---

## 3. Full Tech Stack

**Frontend**
- React 18 + Vite, TypeScript
- React Router v6
- Zustand — state management (auth/session, cart, live dashboard state)
- Recharts — all charts (capacity visualization, Pareto chart, vendor comparison, dashboard tiles)
- Tailwind CSS — styling
- `socket.io-client` — real-time updates
- `zod` — form/request validation (shapes shared with backend)

**Backend**
- Node.js + Express, TypeScript
- Prisma ORM + `mysql2` driver
- `jsonwebtoken` + `bcrypt` — internal auth
- `socket.io` — real-time event push
- `zod` — request validation
- `node-cron` — scheduled jobs (daily reports, low-stock alerts)
- `dotenv` — environment config

**Database**
- MySQL 8.0.2+ (required — this version is when `WITH RECURSIVE` became GA, needed for the Delay Tracer)

**Optional**
- `@anthropic-ai/sdk` or `openai` — used only inside `llm/narrate.ts`, gated by `LLM_NARRATION_ENABLED` in `.env`. When disabled, every feature that would use it falls back to plain templates with zero code changes.

**Dev tooling**
- ESLint + Prettier
- `concurrently` — run frontend + backend together in dev
- npm workspaces (monorepo)

---

## 4. Tech Stack → Usage Mapping

| Technology | Used For |
|---|---|
| React + Vite | All UI screens, fixed-shell layout |
| Zustand | Auth/session state, cart state, live dashboard state fed by sockets |
| Recharts | Capacity Visualization, Pareto chart, Vendor Performance comparison, Dashboard tiles |
| Tailwind CSS | All styling |
| `socket.io` / `socket.io-client` | Real-Time Visibility across every module (order status, stock, delays, procurement, audit) |
| Express + Prisma Client | All standard CRUD: Products, Sales, Purchase, Manufacturing, BoM, Vendors, Signals |
| Prisma `$queryRaw` | **Only** the Delay Tracer's recursive `WITH RECURSIVE` query |
| `jsonwebtoken` + `bcrypt` | Internal RBAC auth (6 roles) |
| `portalAuth.middleware.ts` (separate JWT audience) | Tier A Customer Portal auth, isolated from internal roles |
| `node-cron` | Automated Daily Reports job, low-stock alert job |
| `zod` | Request validation, shared shape between frontend forms and backend routes |
| `llm/narrate.ts` (optional) | Phrasing only for: Delay Tracer explanation, Forecasting narrative, Daily Report summary — never computes a number or decision |
| MySQL 8 | All persistent data: master, transactional, intelligence/signals, audit schema groups |

---

## 5. Full Architecture

```
                         [ React SPA — fixed shell ]
                                    |
                               WebSocket
                                    |
                       [ Express API Gateway ]
                ┌────────────────────────────────────┐
                │ auth.middleware      (JWT verify, internal roles)   │
                │ rbac.middleware      (per-route role check)         │
                │ portalAuth.middleware (separate JWT, Tier A only)   │
                └────────────────────────────────────┘
                                    |
   ┌────────────────────────┐             ┌──────────────────────────────────┐
   │   Service Layer        │  <------->  │  Engine Layer (shared, reused)   │
   │  per-module CRUD:      │             │  forecastingEngine               │
   │  products, sales,      │             │  paretoEngine                    │
   │  purchase, manufacturing,│            │  vendorPerformanceEngine         │
   │  vendors, signals,      │             │  productionHealthEngine         │
   │  portal                 │             │  delayTracerEngine               │
   └────────────────────────┘             │  batchPurchaseOptimizer          │
                                    │      │  dataIntegrityEngine             │
                                    │      └──────────────────────────────────┘
                                    |                       |
                          ┌─────────────────────────────────────┐
                          │           MySQL 8 (Prisma)           │
                          │ Master data | Transactional |        │
                          │ Signals/Intelligence | Audit          │
                          └─────────────────────────────────────┘
                                    |
                       [ Socket.io event bus ]
                 emits after every committed write --> all connected
                 dashboards/screens update with no manual refresh
                                    |
                        [ llm/narrate.ts — optional ]
              feature-flagged phrasing layer, called only from the
              delay tracer / forecasting / daily-report presentation paths
```

**Core reuse principle (the single strongest architectural decision):** the "AI Operations Assistant" and the "Real-Time Dashboard" are **not separate systems**. They are orchestration/presentation layers that call the same seven engines listed above. One computation, many surfaces — a forecast computed once by `forecastingEngine` can appear in the Procurement screen, the Business Owner's Strategy dashboard, and the Daily Report, without being recomputed three different ways.

**PIN (Market Signals) — exact schema** so it's a real mechanism, not a buzzword:

```
market_signals
- id
- source_type     ENUM(carpenter, contractor, dealer, supplier, warehouse_partner, transporter, employee, procurement_partner)
- product_id       NULLABLE FK -> products
- category         NULLABLE (used if product_id is null, applies to a whole category)
- signal_type      ENUM(shortage, price_change, delay, availability)
- description       TEXT
- severity           ENUM(low, medium, high)
- reported_by_user_id FK -> users
- reported_at         DATETIME
```
UI touchpoint: a warning banner on the Sales Order cart screen, querying active signals matching any product/category currently in the cart, shown before the "Confirm Order" button.

**Tier A Customer Portal — communication history table:**
```
customer_communications
- id
- customer_id    FK -> customers
- channel         ENUM(email, sms, portal_message)
- direction        ENUM(inbound, outbound)
- message
- created_at
```

**End-to-end trace #1 — Sales Order confirmation:**
`POST /api/sales/:id/confirm` → `sales.controller` → `prisma.$transaction([` check Free-to-Use Qty, reserve stock `])` → if shortage detected → `procurement.service` reads the product's Procurement Type/Strategy/Vendor/BoM → creates an MO or PO → inserts a `procurement_link` row (`parent=SALES_ORDER_LINE`, `child=MANUFACTURING_ORDER|PURCHASE_ORDER`) → inserts an `audit_logs` row → `io.emit('order:status_changed')` + `io.emit('stock:updated')` → every connected dashboard updates live.

**End-to-end trace #2 — Delay Tracer:**
`GET /api/delay-trace/:orderId` → `delayTracerEngine.trace()` → one `prisma.$queryRaw`:
```sql
WITH RECURSIVE chain AS (
  SELECT parent_type, parent_id, child_type, child_id, reason, 1 AS depth
  FROM procurement_link
  WHERE child_type = 'SALES_ORDER' AND child_id = ?

  UNION ALL

  SELECT pl.parent_type, pl.parent_id, pl.child_type, pl.child_id, pl.reason, c.depth + 1
  FROM procurement_link pl
  JOIN chain c ON pl.child_type = c.parent_type AND pl.child_id = c.parent_id
  WHERE c.depth < 10
)
SELECT * FROM chain;
```
→ structured chain returned → template fills the explanation sentence → if `LLM_NARRATION_ENABLED`, one optional call smooths the phrasing → response contains both the structured chain (renders as a UI timeline) and the prose (renders as the "why is it late" banner).

---

## 6. Architecture → Tech Stack Mapping

| Layer / Engine | Tech |
|---|---|
| Delay Tracer Engine | Prisma `$queryRaw` (raw `WITH RECURSIVE` SQL) + Express controller + optional `llm/narrate.ts` |
| RBAC middleware | `jsonwebtoken` verify + custom Express middleware reading role claim |
| Portal auth | Separate `jsonwebtoken` secret/audience + `portalAuth.middleware.ts`, isolated from internal role enum |
| Forecasting Engine | SQL aggregation (Prisma) + moving-average/linear-regression in plain Node — no external ML |
| Pareto Engine | SQL window functions via Prisma (`$queryRaw` or grouped aggregation) |
| Vendor Performance Engine | Aggregation over `purchase_orders` + `vendor_quality_incidents` |
| Production Health / Capacity | Aggregation over `work_orders` + `work_centers`, charted via Recharts |
| Batch Purchase Optimizer | SQL `GROUP BY` vendor+product within a time window, threshold logic |
| Real-time layer | `socket.io` server on the same HTTP server as Express, emitted from the service layer post-commit |
| Daily Reports / Alerts | `node-cron` jobs calling the same engines above, output optionally narrated |

---

## 7. Senior-Dev (Odoo-style) Interview FAQ

- **Why MySQL, not Postgres/Mongo?** Need real relational integrity for the stock ledger plus native `WITH RECURSIVE` (GA since MySQL 8.0.2) for the Delay Tracer — Postgres could do this too, but the team standardized on one confirmed target instead of hedging across two.
- **Why no Kafka?** Single Node process; Socket.io's in-process emit covers every real-time need here — Kafka adds a distributed ops layer with zero payoff at this scale.
- **Why no trained ML model for the "AI" features?** Every prediction/recommendation is deterministic SQL/statistics over real ledger data — explainable and reproducible, versus an unverifiable model trained on fabricated demo data.
- **Why Prisma if it can't generate the recursive CTE?** Prisma handles ~95% of CRUD with type safety and migrations; the one recursive query is isolated to a single, well-known `$queryRaw` escape hatch — not a workaround hiding a flaw.
- **How does `procurement_link` avoid cycles?** It's insert-only and always written forward in time — a child row is only created after its parent's shortage is detected, so a cycle would require inserting a cause after its effect, which the write path never does.
- **What about recursive trace performance on deep chains?** Realistic supply chains are shallow (2–4 hops); the query is indexed on `(child_type, child_id)` and bounded with a depth guard (`WHERE c.depth < 10`).
- **How are concurrent stock reservations handled?** Every check-then-reserve sequence runs inside one `prisma.$transaction` with row-level locking, so two simultaneous orders can't both reserve the same unit.
- **Why Socket.io over polling/SSE?** Built-in reconnection and room/namespace scoping beats hand-rolled SSE reconnect logic in hackathon time, even though the bidirectional capability is barely needed.
- **How is the customer portal isolated from internal auth?** Separate JWT audience/secret and its own middleware — a compromised or buggy portal token can never satisfy an internal `rbac.middleware` check.
- **What guarantees data integrity under concurrent writes?** Every multi-table mutation (SO confirm, procurement auto-create, MO completion) is wrapped in a single Prisma transaction — partial writes can't persist.
- **How does PIN avoid being vaporware?** It's a concrete internal `market_signals` table any authenticated user can write to, surfaced as a warning banner on the Sales Order screen before confirmation — a real mechanism, not a claim of an external crowdsourced network.
- **Why optional LLM instead of LLM-first?** Numbers and decisions must be reproducible and auditable; the LLM only phrases an already-computed fact, so if the API/key/internet fails at demo time, the feature degrades to plain templates instead of breaking.
- **How do the Pareto/forecast engines avoid lying with insufficient data?** They run on real Sales/Stock Ledger rows from the seed dataset; with too little history they explicitly return "insufficient data" rather than fabricating a trend.
- **How does RBAC scale to more granular permissions later?** Current design is route+role; field-level permissions would be a follow-on policy table consulted by response serializers — a named, known limitation, not solved today.
- **How would this scale past a hackathon demo?** Move procurement-engine triggers from inline/synchronous to a queue, add read replicas for dashboard aggregation queries, and only then evaluate whether real event-streaming infra is justified by actual volume.
- **What stops the Production Health Dashboard's "burnout" flag from being noise?** It's a configurable rolling-window threshold on assigned Work Order hours per operator, not a hidden heuristic — tunable per Work Center.
- **Why a monorepo?** One small team building frontend and backend together benefits from sharing `zod` validation schemas and one source of truth for this spec, more than from independent repo lifecycles.

---

*This document is the source of truth for PINERP's architecture. If a feature changes, update this file first, then the code.*
