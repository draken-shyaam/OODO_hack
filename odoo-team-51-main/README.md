**Project Title**: PINERP (Procurement Intelligence Network Enterprise Resource PLanning)

PINERP is an explainable, intelligence-first ERP designed for growing manufacturers that cannot afford enterprise consultants but still need enterprise-level visibility.
Traditional ERPs tell businesses what happened. PINERP tells them what is happening, why it is happening, and what they should do next.

**Contributors**    
Srushti D  
Vaishnav Adithya  
Shyaam Ganesh  
Balachandar  

**Problem Statement**

To build a Mini ERP System that digitally manages the complete business flow:
● Product Management
● Sales Management
● Purchase Management
● Manufacturing
● Bill of Materials (BoM)
● Inventory & Stock Tracking
● Procurement Automation

**Features**

Module 1 — Product Master
Product Code / Name, Dimensions / Specifications, Lead Time,
Cost Price / Sales Price, Vendor Product Mapping, Movement Rate, Minimum Order Quantity (MOQ)
Procurement Strategy (MTS or MTO), Procurement Type (Purchase or Manufacturing), BoM Link.

Module 2 — Sales + Procurement Intelligence Network (PIN)
Customer management, Sales Order creation, Stock availability check 
Delivery tracking, Automatic reservation, Procurement triggering.
PIN (Market Signals) — before confirming an order, the Sales screen shows any active signals (shortage / price change / delay / availability) reported against the products in the cart, sourced from any authenticated user acting as a field reporter (carpenter, contractor, dealer, supplier, warehouse partner, transporter, employee, procurement partner). This is a real internal mechanism, not a literal external crowdsourcing network — see Section 5 for the exact table.

Module 3 — Inventory & Stock Ledger
On Hand Quantity, Reserved Quantity, Free-to-Use Quantity — `On Hand − Reserved`; this is the number every availability check uses.
Real-time stock visibility, Low-stock alerts, Auto-suggested reorder quantities, Stock reconciliation,
Shortage detectionm, Stock Ledger

Module 4 — Procurement Automation & Intelligence
Procurement Engine, Automatic PO/MO creation, MTS Engine (predicts demand, manufactures/purchases in advance)
MTO Engine, Forecasting Engine ("AI-Enhanced Procurement")
Batch Purchase Optimization, Vendor Performance Intelligence
Profit-Driven Procurement Prioritization (Pareto Engine)

Module 5- Manufacturing

Bill of Materials (BoM), Work Orders
Manufacturing Capacity Visualization — charts work center utilization, throughput, capacity bottlenecks, and delayed queues for proactive production planning.

"Why Is It Late?" Causal Delay Tracer
Causal Delay Tracer — one click on any delayed order traces the dependency chain backward (e.g. SO delayed → MO blocked → screw shortage → PO pending → vendor delayed) and returns a plain-English explanation such as: "SO-145 is delayed because Manufacturing Order MO-87 could not proceed due to insufficient screws. Purchase Order PO-22 remains unfulfilled by Vendor X."
Procurement Link Graph — an auto-generated relationship table storing SO→MO, SO→PO, and MO→PO links, used to construct the dependency chain.
Recursive Trace Engine — uses a recursive SQL query (graph traversal) to walk the link graph backward to the root cause. No machine learning required.
Explanation Generator — converts the structured trace into plain English via deterministic templates, with optional LLM polishing for nicer phrasing.

Cross-Cutting Platform Features
Real-Time Visibility — WebSockets push order status changes, stock updates, delays, procurement events, and audit events to every connected dashboard instantly, with no manual refresh.
Role-Based Access Control — JWT + middleware; users only access the modules permitted by their role (see Roles table above).
Audit Log Module — tracks status changes, quantity updates, price changes, deliveries, procurement events, manufacturing completion, and user actions, for end-to-end traceability.

AI Operations Assistant — not a separate system; it packages outputs from the other deterministic engines into:
Data Integrity Monitoring — detects negative stock, missing stock records, suspicious inventory patterns.
Automated Daily Reports — summaries for inventory, sales, purchases, delays, and forecasting.
Predictions — demand trends, procurement requirements, MTO material needs (reuses the Forecasting Engine).
Strategic Recommendations — fast-moving products, profit drivers, procurement priorities (reuses the Pareto Engine + Vendor Performance Intelligence).
Real-Time Dashboard — home screen aggregating Sales (totals/pending/delayed), Inventory (low-stock/critical shortages), Manufacturing (bottlenecks/utilization), Procurement (pending POs/vendor performance), and Strategy (top profit contributors/forecast insights), all live via WebSocket.
Tier A Customer Portal — isolated external login (separate from internal RBAC) for customers to track orders, view delivery estimates, monitor reserved stock, leave reviews, and view communication history.

**Architecture**

<img width="782" height="528" alt="image" src="https://github.com/user-attachments/assets/87ac508f-1d5c-4197-bf83-b28d9c848517" />


**Tech Stack**

<img width="1235" height="413" alt="image" src="https://github.com/user-attachments/assets/1b873e00-d20b-4caa-aee6-219fe9939799" />


**Setup Instructions**

Follow these steps to set up and run PINERP on your local machine:

### 1. Prerequisites
- **Node.js** (v18.x or later)
- **MySQL Server** (running locally on port 3306)

### 2. Environment Variables Configuration

#### Backend Configuration (`backend/.env`)
Create a `.env` file in the `backend/` directory with the following variables:
```env
DATABASE_URL="mysql://<user>:<password>@localhost:3306/pinerp_db"
JWT_INTERNAL_SECRET="your-internal-jwt-secret-key"
JWT_PORTAL_SECRET="your-portal-jwt-secret-key"
LLM_NARRATION_ENABLED=false
ANTHROPIC_API_KEY=""
PORT=4000
SMTP_USER="your-email@gmail.com"
SMTP_APP_PASSWORD="your-email-app-password"
FRONTEND_URL="http://localhost:5173"
```

#### Frontend Configuration (`frontend/.env`)
Create a `.env` file in the `frontend/` directory with the following variables:
```env
VITE_API_BASE_URL="http://localhost:4000"
```

### 3. Database Initialization & Seeding
From the `backend/` directory, run the following commands to initialize the schema and populate the database with mock records:
```bash
# Generate the Prisma client
npx prisma generate

# Apply migrations and reset the database (runs the seed script automatically)
npx prisma migrate reset --force
```

### 4. Running the Development Servers
You can run both the frontend and backend servers concurrently from the root directory:

```bash
# Install dependencies for both workspaces
npm install

# Run both servers concurrently
npm run dev
```

Once running:
- **Frontend App**: Accessible at [http://localhost:5173](http://localhost:5173)
- **Backend API**: Accessible at [http://localhost:4000](http://localhost:4000)

### 5. Seeded Logins (Demo Credentials)
- **Admin Portal**: Login ID `admin` / Password `Demo@1234`
- **Sales Manager**: Login ID `mahesh.gupta` / Password `Demo@1234`
- **Purchase Executive**: Login ID `nisarg.verma` / Password `Demo@1234`
- **Manufacturing Lead**: Login ID `sweta.kediya` / Password `Demo@1234`
- **Inventory Manager**: Login ID `dinesh.patel` / Password `Demo@1234`

---

**Project Structure**

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


API Documentation
Screenshots
