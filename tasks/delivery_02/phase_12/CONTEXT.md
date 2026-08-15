# Phase 2.12 Context Pack — Customer self-registration and real authentication

Read this file first. It carries the requirement text, decision dispositions, code map and required test paths for Phase 2.12, so you do not need the full requirement and architecture documents to start.

## 0. What this phase is for

CarChief has no customer self-registration. Today the only identity path is a demo stand-in:

- `POST /api/v1/auth/demo-session` (`apps/mock-api/src/server.ts`) takes **no input** and always mints the same `CustomerBuyer` token — `sub=user-123`, `user@carchief.com` — through `createDemoJwtToken` in `packages/domain/src/auth.ts`.
- `resolveDemoCustomerScope` (`apps/mock-api/src/auth/customer-scope.ts`) hard-maps that subject to the single fixture customer `cust-123`, which owns every seeded invoice, payment, shipment, document and notification.
- The public website header renders a `CUSTOMER PORTAL` / `DEMO ACCOUNT` pill leading to `/account`, whose `DemoSignInPanel` offers one button: "Continue with Demo Customer Account".
- The Customer application's `LoginForm.tsx` shows email and password inputs that are **cosmetic** — it calls `requestDemoCustomerSession()` and states the credentials "are not verified and are not transmitted".
- `PasswordRecoveryCard.tsx` is a Keycloak-boundary dead end and the profile page's password card only sets an error string.

This phase replaces all of that with a real, server-enforced account lifecycle: register, sign in, change password, recover a forgotten password — and removes every demo identity affordance from both applications.

## 1. Position in the sequence

Phase 2.12 sits in its own `D02-ACCOUNT` lane at `execution_order` 107–114. It depends on `D02-P10-CODE_REVIEW`, **not** on the optional Phase 2.11 theme work, so it can run whether or not the theme phase was opted into. Its branch `feat_delivery02_phase_12` is cut from the latest merged `delivery_02_customer_application`.

## 2. Requirement text

| ID | Requirement |
|---|---|
| CUST-26 | A visitor can create a CarChief customer account from the public website, supplying name with initials, country, mobile number, email address, password and a re-entered password. The dial code shown beside the mobile number follows the selected country. |
| CUST-27 | A registered customer signs in to the Customer application with the registered email address and password. |
| CUST-28 | A signed-in customer changes their password from the profile page. |
| CUST-29 | A customer who has forgotten their password can recover access. |
| CUST-30 | No demo identity path remains in the public website, the Customer application, the shared packages or the Mock API. |

`CUST-01`, `CUST-03` and `CUST-25` are extended rather than replaced: protected access, recovery and password change now have a real mock implementation behind them.

## 3. Tasks

| Task | Purpose | Product code |
|---|---|---|
| `D02-P12-T001` | Mock API `customer_accounts` and reset-outbox stores, scrypt credential handling, the seven new auth/config routes, and the OpenAPI + generated-client contract | Allowed |
| `D02-P12-T002` | Country dataset in `packages/domain`, credential schemas in `packages/validation`, `AuthService`/`CountryService` in `packages/api-client` | Allowed |
| `D02-P12-T003` | public-web header **Login** + **Register** actions and the `/register` page | Allowed |
| `D02-P12-T004` | Remove demo-mode identity from the public website | Allowed |
| `D02-P12-T005` | Customer application credential sign-in and password recovery | Allowed |
| `D02-P12-T006` | Customer application profile page, change password and residual demo-copy removal | Allowed |
| `D02-P12-T007` | End-to-end journey, cross-account isolation, Docker gate and phase acceptance | Allowed (fixes only) |
| `D02-P12-CODE_REVIEW` | Phase PR review and tech-lead approval | Forbidden |

## 4. Decision dispositions

| Question | Disposition |
|---|---|
| Where do the forms live? | `/register` in **public-web**; the header **Login** action deep-links to the **Customer application** sign-in, which becomes the one real credential form. Registration does **not** mint a session — it forwards to the Customer sign-in with the email pre-filled, so no token crosses an origin boundary (public-web is port 3000, customer-app is port 3001, and they use different storage keys and storage kinds). |
| Password hashing | Salted `scrypt` from `node:crypto`, server-side only. No plaintext or hash in any response, log, cache or OpenAPI schema. |
| Password policy | `D02-ASM-005` — minimum 12 characters, at least one letter and one digit. Declared once in `packages/validation`, enforced authoritatively by the Mock API. |
| Email verification | `D02-ASM-006` — deliberately **absent**. There is no mail provider, and simulating one would claim a capability the system does not have. The account record carries a verification-state field for a later provider. |
| Forgot password | `D02-ASM-007` — deterministic mock outbox plus a single-use expiring token, read through a non-production-only endpoint. The reset request returns the same neutral response whether or not the email exists. |
| Demo removal depth | Entry points are removed; the `cust-123` fixture **data** is kept and reached through one seeded registered credential, so the roughly twenty existing Delivery 02 customer suites keep a working identity. `createDemoJwtToken` survives as an internal `issueSessionToken`. |
| Country list | ISO-3166 with E.164 dial codes, in `packages/domain`, served by `GET /api/v1/config/countries`. One source for both applications and every test. |
| `DEC-CUST-IDENTITY-RECOVERY` | **Unchanged.** AutoPulse/Keycloak still owns production identity. This phase supplies a Keycloak-compatible mock credential path, never a claim of live identity, email delivery or MFA. |

## 5. Code map

**Mock API** — `apps/mock-api/src/store.ts` (~5000 lines: record interfaces → `seedX` arrays → pure projections → `interface DemoStore` → `class MemoryStore` → `class PostgresStore` → `createStore()`), `apps/mock-api/src/server.ts` (all routes registered inline in `createMockApiApp`), `apps/mock-api/src/auth/customer-scope.ts`.

Only ten tables exist in PostgreSQL today (`public_config`, `vehicles`, `enquiries`, `reservations`, `faq_categories`, `faq_items`, `testimonials`, `content_pages`, `office_locations`, `branch_content`). **Every customer domain — profiles, invoices, payments, shipments, documents, notifications — lives only in in-memory seed arrays, even inside `PostgresStore`.** The new `customer_accounts` and `password_reset_outbox` entities must therefore be implemented in both store classes.

`CREATE TABLE IF NOT EXISTS` does not add columns to an existing volume. Follow the `enquiries` precedent and pair every new table with explicit `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` statements; a local `carchief-postgres-data` volume must be recreated.

**Contract** — `openapi/openapi.json` is hand-maintained. `openapi/generate.mjs` (`corepack pnpm api:generate`) reads it only to assert existence: the output is a **hard-coded template literal** written to `packages/api-client/src/generated/schema.d.ts`. Adding an endpoint therefore means editing the JSON **and** the literal, then regenerating. `/api/v1/auth/me` is currently missing from the OpenAPI document.

**Shared packages** — `packages/domain/src/auth.ts` (roles, permissions, token helpers), `packages/validation/src/enquiry.ts` (Zod 4 schema pattern to copy), `packages/api-client/src/http.ts` (`HttpClient`, `NormalizedApiError`) and `packages/api-client/src/services/customerProfile.ts` (service pattern to copy). Note the base-URL asymmetry: public-web services use full `/api/v1/...` paths, customer-app services use paths relative to a `/api/v1` base URL.

**public-web** — `src/shell/HeaderComponent.tsx` (`AccountEntryTrigger`), `src/shell/Header.ts` (`PUBLIC_NAV_ITEMS`), `src/features/account-entry/**`, `src/features/reservation/**`, `src/app/account/**`, `src/app/globals.css` (header rules at roughly lines 52–236 — these contain hard-coded hex colours, a pre-existing deviation that must not be copied into new rules), and the browser-side proxy `src/app/api/v1/[...path]/route.ts`.

**customer-app** — Vite on port 3001. **There is no router:** `src/app/App.tsx` is a chain of `if (activeRoute === ...)` returns, and `activeRoute` lives in `src/features/shell/CustomerShellProvider.tsx`, seeded from `window.location.pathname` and mutated with `pushState`. Pre-authentication screens are reached through `src/features/account/AccountGuard.tsx`, not through a route. Session material is in `sessionStorage` under `carchief_customer_token` and `carchief_customer_session`.

## 6. Required test paths

| Layer | Path |
|---|---|
| Mock API | `apps/mock-api/src/__tests__/customer-registration.test.ts`, `customer-credentials.test.ts`, plus updates to `customer-scope.test.ts`, `customer-security-matrix.test.ts` and `session.test.ts` |
| Shared packages | `packages/validation/src/__tests__/**`, `packages/domain/src/__tests__/auth.test.ts`, `packages/api-client/src/__tests__/contract.test.ts` |
| public-web | `apps/public-web/src/__tests__/registration.test.ts`, `account-entry.test.ts`, `public-content-pages.test.ts` |
| customer-app | `apps/customer-app/src/features/account/__tests__/account.test.ts`, `features/shell/__tests__/shell.test.ts`, `features/profile/__tests__/profile.test.ts` |
| End to end | `tests/e2e/register.spec.ts`, `tests/e2e/account-entry.spec.ts`, `tests/e2e/enquiry-reservation.spec.ts`, `tests/e2e/customer/account-access.spec.ts`, `tests/e2e/customer/profile.spec.ts`, `tests/e2e/customer/registration-login.spec.ts` |
| Traceability | `tests/traceability/**` and `apps/customer-app/src/features/registry/featureRegistry.ts` |

Mock API tests boot the real Express app on an ephemeral port: `createMockApiApp(createStore(''))` — the empty string forces `MemoryStore` — then `app.listen(0, '127.0.0.1')` and drive it with `fetch`. Deterministic time is injected with the `x-mock-now` header. Root Vitest runs in the `node` environment, with no jsdom.

## 7. Boundaries

- The Mock API is the only authority for credentials and sessions. The browser never derives authorization from its own state, and no application code mints a token.
- No password, hash or salt is ever stored client-side, logged, cached by the Service Worker, placed in a URL or returned by any endpoint.
- Registration, sign-in and password-reset responses must not reveal whether an email address exists.
- A frontend application or package may not import `mock-api`, prisma, firebase or supabase. Files under `features/` may not import `api-client/generated/schema`. Files under `routes/` may not import `services/`. `packages/ui` may not import a service. `corepack pnpm test:boundaries` enforces this.
- No `NEXT_PUBLIC_*` or `VITE_*` variable may carry a secret, password or token.
- No static `style={{...}}` and no literal colour, font, spacing, radius or shadow value in TSX. Use semantic classes and `packages/theme` tokens.
- Do not modify `POC/**`; `git diff -- POC` must stay empty.
- Agents never commit, push, create PRs, merge, rewrite history or self-approve.
