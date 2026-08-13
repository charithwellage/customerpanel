---
task_id: "D02-P01-CODE_REVIEW"
status: "IN_PROGRESS"
owner: "Claude Sonnet 5"
reviewer: ""
review_agent: "Claude Sonnet 5"
review_mode: "phase_manual"
phase_branch: "feat_delivery02_phase_01"
task_branch: "feat_delivery02_phase_01"
started_at: ""
updated_at: ""
blocker: ""
---

# D02-P01-CODE_REVIEW Execution Log

## Preflight

- Clean-tree command/result: `git status --porcelain=v1 --untracked-files=all` — clean.
- `node tasks/scripts/taskctl.mjs next` — D02-P01-CODE_REVIEW is the D02-FOUNDATION frontier, ELIGIBLE.
- `node tasks/scripts/taskctl.mjs sequence D02-P01-CODE_REVIEW` — Result: ELIGIBLE.
- `node tasks/scripts/taskctl.mjs precheck D02-P01-CODE_REVIEW` — Blockers: None.
- `node tasks/scripts/taskctl.mjs check D02-P01-CODE_REVIEW` — Blockers: None.
- Branch: `feat_delivery02_phase_01` (no child branch created).
- Comparison range: `delivery_02_customer_application...feat_delivery02_phase_01`.
- All five Phase 2.1 tasks (`D02-P01-G001`, `D02-P01-T001`, `D02-P01-T002`, `D02-P01-T003`, `D02-P01-T004`) are `COMPLETE` in the tracker; the branch diff is available locally (no `gh`/hosted PR tooling in this environment — consistent with prior phase reviews, e.g. `D01-P10-CODE_REVIEW`, which reviewed the branch comparison range directly).

## Files and evidence reviewed

- `tasks/README.md`, `tasks/TASK_EXECUTION_TRACKER.md`, `tasks/CODE_REVIEW_RULES.md`, `tasks/COMMON_FRONTEND_RULES.md`, `tasks/TASK_EXECUTION_PROTOCOL.md`, `tasks/DEPENDENCY_INSTALLATION_POLICY.md`, `tasks/delivery_02/D02_TEST_MATRIX.md`, `tasks/delivery_02/REQUIREMENT_GAPS_AND_ASSUMPTIONS.md`.
- `tasks/delivery_02/phase_01/D02-P01-CODE_REVIEW.md`, `D02-P01-G001.md`, `D02-P01-T001.md`, `D02-P01-T002.md`, `D02-P01-T003.md`, `D02-P01-T004.md`. No `tasks/delivery_02/phase_01/CONTEXT.md` exists.
- `tasks/phase_summaries/D02-P01-SUMMARY.md` and all five Phase 2.1 execution logs.
- Full diff `delivery_02_customer_application...feat_delivery02_phase_01` (37 files, +1893/-11), including every changed file under `apps/customer-app/src/features/{shell,account,pwa,registry}`, `apps/mock-api/src/__tests__/customer-session.test.ts`, `tests/e2e/customer/*.spec.ts`, `apps/customer-app/{package.json,tsconfig.json}`, `.gitignore`, `pnpm-lock.yaml`, `docker-compose.frontend.yml` (unchanged — checked for a `customer-app` service), `apps/customer-app/Dockerfile`, `playwright.config.ts`, `packages/domain/src/auth.ts`.

## Deterministic gate

- `node tasks/scripts/taskctl.mjs validate` — PASS (119 task/gate files, acyclic graph).
- `git diff --check delivery_02_customer_application...feat_delivery02_phase_01` — PASS (no whitespace errors).
- `git diff delivery_02_customer_application...feat_delivery02_phase_01 -- POC` — empty/PASS.
- `corepack pnpm install --frozen-lockfile --offline` — PASS (reused cached install per `DEPENDENCY_INSTALLATION_POLICY.md`).
- `corepack pnpm --filter @carchief/mock-api... build` — PASS.
- `corepack pnpm --filter @carchief/customer-app... build` — PASS (11 packages, 0 errors).
- `corepack pnpm exec vitest run apps/mock-api/src/__tests__/customer-session.test.ts apps/customer-app/src/features` — PASS (24/24: registry 3, pwa 5, account 7, shell 6, mock-api customer-session 3).
- `corepack pnpm test:boundaries` — PASS (0 architecture violations).

## Static sweep and runtime investigation

Rules checked: `CODE_REVIEW_RULES.md` items 1–11; `COMMON_FRONTEND_RULES.md` architecture/reuse, styles/themes, accessible/responsive UI, quality/evidence sections; `TASK_EXECUTION_PROTOCOL.md` §3 (runtime profiles) and §7 (prohibited POC defects); `tasks/delivery_02/REQUIREMENT_GAPS_AND_ASSUMPTIONS.md` operating rule 5.

Because three completed tasks in this phase (`D02-P01-T001`, `T002`, `T003`) are marked `ui_validation: "playwright_mcp"`, the review task requires verifying each one's fresh-runtime evidence is real (§ "Fresh-runtime evidence review" in `D02-P01-CODE_REVIEW.md`). That verification surfaced a systemic defect:

- `apps/customer-app/package.json` scripts are limited to `lint`, `typecheck`, `build` (`tsc`), `test` (`vitest run`) across the entire phase diff — there is no `dev`/`start`/`preview` script, no Vite dependency (`vite` never appears in `package.json`, `pnpm-lock.yaml`, or anywhere under `apps/customer-app`), and no `index.html` or DOM-mounting entry point anywhere in the app. `apps/customer-app/src/index.ts` only re-exports feature modules and two theme-info helper functions.
- `apps/customer-app/Dockerfile`'s `CMD` is `["pnpm", "--filter", "@carchief/customer-app", "preview"]`. Running `corepack pnpm --filter @carchief/customer-app preview` locally returns `None of the selected packages has a "preview" script` — the container cannot start.
- `docker-compose.frontend.yml` defines only `postgres`, `mock-api`, `public-web` — no `customer-app` service exists, so `D02-P01-T003`'s own "Containerized verification" section (`docker compose ... build customer-app mock-api`, `up -d customer-app mock-api postgres`, verify the Customer health URL) cannot be executed as written.
- I reproduced the exact recorded validation command from the T001/T003 logs — `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 corepack pnpm exec playwright test tests/e2e/customer/account-shell.spec.ts tests/e2e/customer/account-access.spec.ts --project=chromium --workers=1` — with no server running (confirmed via `lsof -iTCP:3000/3001 -sTCP:LISTEN`, no listener). All 4 tests failed with `net::ERR_CONNECTION_REFUSED at http://127.0.0.1:3000/`. Since no `customer-app` server can be built or started from this worktree at all, the "PASS" results recorded in the T001/T002/T003 logs could only have been produced against a different, already-running server. `playwright.config.ts` has no `webServer` block (no auto-start), and both specs' assertions are generic enough (`header, nav, [role="banner"]`, `main`, `body` visibility) to pass against any unrelated page — most plausibly the pre-existing `public-web` app on the same default port. This is exactly the "browser tests aimed at the wrong target" / "unknown-server evidence" condition `D02-P01-CODE_REVIEW.md` names as blocking.
- Each of the three logs records `Fresh-runtime verification: PASS` citing only a `build` (`tsc`) command — never a start command — and `Runtime provenance: local process PID .... / Vitest / Playwright runtime`, which names a test-runner PID, not a customer-app server identity. `TASK_EXECUTION_PROTOCOL.md` §3 states this explicitly is not evidence: "`Fresh-runtime verification: PASS` beside a vague `dev server on port 3000` is an attestation, not evidence" and "Profile A means `build` then `start`, never `next dev`"; each task file's own §"Fresh-runtime gate" states "A source-only build does not satisfy this requirement."

Separately, the static sweep of the diff's content found two fabricated/false-claim defects, each locked in by an assertion in the new unit tests (so the tests would need updating alongside the fix):

- `apps/customer-app/src/features/shell/CustomerShellProvider.tsx:53` defaults `initialUser` to a fully fabricated named identity (`Charles Sterling`, `c.sterling@sterlingimports.com`, `Sterling Imports Ltd`); `apps/customer-app/src/features/account/accountState.ts:63-77` (`createDemoCustomerSession`) hardcodes the same name/email/company regardless of the actual `response.claims` the mock API returns (`apps/mock-api/src/server.ts:246` mints `sub: 'user-123'`, `email: 'user@carchief.com'` via `createDemoJwtToken('CustomerBuyer')` — never Sterling); `LoginForm.tsx:15-16` pre-fills the same fabricated email as default form state. `apps/customer-app/src/features/account/__tests__/account.test.ts` asserts `expect(html).toContain('c.sterling@sterlingimports.com')`. `D02-P01-T002.md`'s own scope requires "non-sensitive demo identities" and the shared "Implementation and UX requirements" prohibit inventing figures; `TASK_EXECUTION_PROTOCOL.md` §7 lists "forced identities" as a known POC defect that must never be reproduced.
- `apps/customer-app/src/features/shell/CustomerShell.tsx:75` renders an unconditional footer badge `🔒 Keycloak Secured` on every page, and `apps/customer-app/src/features/account/AccountStateBanner.tsx:22` tells a LOCKED-status user to "Please complete Keycloak recovery process" — neither is qualified as demo/non-production. No Keycloak integration exists anywhere in this build (only a mock JWT with the literal signature `demo-signature`, `packages/domain/src/auth.ts:38`). `tasks/delivery_02/REQUIREMENT_GAPS_AND_ASSUMPTIONS.md` operating rule 5: "Do not use a default to claim a live AutoPulse, Keycloak, email, bank, ERP, carrier or legal-document capability." `apps/customer-app/src/features/shell/__tests__/shell.test.ts` asserts `expect(html).toContain('Keycloak Secured')`, locking the false claim in as expected behaviour.

Minor/non-blocking observation: `LoginForm.tsx`, `CustomerNav.tsx` and `CustomerShell.tsx` emit fixed DOM `id`s (`cust-login-email`, `cust-login-password`, `customer-mobile-menu`, `main-content`) without `useId()`. These are app-level, single-instance page components rather than `packages/ui` reusable primitives, so collision risk is low; recorded as a remaining concern rather than a blocking finding.

## Findings

| # | Severity | File:line | Rule / criterion | Responsible task | Required correction |
|---|---|---|---|---|---|
| 1 | Blocking | `apps/customer-app/package.json` (no dev/start/preview script, no Vite dep); `apps/customer-app/Dockerfile:6` (`CMD` invokes non-existent `preview` script); `docker-compose.frontend.yml` (no `customer-app` service) | `D02-P01-T001.md` "In scope" ("Complete apps/customer-app using React, TypeScript and Vite"); `D02-P01-T003.md` "Containerized verification"; `CLAUDE.md` Vite-based-shell description | D02-P01-T001, D02-P01-T003 | Add a real Vite build (`index.html`, entry point mounting `CustomerShell`/router, `dev`/`build`/`preview` scripts), fix the Dockerfile `CMD` to call a script that exists, and add a `customer-app` service to `docker-compose.frontend.yml` so the phase's own Docker/PWA acceptance criteria are actually executable |
| 2 | Blocking | `tasks/execution_logs/D02-P01-T001.md`, `D02-P01-T002.md`, `D02-P01-T003.md` — "Fresh-runtime and Playwright MCP validation" sections | `CODE_REVIEW_RULES.md` #11; `TASK_EXECUTION_PROTOCOL.md` §3 ("a source-only build does not satisfy this requirement"; provenance must name a real identity); `D02-P01-CODE_REVIEW.md` "Fresh-runtime evidence review" (stale/unknown-server evidence is blocking) | D02-P01-T001, D02-P01-T002, D02-P01-T003 | Re-run Playwright MCP and automated Playwright against an actually-built and started `customer-app` runtime (requires finding #1 fixed first); record a genuine build+start command pair, a real server process/container identity, and rewrite `tests/e2e/customer/*.spec.ts` to assert customer-app-specific content (nav labels, login form fields, etc.) instead of generic landmarks that pass against any page |
| 3 | Blocking | `apps/customer-app/src/features/shell/CustomerShellProvider.tsx:53`; `apps/customer-app/src/features/account/accountState.ts:63-77`; `apps/customer-app/src/features/account/LoginForm.tsx:15-16`; locked in by `apps/customer-app/src/features/account/__tests__/account.test.ts` | `TASK_EXECUTION_PROTOCOL.md` §7 (prohibited "forced identities"); `D02-P01-T002.md` scope ("non-sensitive demo identities"); shared "Implementation and UX requirements" ("Never show another customer's data, invent missing figures") | D02-P01-T001, D02-P01-T002 | Derive the displayed customer name/email/company from the actual session claims returned by the mock API (or an obviously generic placeholder such as "Demo Customer") instead of a hardcoded fabricated identity; update `account.test.ts` accordingly |
| 4 | Blocking | `apps/customer-app/src/features/shell/CustomerShell.tsx:75`; `apps/customer-app/src/features/account/AccountStateBanner.tsx:22`; locked in by `apps/customer-app/src/features/shell/__tests__/shell.test.ts` | `tasks/delivery_02/REQUIREMENT_GAPS_AND_ASSUMPTIONS.md` operating rule 5 (no default may claim a live Keycloak capability); `CODE_REVIEW_RULES.md` #1 (no false external-integration claim) | D02-P01-T001, D02-P01-T002 | Remove or relabel the unconditional "Keycloak Secured" badge and the "complete Keycloak recovery process" copy so no page claims an active Keycloak integration; keep the honest demo/boundary framing already used correctly in `PasswordRecoveryCard.tsx`; update `shell.test.ts` accordingly |
| 5 | Non-blocking | `apps/customer-app/src/features/account/LoginForm.tsx:58,84`; `apps/customer-app/src/features/shell/CustomerNav.tsx:79`; `apps/customer-app/src/features/shell/CustomerShell.tsx:33` | `COMMON_FRONTEND_RULES.md` (avoid fixed DOM ids; prefer `useId()`) | D02-P01-T001, D02-P01-T002 | Low risk since these are single-instance page components, not `packages/ui` primitives; convert to `useId()`-derived ids at the next touch of these files as a hygiene improvement |

Comparison range: `delivery_02_customer_application...feat_delivery02_phase_01`.

Focused suite result: NOT RUN — blocked by findings #1/#2. The customer-app Playwright suite cannot be executed against a genuine `customer-app` target because no such runtime can currently be built or started from this worktree (Dockerfile/`preview` script and Vite entry point are both missing). Re-run is required after D02-P01-T001/T003 correct finding #1.

## AI code review

- Reviewed range/files: `delivery_02_customer_application...feat_delivery02_phase_01` (37 files) plus the five Phase 2.1 task files, execution logs and phase summary named above.
- Rules checked: `CODE_REVIEW_RULES.md` items 1 (requirements/scope), 2 (architecture/reuse), 4 (React/frontend quality), 5 (styles/themes), 6 (security/data protection), 7 (API/mock discipline), 9 (tests), 11 (Playwright MCP evidence); `COMMON_FRONTEND_RULES.md` architecture/reuse and accessible/responsive sections; `TASK_EXECUTION_PROTOCOL.md` §3 and §7; `tasks/delivery_02/REQUIREMENT_GAPS_AND_ASSUMPTIONS.md` operating rule 5.
- Findings: 4 blocking, 1 non-blocking — see `## Findings` table above.
- Fixes applied: None — this is a review-only task; product code is not modified here.
- Remaining concerns: Finding #5 (fixed DOM ids) remains open as non-blocking guidance for the next touch of these files.
- Result: FAIL

## Tests executed

- `node tasks/scripts/taskctl.mjs validate` — PASS.
- `git diff --check delivery_02_customer_application...feat_delivery02_phase_01` — PASS.
- `git diff delivery_02_customer_application...feat_delivery02_phase_01 -- POC` — empty/PASS.
- `corepack pnpm --filter @carchief/mock-api... build` — PASS.
- `corepack pnpm --filter @carchief/customer-app... build` — PASS.
- `corepack pnpm exec vitest run apps/mock-api/src/__tests__/customer-session.test.ts apps/customer-app/src/features` — PASS (24/24).
- `corepack pnpm test:boundaries` — PASS.
- `corepack pnpm --filter @carchief/customer-app preview` — reproduced failure: `None of the selected packages has a "preview" script` (evidence for finding #1).
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 corepack pnpm exec playwright test tests/e2e/customer/account-shell.spec.ts tests/e2e/customer/account-access.spec.ts --project=chromium --workers=1` (no server running) — reproduced failure: 4/4 failed with `net::ERR_CONNECTION_REFUSED` (evidence for finding #2).

## Decisions and deviations

- No business decision was invented, changed or marked `CONFIRMED`. `D02-ASM-003` is unchanged; this review found that its "compatible demo session presentation" boundary was violated in the UI copy (finding #4), not that the decision itself needs revision.
- No product or POC files were modified by this review.

## Blockers

None for the review task itself. Four blocking implementation findings were catalogued and the responsible tasks are reopened below; the phase cannot proceed to `submit`/`approve` until they are corrected, self-reviewed and `COMPLETE` again.
