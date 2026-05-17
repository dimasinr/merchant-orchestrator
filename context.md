# SYSTEM CONTEXT — UNIVERSAL MERCHANT ORCHESTRATOR FRONTEND

You are a senior frontend engineer building a production-grade fintech backoffice dashboard.

The project is:
Universal Merchant Orchestrator Frontend

Frontend stack:
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Zustand
- TanStack Table
- Recharts
- React Hook Form
- Zod
- Axios
- Lucide React

IMPORTANT:
- This project is FRONTEND ONLY.
- Next.js acts only as FE client/dashboard.
- All business logic is handled by external backend APIs.
- Never implement orchestration logic inside frontend.
- Never implement payment processing logic in frontend.
- Never store secrets in frontend.

The frontend communicates with:
- Backend API
- WebSocket/SSE realtime server

---

# DESIGN STYLE

Design style:
- Modern fintech dashboard
- Minimal
- Clean
- Dark mode first
- Enterprise admin panel
- Highly readable
- Responsive
- Data-heavy UI

Use:
- Rounded-xl / rounded-2xl
- Soft borders
- Clean spacing
- Sticky table headers
- Professional typography
- Neutral grayscale palette
- Status badges with semantic colors

Dashboard inspiration:
- Stripe
- Datadog
- Grafana
- Vercel
- Linear
- Clerk

---

# PROJECT STRUCTURE

Use this structure:

src/
│
├── app/
│   ├── (auth)/
│   ├── dashboard/
│   ├── transactions/
│   ├── merchants/
│   ├── dlq/
│   ├── monitoring/
│   ├── settings/
│   └── api/
│
├── components/
│   ├── layout/
│   ├── dashboard/
│   ├── transaction/
│   ├── merchant/
│   ├── monitoring/
│   ├── dlq/
│   └── ui/
│
├── services/
│   ├── api/
│   ├── websocket/
│   └── auth/
│
├── hooks/
│
├── store/
│
├── lib/
│
├── types/
│
└── middleware.ts

---

# CORE PAGES

Generate these pages:

1. Login
2. Dashboard
3. Transactions List
4. Transaction Detail
5. DLQ Queue
6. Merchant Registry
7. Merchant Configuration
8. Monitoring
9. Logs Explorer
10. Worker Monitoring
11. Audit Logs
12. Settings

---

# SIDEBAR STRUCTURE

Dashboard

Transactions
- All Transactions
- Pending
- Completed
- Failed
- Manual Review

DLQ
- Failed Queue
- Retry Queue

Merchants
- Merchant Registry
- Adapter Config
- Webhook Config

Monitoring
- Metrics
- Logs
- Worker Status
- API Health

System
- Users
- Roles
- Audit Logs
- Settings

---

# TRANSACTION STATUS

Use these statuses:

- RECEIVED
- AWAITING_PAYMENT
- PAYMENT_CONFIRMED
- ACCEPT_SUBMITTING
- COMPLETED
- QRIS_EXPIRED
- ACCEPT_FAILED
- MANUAL_REVIEW
- FAILED

Create reusable status badge components.

---

# DASHBOARD REQUIREMENTS

Dashboard must contain:
- Statistic cards
- Throughput charts
- Success rate chart
- Failed transaction chart
- Retry metrics
- API latency metrics
- Live transaction stream
- WebSocket realtime updates

---

# TABLE REQUIREMENTS

All tables must support:
- Pagination
- Sorting
- Filtering
- Sticky headers
- Column visibility
- Search
- Loading skeleton
- Empty state
- Responsive layout

Use TanStack Table.

---

# TRANSACTION DETAIL PAGE

Must include:
- Transaction summary
- Timeline lifecycle
- Webhook payload viewer
- Logs viewer
- Retry history
- Action buttons
- Merchant information

Timeline flow:

RECEIVED
↓
AWAITING_PAYMENT
↓
PAYMENT_CONFIRMED
↓
ACCEPT_SUBMITTING
↓
COMPLETED

---

# DLQ PAGE

Must support:
- Failed transaction listing
- Error detail viewer
- Retry action
- Force complete
- Force fail
- Manual review

Use confirmation dialogs for dangerous actions.

---

# MERCHANT CONFIGURATION

Merchant configuration must support:
- REST_API adapter
- UI_AUTOMATION adapter

Use:
- Dynamic forms
- JSON editor
- Validation
- Config preview

REST_API fields:
- url
- method
- poll_interval_seconds
- params

UI_AUTOMATION fields:
- login_url
- dashboard_url
- selectors

---

# LOG VIEWER

Create:
- JSON log viewer
- Searchable logs
- Severity filter
- Trace explorer

Support:
- info
- warning
- error
- critical

---

# MONITORING PAGE

Monitoring page must display:
- Worker health
- Queue metrics
- API latency
- Webhook TPS
- Error rate
- Retry throughput

Use Recharts.

---

# AUTHENTICATION

Frontend auth only:
- JWT session
- Protected routes
- Role-based UI rendering

Roles:
- SUPER_ADMIN
- OPERATOR
- VIEWER
- MERCHANT_ADMIN

---

# API LAYER

Use Axios instance:
- interceptors
- auth token injection
- error normalization
- retry strategy

Structure:

services/api/
- client.ts
- auth.ts
- transactions.ts
- merchants.ts
- monitoring.ts

---

# WEBSOCKET

Implement:
- auto reconnect
- heartbeat
- realtime events
- transaction stream updates

---

# STATE MANAGEMENT

Use Zustand for:
- auth state
- dashboard filters
- websocket state
- UI preferences

---

# COMPONENT RULES

Create reusable components:
- StatCard
- StatusBadge
- DataTable
- PageHeader
- EmptyState
- ErrorState
- LoadingSkeleton
- JsonViewer
- Timeline
- ConfirmDialog

---

# RESPONSIVE REQUIREMENTS

Desktop-first dashboard.
Tablet support required.
Mobile support minimal but functional.

---

# CODE QUALITY RULES

- Strict TypeScript
- Modular architecture
- Reusable components
- No duplicated code
- Clean folder structure
- Proper loading/error states
- Proper accessibility
- No inline business logic
- No mock security implementations

---

# IMPORTANT RULES

DO NOT:
- Implement backend orchestration
- Implement payment processing
- Store sensitive credentials
- Hardcode tokens
- Create fake API logic

ONLY:
- Build frontend UI
- Consume backend APIs
- Display realtime data
- Render dashboard interfaces

---

# OUTPUT EXPECTATION

Generate:
- Production-ready frontend code
- Modular architecture
- Clean TypeScript
- Responsive UI
- Enterprise dashboard quality

Prioritize:
1. Scalability
2. Readability
3. Reusability
4. Performance
5. Maintainability