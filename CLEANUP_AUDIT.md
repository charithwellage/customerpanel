# Full-stack cleanup audit

This document records the evidence-based cleanup performed for the active Public Web, Customer App, shared packages, Mock API, and Mock PostgreSQL database.

## Scope and guardrails

- The POC and salesperson applications are out of scope.
- Health, Swagger/OpenAPI, reset, password-reset outbox, staff, and finance test-support operations remain supported operational tooling.
- A database object is removable only when no active page, retained API, store projection, seed/reset process, or operational workflow depends on it.
- Historical invoices, payments, allocations, reservations, enquiries, documents, shipments, and statements are retained because they provide ownership, audit, or customer-facing data.

## Confirmed removals

| Area | Removed item | Evidence |
| --- | --- | --- |
| Public Web | Legacy plain-Node renderer (`src/server.ts`) | The production build and start commands use Next.js. No active route imports the renderer. |
| Public Web | Legacy shell configuration renderer, config-only footer/navigation helpers, package entrypoint, and renderer-only test | These files were referenced only by the legacy renderer/test and had no React or Next.js consumer. |
| Public Web | Legacy header configuration helper | Its only consumer was the removed layout configuration renderer; `PUBLIC_NAV_ITEMS` and `resolveCustomerAppUrl` remain for the active React header. |

## Retained data and contracts

All Mock PostgreSQL tables currently participate in an active feature or retained operational workflow. In particular, vehicle lookup tables, statuses, enquiries, reservations, wishlist/favourites, customer accounts/tier rules, invoices/proformas, payment allocations, shipments/documents, notifications, payments, and statement transactions remain required.

No database table, column, index, or foreign key met the safe-removal threshold in this cleanup pass. A destructive cleanup migration is therefore intentionally not added.

## Ongoing contract guard

Run the following before changing Mock API routes:

```bash
pnpm audit:mock-api-contract
```

It verifies every registered Mock API route is represented in `openapi/openapi.json`, except the explicitly listed operational endpoints.
