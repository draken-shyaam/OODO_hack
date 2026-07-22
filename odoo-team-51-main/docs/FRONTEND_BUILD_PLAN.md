# PINERP — Frontend Build Plan (hand this to your AI builder as-is)

## 0. How to use this document

This document specifies **only the frontend**. Build it as a standalone app that runs entirely against a **mock API layer** (Section 9) — no real backend exists yet. Every screen, field, button, status transition, and permission rule below comes directly from the team's actual Excalidraw wireframe (not inferred). Follow it exactly. When the backend is built later, it will implement the contract in Section 8 — if the frontend calls exactly those endpoints with exactly those shapes, swapping mock → real backend requires **zero frontend code changes**, only flipping an env variable.

If anything below is ambiguous while building, do not guess silently — flag it, because this frontend will be pushed to GitHub and connected to a real backend afterward; any invented behavior that doesn't match Section 8's contract will break integration later.

## 1. Scope & Source of Truth

Two layers, visually consistent, both required:

1. **Core layer (exact wireframe fidelity)** — Login/Signup, Dashboard, Sales Orders, Purchase Orders, Manufacturing Orders, Bill of Materials, Products, granular permission-based User Management, Audit Logs. Every field, button, and status rule in Sections 6–7 below is transcribed directly from the wireframe.
2. **Intelligence layer (bolt-on, same visual language)** — Vendors (with performance scorecards), Market Signals (PIN), Insights (Forecasting + Pareto + Batch Purchase Optimization), Production Health (capacity/utilization), "Why Is It Late?" Delay Tracer, and the external Customer Portal. These are **new screens that did not exist in the wireframe** — built using the exact same List View / Form View / Kanban View patterns as the core layer so the whole app feels like one product, not two bolted-together apps.

**Correction to earlier planning:** the permission model is **not** a fixed set of named roles (Sales User, Purchase User, etc.). It is a generic **Admin / User** split where the Admin grants each individual User account granular Create/View/Edit/Delete rights **per field, per module** (Section 5). Discard any earlier "6 named roles" design — this wireframe's permission model is the real one.

---

## 2. Tech Stack (frontend)

- React 18 + Vite + TypeScript
- React Router v6
- Zustand — auth/session state, cart/order-draft state, live dashboard state
- Recharts — Forecasting charts, Pareto chart, Production Health utilization bars, Vendor Performance comparison
- Tailwind CSS — all styling
- `socket.io-client` — real-time updates
- `zod` — form validation (same shapes the backend will validate against)
- **MSW (Mock Service Worker)** — intercepts network calls so the app is fully interactive standalone before the backend exists (Section 9)

---

## 3. Project Folder Structure

```
frontend/
├── src/
│   ├── api/                      # one file per module, same function signatures regardless of mock/real
│   │   ├── authApi.ts
│   │   ├── salesApi.ts
│   │   ├── purchaseApi.ts
│   │   ├── manufacturingApi.ts
│   │   ├── bomApi.ts
│   │   ├── productApi.ts
│   │   ├── vendorApi.ts
│   │   ├── signalApi.ts          # PIN
│   │   ├── insightsApi.ts        # forecasting + pareto + batch optimization
│   │   ├── productionHealthApi.ts
│   │   ├── delayTraceApi.ts
│   │   ├── userManagementApi.ts
│   │   ├── auditApi.ts
│   │   ├── dashboardApi.ts
│   │   └── portalApi.ts          # customer portal
│   ├── mocks/
│   │   ├── browser.ts            # MSW setup
│   │   ├── handlers/              # one file per module, mirrors api/ 1:1
│   │   └── seed/                  # fixed demo data (Section 9.2)
│   ├── components/                 # shared design system (Section 10)
│   ├── features/                   # one folder per screen group, matches Section 7
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── sales/
│   │   ├── purchase/
│   │   ├── manufacturing/
│   │   ├── bom/
│   │   ├── products/
│   │   ├── vendors/
│   │   ├── signals/
│   │   ├── insights/
│   │   ├── productionHealth/
│   │   ├── delayTracer/
│   │   ├── userManagement/
│   │   ├── audit/
│   │   └── portal/
│   ├── hooks/                       # useSocket.ts, useAuth.ts, usePermission.ts
│   ├── store/                        # authStore.ts, draftOrderStore.ts, dashboardStore.ts
│   ├── layouts/                       # AppShell.tsx (internal), PortalShell.tsx (external)
│   ├── routes/                         # route table, matches Section 4
│   ├── types/                           # shared TS types mirroring Section 8 payload shapes
│   └── main.tsx
├── .env.example                          # VITE_API_BASE_URL, VITE_USE_MOCKS
├── package.json
└── vite.config.ts
```

---

## 4. Global Navigation Map

**Top bar (every internal screen):**
| Element | Position | Behavior |
|---|---|---|
| Hamburger icon | Left | Opens login/profile slide-out (My Profile, Logout) |
| Master Menu icon | Left, next to hamburger | Opens the Master Menu panel (table below) |
| App Logo + Name | Center | Click → navigates to Dashboard |
| New button | List views only | Opens a blank Form View for that module |
| Search icon | List views | Live search by reference/contact |
| List-view icon | List views | Switches table ↔ kanban |
| Kanban-view icon | List views | Switches table ↔ kanban |
| User Avatar | Right | Opens "User Login Detail Management" (My Profile) |

**Master Menu (panel items, in order):**
1. Dashboard
2. Sale Orders
3. Purchase Orders
4. Manufacturing Orders
5. Bills of Materials
6. Products
7. Vendors *(bolt-on)*
8. Market Signals *(bolt-on — PIN)*
9. Insights *(bolt-on — Forecasting / Pareto / Batch Purchase)*
10. Production Health *(bolt-on)*
11. User Management *(Admin only)*
12. Audit Logs

**Route table:**
| Path | Screen | Permission gate |
|---|---|---|
| `/login` , `/login/admin` , `/signup` | Auth screens | public |
| `/` | Dashboard | any logged-in user |
| `/sales` , `/sales/:id` , `/sales/new` | Sales Order list/detail/create | module=sales view/create |
| `/purchase`, `/purchase/:id`, `/purchase/new` | Purchase Order list/detail/create | module=purchase |
| `/manufacturing`, `/manufacturing/:id`, `/manufacturing/new` | MO list/detail/create | module=manufacturing |
| `/bom`, `/bom/:id`, `/bom/new` | BoM list/detail/create | module=manufacturing (Edit BOM) |
| `/products`, `/products/:id`, `/products/new` | Product list/detail/create | module=product |
| `/vendors`, `/vendors/:id` | Vendor list/detail | module=purchase |
| `/signals`, `/signals/new` | Market Signals | any logged-in user |
| `/insights` | Forecasting / Pareto / Batch Purchase | Admin or module=purchase |
| `/production-health` | Production Health dashboard | module=manufacturing |
| `/users`, `/users/:id` | User Management | Admin only |
| `/profile` | My Profile | any logged-in user |
| `/audit` | Audit Logs | Admin only (per wireframe legend) |
| `/portal/login`, `/portal/signup` | Customer portal auth | public, isolated from internal auth |
| `/portal/orders`, `/portal/orders/:id`, `/portal/reviews`, `/portal/messages` | Customer portal screens | portal JWT only |

---

## 5. Authentication & Permission Model

### 5.1 Login / Signup flow (exact wireframe behavior)

Two parallel login forms, cross-linked, plus one signup form:

- **Admin Login** (`/login/admin`): Login Id, Password, "Sign In". Link at bottom: "Login as User" → `/login`. Link: "Forgot Password? | Sign Up".
- **User Login** (`/login`): identical fields. Link at bottom: "Login as System Administrator" → `/login/admin`.
- **Signup** (`/signup`, creates a User account — Admin accounts are not self-service): Enter Login Id, Enter Email Id, Enter Password, Re-Enter Password, "Sign Up".
  - Login Id: 6–12 characters, must be unique (validated against backend on submit).
  - Password: minimum 8 characters, must include upper+lower case and a special character. Re-enter must match.
- Both logins: on submit, check credentials → on success store JWT + user object in `authStore` and redirect to `/`. On failure, show inline error without clearing the form. Forgot Password links to a (stubbed for now) reset flow.

### 5.2 Permission model

**Module-level legend (the ceiling — what each access level can ever mean):**

| Module | Action | Admin | User | None |
|---|---|---|---|---|
| Sales | View | Full | Full | Optional (admin can still allow) |
| Sales | Create | Yes | Yes | No |
| Sales | Edit | Full | Limited (field-by-field, see 5.3) | No |
| Sales | Delete | Yes | No | No |
| Sales | Approve/Confirm | Yes | No | No |
| Purchase | View | Full | Full | Optional |
| Purchase | Create | Yes | Yes | No |
| Purchase | Edit | Full | Limited | No |
| Purchase | Approve | Yes | No | No |
| Manufacturing | View | Full | Full | Optional |
| Manufacturing | Production Entry | Yes | Yes | No |
| Manufacturing | Edit BOM | Yes | No | No |
| Product | View | Full | Full | Optional |
| Product | Create | Yes | Yes | No |
| Product | Edit | Full | Limited | No |

Two fixed rules from this table that the frontend must hard-code (not admin-configurable): **only Admin can click Confirm/Approve on Sales or Purchase orders**, and **only Admin can edit a Bill of Materials**. Everything else in this table is the ceiling that the per-field grid below operates under.

**Per-user, per-field grid (the actual Admin-editable screen — User Management Form View, tabs: Sales | Purchase | Manufacturing | Product):**

Each tab lists every field of that module's form with 4 checkbox columns: Create / View / Edit / Delete. Exact fields per tab:

- **Sales tab:** Customer, Customer Address, Sales Person, Product, Ordered Quantity, Delivered Quantity, Sales Price, Status, Total (Edit shows "Recomputed" — never raw-editable), Creation Date (Create = "Auto Compute", Edit/Delete = always No).
- **Purchase tab:** Vendor, Vendor Address, Responsible Person, Product, Ordered Quantity, Received Quantity, Cost Price, Total ("Auto Recomputed"), Creation Date (Auto Compute, never editable/deletable).
- **Manufacturing tab:** Product to Manufacture, Product Quantity, BoM, Responsible Person, Finished Quantity, Creation Date (Auto Compute, never editable/deletable).
- **Product tab:** Product, Sales Price, Cost Price, On Hand Qty (Delete = "System Computed", i.e. never deletable), Free To Use Qty (always system-computed, no manual Create/Edit/Delete), Procure On Demand (Create = "Not possible" — it's a checkbox toggle, not a created record), Procurement Method ("Not Possible" to create directly), Vendor, Bill of Materials.

This grid is stored per `(user_id, module, field)` with 4 booleans. The frontend's `usePermission(module, field, action)` hook reads the logged-in user's grid (fetched once at login, cached in `authStore`) and returns a boolean. Use it to: hide a Master Menu item entirely if View is false for every field of that module; render a field read-only if Edit is false; omit a field from the create form if Create is false; hide a delete icon if Delete is false; hide Confirm/Approve buttons for non-Admin per the fixed rule above.

### 5.3 My Profile ("User Login Detail Management")

Any logged-in user, via the Avatar icon:
- Editable: Name, Address, Mobile Number.
- Read-only, cannot be changed by the user: Email ID (must match the email used at account creation), Position (free-text label like "Sales Manager" — settable only by Admin from the User Management form).
- Photo: upload + edit icon, saved to the user's profile.

---

## 6. User Flows

**Flow A — Admin grants a new user Sales access:**
User Management list → New (or select existing user) → fill Name/Address/Mobile/Email/Position → Sales tab → check Create/View/Edit boxes for the fields that user should touch → Save → user can now see "Sale Orders" in their Master Menu.

**Flow B — Sales Order lifecycle:**
Sale Orders list → New → fill Customer, Customer Address, Sales Person → Add a product line (Product, Ordered Qty; Sales Price auto-fills from product; Availability flag shows if Ordered Qty > product's Free-to-Use Qty) → Save (status: Draft) → **Confirm** (Admin only; locks Customer/Customer Address/Creation Date; reserves stock) → **Deliver** (enter Delivered Qty per line; if Delivered = Ordered for all lines → status Fully Delivered, fields locked, Deliver button hidden; if less → status Partially Delivered, only Delivered Quantity stays editable, Deliver button stays visible) → or **Cancel** at any pre-delivery point (locks everything). Every transition writes an Audit Log row, viewable via the **Logs** button (opens `/audit` pre-filtered to module=Sales, recordId=this order).

**Flow C — Purchase Order lifecycle:** mirrors Flow B with Vendor/Vendor Address/Responsible Person, Cost Price, and **Receive** instead of Deliver (Fully/Partially Received).

**Flow D — Manufacturing Order lifecycle:**
New MO → pick Finished Product → Bill of Material auto-filters to BoMs for that product → Quantity, Schedule Date, Assignee → Components tab populates from the BoM (Component, Availability, To Consume = BoM qty × MO qty) → **Confirm** (locks Finished Product/BoM, reserves components) → **Start** (switches the form from Components tab to Work Orders tab: Operation/Work Center/Expected Duration populate from BoM × MO qty, Real Duration becomes enterable) → **Produce** (marks Done, locks everything, increments finished-good stock, decrements consumed components) → or **Cancel** before Done.

**Flow E — BoM creation:** Bills of Materials → New → pick Finished Product (many2one) → Quantity, Reference text → Components tab (add components + qty) → Work Orders tab (add operations + work center + expected duration) → Save. This BoM is now selectable on any Manufacturing Order for that finished product, and all its values pre-populate there.

**Flow F — Product setup with auto-procurement:** Products → New → Product name, Sales Price, Cost Price → check "Procure on Demand" → pick Procurement Method: Purchase (adds mandatory Vendor field) or Manufacturing (adds mandatory BoM field) → Save. From now on, whenever On Hand Qty would fall short of a confirmed Sales Order's quantity, the (mocked, later real) backend auto-creates a PO or MO for the shortfall — the frontend just needs to show this happened (a toast + the new PO/MO appearing in its list, pushed via socket event).

**Flow G — Audit review:** Any "Logs" button on a form, or the Audit Logs menu item directly → filter by Date Range / User / Module / Action → paginated table.

**Flow H — "Why Is It Late?" (bolt-on):** On any Sales/Purchase/Manufacturing Order Form View that is overdue, a red "Why is this late?" button appears next to Logs → opens a modal showing a vertical timeline (this order → blocking MO/PO → root cause) plus one explanation sentence.

**Flow I — Market Signal reported (bolt-on):** Any logged-in user → Market Signals → New → pick source type, product/category, signal type, severity, description → Save. Next time anyone opens a Sales Order containing that product/category, a warning banner appears above the product lines before Confirm is clickable.

**Flow J — Customer Portal:** Customer receives an order confirmation email with a portal link → Portal Login (email + password, separate from internal auth) → My Orders list → click an order → tracking timeline (Draft/Confirmed/Partially Delivered/Fully Delivered mapped to customer-friendly labels), delivery estimate, reserved stock for that order's lines → after delivery, "Leave a Review" button appears → Communication History tab shows all messages tied to this customer.

---

## 7. Screen-by-Screen Specification

> Every screen uses the shared **AppShell** (fixed top bar + Master Menu, only the content panel scrolls — no full-page scroll). List screens use the shared **ListView** component (table + search + New + view-toggle + pagination); detail screens use **FormView** (status-driven readonly logic + action buttons + Logs button).

### 7.1 Sale Orders
- **List View** — columns: Reference, Date, Customer, Salesperson, Status. Toggle to **Kanban View** grouped by status (card shows Reference, Status, Customer, Date).
- **Form View** — header: Reference (auto, readonly), Status badge. Fields: Customer*, Customer Address, Creation Date (auto, readonly), Sales Person. Lines table: Product, Availability (flag), Ordered Qty, Delivered Qty, Units, Sales Unit Price (auto from product), Total. Footer: Total. Buttons: Back, Confirm, Deliver, Cancel, Logs. Status-driven field locking exactly as Flow B.

### 7.2 Purchase Orders
- **List View** — columns: Reference, Date, Vendor, Responsible, Status.
- **Form View** — fields: Vendor*, Vendor Address, Creation Date (auto), Responsible Person. Lines: Product, Ordered Qty, Received Qty, Units, Cost Unit Price, Total. Buttons: Back, Confirm, Receive, Cancel, Logs.
- **Bolt-on:** if 2+ Draft POs to the same Vendor exist, show a banner: "3 draft POs to Wood Co. can be merged — Merge Now" (Batch Purchase Optimization).

### 7.3 Manufacturing Orders
- **List View** — columns: Reference, Date, Finished Product, Component Status (Available/Not Available), Quantity, Unit, Status.
- **Form View** — fields: Finished Product*, Quantity, Bill of Material (filtered to product), Schedule Date, Assignee. Tab switches by status: **Components** (Draft/Confirmed) → Component, Availability, To Consume, Consumed, Units; **Work Orders** (after Start) → Operation, Work Center, Expected Duration, Real Duration. Buttons: Back, Confirm, Start, Produce, Cancel, Logs.
- **Bolt-on:** link to Production Health filtered to this MO's work centers.

### 7.4 Bills of Materials
- **List View** — columns: Reference, Finished Product, Quantity, Unit.
- **Form View** — Finished Product* (many2one, fetch from Products), Quantity, Reference (text, max length enforced). Tabs: Components (Component, To Consume, Units), Work Orders (Operation, Work Center, Expected Duration). Buttons: Back, Save, Logs.

### 7.5 Products
- **List View** — columns: Reference (PROD-xxxxxx), Product, Sales Price, Cost Price, On Hand Qty.
- **Form View** — Product*, photo, Sales Price, Cost Price, On Hand Qty (system, readonly), Free To Use Qty (system, readonly), Procure on Demand checkbox → Procurement Method (Purchase/Manufacturing) → Vendor or BoM field appears accordingly. Buttons: Back, Save, Logs.
- **Bolt-on:** "View Forecast" link → Insights screen pre-filtered to this product.

### 7.6 Vendors *(bolt-on)*
- **List View** — Reference, Vendor Name, On-Time Delivery %, Defect Rate, Lead Time Adherence.
- **Form View** — Vendor Name, Address, Contact, linked Products, performance scorecard (3 stat tiles + a small trend chart), purchase history table. Buttons: Back, Save, Logs.

### 7.7 Market Signals *(bolt-on — PIN)*
- **List View** — Reference, Source Type, Product/Category, Signal Type, Severity, Reported By, Date.
- **Form View (create only, no edit/delete by non-Admin)** — Source Type (dropdown: carpenter/contractor/dealer/supplier/warehouse_partner/transporter/employee/procurement_partner), Product (optional) or Category (optional), Signal Type (shortage/price_change/delay/availability), Severity (low/medium/high), Description. Buttons: Back, Save.
- **Embedded usage:** a warning banner component reused inside the Sales Order Form View, querying signals matching the cart's products/categories.

### 7.8 Insights *(bolt-on — Forecasting + Pareto + Batch Purchase)*
Three sections on one scrollable page (inside the fixed shell):
- **Forecasting** — per-product line chart (Recharts) of historical sales qty + projected next-period demand; a table of "Suggested Reorder Quantities."
- **Pareto / Profit Prioritization** — bar chart of products ranked by profit contribution with a cumulative-% line overlay; table flagging the top ~20% of products.
- **Batch Purchase Optimization** — table of vendors with 2+ mergeable draft POs and a "Merge Now" action (same banner also surfaces inline on the Purchase Orders list, see 7.2).

### 7.9 Production Health *(bolt-on)*
- Work Center utilization bars (active Work Order hours ÷ shift capacity), queue length per Work Center, idle-station flags, operator workload list with a configurable burnout threshold highlight, a "Suggest Redistribution" banner when one center is overloaded and another idle.

### 7.10 "Why Is It Late?" Delay Tracer *(bolt-on, modal)*
Triggered from a red button on overdue Sales/Purchase/Manufacturing Order Form Views. Modal shows: a vertical breadcrumb timeline (this order → blocking child order → root cause, with status icons), and the generated plain-English sentence underneath.

### 7.11 User Management
- **List View** — Users: Name column only (matches wireframe: Mahesh Gupta, Nisarg Verma, Sweta Kediya, Dinesh Patel, Trisha K.), search/list/kanban icons present but kanban not meaningful here (list-only is fine).
- **Form View** — profile header (Name, Address, Mobile, Email — readonly except for Admin editing here, Position editable only here) + photo, then tabs Sales | Purchase | Manufacturing | Product, each the exact field × Create/View/Edit/Delete grid from Section 5.3. Admin-only screen.

### 7.12 My Profile
Same visual card as User Management's profile header, but: Name/Address/Mobile editable by the user themself, Email and Position read-only (Position changeable only by Admin elsewhere).

### 7.13 Audit Logs
4 summary stat tiles (Total Logs / Create Actions / Update Actions / Delete Actions, each with a count + sub-label). Filters: Date Range, User, Module, Action, with Filter + Reset buttons. Table columns: Date & Time, User, Module, Record Type, Record ID, Action, Field Changed, Old Value, New Value. Pagination at the bottom. Reachable both directly from the Master Menu (unfiltered) and via any "Logs" button on a form (pre-filtered to that module + record).

### 7.14 Dashboard
Three card sections — Sale Orders, Purchase Orders, Manufacturing Orders — each with an **All** row and a **My** row of clickable status-count pills:
- Sales/Purchase: Draft, Confirmed, Partially Delivered/Received, then separately highlighted Delivered/Received and Late counts.
- Manufacturing: Draft, Confirmed, In-Progress, To Close, then Done.
- "My" rows show only records assigned to / created by the logged-in user, with a relevant subset of the same pills.
- Clicking any pill navigates to that module's list view pre-filtered to the matching status (and highlights the clicked pill).
- "Late" = client/schedule date has passed and the order is still in an unconfirmed/undelivered state.
- **Bolt-on additions to this same dashboard:** a small Forecasting/Pareto summary tile and a Production Health summary tile, each linking to their full screen.

### 7.15 Customer Portal *(bolt-on, separate shell — `PortalShell`, no Master Menu)*
- **Login/Signup** — Email + Password, isolated from internal auth (separate token, separate `portalApi.ts`).
- **My Orders** — list of this customer's orders with status.
- **Order Detail** — tracking timeline, delivery estimate, reserved stock for that order's lines.
- **Leave a Review** — available once an order is delivered.
- **Communication History** — list of all messages (email/SMS/portal) tied to this customer.

---

## 8. API Contract Appendix (mock now, real backend later — must match exactly)

### 8.1 Auth
| Endpoint | Method | Body | Response |
|---|---|---|---|
| `/api/auth/login` | POST | `{ loginId, password }` | `{ token, user: { id, name, email, position, isAdmin, permissions[] } }` |
| `/api/auth/signup` | POST | `{ loginId, email, password }` | `{ token, user }` |
| `/api/portal/auth/login` | POST | `{ email, password }` | `{ portalToken, customer }` (separate token, never accepted by internal routes) |

`permissions[]` shape: `{ module, field, canCreate, canView, canEdit, canDelete }[]`.

### 8.2 Standard module CRUD pattern (applies to Sales, Purchase, Manufacturing, BoM, Products, Vendors)
| Endpoint | Method | Notes |
|---|---|---|
| `/api/{module}` | GET | list, supports `?search=&status=&page=` |
| `/api/{module}/:id` | GET | full record incl. lines |
| `/api/{module}` | POST | create (Draft) |
| `/api/{module}/:id` | PATCH | edit fields allowed by status + permissions |
| `/api/{module}/:id` | DELETE | only if permitted and status allows |
| `/api/{module}/:id/confirm` | POST | Draft → Confirmed (Admin only for sales/purchase) |
| `/api/{module}/:id/cancel` | POST | → Cancelled |
| `/api/sales/:id/deliver` | POST | `{ lines: [{ lineId, deliveredQty }] }` → Partially/Fully Delivered |
| `/api/purchase/:id/receive` | POST | `{ lines: [{ lineId, receivedQty }] }` → Partially/Fully Received |
| `/api/manufacturing/:id/start` | POST | Confirmed → In-Progress |
| `/api/manufacturing/:id/produce` | POST | → Done |

### 8.3 Bolt-on endpoints
| Endpoint | Method | Notes |
|---|---|---|
| `/api/signals` | GET/POST | Market Signals (PIN) |
| `/api/signals/active?productIds=&categories=` | GET | for the Sales Order banner |
| `/api/insights/forecast/:productId` | GET | `{ history:[{period,qty}], forecast:[{period,qty}], suggestedReorderQty }` |
| `/api/insights/pareto` | GET | `{ products:[{productId,name,profit,cumulativePct,isTop20}] }` |
| `/api/insights/batch-purchase-suggestions` | GET | `{ vendorId, draftPoIds[], suggestedMergedQty }[]` |
| `/api/vendors/:id/performance` | GET | `{ onTimePct, defectRate, leadTimeAdherence, history[] }` |
| `/api/production-health` | GET | `{ workCenters:[{id,name,utilizationPct,queueLength,idle}], burnoutFlags[] }` |
| `/api/delay-trace/:orderType/:orderId` | GET | `{ chain:[{type,id,status,...}], explanation: string }` |
| `/api/audit?dateFrom=&dateTo=&user=&module=&action=&page=` | GET | `{ summary:{total,created,updated,deleted}, rows[] }` |
| `/api/users` , `/api/users/:id` | GET/POST/PATCH | profile + permissions grid (Admin only write) |
| `/api/me` | GET/PATCH | own profile (Name/Address/Mobile only) |
| `/api/portal/orders`, `/api/portal/orders/:id`, `/api/portal/reviews`, `/api/portal/messages` | GET/POST | customer portal, portal token only |

### 8.4 WebSocket events
| Event | Payload | Who listens |
|---|---|---|
| `order:status_changed` | `{ orderType, orderId, newStatus }` | Dashboard, relevant list view, Kanban |
| `stock:updated` | `{ productId, onHandQty, freeToUseQty }` | Products list/form, Sales/Manufacturing forms (Availability flags) |
| `signal:created` | `{ signal }` | Sales Order banner |
| `audit:entry_created` | `{ row }` | Audit Logs screen (live append) |

All requests carry `Authorization: Bearer <token>`; permission failures return `403` with `{ error, module, field, action }` so the frontend can show a consistent "not permitted" toast.

---

## 9. Mock Layer Strategy

### 9.1 Mechanism
Use **MSW (Mock Service Worker)** — it intercepts `fetch` at the network level using the exact paths in Section 8, so `api/*.ts` files call real-looking URLs and never need an `if (mock)` branch anywhere in component code. Toggle via `.env`: `VITE_USE_MOCKS=true`. When the real backend is ready, set it to `false` and point `VITE_API_BASE_URL` at the backend — no other change.

### 9.2 Seed data (for visual/demo consistency, matches the wireframe's own sample data)
- Users: Mahesh Gupta (Sales Manager), Nisarg Verma, Sweta Kediya, Dinesh Patel, Trisha K.
- Customers: Suzuki India, MRF Ltd.
- Vendors: Mayfair Co., OMA Mahek
- Products: Door Frames (Sales ₹10.00 / Cost ₹8.00 / On Hand 50), Lighting Frame (₹5.00 / ₹3.00 / On Hand 12)
- Sales Orders: SO-000001 (Suzuki India, Ravi Jadeja, Confirmed), SO-000002 (MRF Ltd., Saloni Shaikh, Partially Delivered)
- Purchase Orders: PO-000001 (Mayfair Co., Vijay Sharma, Confirmed), PO-000002 (OMA Mahek, John Doe, Draft)
- Manufacturing Orders: MO-000001 (Door Frames, 10 units, Confirmed, components Not Available), MO-000002 (Lighting Frame, 5 units, Draft, components Available)
- BoMs: BOM-000001 (Door Frames, 10 units), BOM-000002 (Lighting Frame, 5 units)
- At least one deliberately overdue chain (an SO blocked by an MO blocked by a PO) so the Delay Tracer modal has something real to show in the demo.

---

## 10. Component Library / Design System

| Component | Purpose |
|---|---|
| `AppShell` | Fixed top bar + Master Menu; only the inner content region scrolls |
| `PortalShell` | Simplified shell for the external customer portal (no Master Menu) |
| `ListView` | Table + search + New button + list/kanban toggle + pagination, used by every module list |
| `KanbanView` | Status-grouped cards, used by Sales/Purchase/Manufacturing/Products |
| `FormView` | Header (Reference + Status badge) + action button row + Logs button + status-driven field locking |
| `PermissionGate` | Wraps a field/button; renders nothing or read-only based on `usePermission()` |
| `LogsButton` | Navigates to `/audit` pre-filtered by module + record id |
| `StatCard` | The colored summary tiles (Audit Logs, Dashboard) |
| `StatusPill` | Colored badge per status, also used as the clickable dashboard filters |
| `FilterBar` | Date range + dropdown filters + Filter/Reset, used by Audit Logs and list views |
| `Banner` | Warning/info banner — reused for Market Signals on Sales Orders and Batch Purchase suggestions on Purchase Orders |

---

## 11. State Management Plan (Zustand)

- `authStore` — token, current user, permissions grid, `isAdmin`.
- `draftOrderStore` — in-progress Sales/Purchase/Manufacturing order being edited (lines, computed totals) before save.
- `dashboardStore` — live counts per module/status, updated by socket events.
- `portalAuthStore` — separate from `authStore`, isolated token for the customer portal.

---

## 12. Definition of Done (before pushing to GitHub)

- [ ] Every screen in Section 7 exists and matches its field list exactly.
- [ ] Every button's status transition in Sections 6–7 is implemented (Confirm/Deliver/Receive/Start/Produce/Cancel all correctly lock/unlock fields).
- [ ] `usePermission()` correctly hides/disables based on the seeded permissions grid for at least two different mock users (one Admin, one limited User).
- [ ] All API calls go through `api/*.ts` using the exact paths in Section 8 — grep the codebase for any hardcoded `fetch`/`axios` call outside that folder; there should be none.
- [ ] MSW is on by default (`VITE_USE_MOCKS=true`) and the entire app is clickable end-to-end with zero backend running.
- [ ] Socket event names match Section 8.4 exactly (so the future real backend's `io.emit()` calls connect with no frontend changes).
- [ ] No full-page scroll anywhere — only `AppShell`'s inner content region scrolls.
- [ ] README in `frontend/` documents how to flip `VITE_USE_MOCKS` to `false` and point at a real backend.
