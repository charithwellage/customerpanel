# Phase 2.10 — Assumption Reconciliation and MVP Closure

## Final disposition

- `D02-ASM-001` — `ASSUMED`: dashboard balance, approved-allocation and credit-utilisation values remain server-projected from the linked mock records.
- `D02-ASM-002` — `ASSUMED`: the ten existing document categories and server-side Finance/release visibility gates remain the safe MVP baseline; storage, retention, scanning and binary download policy remain deferred.
- `D02-ASM-003` — `ASSUMED`: demo sessions and recovery/MFA presentation remain Mock API behavior; production password, MFA secret and identity-provider behavior remain an AutoPulse/Keycloak handoff.
- `D02-ASM-004` — `ASSUMED`: payment proof metadata, hold/resubmission, deterministic outbox records and server-side allocation remain the safe MVP boundary; live bank, storage, scanner, email and ERP integrations remain deferred.

No named business-authority evidence was supplied to change any row to `CONFIRMED`. No new requirement gap or product adjustment was introduced in T002/T003.

## Acceptance evidence

- Fresh Docker runtime built from the current worktree with `docker compose -f docker-compose.frontend.yml build customer-app mock-api` and recreated with `docker compose -f docker-compose.frontend.yml up -d customer-app mock-api postgres`.
- Customer App, Mock API and PostgreSQL were healthy. Customer `/healthz`, Mock API `/healthz`, `/openapi.json`, deterministic `POST /api/v1/__reset`, `pg_isready -U carchief -d carchief_mock`, and live `public.vehicles` schema inspection passed.
- Full Customer browser regression passed 126/126 across Chromium, mobile-Chromium and tablet-Chromium at 1440x900, 390x844 and 768x1024.
- Playwright MCP desktop walkthrough passed under the default `carchief` theme with accessibility snapshot, resize, navigation interaction, screenshot, zero console errors and successful dashboard/profile API requests.
- Full Vitest regression passed 627/627 after making the active PI contract test deterministic with `x-mock-now`; security/privacy and production-guard suites also passed.

## Release exceptions and Delivery 03 handoff

- The MVP does not claim live AutoPulse/Keycloak, Finance, repository, bank, scanner, email, ERP or carrier integrations.
- Offline mutations for identity, finance, approval, payment and document flows remain blocked; sensitive customer data is not broadly cached.
- Delivery 03 must preserve the generated OpenAPI/client boundary and replace Mock API adapters only after approved external contracts exist.
- Delivery 03 prerequisites are named identity claims and recovery/MFA contracts, Finance balance/document/payment decisions, repository retention/scanning/download policy, provider/outbox contracts, and continued server-side customer isolation.

## Handoff

Phase 2.10 final acceptance is complete pending the phase-level PR review. The phase summary and T003 execution log contain the final evidence; implementation changes remain available for human review and commit.
