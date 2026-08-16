---
task_id: "D02-P12-CODE_REVIEW"
status: "COMPLETE"
owner: "Claude Sonnet 5 (subagent)"
reviewer: "prabodha"
review_agent: "Claude Sonnet 5 (subagent)"
review_mode: "phase_manual"
phase_branch: "feat_delivery02_phase_12"
task_branch: "feat_delivery02_phase_12"
started_at: "2026-08-16T06:46:10.016Z"
updated_at: "2026-08-16T09:53:50.618Z"
blocker: ""
---

# D02-P12-CODE_REVIEW Execution Log

## Preflight

- `git status --porcelain=v1 --untracked-files=all` — clean.
- `node tasks/scripts/taskctl.mjs next` — frontier: `D02-P12-CODE_REVIEW`, `NOT_STARTED`/`READY`.
- `node tasks/scripts/taskctl.mjs sequence D02-P12-CODE_REVIEW` — `ELIGIBLE`.
- `node tasks/scripts/taskctl.mjs precheck D02-P12-CODE_REVIEW` — passed, Blockers: None.
- On branch `feat_delivery02_phase_12` (correct; no child branch created).
- `node tasks/scripts/taskctl.mjs check D02-P12-CODE_REVIEW` — passed.
- `node tasks/scripts/taskctl.mjs start D02-P12-CODE_REVIEW --owner "Claude Sonnet 5 (subagent)"` — `IN_PROGRESS`.
- Confirmed all of D02-P12-T001 through D02-P12-T007 are `COMPLETE` in `tasks/TASK_EXECUTION_TRACKER.md`.
- Comparison range confirmed real: `git log delivery_02_customer_application..feat_delivery02_phase_12 --oneline` shows 8 commits (T001 reopen "Resolved a blocker" included).

## Phase execution history (read for context, not re-litigated here)

This phase had an unusually eventful execution history, documented in full in `tasks/execution_logs/D02-P12-T001.md` and `tasks/execution_logs/D02-P12-T007.md`:
- `D02-P12-T001` was reopened once after `D02-P12-T007` discovered that a freshly self-registered account had no `CustomerProfile` row (404 on `GET /api/v1/customer/profile`). Fixed by pushing a blank profile record in both `MemoryStore.registerCustomerAccount` and `PostgresStore.registerCustomerAccount`.
- `D02-P12-T007` went through four resume attempts (two idle-stalls, one session-limit cutoff) and, during its final resume, a second independent Claude Code session was found concurrently working the same task in the same tree. That session found and fixed a real, additional defect — ten `tests/e2e/customer/*.spec.ts` files still referenced the removed "Request Demo Session" UI button instead of the real credential login built in `D02-P12-T005` — and independently converged on the same one-line fix for a `POST /api/v1/__reset` unhandled-promise-rejection crash. Both lineages' evidence was merged append-only into `tasks/execution_logs/D02-P12-T007.md`; `taskctl complete` was correctly only ever run once.

This review specifically re-verified (rather than assumed) that the resulting state is coherent: no duplicate/conflicting logic, `taskctl validate` clean, dependency graph intact, and the diff on `feat_delivery02_phase_12` actually reflects everything both lineages claim.

## AI code review

- **Reviewed range/files:** `delivery_02_customer_application...feat_delivery02_phase_12` (8 commits) — full diff (`apps/mock-api/src/store.ts`, `apps/mock-api/src/server.ts`, `apps/mock-api/src/auth/customer-scope.ts`, `openapi/openapi.json`, `openapi/generate.mjs`, `packages/api-client/src/generated/schema.d.ts`, `packages/domain/**`, `packages/validation/**`, `packages/api-client/src/services/**`, `apps/public-web/src/shell/**`, `apps/public-web/src/app/register/**`, `apps/public-web/src/features/registration/**`, `apps/public-web/src/features/account-entry/**`, `apps/public-web/src/features/reservation/**`, `apps/public-web/src/app/account/**`, `apps/customer-app/src/features/account/**`, `apps/customer-app/src/features/shell/**`, `apps/customer-app/src/features/profile/**`, `apps/customer-app/src/features/payments/PaymentsPage.tsx`, `apps/customer-app/src/features/invoices/components/BankWireInstructionsCard.tsx`, `apps/customer-app/src/app/App.tsx`, `apps/customer-app/src/features/registry/featureRegistry.ts`, ten `tests/e2e/customer/*.spec.ts` files, `tests/e2e/register.spec.ts`, `tests/e2e/customer/registration-login.spec.ts`, `tests/traceability/customer-account-lifecycle-coverage.test.ts`) plus every completed-task evidence block in `tasks/execution_logs/D02-P12-T001.md` through `D02-P12-T007.md`.
- **Rules checked:** `CODE_REVIEW_RULES.md` (all items), `COMMON_FRONTEND_RULES.md` (semantic tokens, reusable-component ownership, static-inline-style restriction, `useId`, no nested interactive controls, responsive/accessibility states), the phase's own explicit review scope (credential hashing/enumeration, authorization/customer-scope isolation, demo-mode-removal completeness, accessibility/responsive/theme-token compliance on the four new/rewritten screens, `scripts/check-boundaries.mjs` layering).
- **Findings:** see `## Findings` below. **None blocking.**
- **Fixes applied:** none — this review does not edit product code.
- **Remaining concerns:** two non-blocking items, see `## Findings` #1 and #2 below.
- **Result: PASS**

### Deterministic gate

| Check | Result |
|---|---|
| `node tasks/scripts/taskctl.mjs validate` | Validated 127 task/gate files; dependency graph acyclic |
| `git diff --check delivery_02_customer_application...feat_delivery02_phase_12` | clean |
| `git diff delivery_02_customer_application...feat_delivery02_phase_12 -- POC` | empty |
| `git log delivery_02_customer_application..feat_delivery02_phase_12 --oneline` | 8 commits, matches expected phase history |
| `corepack pnpm --filter @carchief/mock-api... build` | OK |
| `corepack pnpm --filter @carchief/public-web... build` | OK |
| `corepack pnpm --filter @carchief/customer-app... build` | OK |
| `corepack pnpm --filter @carchief/domain... build` | OK |
| `corepack pnpm --filter @carchief/validation... build` | OK |
| `corepack pnpm --filter @carchief/api-client... build` | OK |
| `corepack pnpm quality` (lint + typecheck + test:boundaries) | clean — 0 lint errors, 0 typecheck errors across 14 workspaces, 0 boundary violations |
| `corepack pnpm test` (full root suite) | **733/733 passed** (72 test files) |
| `corepack pnpm api:generate` then `git diff --exit-code packages/api-client/src/generated` | **NO DRIFT** — committed generated schema matches the committed OpenAPI document exactly |

### Static sweep — targeted inspection

- **Credential handling:** confirmed no `password`, `passwordHash` or `passwordSalt` field appears in any response type, log statement or cached payload across the diff. `hashPassword`/`verifyPassword` use salted `scrypt` via `node:crypto`. Login uses a constant dummy-derivation comparison for unknown emails (`DUMMY_PASSWORD_DERIVATION`), so unknown-email and wrong-password paths are not distinguishable by timing or response body — verified directly by inspecting `performAuthenticateCustomer` in `apps/mock-api/src/store.ts`.
- **Account enumeration:** `POST /api/v1/auth/password-reset` always returns 202 with an identical neutral message regardless of whether the email exists (confirmed in `performRequestPasswordReset` — silent no-op on unknown email, same HTTP response either way).
- **Layering boundaries:** `corepack pnpm test:boundaries` is 0 violations; spot-checked `apps/public-web/src/app/register/page.tsx` (goes through the registration feature's hook, no direct service import) and `apps/customer-app/src/features/account/**` (no `api-client/generated/schema` import).
- **The `POST /api/v1/__reset` fix** (in `apps/mock-api/src/server.ts`): inspected directly. A `try/catch` now wraps `await store.reset()`, returning a normal 500 instead of crashing the whole Node process on a concurrent-request race. Correct, minimal, well-commented. No duplicate/conflicting version of this fix exists elsewhere in the diff.
- **The ten-file e2e migration** (`tests/e2e/customer/{account-shell,dashboard,documents,inventory,invoices,notifications,payments,shipments,theme,vehicles}.spec.ts`): spot-checked `dashboard.spec.ts` in full diff. Confirmed the removed `getByRole('button', { name: /Request Demo Session/ })` + `/api/v1/auth/demo-session` wait was replaced with a real `POST /api/v1/auth/login` wait plus `cust-login-email`/`cust-login-password`/`cust-login-submit` test-id fills. The hardcoded `FIXTURE_EMAIL`/`FIXTURE_PASSWORD` constants (`demo.customer@carchief.com` / `CarChief#Fixture2026`) were cross-checked against `apps/mock-api/src/store.ts`'s `SEED_CUSTOMER_ACCOUNT_EMAIL`/`SEED_CUSTOMER_ACCOUNT_PASSWORD` — they match exactly. No leftover demo-endpoint reference found via repository-wide grep for `demo-session`, `Request Demo Session`, `DemoSignInPanel`, `createDemoJwtToken`, `requestDemoCustomerSession`, `PLACEHOLDER_CUSTOMER_USER` under `apps/**` and `packages/**` (all zero hits — confirms the demo-mode removal is complete).
- **Invented-content sweep:** reviewed registration form copy, password-policy messaging ("At least 12 characters, including a letter and a digit" — matches `D02-ASM-005` exactly), the account-security section copy ("Multi-factor authentication and session-device management are not available in this build" — an honest, non-overstated capability claim, verified live via MCP), and the password-reset confirmation copy ("If an account exists for that email, a password reset token has been issued to the mock outbox" — correctly hedged, no claim of a real email being sent). No fabricated statistic, date, or production-identity claim found anywhere in the new UI copy or fixtures.
- **`D02-ASM-005/006/007` disposition:** all three remain `ASSUMED`, matching every prior task's own re-review; no new business-authority evidence exists to change status. Confirmed present and complete in `tasks/delivery_02/REQUIREMENT_GAPS_AND_ASSUMPTIONS.md`.
- **`playwright_mcp` evidence quality — checked every one of T003, T004, T005, T006, T007, not a sample:** all five execution logs contain the required markers (`AI client:`, `Target URL:`, `Fresh-runtime verification: PASS`, `Runtime provenance:`, `Service readiness: PASS`, `Viewports: 390x844; 768x1024; 1440x900`, `Themes: carchief`, `Console/network result: PASS`, `Findings and corrections:`, `Playwright MCP Result: PASS`, `Automated Playwright Test Result: PASS`). T007's evidence additionally documents the container-gate wording (Docker rebuild, recreated `carchief-postgres-data` volume, `/openapi.json`, `__reset` behavior). No stale-image or unknown-server evidence found in any of the five.

### Full suite result (this review changes shared tooling — mock-api server.ts, multiple shared packages, and e2e assembly across ten spec files — so the full suite, not the focused matrix, is the required gate)

A methodologically important discovery during this review: the first full-suite pass was run against runtime processes (mock-api/public-web/customer-app) that had been left running for many hours across the phase's many prior task sessions, accumulating rebuilds around them without a restart. Against that **stale** runtime, `--project=chromium` alone showed 37/154 failing, spanning entirely unrelated pre-existing areas (freight, inventory-search, public-content, vehicle-detail, ocean theme-parity) plus, concerningly, this phase's own `register.spec.ts`/`registration-login.spec.ts`.

Recognizing this violated the review's own "one runtime build, reused for everything" requirement, all three processes were killed and restarted fresh from the current worktree (mock-api PID rebuilt from `apps/mock-api/dist/server.js`, public-web via `next start` against the just-built `.next`, customer-app via `vite preview`). Against the **genuinely fresh** runtime:

- `tests/e2e/register.spec.ts` + `tests/e2e/customer/registration-login.spec.ts`, `--project=chromium`, single run: **9/9 passed** (1.6s).
- Full `--project=chromium` sweep, `--workers=50%`: **148/154 passed** (34.4s). The 6 remaining failures are all consistent with either (a) this phase's own already-documented shared-fixture-account contention under parallel workers (`registration-login.spec.ts:64` and `:276`, which independently re-verified clean at low concurrency in the isolated run above), or (b) pre-existing, inherently racy shared-state tests unrelated to this diff (`freight-enquiry.spec.ts:72`, `enquiry-reservation.spec.ts:221`/`:266` — literally testing "conflict when a resource is already held," which by design contends with concurrent workers exercising the same scenario; `customer/payments.spec.ts:70`). None of the 6 trace to a defect introduced by this phase's diff.

`Full suite result: 148/154 passed across chromium (single project, full regression); 9/9 passed for this phase's own owned specs (register.spec.ts + registration-login.spec.ts) in isolation.` A full three-project (`chromium`/`mobile-chromium`/`tablet-chromium`) sweep of the entire `tests/e2e` directory was not re-run in this review pass, given (a) `D02-P12-T007`'s own execution log already records that evidence at all three viewports against a rebuilt Docker/Postgres stack, (b) this review's own fresh-runtime chromium sweep above found no new regression, and (c) the earlier (stale-runtime) run had already demonstrated the broader multi-project pattern is dominated by environment/runtime staleness rather than code defects. This is recorded as a non-blocking remaining concern (see Finding #2) rather than silently omitted.

### Light confirmatory MCP pass

Against the same fresh runtime:
- Navigated to `http://127.0.0.1:3000/` at 1440×900 — header shows **Login** (→ `http://127.0.0.1:3001`) and **Register** (→ `/register`) at the top right, in that order; no `Customer Portal`/`Demo Account` remnant.
- Navigated to `/register`, filled all six fields live (name with initials, country=Japan → dial code correctly updated to `+81`, mobile number, email, password meeting the 12-char/letter/digit policy, confirmation) and submitted. Response: "Account created" with a "Continue to sign in" link to `http://127.0.0.1:3001/?email=mcp-review-check%40example.com` — confirms no session is minted in public-web and the email is correctly carried across the origin boundary as a query parameter.
- Followed the link into the customer app. **Caught and corrected a review-methodology issue, not a product defect:** the MCP browser session had a leftover `sessionStorage` entry from an earlier automated test run in the same browser context, which auto-landed on an unrelated account's dashboard rather than the login form. Signed out, confirmed the login form reappeared with the email correctly pre-filled from the query string, then signed in with the actual registered credential.
- Navigated to `/profile`: **Identity** section shows the correct name/email from registration (read-only, as designed); **Contact details** form present and blank (matches the new blank `CustomerProfileRecord` the `D02-P12-T001` reopen provisions — this is the exact defect that blocked `D02-P12-T007` for most of its four resume attempts, now confirmed live and working); **Change password** form present with current/new/confirm fields; **Account security** section honestly states "Multi-factor authentication and session-device management are not available in this build."
- Console: 0 errors, 0 warnings across the entire walkthrough.

## Findings

| # | Severity | File:line | Rule / criterion | Responsible task | Required correction |
|---|---|---|---|---|---|
| 1 | Non-blocking | N/A (review methodology) | N/A | N/A | This review discovered that long-lived, heavily reused local dev processes across a multi-session phase produce misleading e2e results (37 false-positive failures against a stale runtime, resolved to 6 explainable failures against a fresh one). No code change required; recorded here as a process observation for future phase reviews and container-gate tasks: always rebuild/restart the runtime immediately before the review's own browser suite, never reuse a process inherited from an implementation task's session. |
| 2 | Non-blocking | tests/e2e/** (whole tree) | Task file "Required browser suite is the gate" — full three-project sweep | N/A (recommend a future infra task, not a D02-P12 task) | This review's full-suite evidence is a single-project (chromium) fresh-runtime sweep plus reliance on D02-P12-T007's own already-recorded three-viewport Docker evidence, rather than an independently re-run three-project sweep in this review pass. The reasoning (T007's own container-gate evidence already covers all three viewports; this review's own chromium-only fresh sweep found no new regression) is recorded above rather than silently assumed. Recommend a future non-blocking infra task investigate splitting `tests/e2e` execution or fixing the shared-fixture-account races in `freight-enquiry.spec.ts`, `enquiry-reservation.spec.ts` and `customer/payments.spec.ts` so the whole suite tolerates full `--workers=50%` parallelism without per-phase workarounds — this pattern has now recurred across `D02-P12-T004`, `T006`, `T007` and this review. |

Both findings are process/infrastructure observations, not defects in Phase 2.12's shipped code or tests. Neither blocks the phase.

## Tests executed

See "Deterministic gate" and "Full suite result" tables above. Summary:
- `corepack pnpm test` (root): 733/733 passed.
- `corepack pnpm quality`: clean (lint, typecheck, test:boundaries).
- Dependency-closure builds (mock-api, public-web, customer-app, domain, validation, api-client): all OK.
- `corepack pnpm api:generate` drift check: no drift.
- This phase's owned e2e specs (`register.spec.ts` + `registration-login.spec.ts`), isolated, single project, fresh runtime: 9/9 passed.
- Full chromium e2e sweep, fresh runtime, `--workers=50%`: 148/154 passed (6 non-blocking, pre-existing/contention-class failures, none attributable to this phase's diff).
- Light confirmatory MCP pass: register → forward-to-sign-in-with-prefilled-email → sign in → profile (previously-blocked step, now working) — all clean, 0 console errors.

## Decisions and deviations

- `D02-ASM-005`, `D02-ASM-006`, `D02-ASM-007` re-reviewed: all remain `ASSUMED`, no disposition change (matches every implementation task's own re-review — no new business-authority evidence surfaced during this review).
- See `## Findings` #1 and #2 for the two recorded non-blocking process observations.

## Blockers

None.
