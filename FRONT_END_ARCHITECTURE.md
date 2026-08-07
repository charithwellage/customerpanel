# CarChief Frontend Architecture

**Status:** Approved reference architecture for the frontend rebuild
**Audience:** Developers and AI agents building any part of the three applications
**Companion documents:** [Implementation Plan](./docs/CarChief-Frontend-Implementation-plan.md) · [Roadmap](./docs/CarChief-Frontend-Implementation-Roadmap.md) · [Risks](./docs/implementation_risks.md)

---

## 1. Purpose

The delivery documents describe **what** is built and **in what order**. This document describes **how the code is organised**.

Read it before building any feature. It exists because an AI agent writes most of the code, and without a written architecture every feature drifts into a slightly different shape. The POC failed for exactly that reason — its screens were correct, but its data layer had two write paths and two read paths that never reconciled, so working screens showed wrong data.

**The one promise this architecture must keep:** when the real ASP.NET Core BFF replaces the mock service, **no screen changes**. Only a base URL changes. There are three user-facing frontend applications—Public Website, Customer Application and Salesperson Application—plus the separate mock-api service used during development.

Everything below serves that promise.

---

## 2. Principles

Five rules. Each is enforced by a lint rule or a CI check (§16) rather than by convention alone.

| # | Principle | In practice |
|---|---|---|
| P1 | **One way to reach data** | Every screen reads and writes through the same service layer. No screen calls `fetch` or the generated client directly. |
| P2 | **Features are vertical slices** | A feature owns its components, hooks, and schemas in one folder. Adding a feature means adding a folder, not editing shared code. |
| P3 | **Components render; hooks decide** | Components take props and return markup. All logic — fetching, deriving, submitting — lives in hooks. |
| P4 | **The contract is the source of truth** | Types come from the OpenAPI document. They are generated, never hand-written. |
| P5 | **Prefer deleting over abstracting** | We add an indirection only when it earns its place. §17 lists what we deliberately do not build. |

### Responsive-first and reusable feature packages

All three applications are responsive products, not desktop pages with a mobile fallback. Every shared component and feature package must support the agreed phone, tablet and desktop viewports, touch targets, keyboard navigation, browser zoom, reduced motion and narrow/long content. Fixed-width layouts, horizontal overflow for primary workflows and breakpoint-only hiding of required information are prohibited.

Shared behavior belongs in a reusable package when two or more applications need the same domain interaction. The vehicle search experience is the first explicit example: Public Website, Customer Application and Salesperson Application consume the same `packages/vehicle-search` package, while each app supplies an audience configuration for visibility, price presentation, reservation permissions, route handling and available actions. The package owns reusable search orchestration, filter schema, URL/query mapping, result-grid/list components, loading/empty/error states and accessibility behavior; it does not own app-specific navigation or authorization decisions.

Reusable packages must have a small public `index.ts`, framework-compatible peer dependencies, no app imports, no mock-fixture imports and no direct route assumptions. App-specific wrappers compose the package rather than fork it. New shared behavior is added once, tested once at package level, then covered by a thin integration test in each consuming application.

### SOLID, concretely

Not slogans — each maps to a specific rule or file location.

| Principle | How it appears here |
|---|---|
| **S**ingle responsibility | Four distinct jobs, four distinct places: components render (`features/*/components/`), hooks orchestrate (`features/*/hooks/`), services fetch (`packages/api-client/services/`), schemas validate (`features/*/schemas.ts`). |
| **O**pen/closed | New features are new folders under `features/`. Shared packages are extended, not modified, when a feature needs something new. |
| **L**iskov substitution | The mock service and the real BFF both satisfy the same OpenAPI contract, so either can stand in for the other without the caller noticing. |
| **I**nterface segregation | One small service module per domain (`vehicles.ts`, `invoices.ts`, `payments.ts`) — not one large API object that every screen imports. |
| **D**ependency inversion | Features depend on `vehicleService`, an abstraction owned by us. They do not depend on the generated HTTP client, which is owned by the contract. |

---

## 3. System architecture

This is the whole picture, including the seam where the API implementation changes.

```mermaid
flowchart TB
    subgraph Users[" "]
        direction LR
        U1["Public visitor"]
        U2["Customer"]
        U3["Sales / finance / admin staff"]
    end

    subgraph Apps["Applications — this repository"]
        direction LR
        A1["public-web<br/>Next.js App Router"]
        A2["customer-app<br/>React SPA"]
        A3["salesperson-app<br/>React SPA"]
    end

    subgraph Shared["Shared packages — this repository"]
        direction TB
        UI["ui + theme<br/>design system, tokens"]
        DOM["domain + validation<br/>types, rules, Zod schemas"]
        VEH["vehicle-search + vehicle-detail<br/>shared feature packages"]
        SVC["api-client / services<br/>thin per-domain modules"]
        GEN["api-client / generated<br/>typed client from OpenAPI"]
        SVC --> GEN
        VEH --> UI
        VEH --> DOM
        VEH --> SVC
    end

    U1 --> A1
    U2 --> A2
    U3 --> A3

    A1 --> UI
    A2 --> UI
    A3 --> UI
    A1 --> VEH
    A2 --> VEH
    A3 --> VEH
    A1 --> SVC
    A2 --> SVC
    A3 --> SVC
    SVC --> DOM

    GEN ==>|"HTTP + Bearer token<br/>ONE boundary"| BOUNDARY{{"API_BASE_URL"}}

    BOUNDARY -->|"now"| MOCK
    BOUNDARY -.->|"later — config change only"| REAL

    subgraph MOCK["apps/mock-api — same repo, its own container"]
        direction TB
        M1["Node.js API<br/>implements the OpenAPI contract"]
        M2["Stand-in sign-in<br/>issues JWT with role + permissions"]
        M3[("PostgreSQL<br/>own container")]
        M1 --> M3
        M2 --> M3
    end

    subgraph REAL["Production — later"]
        direction TB
        R1["ASP.NET Core BFF<br/>implements the same contract"]
        R2["AutoPulse sign-in<br/>already exists"]
        R3[("AutoPulse PostgreSQL")]
        R1 --> R3
        R2 --> R3
    end

    SPEC["openapi.yaml<br/>the single contract"]
    SPEC -.->|"generates"| GEN
    SPEC -.->|"implemented by"| M1
    SPEC -.->|"implemented by"| R1

    classDef user fill:#fff7ed,stroke:#d97706,color:#111827
    classDef app fill:#fef2f2,stroke:#dc2626,color:#111827
    classDef pkg fill:#eff6ff,stroke:#2563eb,color:#111827
    classDef spec fill:#fffbeb,stroke:#d97706,color:#111827,stroke-width:3px
    classDef mock fill:#f5f3ff,stroke:#7c3aed,color:#111827
    classDef real fill:#ecfdf5,stroke:#059669,color:#111827
    classDef data fill:#f0fdf4,stroke:#16a34a,color:#111827
    class U1,U2,U3 user
    class A1,A2,A3 app
    class UI,DOM,SVC,GEN pkg
    class SPEC,BOUNDARY spec
    class M1,M2 mock
    class R1,R2 real
    class M3,R3 data
```

### Reading the diagram

- **One HTTP boundary.** All three applications funnel through a single generated client. There is exactly one place where the frontend talks to a network.
- **`API_BASE_URL` is the switch.** Pointing at the mock or the real BFF is an environment variable. No code changes, no conditional branches, no `if (isMock)` anywhere.
- **The contract sits above everything.** `openapi.yaml` generates the frontend's types and is implemented by both backends. If the mock and the applications disagree about a field, the **build fails** rather than the behaviour breaking at runtime.
- **The mock lives in this repository but is not part of any application.** It sits under `apps/mock-api` as a peer of the three frontends, builds into its own container, and is reached only over HTTP.

> ### Why the mock is in this repository — and what that costs
>
> Keeping it here means the contract, the mock that implements it, and the applications that consume it move together in one commit and one pull request. A contract change and its mock implementation cannot drift apart across two repositories.
>
> **The cost is that repository separation no longer enforces the boundary.** When the mock lived elsewhere, importing its code was impossible. Now it is merely forbidden — so the rule is enforced by tooling instead:
>
> - `apps/mock-api` is a workspace package that **no frontend app declares as a dependency**, so its modules are not resolvable from application code.
> - An ESLint boundary rule rejects any import path containing `mock-api` from `apps/public-web`, `apps/customer-app`, `apps/salesperson-app` or any `packages/*`.
> - The dependency flows one way only: `mock-api` may read `openapi/openapi.yaml`; nothing in the frontend may read anything from `mock-api`.
>
> The applications reach the mock the same way they will reach the real BFF — over HTTP, at whatever `API_BASE_URL` points to.

> **Consistent with the delivery documents.** `docs/CarChief-Frontend-Implementation-plan.md` §4.2 and §4.4, and the Roadmap's target-solution section, describe the same arrangement in business language: the stand-in service lives in this repository and deploys as its own container.

---

## 4. BA workflow ownership and integration boundaries

The BA workflow baseline is documented in [`docs/CarChief-BA-Workflow-Coverage-Matrix.md`](docs/CarChief-BA-Workflow-Coverage-Matrix.md). The frontend applications display authoritative state and submit typed commands; they do not decide whether a transition is valid.

### Ownership

- The mock API models only approved workflow behavior needed by delivered screens.
- The future ASP.NET Core BFF owns authorization, state transitions, timers, calculations, idempotency and multi-record transactions.
- VBMS, Oracle NetSuite, auction websites, bank statements, email, WhatsApp and ERP/IBQ remain manual or external boundaries until separately approved.
- A UI label, notification intent or recorded checkpoint must never claim that an external operation completed without an integration response or an explicitly recorded manual confirmation.

### Provisional domain boundaries

The service layer may grow incrementally across these domains: stock ingestion, publication/visibility, pricing readiness, enquiries and screening, negotiation, reservations, proforma invoices, TT/payment review, allocations, Ship OK, document release, documents and external-integration checkpoints. Final payloads remain open until the BA and AutoPulse/BFF teams approve the fields.

### Server-authoritative transitions

The API boundary must enforce active/inactive publication, under-negotiation, PI-created, payment held/approved/rejected, Ship OK approval, document-release approval, vehicle allocation and customer document visibility. The browser may hide unavailable actions but is never the security or workflow authority.

### State separation

Operational lifecycle, commercial sale state, publication state, price readiness and country availability must not be collapsed into a single vehicle status. The existing 48-hour reservation rule and the BA negotiation timer remain separate concepts until the business resolves that decision. The 72-hour PI payment timer is a separate workflow stage.

## 4.1 Progressive Web App strategy

PWA support is part of the frontend architecture for all three user-facing applications. Each app owns its manifest, icons, service-worker registration and install/update UI, while shared packages provide the safe lifecycle and connectivity primitives.

- `packages/pwa` owns manifest helpers, online/offline state, update prompts, cache-version constants, logout cleanup and test utilities.
- `apps/public-web`, `apps/customer-app` and `apps/salesperson-app` provide app-specific names, icons, start URLs, scopes and offline fallback pages.
- The service worker may cache the public application shell and explicitly approved public read-only content.
- Authenticated customer/staff data, payment proofs, invoices, documents, identity data and staff data are never broadly cached. Sensitive data is cleared on logout and user changes.
- Offline mutations and approval/finance/logistics commands are blocked with a clear reconnect message. The BFF remains the authority for all state changes.
- Service-worker updates are versioned, observable and recoverable; a stale or broken cache must be clearable without deleting server data.
- Push notifications, background sync, camera capture and install analytics remain open requirements under `PWA-05`; they are not implied by installability.

PWA behavior is tested at package level and in each application at supported phone, tablet and desktop viewports, including fresh install, offline shell, reconnect, update, logout and cache-reset scenarios.

### 4.2 The design pattern

**Feature-first (vertical slice) organisation with a thin service layer.**

Each feature is a self-contained slice — its components, its hooks, its validation — in one folder. Beneath the features sits one shared layer for reaching the API. That is the entire pattern.

**Why this and not something heavier.** Feature-Sliced Design and Clean/Hexagonal layering both solve real problems, but their ceremony (layer taxonomies, interface-per-domain, DI containers) buys little here: the base-URL switch already delivers backend swappability, and three applications is not enough surface to justify the file count. §17 records what was rejected and why.

**What it looks like in one sentence:** a screen renders what a hook gives it; the hook asks a service; the service calls the generated client; the client talks to whichever API the environment points at.

---

## 5. Layers and the dependency rule

```mermaid
flowchart TB
    R["Routes / pages<br/>URL → screen, layout, guards"]
    F["Features<br/>components + hooks + schemas"]
    S["Services<br/>one thin module per domain"]
    G["Generated client<br/>from openapi.yaml"]
    H["HTTP"]

    U["ui + theme<br/>presentational, no data"]
    D["domain + validation<br/>types, rules, schemas"]

    R --> F
    F --> S
    S --> G
    G --> H

    R --> U
    F --> U
    F --> D
    S --> D

    F -.->|"FORBIDDEN"| G
    R -.->|"FORBIDDEN"| S
    U -.->|"FORBIDDEN"| S

    classDef allowed fill:#ecfdf5,stroke:#059669,color:#111827
    classDef shared fill:#eff6ff,stroke:#2563eb,color:#111827
    classDef edge fill:#fffbeb,stroke:#d97706,color:#111827
    class R,F,S allowed
    class U,D shared
    class G,H edge
```

### The rule

**Dependencies point downward and never upward.** Beyond that, three specific prohibitions:

| Forbidden | Why |
|---|---|
| A feature importing the generated client | Couples the feature to the transport shape. This is what made the POC hard to change. |
| A route importing a service directly | Routes wire screens together; they do not fetch. Fetching belongs in a feature hook. |
| A `ui` component importing a service | Shared components must stay presentational so they are reusable and testable without a network. |
| One feature importing another feature's internals | Only a feature's `index.ts` is public. Reaching inside creates hidden coupling. |

### Responsibilities

| Layer | Owns | Never does |
|---|---|---|
| **Routes / pages** | URL structure, layout composition, auth guards, metadata | Fetch data, hold business logic |
| **Features** | Screen behaviour, orchestration, feature-local state, validation schemas | Know the HTTP shape, know the base URL |
| **Services** | How to call one domain; mapping wire shapes to domain types | Cache, hold React state, know about components |
| **Generated client** | Typed HTTP calls, auth header, error normalisation | Anything hand-written — it is regenerated |
| **ui + theme** | Presentational components, design tokens | Fetch, validate, or know any domain |
| **domain + validation** | Shared types, status vocabularies, business rules, Zod schemas | Import from any layer above |

---

## 6. Folder structure

### The frontend repository

```text
carchief-frontend/
├── apps/                           # Every app here builds into its OWN container
│   ├── public-web/                 # Next.js App Router — server-rendered, indexable
│   │   ├── src/
│   │   ├── Dockerfile
│   │   ├── .env.example            # Committed — documents required variables
│   │   └── .env.local              # Git-ignored — developer's real values
│   ├── customer-app/               # React + Vite SPA — authenticated
│   │   ├── src/
│   │   ├── Dockerfile
│   │   ├── .env.example
│   │   └── .env.local
│   ├── salesperson-app/            # React + Vite SPA — authenticated
│   │   ├── src/
│   │   ├── Dockerfile
│   │   ├── .env.example
│   │   └── .env.local
│   └── mock-api/                   # Stand-in backend. NOT imported by any app.
│       ├── src/
│       │   ├── routes/             # One router per domain, mirroring services/
│       │   ├── auth/               # JWT issuing, role + permission claims
│       │   └── seed/               # Demonstration data
│       ├── prisma/schema.prisma    # Declarative schema → typed client
│       ├── Dockerfile
│       ├── .env.example
│       └── .env.local
│
├── packages/                       # Build-time only. None of these is a container.
│   ├── ui/                         # Design system: Button, Card, Table, Dialog, EmptyState…
│   ├── theme/                      # Design tokens + ThemeProvider (see §11)
│   ├── domain/                     # Shared types, status vocabularies, business rules
│   ├── validation/                 # Zod schemas shared across apps
│   ├── api-client/                 # THE only place that talks HTTP (see below)
│   ├── vehicle-search/             # Shared vehicle search UI, hooks, schemas and view models
│   ├── vehicle-detail/             # Shared vehicle detail/gallery projections where applicable
│   ├── pwa/                         # Manifest, safe cache lifecycle, offline/update primitives
│   ├── testing/                    # Fixtures, render helpers, Playwright utilities
│   └── config/                     # Shared eslint / tsconfig / tailwind / vite presets
│
├── openapi/
│   └── openapi.yaml                # The contract. Owned here, implemented by mock-api.
│
├── docker/
│   ├── docker-compose.yml          # Base: all five services
│   ├── docker-compose.dev.yml      # Overlay: hot reload, bind mounts, exposed ports
│   ├── docker-compose.prod.yml     # Overlay: built images, no mock-api, no postgres
│   └── nginx/                      # Static-serving config for the two SPAs
│
├── .env.example                    # Committed — compose-level variables (ports, DB)
├── .env                            # Git-ignored — what docker compose actually reads
├── .gitignore                      # Ignores .env, .env.local, never .env.example
├── package.json                    # Workspace root
└── FRONT_END_ARCHITECTURE.md       # This document
```

### The API client package — the critical one

```text
packages/api-client/
├── generated/
│   └── schema.d.ts                 # openapi-typescript output — NEVER hand-edited
├── http.ts                         # Base client: baseUrl, auth header, error normalisation
├── services/                       # Thin per-domain modules — the layer features import
│   ├── vehicles.ts
│   ├── customers.ts
│   ├── leads.ts
│   ├── quotations.ts
│   ├── invoices.ts
│   ├── payments.ts
│   ├── shipments.ts
│   ├── documents.ts
│   ├── masters.ts                  # countries, ports, banks, shippers, terms
│   ├── rates.ts                    # freight, city delivery, exchange
│   └── auth.ts
└── index.ts                        # Exports services only — never `generated` or `http`
```

Services live in a shared package, not inside an app, because the customer and salesperson applications both need vehicles, invoices and payments. One definition of how to call each domain, used by all three.

### Inside an application

```text
apps/customer-app/src/
├── app/
│   ├── routes.tsx                  # Route table
│   ├── providers.tsx               # QueryClient, ThemeProvider, AuthProvider
│   └── layout/                     # Shell, sidebar, header
│
├── features/                       # Vertical slices — the bulk of the code
│   ├── dashboard/
│   ├── vehicles/
│   ├── invoices/
│   ├── payments/
│   ├── shipments/
│   ├── documents/
│   ├── notifications/
│   └── profile/
│
├── shared/                         # App-local helpers used by 2+ features
└── main.tsx
```

### Container topology

One repository, five containers. Every application ships independently.

```mermaid
flowchart TB
    subgraph Repo["carchief-frontend — one repository, one workspace"]
        direction TB
        subgraph Built["Containers built from apps/"]
            direction LR
            C1["public-web<br/>:3000<br/>Node (Next.js server)"]
            C2["customer-app<br/>:3001<br/>nginx (static)"]
            C3["salesperson-app<br/>:3002<br/>nginx (static)"]
            C4["mock-api<br/>:4000<br/>Node"]
        end
        C5[("postgres<br/>:5432<br/>mock data only")]
        PKG["packages/*<br/>compiled INTO the images above<br/>— never a container"]
    end

    C1 -->|HTTP| C4
    C2 -->|HTTP| C4
    C3 -->|HTTP| C4
    C4 --> C5
    PKG -.->|build time| C1
    PKG -.->|build time| C2
    PKG -.->|build time| C3

    C1 -.->|"production: API_BASE_URL → BFF"| BFF["ASP.NET Core BFF<br/>outside this repo"]
    C2 -.-> BFF
    C3 -.-> BFF

    classDef app fill:#fef2f2,stroke:#dc2626,color:#111827
    classDef mock fill:#f5f3ff,stroke:#7c3aed,color:#111827
    classDef data fill:#ecfdf5,stroke:#059669,color:#111827
    classDef pkg fill:#eff6ff,stroke:#2563eb,color:#111827
    classDef ext fill:#f9fafb,stroke:#6b7280,color:#111827,stroke-dasharray: 4 4
    class C1,C2,C3 app
    class C4 mock
    class C5 data
    class PKG pkg
    class BFF ext
```

**Why `packages/*` is not a container.** Shared packages are compiled into each application's image at build time. They have no runtime of their own, which is why the workspace has four deployable apps and ten build-time packages, including the reusable vehicle-search, vehicle-detail and pwa packages.

**In production, `mock-api` and `postgres` are simply not deployed.** The three application containers point at the real BFF instead. No image changes, no rebuild of application code — only `API_BASE_URL` differs.

### Docker Compose files

Three files, composed together rather than duplicated. The base file describes *what the services are*; the overlays describe *how this environment differs*.

| File | Purpose | Contains |
|---|---|---|
| `docker/docker-compose.yml` | Base — the service graph | All five services, image names, networks, depends-on |
| `docker/docker-compose.dev.yml` | Local development overlay | Bind mounts for hot reload, exposed ports, dev command overrides |
| `docker/docker-compose.prod.yml` | Production overlay | Pre-built image tags, **omits `mock-api` and `postgres`**, real `API_BASE_URL` |

```bash
# Local development — everything including the mock and its database
docker compose -f docker/docker-compose.yml -f docker/docker-compose.dev.yml up

# Production — three app containers only, pointed at the real BFF
docker compose -f docker/docker-compose.yml -f docker/docker-compose.prod.yml up -d
```

**Each app owns its `Dockerfile`**, sitting beside its source in `apps/<name>/Dockerfile`. Compose references them by build context. This keeps each application's build concerns with the application, and means an app can be built and run on its own without Compose at all.

**Build context is the repository root**, not the app folder — because each image needs `packages/*` and the workspace lockfile. Each `Dockerfile` therefore starts from the root and copies only the workspace paths it needs:

```dockerfile
# apps/customer-app/Dockerfile — shape only
FROM node:22-alpine AS build
WORKDIR /repo
COPY package.json pnpm-lock.yaml ./
COPY packages/ ./packages/
COPY apps/customer-app/ ./apps/customer-app/
RUN pnpm install --frozen-lockfile && pnpm --filter customer-app build

FROM nginx:alpine
COPY --from=build /repo/apps/customer-app/dist /usr/share/nginx/html
COPY docker/nginx/spa.conf /etc/nginx/conf.d/default.conf
```

### Environment files

Two levels, because two different consumers read them.

| Level | File | Read by | Committed? |
|---|---|---|---|
| Repository root | `.env` | `docker compose` — ports, database credentials, image tags | **No** |
| Repository root | `.env.example` | Humans and agents — documents every variable | **Yes** |
| Per app | `apps/<name>/.env.local` | The app's dev server when run outside Docker | **No** |
| Per app | `apps/<name>/.env.example` | Humans and agents | **Yes** |

**Rules**

1. **Never commit a real `.env` or `.env.local`.** `.gitignore` excludes both patterns and explicitly re-includes `*.example`.
2. **Every variable appears in an `.env.example`** with a safe placeholder and a one-line comment. A variable that exists only in someone's local file will break the next person's setup.
3. **Compose passes variables into containers explicitly**, via `environment:` entries — it does not mount `.env` files into images.
4. **Build-time versus runtime.** The Vite SPAs bake `VITE_*` variables in at build time, so changing `API_BASE_URL` for those means rebuilding the image. Next.js and `mock-api` read theirs at runtime. Where the same value is needed at runtime by all three, it is served from the Next.js app's runtime config rather than baked in.
5. **Framework prefixes are mandatory.** Vite only exposes `VITE_*` to client code; Next.js only exposes `NEXT_PUBLIC_*`. **Anything without that prefix stays server-side — which is exactly where secrets belong.**

```bash
# .env.example  (repository root — read by docker compose)
COMPOSE_PROJECT_NAME=carchief
PUBLIC_WEB_PORT=3000
CUSTOMER_APP_PORT=3001
SALESPERSON_APP_PORT=3002
MOCK_API_PORT=4000
POSTGRES_PORT=5432
POSTGRES_USER=carchief
POSTGRES_PASSWORD=change-me          # local only; never a real credential
POSTGRES_DB=carchief_mock
```

```bash
# apps/customer-app/.env.example
VITE_API_BASE_URL=http://localhost:4000    # mock locally; BFF URL in production
VITE_APP_NAME=CarChief Customer Portal
```

```bash
# apps/mock-api/.env.example
PORT=4000
DATABASE_URL=postgresql://carchief:change-me@postgres:5432/carchief_mock
JWT_SECRET=local-development-only          # never a production value
JWT_EXPIRY=8h
```

> **No production secret ever appears in this repository**, including in an `.env.example`. Production values are supplied by the deployment environment. The examples above are local-development placeholders and are named as such.

---

## 7. Anatomy of a feature slice

Every feature has the same shape. An agent building a new one copies this structure exactly.

```text
features/invoices/
├── components/
│   ├── InvoiceLedgerTable.tsx      # Presentational — props in, markup out
│   ├── InvoiceStatusBadge.tsx
│   └── InvoiceDetailPanel.tsx
├── hooks/
│   ├── useInvoiceLedger.ts         # Fetch + derive + expose state
│   └── useRecordPayment.ts         # Mutation + cache invalidation
├── schemas.ts                      # Zod — used by forms AND payload validation
└── index.ts                        # Public surface. Nothing else is importable.
```

### The four technologies meeting in one feature

**Service module** — `packages/api-client/services/invoices.ts`:

```ts
import { http } from '../http';

export const invoiceService = {
  list: (customerId: string) =>
    http.GET('/customers/{id}/invoices', { params: { path: { id: customerId } } }),

  recordPayment: (invoiceId: string, body: RecordPaymentInput) =>
    http.POST('/invoices/{id}/payments', { params: { path: { id: invoiceId } }, body }),
};
```

**Read hook** — TanStack Query handles loading, error, caching, refetch:

```ts
export function useInvoiceLedger(customerId: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['invoices', customerId],
    queryFn: () => invoiceService.list(customerId),
  });

  // Derivation belongs here, not in the component
  const outstanding = useMemo(() => deriveOutstanding(data), [data]);

  return { invoices: data ?? [], outstanding, isLoading, error };
}
```

**Write hook** — mutation plus explicit cache invalidation:

```ts
export function useRecordPayment(customerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RecordPaymentInput) =>
      invoiceService.recordPayment(input.invoiceId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices', customerId] });
      qc.invalidateQueries({ queryKey: ['customer', customerId] }); // balance changed
    },
  });
}
```

**Component** — renders only:

```tsx
export function InvoiceLedger({ customerId }: { customerId: string }) {
  const { invoices, outstanding, isLoading, error } = useInvoiceLedger(customerId);

  if (isLoading) return <TableSkeleton />;
  if (error)     return <ErrorState error={error} />;
  if (!invoices.length) return <EmptyState message="No invoices yet" />;

  return <InvoiceLedgerTable rows={invoices} outstanding={outstanding} />;
}
```

Note what the component does **not** contain: no `fetch`, no base URL, no try/catch, no cache handling, no derivation. That is the pattern working.

---

## 8. How data flows

### Reading

```mermaid
sequenceDiagram
    participant C as Component
    participant H as Feature hook
    participant Q as TanStack Query
    participant S as Service module
    participant G as Generated client
    participant API as Mock or real API

    C->>H: useInvoiceLedger(customerId)
    H->>Q: useQuery(['invoices', id])
    alt cached and fresh
        Q-->>H: cached data
    else needs fetching
        Q->>S: invoiceService.list(id)
        S->>G: typed GET
        G->>API: HTTP + Bearer token
        API-->>G: JSON
        G-->>S: typed response
        S-->>Q: domain objects
        Q-->>H: data + isLoading + error
    end
    H-->>C: view-ready state
```

### Writing

```mermaid
sequenceDiagram
    participant C as Component
    participant F as Form (RHF + Zod)
    participant H as Mutation hook
    participant S as Service module
    participant API as Mock or real API
    participant Q as Query cache

    C->>F: user submits
    F->>F: Zod validates
    alt invalid
        F-->>C: field errors, nothing sent
    else valid
        F->>H: mutate(payload)
        H->>S: invoiceService.recordPayment(...)
        S->>API: HTTP POST
        API-->>S: result
        S-->>H: success
        H->>Q: invalidate affected keys
        Q-->>C: dependent screens refetch
    end
```

**The invalidation step is not optional.** A write that changes a customer's balance must invalidate every query that displays a balance. The POC showed five different balances on five screens precisely because nothing coordinated this. Every mutation hook declares which keys it invalidates.

---

## 9. The contract and environment switching

### Generation

```
openapi.yaml  ──▶  openapi-typescript  ──▶  packages/api-client/generated/schema.d.ts
```

Run as a script (`pnpm generate:api`), committed to the repository, regenerated whenever the contract changes. **Never hand-edited** — edits are lost on the next run and the file carries a header saying so.

### Switching backends

| Environment | Value | Set in |
|---|---|---|
| Local, outside Docker | `http://localhost:4000` | `apps/<name>/.env.local` |
| Local, in Docker | `http://mock-api:4000` (compose network name) | `docker/docker-compose.dev.yml` |
| Shared demonstration | mock-api host | deployment environment |
| Production | ASP.NET Core BFF host | deployment environment |

That is the entire switch. There is no mock adapter, no service-locator, no `if (isMock)` branch. The only code that reads this variable is `packages/api-client/http.ts`.

**Guardrails**

- The production build asserts that `API_BASE_URL` does not resolve to a known mock host, and fails if it does.
- `docker/docker-compose.prod.yml` does not define `mock-api` or `postgres` at all, so a production stack cannot start them by accident.

---

## 10. Authentication and authorisation

AutoPulse provides authentication in production. It is unavailable during this project, so the mock service issues an equivalent signed token. **The applications only ever see the token — never the issuer** — which is what makes the switch a configuration change.

```mermaid
sequenceDiagram
    participant U as User
    participant App as Application
    participant Auth as Sign-in provider
    participant API as Business API

    Note over Auth: Mock service now · AutoPulse later
    U->>App: credentials
    App->>Auth: POST /auth/login
    Auth-->>App: JWT { sub, role, permissions[] }
    App->>App: store token, hydrate AuthProvider

    U->>App: opens a protected screen
    App->>App: route guard checks role
    App->>API: request + Bearer token
    API->>API: verifies token, enforces permissions
    alt permitted
        API-->>App: data
    else not permitted
        API-->>App: 403
        App-->>U: not-authorised state
    end
```

### Rules

- **The server is the authority.** Client-side permission checks only decide what to *show*. Every protected response is enforced by the API. Hiding a button is not security.
- **The token is attached in one place** — `packages/api-client/http.ts`. Features never touch headers.
- **Permissions come from the token**, not from a local table. The 29-permission model from the POC is carried in the claims.
- **A 401 clears the session and redirects** once, centrally, in the HTTP layer.

---

## 11. Theming

The POC already uses Tailwind v4's `@theme` with CSS custom properties, so this is a continuation of an existing approach rather than a new mechanism.

```mermaid
flowchart LR
    T1["carchief theme<br/>the POC look"] --> TOK
    T2["dark theme"] --> TOK
    T3["future: partner brand"] -.-> TOK
    TOK["CSS custom properties<br/>--color-primary, --space-*, --radius-*"]
    TOK --> UI["packages/ui components"]
    UI --> APPS["All three applications"]

    classDef theme fill:#fff7ed,stroke:#d97706,color:#111827
    classDef tok fill:#fffbeb,stroke:#d97706,color:#111827,stroke-width:3px
    classDef comp fill:#eff6ff,stroke:#2563eb,color:#111827
    classDef app fill:#fef2f2,stroke:#dc2626,color:#111827
    class T1,T2,T3 theme
    class TOK tok
    class UI comp
    class APPS app
```

**Mechanism.** Tokens are CSS custom properties scoped by a `data-theme` attribute on the root element. Switching themes sets that attribute — no re-render, no rebuild, no JavaScript theme objects passed through props.

**The rule:** components reference semantic roles (`bg-surface`, `text-primary`, `border-danger`), never literal values (`bg-[#dc2626]`, `p-[13px]`). A lint rule fails the build on raw colour or spacing literals in application code.

This is what makes a rebrand a single-file change instead of a pass over every screen.

---

## 12. State management

Two kinds of state, handled two different ways. Most confusion in frontend codebases comes from mixing them.

| Kind | Examples | Handled by |
|---|---|---|
| **Server state** — data owned by the API | Vehicles, invoices, payments, customers | **TanStack Query**. Never copied into `useState`. |
| **Feature-local UI state** | Open dialog, active tab, filter selections | `useState` inside the feature |
| **Cross-cutting client state** | Signed-in user, active theme | React Context, one provider each |
| **Form state** | Any form | React Hook Form (§13) |

**There is no global store.** Redux, Zustand and similar are not used, because once server state lives in TanStack Query and forms live in React Hook Form, the remaining shared state is two values — user and theme — which Context handles without ceremony.

**Never copy server data into local state.** Deriving is fine (`useMemo`); mirroring is not. A mirrored copy goes stale, and that is the class of bug this whole architecture exists to prevent.

---

## 13. Forms and validation

React Hook Form for state, Zod for rules, one schema for both.

```ts
// features/quotations/schemas.ts
export const quotationSchema = z.object({
  chassisNo:  z.string().min(1, 'Chassis number is required'),
  fobPrice:   z.number().positive('Must be greater than zero'),
  currency:   z.enum(['USD', 'JPY', 'EUR', 'UGX', 'GBP', 'AUD', 'CAD']),
  taxBasis:   z.number().min(0).max(100),
  tradeTerm:  z.enum(['CNF', 'FOB', 'CIF', 'C&F']),
});

export type QuotationInput = z.infer<typeof quotationSchema>;
```

```tsx
const form = useForm<QuotationInput>({ resolver: zodResolver(quotationSchema) });
```

**Why one schema.** The same rules validate the form and the outgoing payload, so a field cannot be valid on screen and rejected by the API. The inferred type flows through the mutation hook and the service, giving end-to-end type safety from input to request.

**Rules**

- Validation rules live in `schemas.ts`, never inline in a component.
- Server-side errors map back onto fields via `setError`, so users see them in context.
- Submit buttons disable while a mutation is in flight — handled by the mutation hook's `isPending`.
- The POC relied on browser-native validation only. That is not sufficient and is not carried forward.

---

## 14. Error, loading and empty states

Three states, three shared components, used everywhere. Consistency here is what makes an application feel finished.

| State | Component | Rule |
|---|---|---|
| Loading | `<Skeleton />` matching the content shape | Never a bare spinner for content areas |
| Error | `<ErrorState />` with a retry action | Never a blank screen or a raw error string |
| Empty | `<EmptyState />` explaining what is missing and what to do | **Never substitute placeholder data** |

**That last rule is not negotiable.** The POC contained two charts that, when their query returned no rows, silently displayed fabricated figures — "Toyota, 8 units sold" against a catalogue containing no Toyota. Empty means empty.

---

## 15. Testing

Each layer is tested at the level where failure is cheapest to find.

| Layer | Test type | Tool |
|---|---|---|
| `ui` components | Render + interaction, no network | Vitest + Testing Library |
| Feature hooks | Behaviour with a mocked service module | Vitest |
| Service modules | Request shape and response mapping | Vitest + MSW |
| Contract | Generated types match `openapi.yaml` | Type check in CI |
| Journeys | Full user flows against the running mock | Playwright |

Responsive acceptance is required at package and application level: shared vehicle-search tests cover phone/tablet/desktop layouts, keyboard and touch interaction, and no-overflow behavior; each application adds route/permission/content variations without reimplementing the search module.
| Money | Worked examples reconcile exactly | Vitest, run on every commit |

**Shared test infrastructure lives in `packages/testing/`** — fixtures, custom render helpers that wrap components in the required providers (QueryClient, Theme, Auth), and Playwright utilities for signing in against the mock. Tests import from there rather than each app re-creating its own harness.

**Financial calculations get their own suite.** Quotation totals, tier discounts, tax, deposits and payment allocation are asserted against approved worked examples. The POC's arithmetic was actually correct; what failed was everything around it. These tests guard the whole chain.

---

## 16. Guardrails

Rules that depend on people remembering them will be broken by the fiftieth feature. Each architectural rule has a mechanism.

| Rule | Enforced by |
|---|---|
| Features never import the generated client or `http.ts` | ESLint `no-restricted-imports` on `api-client/generated`, `api-client/http` |
| Features never reach into other features' internals | ESLint boundaries rule — only `features/*/index.ts` is importable |
| `ui` and `theme` never import services or domain logic | ESLint boundaries rule |
| No raw colour or spacing literals in application code | ESLint rule rejecting arbitrary Tailwind values |
| Generated files are never hand-edited | File header + CI check that regeneration produces no diff |
| **No frontend app imports `apps/mock-api`** | Not declared as a workspace dependency + ESLint boundary rule on the path |
| Production cannot point at the mock | Build-time assertion + `mock-api` absent from the production compose file |
| No real `.env` is committed | `.gitignore` patterns + CI check that fails on a committed `.env` or `.env.local` |
| Every environment variable is documented | CI check that each variable used in code exists in the matching `.env.example` |
| Every mutation declares its cache invalidations | Code review checklist + lint rule requiring `onSuccess` on `useMutation` |
| No server data mirrored into `useState` | Code review checklist |

---

## 17. What we deliberately do not build

Recorded so these are understood as decisions, not oversights.

| Not doing | Why |
|---|---|
| **Repository interfaces + DI container** | The base-URL switch already delivers backend swappability. Interfaces per domain would roughly triple the file count for no additional capability. |
| **A global store (Redux / Zustand)** | Server state belongs in TanStack Query; forms belong in React Hook Form. What remains is user and theme — two Context providers. |
| **A wrapper around TanStack Query** | Wrapping a well-designed library hides its capabilities and creates a second thing to learn. Use it directly. |
| **Custom caching or request deduplication** | Solved by TanStack Query. Hand-rolling this is how the POC's data layer went wrong. |
| **Barrel files re-exporting everything** | They create import cycles and defeat tree-shaking. Only feature `index.ts` files are barrels, and they export a deliberately small surface. |
| **Micro-frontends** | Three applications sharing one design system in one workspace. Independent deployment would add operational cost for no delivery benefit. |
| **An abstraction layer over the router** | Next.js App Router and the SPA router are stable, well-documented APIs. Wrapping them helps nobody. |
| **Shared state between the three applications** | They are separate deployments with separate audiences. They share code, not runtime state. |

---

## 18. Summary

| Question | Answer |
|---|---|
| How is code organised? | Feature-first vertical slices, with a thin shared service layer |
| Where does data come from? | `packages/api-client/services/*` — the only route to the API |
| Where does logic live? | Feature hooks. Components render. |
| How do we swap mock for real? | Change `API_BASE_URL`. Nothing else. |
| Where does the mock live? | `apps/mock-api` in this repository — its own container, never imported by an app |
| What deploys as a container? | The four apps, plus postgres locally. `packages/*` compile into the images. |
| How do we know the contract holds? | Types are generated from `openapi.yaml`; mismatches fail the build |
| How is state handled? | Server state in TanStack Query, forms in React Hook Form, two Contexts for user and theme |
| How is the look changed later? | One theme file of CSS custom properties |
| What stops this decaying? | The lint rules and CI checks in §16 |

**If you are about to write code and something here is unclear or seems to block you, the architecture is wrong or incomplete — raise it rather than working around it.** A documented exception is fine. A silent one is how the POC ended up with two data paths.
