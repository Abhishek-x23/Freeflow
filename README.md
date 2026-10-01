# Apex Support Ticket Dashboard

A production-grade, high-performance customer support ticket triage and response dashboard built for the 48-Hour Frontend Internship Assessment. Designed to replace error-prone spreadsheets with an intelligent, resilient, and accessible operations center.

---

## Key Features

1. **Ticket Operations & Management:**
   - Unified dashboard displaying over 5,000 deterministically generated tickets plus all 12 edge-case assessment test tickets.
   - Real-time SLA deadline tracking with countdowns updating every second (P0: 1h, P1: 4h, P2: 24h, P3: 72h).
   - SLA status indicators: **On Track**, **At Risk** (<20% SLA remaining), **Late**, and **Future**.

2. **Search & Multi-Dimensional Filtering:**
   - Debounced search (350ms) across ticket subjects, bodies, and IDs.
   - Filters for Status (`open`, `in_progress`, `resolved`), Priority (`P0`, `P1`, `P2`, `P3`), Category, and AI Decision (`auto_accept`, `manual_review`).
   - Bidirectional synchronization between Redux Toolkit and URL parameters (e.g. `/tickets?status=open&priority=P1`); fully shareable and persistent across reloads.

3. **Optimistic Updates & Conflict Resilience:**
   - Zero-latency optimistic UI updates for claiming tickets and moving statuses.
   - Automatic rollback and conflict explanations when HTTP 409 (another agent claimed) or HTTP 500 errors occur.
   - Enforced status lifecycle: `open → in_progress → resolved` and `resolved → open`.

4. **AI Triage Review Queue (`/review`):**
   - Quarantines tickets requiring human verification (`manual_review`).
   - One-click approval of AI proposals or manual category/priority overrides.
   - Required written explanation (minimum 10 characters) for any manual modification.
   - Strict enforcement of Enterprise customer priority invariant (cannot be downgraded below P1).

5. **Live Updates & Non-Disruptive Banner:**
   - Automatic background polling every 5 seconds via `GET /api/tickets/updates?since=`.
   - Incoming tickets are buffered into a top banner (`"3 new tickets — Show now"`), completely eliminating layout shifts (CLS) while an agent is reading.

6. **Bulk Operations:**
   - Multi-ticket selection with bulk claim and bulk status transitions.
   - Independent per-ticket API execution: retains successes, rolls back failures, and displays clear outcome summaries.

7. **Strict Security & XSS Sanitization:**
   - Customer HTML bodies and AI summaries are thoroughly sanitized using `DOMPurify` to eliminate malicious tags and handlers (such as `<img src=x onerror="...">`).
   - Attachment URLs undergo strict protocol verification: blocks `javascript:` and dangerous URI schemes.

8. **Accessible & Fully Responsive:**
   - Adapts seamlessly from 4K desktop tables to compact mobile cards at 375px viewport width.
   - High color contrast, visible focus rings, and screen-reader accessible labeling.

---

## Technology Stack

- **Framework:** Next.js (App Router) & React 19
- **State Management:** Redux Toolkit & React Redux
- **Styling:** Tailwind CSS with shadcn/ui design tokens
- **Icons:** Lucide React
- **Sanitization:** DOMPurify
- **Testing:** Vitest & React Testing Library
- **Server / Backend:** Node.js Express server + Next.js Route Handlers (`src/app/api/...`)
- **Database:** In-memory high-capacity store with deterministic PRNG

---

## Project Structure

```
├── src/
│   ├── app/                    # Next.js App Router routes & pages
│   │   ├── api/tickets/        # Next.js Route Handlers
│   │   │   ├── route.ts        # GET /api/tickets
│   │   │   ├── updates/        # GET /api/tickets/updates?since=
│   │   │   └── [id]/           # GET, /claim, /status, /triage, /retriage
│   │   ├── layout.tsx          # Root HTML layout with providers
│   │   ├── page.tsx            # Main entry point
│   │   ├── tickets/            # Ticket list & detail pages
│   │   └── review/             # AI review queue page
│   ├── components/
│   │   ├── layout/AppHeader.tsx
│   │   ├── tickets/            # TicketList, TicketRow, TicketCard, Filters, Search, Details
│   │   ├── review/ReviewQueue.tsx
│   │   └── shared/             # LoadingState, EmptyState, ErrorState
│   ├── features/tickets/       # Redux Toolkit slice, selectors, async thunks
│   ├── hooks/useCurrentTime.ts # Central 1-second interval timer hook
│   ├── lib/
│   │   ├── mock-database.ts    # In-memory database & business validation service
│   │   ├── mock-generator.ts   # Deterministic 5,000 ticket generator
│   │   ├── test-tickets.ts     # Assessment test tickets (T-2001 to T-2012)
│   │   ├── chaos-config.ts     # Latency & chaos simulation controls
│   │   ├── deadline-utils.ts   # SLA math and formatting
│   │   ├── safe-url.ts         # URL protocol validator
│   │   ├── sanitize.ts         # HTML sanitizer
│   │   └── api-client.ts       # Typed client API wrapper
│   ├── store/                  # Redux store & typed hooks
│   └── types/                  # Ticket, Agent, and API TypeScript definitions
├── tests/                      # Vitest automated test suites
├── server.ts                   # Full-stack Node API & dev server
├── DECISIONS.md                # Comprehensive architectural decision record
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js >= 18.x (Node 22.x recommended)
- npm >= 9.x

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd support-ticket-dashboard

# Install dependencies
npm install
```

### Environment Variables

No external API keys or paid accounts are required. A sample `.env.example` is provided:

```bash
cp .env.example .env
```

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `PORT` | `3000` | Port for the application server |
| `NODE_ENV` | `development` | Runtime environment |
| `ENABLE_MOCK_CHAOS` | `true` | Enables 300–1500ms delay and simulated faults |

---

## Development & Build Commands

```bash
# Start development server on port 3000
npm run dev

# Run automated test suite (Vitest)
npm test

# Run TypeScript type check
npm run lint

# Build production bundle
npm run build

# Start production server
npm start
```

---

## API Documentation

All endpoints return JSON responses with standard HTTP status codes.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/tickets` | Query tickets with pagination (`page`, `limit`), filters (`status`, `priority`, `category`, `ai_decision`), and search (`q`). |
| `GET` | `/api/tickets/:id` | Retrieve single ticket by `external_id`. Returns 404 if not found. |
| `POST` | `/api/tickets/:id/claim` | Claim an unassigned ticket. Body: `{ agent_id }`. Returns 409 if already claimed. |
| `PATCH` | `/api/tickets/:id/status` | Advance status (`open → in_progress → resolved`, `resolved → open`). Body: `{ status }`. |
| `PATCH` | `/api/tickets/:id/triage` | Update category or priority with required written explanation (min 10 chars). Enforces Enterprise min P1 rule. |
| `POST` | `/api/tickets/:id/retriage`| Re-run deterministic local AI classifier on ticket content. |
| `GET` | `/api/tickets/updates?since=`| Retrieve all tickets created or modified after ISO timestamp. |
| `POST` | `/api/simulation/toggle` | Toggle 300-1500ms delay and simulated error chaos on/off for testing. |

---

## Chaos & Latency Simulation Controls

To mimic a busy production server:
- API responses experience 300–1500ms simulated delay.
- ~10% of requests trigger simulated HTTP 500 errors.
- ~25% of claim attempts encounter simulated HTTP 409 race conditions.

### How to Bypass Simulation During Automated Tests:
1. Vitest tests automatically set `NODE_ENV=test`, disabling simulation.
2. In HTTP requests, pass the header `x-disable-simulation: true` or query param `?disable_simulation=true`.
3. In the UI, click the **"Sim: Chaos ON / Fast OFF"** badge in the header.

---

## Automated Test Results

Run `npm test` to execute the automated suite:

```bash
✓ tests/business-rules.test.ts (12 tests) 316ms
✓ tests/safety-and-sanitization.test.ts (10 tests) 11ms

Test Files  2 passed (2)
     Tests  22 passed (22)
  Duration  1.06s
```

All business invariants, status transitions, enterprise SLA rules, XSS sanitization, URL protocols, and test tickets (T-2001 through T-2012) are fully tested and passing.
