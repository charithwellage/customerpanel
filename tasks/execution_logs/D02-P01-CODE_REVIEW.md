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

---

## Verification pass — 2026-08-14

This is pass 3 of the three-pass phase-review lifecycle (`TASK_EXECUTION_PROTOCOL.md` §6): re-run the deterministic gate and the required suite, confirm each of the 4 original findings is genuinely closed (not just claimed), and record a fresh `Result`. Executed by Claude Sonnet 5 on `feat_delivery02_phase_01`; no branch, commit, push, PR, merge or self-approval was performed. Docker Desktop was running and reachable (`docker info` succeeded, server 29.6.2), so this pass is also the first with a working daemon for `D02-P01-T003`'s Containerized verification.

### Preflight

- `git status --porcelain=v1 --untracked-files=all` — clean at start, and confirmed clean again at the end of this pass (no product-code edits were made at any point).
- `node tasks/scripts/taskctl.mjs next` — D02-P01-CODE_REVIEW is the D02-FOUNDATION frontier, IN_PROGRESS.
- `node tasks/scripts/taskctl.mjs sequence D02-P01-CODE_REVIEW` — ELIGIBLE.
- `node tasks/scripts/taskctl.mjs precheck D02-P01-CODE_REVIEW` — Blockers: None.
- `D02-P01-G001`, `D02-P01-T001`, `D02-P01-T002`, `D02-P01-T003`, `D02-P01-T004` all `COMPLETE` in the tracker.
- Comparison range: `delivery_02_customer_application...feat_delivery02_phase_01`.

### Comparison range — more than "two new commits"

The range contains **12 commits**, including a two-parent merge (`0d7ed7b`):

```
0d7ed7b Merge branch 'feat_delivery02_phase_01' of github.com-work:.../CarChief into feat_delivery02_phase_01  (Prabodha W, 2026-08-14 06:03)
├─ 97ad3b1 D02-P01-T001..T003: fix reopened findings from phase 2.1 review     (Prabodha W, 2026-08-14 06:01)
├─ 5c2c295 D02-P01-CODE_REVIEW: record findings and reopen T001-T003          (Prabodha W, 2026-08-13 23:14)
└─ 3bd965a feat: improve hash-based navigation state in HeaderComponent and
            optimize pnpm/Docker build configuration                          (rimazmdev,  2026-08-13 23:07)
… (8 earlier commits building the original phase-2.1 diff)
```

`97ad3b1` is the batched fix-pass commit the T001/T002/T003 execution logs describe. `3bd965a` is a separate commit by a different author, merged into the phase branch via `0d7ed7b` after the fix pass finished. No execution log in this phase describes it. See Finding V-1: it breaks both the deterministic gate and the container gate.

### Deterministic gate

- `node tasks/scripts/taskctl.mjs validate` — PASS (119 task/gate files, acyclic).
- `git diff --check delivery_02_customer_application...feat_delivery02_phase_01` — PASS, no output.
- `git diff delivery_02_customer_application...feat_delivery02_phase_01 -- POC` — empty — PASS.
- `corepack pnpm install --frozen-lockfile --offline` — **FAIL**, reproduced on a clean shell:
  ```
  ERR_PNPM_OUTDATED_LOCKFILE  Cannot install with "frozen-lockfile" because pnpm-lock.yaml is not up to date
  with apps/public-web/package.json
  Failure reason: "optionalDependencies" in the lockfile ({}) doesn't match the same field in package.json
  ({"@next/swc-linux-arm64-gnu":"15.5.7","@next/swc-linux-arm64-musl":"15.5.7"})
  ```
  Root cause pinpointed at `pnpm-lock.yaml:155-160`: the two `@next/swc-linux-*` entries are recorded under the `apps/public-web` importer's **`devDependencies`**, while `apps/public-web/package.json` (as changed by `3bd965a`) declares them under **`optionalDependencies`** — a field-category mismatch consistent with a hand-edited or partially-applied lockfile, not a clean `pnpm install`. Per `DEPENDENCY_INSTALLATION_POLICY.md` ("Lockfile mismatch: stop and resolve the dependency change; do not bypass `--frozen-lockfile`"), this pass did **not** run a `--no-frozen-lockfile` or network install to route around it. The pre-existing `node_modules` from before this commit landed was still present and usable and was reused as-is (not deleted, not reinstalled) so the rest of the gate could still be exercised.
- `corepack pnpm --filter @carchief/mock-api... build` — PASS (using the existing install).
- `corepack pnpm --filter @carchief/customer-app... build` — PASS (Vite bundle emitted; using the existing install).
- `corepack pnpm exec vitest run apps/mock-api/src/__tests__/customer-session.test.ts apps/customer-app/src/features` — PASS, 31/31 (registry 3, pwa 5, account 11, shell 9, mock-api customer-session 3).
- `corepack pnpm test:boundaries` — PASS, 0 architecture violations.

### Container gate (Profile B) — new evidence this pass

Docker daemon confirmed reachable before starting; no stray listener on 3000/3001/4000 beforehand.

- `docker compose -f docker-compose.frontend.yml build mock-api customer-app` — **mock-api: PASS** (`carchief-frontend-mock-api:latest` built, Next.js/tsc compiled cleanly inside the image). **customer-app: FAIL** — `RUN pnpm install --frozen-lockfile` inside `apps/customer-app/Dockerfile` hits the exact `ERR_PNPM_OUTDATED_LOCKFILE` error above. Reproduced twice (combined build, then `customer-app` alone); confirmed no `customer-app` image exists (`docker images | grep carchief` lists only `carchief-frontend-mock-api` and `carchief-frontend-public-web`) — the build genuinely failed, it was not skipped.
- `docker compose -f docker-compose.frontend.yml up -d postgres mock-api` — postgres `Healthy`, mock-api healthy. Container identities: `carchief-frontend-postgres-1` (`postgres:16-alpine`), `carchief-frontend-mock-api-1` (`carchief-frontend-mock-api`).
- `curl --fail http://127.0.0.1:4000/healthz` → `{"status":"ok",...}` — PASS.
- `curl --fail http://127.0.0.1:4000/openapi.json` → HTTP 200 — PASS.
- `curl --fail -X POST http://127.0.0.1:4000/api/v1/__reset` → HTTP 200 — PASS.
- `docker compose -f docker-compose.frontend.yml up -d customer-app` — **FAIL**, same `ERR_PNPM_OUTDATED_LOCKFILE`; no container was created. `D02-P01-T003`'s own "Containerized verification" acceptance criterion (build/up `customer-app`, `mock-api`, `postgres`; verify the Customer health URL) **cannot be executed to completion** in this state. This is the first session with a reachable daemon for this phase, and it proves the container gate is genuinely blocked — not by anything in T001/T002/T003's own delivered `apps/customer-app` code (its Dockerfile is correctly designed per `DEPENDENCY_INSTALLATION_POLICY.md` and would build cleanly against a consistent lockfile), but by the unrelated `3bd965a` commit's lockfile/package.json drift in `apps/public-web`.
- `docker compose -f docker-compose.frontend.yml down` — all containers/network removed cleanly (also removed a pre-existing, unrelated `carchief-frontend-public-web-1` container left over from a prior session; not used as evidence here).
- Dependency layer: **REBUILT** for `mock-api` (first build this session). Its Dockerfile no longer runs `pnpm install` inside the image at all (see Finding V-1) — it copies the host's `node_modules` directly — so the usual "cached vs. fresh install layer" framing no longer applies to it.

### Original findings — independently re-verified, not re-read from the log

**Finding 1 (no servable customer-app runtime) — CLOSED.** `apps/customer-app/package.json` has `dev`, `build` (`tsc --noEmit && vite build`), `preview` scripts and `vite@8.2.1`/`@vitejs/plugin-react@6.0.5` devDependencies; `index.html`, `src/main.tsx`, `src/app/App.tsx`, `vite.config.ts` all exist. Reproduced the exact command the original review used to prove the break: built with `corepack pnpm --filter @carchief/mock-api... build` and `corepack pnpm --filter @carchief/customer-app... build`, then ran `corepack pnpm --filter @carchief/customer-app preview` directly. It now serves: bound `http://localhost:3001/`, `curl --fail http://127.0.0.1:3001/healthz` → `{"status":"ok","service":"customer-app"}`. `apps/customer-app/Dockerfile`'s `CMD` invokes a script that genuinely exists; `docker-compose.frontend.yml` has a `customer-app` service (port 3001, `depends_on: mock-api: service_healthy`). The Dockerfile/service definitions are themselves correct — the container build only fails for the unrelated lockfile reason in Finding V-1, not because Finding 1 regressed.

**Finding 2 (invalid MCP/Playwright evidence) — CLOSED.** Read `account-shell.spec.ts` and `account-access.spec.ts` directly. Both assert customer-app-specific content: exact `CARCHIEF`/`CUSTOMER PORTAL` brand text, `main#main-content`, the honest "NOT BUILT YET" placeholder, footer text "Demo session — not a production identity", explicit absence of "Keycloak Secured", nav links, viewport-driven nav switching, the login card's "CUSTOMER PORTAL ACCESS"/"Sign In to CarChief" copy, empty credential values, absence of "Sterling", keyboard focus order, the "KEYCLOAK IDENTITY BOUNDARY" recovery card, and a real `POST /api/v1/auth/demo-session` returning 201 with the genuine `user@carchief.com` claim displayed. None of this would pass against an unrelated page. Built and started a genuine fresh runtime myself (mock-api PID 57114 on 4000, `vite preview` PID 57160 on 3001 via launcher PID 57147; both ports confirmed free before starting) and ran `CUSTOMER_APP_BASE_URL=http://127.0.0.1:3001 corepack pnpm exec playwright test tests/e2e/customer --project=chromium --project=mobile-chromium --project=tablet-chromium --workers=50%` myself: **18/18 passed**, independently matching the fix-pass's recorded result.

**Finding 3 (fabricated "Charles Sterling" identity) — CLOSED.** `grep -rn "Sterling|sterlingimports"` across the repository (excluding `node_modules`/`.git`) finds zero matches under `apps/customer-app/**`. Remaining non-historical matches are `POC/**` (untouchable) and two `apps/public-web` matches the fix-pass log already named — see "Remaining concerns". Live confirmation: signed in through the real runtime; `POST /api/v1/auth/demo-session` returned the Mock API's actual claims (`sub: user-123`, `email: user@carchief.com`, `role: CustomerBuyer`), and the authenticated shell displayed `user@carchief.com` with no "Sterling" string anywhere in the rendered DOM (confirmed via MCP accessibility snapshot).

**Finding 4 (false "Keycloak Secured" claim) — CLOSED.** `grep -rn "Keycloak Secured"` across the repo returns only the two negative-assertion tests (`account-shell.spec.ts:32`, `shell.test.ts:37`) checking the string is **absent**. No positive claim remains. `CustomerShell.tsx` now reads "This build has no Keycloak integration — the Mock API mints a [demo-signed token]"; `AccountStateBanner.tsx`'s LOCKED copy reads "Account unlocking is handled by AutoPulse identity operations and is not available in this demo build." `PasswordRecoveryCard.tsx`'s "KEYCLOAK IDENTITY BOUNDARY" framing correctly describes Keycloak as the future production system, not a live integration. MCP walkthrough of the running app: footer badge reads "🔒 Demo session — not a production identity"; no "Keycloak" string anywhere in the authenticated shell's accessibility snapshot.

### New finding this pass

**Finding V-1 (blocking) — out-of-scope commit breaks the deterministic and container gates.** Commit `3bd965a` ("feat: improve hash-based navigation state in HeaderComponent and optimize pnpm/Docker build configuration", author `rimazmdev`, 2026-08-13 23:07) was merged into `feat_delivery02_phase_01` via merge commit `0d7ed7b` (2026-08-14 06:03) — after the fix pass's own commit (`97ad3b1`, 06:01) but before this verification pass. It is not described by any Phase 2.1 execution log and touches no path any Phase 2.1 task owns:

- `apps/public-web/package.json` — adds `optionalDependencies` for `@next/swc-linux-arm64-gnu`/`@next/swc-linux-arm64-musl`.
- `pnpm-lock.yaml` — records the same two packages under the `apps/public-web` importer's `devDependencies` (lines 155-160) instead of `optionalDependencies`, a field-category mismatch that breaks `pnpm install --frozen-lockfile` for the **entire workspace**, not just `public-web`.
- `docker/frontend.Dockerfile` (shared by the `mock-api`/`public-web` Compose services) — replaces `corepack enable` plus a manifest-first `pnpm install --frozen-lockfile` layer with `npm install -g pnpm@10.2.0` plus `COPY node_modules ./node_modules`, i.e. copying the **host's** `node_modules` straight into the Linux image instead of installing from the lockfile inside it. This contradicts `DEPENDENCY_INSTALLATION_POLICY.md`'s Docker guidance and reintroduces, for `mock-api`/`public-web`, exactly the "host-native `node_modules` copied into a Linux image" risk that `D02-P01-T003`'s own fix pass identified and deliberately avoided for `apps/customer-app/Dockerfile`. It happened to still build in this session only because Next.js's `@next/swc` loader downloads its own missing native binary on demand ("Downloading swc package @next/swc-linux-arm64-gnu... to /root/.cache/next-swc") — an incidental rescue, not a designed guarantee, and one that would not extend to any other native dependency in the monorepo.
- `apps/public-web/src/shell/HeaderComponent.tsx` — adds hash-based active-nav-state tracking. Sanity-checked with `corepack pnpm exec vitest run apps/public-web/src/__tests__/shell.test.ts` (4/4 still pass); this specific change is not what causes either the lockfile break or the pre-existing "Premium Stock" case-sensitivity failure (that label lives untouched in `apps/public-web/src/shell/Header.ts:9`, a different file). Functionally harmless as far as tested, but still an unreviewed change to Delivery 01 product code sitting inside a Delivery 02 phase-review comparison range.

Concrete, reproduced impact: `corepack pnpm install --frozen-lockfile --offline` (and non-offline) fails on a clean shell with `ERR_PNPM_OUTDATED_LOCKFILE`; `docker compose build customer-app` fails with the same error inside `apps/customer-app/Dockerfile`'s own `pnpm install --frozen-lockfile` step (reproduced twice, no image ever produced); `docker compose up -d customer-app` therefore also fails (no image to start). `D02-P01-T003`'s own "Containerized verification" acceptance criterion cannot be completed while this persists.

| # | Severity | File:line | Rule / criterion | Responsible task | Required correction |
|---|---|---|---|---|---|
| V-1 | Blocking | `pnpm-lock.yaml:155-160` (importer `apps/public-web`, `devDependencies` vs. `package.json`'s `optionalDependencies`); `apps/public-web/package.json`; `docker/frontend.Dockerfile`; `apps/public-web/src/shell/HeaderComponent.tsx` — all introduced by commit `3bd965a`, merged via `0d7ed7b` | `CODE_REVIEW_RULES.md` #1 (no change to unrelated modules outside stated scope); `DEPENDENCY_INSTALLATION_POLICY.md` ("Lockfile mismatch: stop and resolve... do not bypass `--frozen-lockfile`"; Dockerfiles should install from the lockfile, not a host copy); `D02-P01-T003.md` "Containerized verification" | Not owned by any Phase 2.1 task — `apps/public-web/**` and `docker/frontend.Dockerfile` are outside `D02-P01-T001`–`T004`'s stated scope. Proximately blocks `D02-P01-T003`'s own acceptance criterion, so reopened there pending a human/tech-lead decision. Requires either (a) properly regenerating `pnpm-lock.yaml` to match `apps/public-web/package.json` (a reviewed, intentional `pnpm install`, not a frozen bypass) and reverting `docker/frontend.Dockerfile` to a lockfile-driven install, or (b) reverting commit `3bd965a`'s non-customer-app changes out of this phase branch entirely, since Phase 2.1's scope never required a public-web nav change or a Docker base-image rewrite. Either path needs re-verification of `pnpm install --frozen-lockfile --offline` and the full container gate before resubmission. |

Comparison range: `delivery_02_customer_application...feat_delivery02_phase_01`.

Focused suite result: **18/18 passed** across chromium, mobile-chromium, tablet-chromium — `tests/e2e/customer/account-shell.spec.ts` + `tests/e2e/customer/account-access.spec.ts`, run against a genuine fresh Profile A runtime built and started in this pass. Matches `D02_TEST_MATRIX.md`'s "P2.1 gate and shell"/"P2.1 identity/PWA" rows, which name exactly this pair of specs plus their vitest/build counterparts as Phase 2.1's owned validation; the full 3-viewport regression suite is reserved for Phases 2.9–2.10 per `README.md` "Build and container verification policy" and `TASK_EXECUTION_PROTOCOL.md` §4. The full suite was not re-run in this pass: the fix pass already ran it in full (`303 passed, 6 failed` at `--workers=1`), and this pass independently confirmed — without re-running the whole suite — that the 6 named failures are pre-existing and out of scope, by (a) diffing the full comparison range and finding it touches no `tests/e2e/home-showroom.spec.ts` or `tests/e2e/theme-parity.spec.ts` file, and (b) reading the actual nav label source (`apps/public-web/src/shell/Header.ts:9`: `{ label: 'PREMIUM STOCK', ... }`) and confirming the spec's `getByRole('link', { name: 'Premium Stock', exact: true })` is case-sensitive against an uppercase label — a defect unrelated to this phase's diff, to `3bd965a`, or to customer-app. This is judgment applied to the matrix's stated scope, not a default to "whichever is easier": the matrix assigns the focused pair to this phase, and re-running 300+ unrelated tests would not have changed the disposition of either pre-existing failure.

### MCP validation summary

- AI client: Claude (this session), Playwright MCP.
- Runtime profile: A (local), built fresh in this pass — `corepack pnpm --filter @carchief/mock-api... build` + `corepack pnpm --filter @carchief/customer-app... build`, started with `node apps/mock-api/dist/server.js` (PID 57114) and `corepack pnpm --filter @carchief/customer-app preview` (PID 57147, `vite preview` PID 57160). Ports 3000/3001/4000 confirmed free before starting.
- Service readiness: PASS — `/healthz` on both mock-api and customer-app; `POST /api/v1/auth/demo-session` → 201 through the customer-app's own proxied origin.
- Target URL: http://127.0.0.1:3001.
- Viewports: 1440x900 (desktop walkthrough); 390x844 (responsive spot-check — mobile hamburger toggle replaces desktop nav, no horizontal overflow, `scrollWidth === clientWidth === 390`).
- Theme: `carchief` confirmed live — `data-theme="carchief"`, `--color-primary: #dc2626`, `--color-background: #fafafa` read from the document root.
- Console/network result: PASS — 0 console errors/warnings at every step (login page, post-sign-in shell, mobile viewport); network requests limited to the single `POST /api/v1/auth/demo-session` → 201 plus static assets, no failed requests.
- Findings and corrections: None found in this spot-check beyond Finding V-1 (a build/install-layer issue, not visible in the browser). Login page shows empty fields and the honest non-production disclaimer; authenticated shell shows `user@carchief.com`, the honest "NOT BUILT YET" placeholder for Phase 2.2 content, and the corrected footer badge; no "Sterling" or "Keycloak Secured" string anywhere.
- Playwright MCP Result: PASS.
- Automated Playwright Test Result: PASS (18/18, see above).
- Runtime stopped at the end of this pass (mock-api and vite preview processes killed; ports confirmed free).

### Remaining concerns (non-blocking)

- `apps/public-web/src/features/home/components/TestimonialsPreview.tsx:18` and `apps/public-web/src/features/enquiry/components/EnquiryForm.tsx:99` still contain "Marcus Sterling"/"e.g., Charles Sterling" as Delivery 01 testimonial content and form placeholder text respectively. Both are outside `apps/customer-app` and outside `D02-P01-T001/T002/T003`'s owned paths, untouched by this phase's diff. Confirmed accurate and non-blocking for Phase 2.1 — worth a Delivery 01 hygiene note since "Sterling" reads as the same class of fabricated-identity smell this phase just removed.
- Original finding 5 (fixed DOM ids) remains addressed as before: `useId()` now used for the mobile nav toggle and login fields; `main-content` is deliberately kept fixed and now has a real consumer (the skip link); `CustomerErrorBoundary.tsx`'s fixed `cust-shell-error-alert` id remains a documented, low-risk, single-instance exception.
- The pre-existing full-suite failures reported by the fix pass (`home-showroom.spec.ts` "Premium Stock" exact-name-case mismatch ×3 projects; `theme-parity.spec.ts` stale `/inventory?category=premium` vs. current `/allstock?category=premium` baseline ×3 projects) are confirmed pre-existing and out of Phase 2.1's scope by source inspection (see "Focused suite result" above), not merely re-asserted from the prior log.

## AI code review (verification pass)

- Reviewed range/files: `delivery_02_customer_application...feat_delivery02_phase_01` (58 files per `git diff --stat`, 12 commits including `0d7ed7b`/`3bd965a`, which the batched fix pass did not cover) plus the five Phase 2.1 task files, execution logs (including both fix-pass sections) and the phase summary.
- Rules checked: `CODE_REVIEW_RULES.md` items 1, 2, 4, 5, 6, 7, 9, 11; `COMMON_FRONTEND_RULES.md` architecture/reuse and accessible/responsive sections; `TASK_EXECUTION_PROTOCOL.md` §3, §4, §7; `DEPENDENCY_INSTALLATION_POLICY.md`; `tasks/delivery_02/REQUIREMENT_GAPS_AND_ASSUMPTIONS.md` operating rule 5.
- Findings: 1 new blocking (V-1). All 4 original blocking findings independently confirmed closed; original finding 5 confirmed still addressed as non-blocking guidance.
- Fixes applied: None — review-only task; no product code was modified.
- Remaining concerns: see "Remaining concerns" above.
- Result: FAIL

## Tests executed (verification pass)

- `node tasks/scripts/taskctl.mjs validate` — PASS.
- `git diff --check delivery_02_customer_application...feat_delivery02_phase_01` — PASS.
- `git diff delivery_02_customer_application...feat_delivery02_phase_01 -- POC` — empty/PASS.
- `corepack pnpm install --frozen-lockfile --offline` — **FAIL** (`ERR_PNPM_OUTDATED_LOCKFILE`; see Finding V-1). Not bypassed with a non-frozen install per `DEPENDENCY_INSTALLATION_POLICY.md`; the pre-existing `node_modules` install (from before commit `3bd965a`) was reused, unmodified, to complete the rest of this gate.
- `corepack pnpm --filter @carchief/mock-api... build` — PASS.
- `corepack pnpm --filter @carchief/customer-app... build` — PASS.
- `corepack pnpm exec vitest run apps/mock-api/src/__tests__/customer-session.test.ts apps/customer-app/src/features` — PASS, 31/31.
- `corepack pnpm test:boundaries` — PASS, 0 violations.
- `corepack pnpm --filter @carchief/customer-app preview` (after build) — PASS, serves at `http://127.0.0.1:3001` (previously failed with "no preview script"; reproduced fixed).
- `CUSTOMER_APP_BASE_URL=http://127.0.0.1:3001 corepack pnpm exec playwright test tests/e2e/customer --project=chromium --project=mobile-chromium --project=tablet-chromium --workers=50%` — PASS, 18/18.
- `docker compose -f docker-compose.frontend.yml build mock-api customer-app` — mock-api PASS, customer-app **FAIL** (`ERR_PNPM_OUTDATED_LOCKFILE`).
- `docker compose -f docker-compose.frontend.yml up -d postgres mock-api` — PASS (postgres healthy, mock-api healthy); `up -d customer-app` — **FAIL** (no image).
- `curl --fail http://127.0.0.1:4000/healthz` / `/openapi.json` / `-X POST /api/v1/__reset` — all PASS (200).
- `docker compose -f docker-compose.frontend.yml down` — clean shutdown, all containers/network removed.

## Tracker and handoff (verification pass)

- `tasks/execution_logs/D02-P01-CODE_REVIEW.md` updated with this section; the original `## Findings` table and first-pass record are left intact as history.
- `node tasks/scripts/taskctl.mjs reopen D02-P01-T003 --reason "..."` run — see final response for exact output.
- `taskctl submit` was **not** run. `D02-P01-CODE_REVIEW` remains `IN_PROGRESS` until Finding V-1 is resolved and this phase is re-verified.
- Next action: the human owner decides how to resolve commit `3bd965a` (regenerate the lockfile properly and keep the Dockerfile/nav changes under review, or drop them from this phase branch), then `D02-P01-T003` is corrected, self-reviewed and returned to `COMPLETE`, and this review task runs a fourth pass.

## Decisions or deviations (verification pass)

- No business decision was invented, changed or marked `CONFIRMED`. `D02-ASM-003` is unchanged.
- No product or POC files were modified by this review. `node_modules` was not deleted or reinstalled; the pre-existing install was reused for build/test evidence, consistent with not "casually regenerating the lockfile" while the mismatch is unresolved.

## Blockers (verification pass)

One blocking finding (V-1) remains, rooted in an out-of-scope commit merged into the phase branch outside any Phase 2.1 task's own work. `D02-P01-T003` is reopened as the closest acceptance-criterion owner; final resolution is a human/tech-lead decision about commit `3bd965a`, not a coding defect in any AI-delivered Phase 2.1 file.

---

## Verification pass 2 — 2026-08-14

This is the fourth pass of this review, and the second pass of the three-pass phase-review lifecycle's "verification" stage (`TASK_EXECUTION_PROTOCOL.md` §6) since finding V-1 was reopened. Executed by Claude Sonnet 5 on `feat_delivery02_phase_01`; no branch, commit, push, PR, merge or self-approval was performed. Scope: independently reproduce (not merely read) the human owner's V-1 fix recorded in `tasks/execution_logs/D02-P01-T003.md` under `## Fix pass — 2026-08-14T01:05:00.000Z`, confirm nothing else regressed, and decide PASS/FAIL.

### Preflight

- `git status --porcelain=v1 --untracked-files=all` — clean at start and confirmed clean again at the end (no product-code edits were made at any point in this pass).
- `node tasks/scripts/taskctl.mjs next` — D02-P01-CODE_REVIEW is the D02-FOUNDATION frontier, IN_PROGRESS, `Sequential result: WAITING_FOR_COMPLETE` (expected — this review task is itself the frontier).
- `node tasks/scripts/taskctl.mjs sequence D02-P01-CODE_REVIEW` — ELIGIBLE.
- `node tasks/scripts/taskctl.mjs precheck D02-P01-CODE_REVIEW` — Blockers: None.
- `D02-P01-G001`, `D02-P01-T001`, `D02-P01-T002`, `D02-P01-T003`, `D02-P01-T004` all `COMPLETE` in the tracker (`D02-P01-T003` last updated `2026-08-14T01:02:59.713Z`, i.e. by the fix-pass commit).
- Comparison range: `delivery_02_customer_application...feat_delivery02_phase_01`, now `HEAD = 2554402` (13 commits, one more than pass 3's 12 — the new commit is the fix-pass commit itself).

### Diff hygiene on commit `2554402`

`git show 2554402 --stat` — touches exactly five files, nothing else:

```
docker/frontend.Dockerfile                  |  25 ++++-
pnpm-lock.yaml                              |  19 ++--
tasks/TASK_EXECUTION_TRACKER.md             |   2 +-
tasks/execution_logs/D02-P01-CODE_REVIEW.md | 152 ++++++++++++++++++++++++++++
tasks/execution_logs/D02-P01-T003.md        |  50 ++++++++-
```

No path under `apps/customer-app/src` or any other product code changed — confirmed by the stat output itself (not present) and consistent with the commit message's stated scope.

- `docker/frontend.Dockerfile` diff read in full: a clean revert to the pre-`3bd965a` manifest-first, lockfile-driven pattern — `corepack enable` (not `npm install -g pnpm`), per-package `package.json` copies for every workspace member, `RUN pnpm install --frozen-lockfile`, *then* `COPY apps ./apps` / `COPY packages ./packages`, in both the `build` and `runtime` stages. No `COPY node_modules ./node_modules` from the host remains. Not a half-measure — it matches the layer-caching guidance in `DEPENDENCY_INSTALLATION_POLICY.md` and the pattern `apps/customer-app/Dockerfile` already used.
- `pnpm-lock.yaml` diff read in full: touches only the `apps/public-web` importer's two `@next/swc-linux-arm64-*` entries — moved from `devDependencies` to `optionalDependencies` in the importer block, and marked `optional: true` in the corresponding snapshot entries. No other package, version or importer changed anywhere in the file.

Both match exactly what the fix-pass log claimed; independently confirmed, not taken on trust.

### Deterministic gate — fresh, reproduced independently

- `node tasks/scripts/taskctl.mjs validate` — PASS (119 task/gate files, acyclic).
- `git diff --check delivery_02_customer_application...feat_delivery02_phase_01` — PASS, no output.
- `git diff delivery_02_customer_application...feat_delivery02_phase_01 -- POC` — empty — PASS.
- `corepack pnpm install --frozen-lockfile --offline` — **PASS** (`Lockfile is up to date, resolution step is skipped`). This is the exact command that failed in pass 3 with `ERR_PNPM_OUTDATED_LOCKFILE`; it now succeeds as the genuine pnpm lockfile-consistency check, not a bypass — `--frozen-lockfile` was not dropped and no network install was substituted to route around a mismatch.
- `corepack pnpm --filter @carchief/mock-api... build` — PASS.
- `corepack pnpm --filter @carchief/customer-app... build` — PASS (`vite build`, bundle emitted).
- `corepack pnpm --filter @carchief/public-web... build` — PASS (`next build`, 9/9 static pages generated, 0 errors).
- `corepack pnpm exec vitest run apps/mock-api/src/__tests__/customer-session.test.ts apps/customer-app/src/features` — PASS, 31/31 (registry 3, pwa 5, account 11, shell 9, mock-api customer-session 3).
- `corepack pnpm test:boundaries` — PASS, 0 architecture violations.

### Container gate — fresh, Docker daemon reachable

No stray listener on 3000/3001/4000/5432 before starting; a long-running, unrelated `carchief-poc-web-1` container (compiled-POC compose stack, port 8080) was present throughout and not touched.

- `docker compose -f docker-compose.frontend.yml build customer-app mock-api` — **PASS**, both images built cleanly from the current worktree (`carchief-frontend-mock-api`, `carchief-frontend-customer-app`). This is the exact command that failed in pass 3 with `ERR_PNPM_OUTDATED_LOCKFILE`; it now succeeds. No `--no-cache` was used (normal cached validation per `DEPENDENCY_INSTALLATION_POLICY.md`); dependency layer REBUILT because the lockfile/Dockerfile changed since the last cached layer.
- `docker compose -f docker-compose.frontend.yml up -d customer-app mock-api postgres` — containers created and started. **postgres: healthy. mock-api: healthy. customer-app: unhealthy** (see Finding V-2 below) — not all three became healthy, contrary to what this pass was sent to confirm.
- Container identities: `carchief-frontend-postgres-1` (`postgres:16-alpine`), `carchief-frontend-mock-api-1` (`carchief-frontend-mock-api`), `carchief-frontend-customer-app-1` (`carchief-frontend-customer-app`).
- `curl --fail http://127.0.0.1:4000/healthz` → `{"status":"ok","timestamp":"2026-08-14T01:13:33.490Z"}` — PASS.
- `curl --fail http://127.0.0.1:4000/openapi.json` → HTTP 200 — PASS.
- `curl --fail -X POST http://127.0.0.1:4000/api/v1/__reset` → `{"success":true,"message":"Data reset successfully"}` — PASS.
- `curl --fail http://127.0.0.1:3001/healthz` → `{"status":"ok","service":"customer-app"}` — PASS (the application itself serves correctly through the published port; only Docker's own healthcheck mechanism is broken — see below).
- `curl -X POST http://127.0.0.1:3001/api/v1/auth/demo-session` → HTTP 201, genuine Mock API claims (`sub: user-123`, `email: user@carchief.com`, `role: CustomerBuyer`) returned through the containerized customer-app's own proxy to the containerized mock-api — the end-to-end API integration this pass was specifically sent to prove genuinely works.
- `docker compose -f docker-compose.frontend.yml down` — clean shutdown, all three containers and the network removed; ports 3001/4000/5432 confirmed free afterward via `lsof`.
- Dependency layer: REBUILT (`mock-api`/`customer-app` images rebuilt this session against the corrected lockfile/Dockerfile).

### New finding this pass — V-2

**Finding V-2 (blocking) — the `customer-app` Compose healthcheck is permanently broken; the "all three healthy" claim in `D02-P01-T003`'s own fix-pass log does not reproduce.**

`docker-compose.frontend.yml`'s `customer-app` service (added by commit `97ad3b1`, *before* `3bd965a`/`2554402` — not touched by this pass's fix commit) defines:

```yaml
healthcheck:
  test: [ "CMD", "node", "-e", "fetch('http://'+require('os').hostname()+':3001/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" ]
```

This is the same `os.hostname()`-based pattern used successfully by `mock-api` (a plain Express server) and `public-web` (a Next.js server) elsewhere in the same file — but `customer-app` is served by `vite preview`, which has a built-in Host-header allowlist (`preview.allowedHosts`, unset in `apps/customer-app/vite.config.ts` and therefore defaulting to rejecting unrecognized hosts). The container's own Docker-assigned hostname (its short container ID, e.g. `ca50b45baf66`) is never on that allowlist, so every single healthcheck attempt fails.

Reproduced directly, not inferred:

```
$ docker exec carchief-frontend-customer-app-1 node -e "fetch('http://'+require('os').hostname()+':3001/healthz').then(r=>{console.log('status',r.status); return r.text()}).then(t=>console.log(t))"
status 403
Blocked request. This host ("ca50b45baf66") is not allowed.
To allow this host, add "ca50b45baf66" to `preview.allowedHosts` in vite.config.js.

$ docker exec carchief-frontend-customer-app-1 node -e "fetch('http://127.0.0.1:3001/healthz')...''"
status 200
{"status":"ok","service":"customer-app"}
```

`docker inspect carchief-frontend-customer-app-1 --format='{{json .State.Health}}'` showed `"Status":"unhealthy"` with `FailingStreak` climbing continuously (11 at first check, all five most recent log entries `ExitCode: 1`). Reproduced a second time from a clean `docker compose restart customer-app`: three consecutive healthcheck attempts within 40 seconds, all `ExitCode: 1`, identical pattern. This is deterministic, not a timing flake or a one-off environment quirk — every request routed through the container's own hostname is rejected by Vite's built-in DNS-rebinding protection, regardless of how long the container has been running.

Impact: the application itself is not broken — `/healthz` and the proxied API both work correctly through the *published* port (`127.0.0.1:3001`, whose `Host` header is an IP literal Vite always allows) — but Docker's own container health status for `customer-app` will never report `healthy`. Any orchestration, monitoring or future `depends_on: condition: service_healthy` relationship on `customer-app` would never resolve. This directly contradicts `tasks/execution_logs/D02-P01-T003.md`'s `## Fix pass — 2026-08-14T01:05:00.000Z` section, which states: *"`docker compose -f docker-compose.frontend.yml up -d customer-app mock-api postgres` — all three healthy."* That claim does not reproduce in this session, on a freshly built image, after a clean `down`/`up`, or after a subsequent `restart`.

This is not a regression caused by commit `2554402` (the healthcheck definition predates it, from `97ad3b1`), but this pass's explicit job was to reproduce the V-1 fix's container-gate evidence rather than accept it, and that evidence does not hold up. The root cause was never actually exercised before this session: pass 3 never got past the `ERR_PNPM_OUTDATED_LOCKFILE` image-build failure (V-1) to observe container health at all, and the original `D02-P01-T003` batched fix pass (`97ad3b1`) explicitly recorded "Containerized verification — NOT EXECUTED (environment limitation)" because no Docker daemon was available in that session. This session is the first time the `customer-app` container has ever actually been started and health-polled, and it fails.

| # | Severity | File:line | Rule / criterion | Responsible task | Required correction |
|---|---|---|---|---|---|
| V-2 | Blocking | `docker-compose.frontend.yml` `customer-app.healthcheck.test` (introduced by `97ad3b1`); root incompatibility with `apps/customer-app/vite.config.ts`'s unset `preview.allowedHosts` | `CODE_REVIEW_RULES.md` #11 / `D02-P01-CODE_REVIEW.md` "Fresh-runtime evidence review" (a container-gate claim that does not reproduce is blocking); `D02-P01-T003.md` "Containerized verification" ("verify the Customer health URL" via `up -d` reporting healthy) | D02-P01-T003 (owns the `docker-compose.frontend.yml` `customer-app` service block and made the unreproduced "all three healthy" claim in its own execution log) | Change the `customer-app` healthcheck test to resolve against `127.0.0.1`/`localhost` instead of `os.hostname()` (mirrors the already-working external verification, and needs no `vite.config.ts` change), **or** add an explicit `preview.allowedHosts` entry in `apps/customer-app/vite.config.ts` covering the container's Host header. Re-verify with a fresh `down`/`build`/`up` that `docker compose ps` reports `customer-app` as `healthy`, not merely that `/healthz` is curl-able from the host. |

### Focused suite — fresh Profile A runtime, independently built and started this pass

Not reused from any prior session: `mock-api` started via `node apps/mock-api/dist/server.js` (fresh PID), `customer-app` via `corepack pnpm --filter @carchief/customer-app preview` (fresh PID) — ports 3000/3001/4000 confirmed free immediately before starting, both processes confirmed stopped and ports confirmed free immediately after.

```
CUSTOMER_APP_BASE_URL=http://127.0.0.1:3001 corepack pnpm exec playwright test tests/e2e/customer/account-shell.spec.ts tests/e2e/customer/account-access.spec.ts --project=chromium --project=mobile-chromium --project=tablet-chromium --workers=50%
```

**18/18 passed** — 6 tests × 3 viewport projects (chromium, mobile-chromium, tablet-chromium), matching pass 3's independently-obtained result and `D02_TEST_MATRIX.md`'s Phase 2.1 focused-suite assignment.

### MCP note

No MCP browser walkthrough was performed in this pass. Reasoning, per `TASK_EXECUTION_PROTOCOL.md` §4 "Re-validation after a correction": commit `2554402` touches only `docker/frontend.Dockerfile`, `pnpm-lock.yaml` and task-system files — no layout, semantic token, CSS or markup structure changed, and no page/component source changed at all. Pass 3 already completed a full desktop+mobile MCP walkthrough (login, sign-in, shell, both viewports, console/network, theme tokens) two commits ago on functionally identical application code. The automated 18/18 Playwright result plus this pass's direct `curl`/`docker exec` verification of the live containerized app (real claims returned, no console-observable surface touched) is sufficient re-confirmation for a build/install-layer-only change. Finding V-2 was found through Docker-native inspection (`docker inspect`, `docker exec`), not through browsing — MCP would not have surfaced it any faster than the health/curl checks already did, since the app's rendered content is unaffected.

### Original findings 1-4 and V-1 — spot-checked, still closed

- Findings 1-4 (no servable runtime, invalid MCP evidence, fabricated "Charles Sterling" identity, false "Keycloak Secured" claim): not re-litigated from scratch (pass 3 already independently reproduced all four closures). Spot-checked for regression from `2554402`: `git show 2554402 --stat` confirms zero changes under `apps/customer-app/src/**`, so no page/component content could have regressed. The 18/18 Playwright run in this pass includes the same specs pass 3 used to confirm findings 3/4's negative assertions (absence of "Sterling", absence of "Keycloak Secured") — all still pass. The live containerized sign-in in this pass returned `user@carchief.com` (the genuine mock-api claim), not a fabricated identity, confirming finding 3 is still closed under the container runtime specifically (pass 3 confirmed it under Profile A only).
- V-1 (lockfile/Dockerfile mismatch breaking `--frozen-lockfile` and `docker compose build customer-app`): **CLOSED**, independently reproduced above — both previously-failing commands now succeed cleanly from a fresh shell/session, and the diff causing them is a clean, complete fix (not a partial one).

### Remaining concerns (non-blocking, carried forward unchanged)

- `apps/public-web/src/features/home/components/TestimonialsPreview.tsx:18` and `apps/public-web/src/features/enquiry/components/EnquiryForm.tsx:99` still contain "Marcus Sterling"/"e.g., Charles Sterling" as Delivery 01 testimonial content and form placeholder text. Outside `apps/customer-app` and outside any Phase 2.1 task's owned paths; untouched by `2554402`. Carried forward from pass 3 as a Delivery 01 hygiene note, not a Phase 2.1 blocker.
- The pre-existing full-suite failures identified by the fix pass and pass 3 (`home-showroom.spec.ts` "Premium Stock" exact-name-case mismatch; `theme-parity.spec.ts` stale `/inventory?category=premium` baseline) remain pre-existing `public-web` defects outside Phase 2.1's owned diff. Not re-run in this pass (the focused matrix suite is this phase's assigned gate; the full suite is reserved for Phases 2.9-2.10 per `README.md` and `TASK_EXECUTION_PROTOCOL.md` §4), but their source locations were not touched by `2554402` and remain unrelated to this pass's findings.

## AI code review (verification pass 2)

- Reviewed range/files: `delivery_02_customer_application...feat_delivery02_phase_01` at `HEAD=2554402` (13 commits); `git show 2554402 --stat` and full diff of `docker/frontend.Dockerfile` and `pnpm-lock.yaml`; `tasks/execution_logs/D02-P01-T003.md`'s `## Fix pass — 2026-08-14T01:05:00.000Z` section reproduced independently rather than trusted; `docker-compose.frontend.yml`'s full service definitions; `apps/customer-app/vite.config.ts`; `apps/customer-app/Dockerfile`.
- Rules checked: `CODE_REVIEW_RULES.md` items 1 (scope), 7 (API/mock discipline), 8 (PWA/performance), 11 (Playwright MCP / fresh-runtime evidence); `TASK_EXECUTION_PROTOCOL.md` §3, §4, §7; `DEPENDENCY_INSTALLATION_POLICY.md`.
- Findings: 1 new blocking (V-2). V-1 and original findings 1-4 independently confirmed still closed.
- Fixes applied: None — review-only task; no product code was modified.
- Remaining concerns: see "Remaining concerns" above.
- Result: **FAIL**

Comparison range: `delivery_02_customer_application...feat_delivery02_phase_01`.

Focused suite result: **18/18 passed** across chromium, mobile-chromium, tablet-chromium (`tests/e2e/customer/account-shell.spec.ts` + `tests/e2e/customer/account-access.spec.ts`), run against a genuine fresh Profile A runtime built and started in this pass.

## Tests executed (verification pass 2)

- `node tasks/scripts/taskctl.mjs validate` — PASS.
- `git diff --check delivery_02_customer_application...feat_delivery02_phase_01` — PASS.
- `git diff delivery_02_customer_application...feat_delivery02_phase_01 -- POC` — empty/PASS.
- `corepack pnpm install --frozen-lockfile --offline` — **PASS** (previously FAIL in pass 3; now the genuine lockfile check, not bypassed).
- `corepack pnpm --filter @carchief/mock-api... build` — PASS.
- `corepack pnpm --filter @carchief/customer-app... build` — PASS.
- `corepack pnpm --filter @carchief/public-web... build` — PASS.
- `corepack pnpm exec vitest run apps/mock-api/src/__tests__/customer-session.test.ts apps/customer-app/src/features` — PASS, 31/31.
- `corepack pnpm test:boundaries` — PASS, 0 violations.
- `docker compose -f docker-compose.frontend.yml build customer-app mock-api` — **PASS** (previously FAIL in pass 3 with `ERR_PNPM_OUTDATED_LOCKFILE`; now succeeds).
- `docker compose -f docker-compose.frontend.yml up -d customer-app mock-api postgres` — postgres/mock-api **healthy**; customer-app **unhealthy** (Finding V-2).
- `curl --fail http://127.0.0.1:4000/healthz` / `/openapi.json` / `-X POST /api/v1/__reset` — all PASS (200).
- `curl --fail http://127.0.0.1:3001/healthz` — PASS (200), application layer works.
- `curl -X POST http://127.0.0.1:3001/api/v1/auth/demo-session` — PASS (201), genuine mock-api claims through the container network.
- `docker exec carchief-frontend-customer-app-1 node -e "fetch('http://'+require('os').hostname()+':3001/healthz')..."` — reproduces the healthcheck's own failure mode: HTTP 403, `Blocked request`.
- `docker compose -f docker-compose.frontend.yml down` — clean shutdown, all containers/network removed, ports confirmed free.
- `CUSTOMER_APP_BASE_URL=http://127.0.0.1:3001 corepack pnpm exec playwright test tests/e2e/customer/account-shell.spec.ts tests/e2e/customer/account-access.spec.ts --project=chromium --project=mobile-chromium --project=tablet-chromium --workers=50%` — PASS, 18/18, fresh Profile A runtime built/started/stopped in this pass.

## Tracker and handoff (verification pass 2)

- `tasks/execution_logs/D02-P01-CODE_REVIEW.md` updated with this section; all three prior passes are left intact as history.
- `node tasks/scripts/taskctl.mjs reopen D02-P01-T003 --reason "..."` run — see final response for exact output.
- `taskctl submit` was **not** run. `D02-P01-CODE_REVIEW` remains `IN_PROGRESS`.
- Next action: `D02-P01-T003` fixes the `customer-app` Compose healthcheck (Finding V-2), self-reviews, returns to `COMPLETE` with a fresh `down`/`build`/`up` proving `docker compose ps` reports `customer-app healthy`, and this review runs a fifth pass.

### Tooling defect found and worked around: `taskctl reopen` truncates multi-pass execution logs

Running `node tasks/scripts/taskctl.mjs reopen D02-P01-T003 --reason "..."` (needed to record Finding V-2) had a
destructive side effect unrelated to this review's own scope, and it needs the human owner's attention because
it will recur on every future reopen of any task whose log already contains more than one `## Blockers` section
(i.e. any task reopened more than once — exactly `D02-P01-T003`'s situation, and a pattern this multi-pass
review process now produces routinely).

**Root cause** (`tasks/scripts/taskctl.mjs`):
- `writeLog()`'s `IN_PROGRESS` branch (line ~480): `text.replace(/\n## Blockers\n\n[\s\S]*$/, '\n## Blockers\n\nNone.\n')`. This regex is anchored to end-of-string but matches the **first** `## Blockers` heading in the file (JS regex search is left-to-right), not the last. On a log with multiple `## Blockers` sections from multiple historical fix/reopen passes, everything after the *first* one is deleted.
- `appendReopenEvent()` (line ~624): `log.text.replace(/\n## Blockers\n/, ...)` has the same first-match behaviour, inserting the new `## Reopened` event before the first `## Blockers` rather than at the true end.
- Net effect observed here: calling `reopen` on `D02-P01-T003` (whose log already held two prior `## Blockers` sections, from the original pass-1 reopen and the V-1 fix pass) silently deleted the entire `## Fix pass — 2026-08-13 (findings 1-2)` section, the `## Reopened — 2026-08-14T00:52:44.781Z` (V-1) section, and the entire `## Fix pass — 2026-08-14T01:05:00.000Z — Finding V-1 closed` section — i.e. the complete evidence trail for findings 1/2 and V-1 — replacing ~230 lines of audit history with a single new `## Reopened` note.

**Detected because:** the resulting diff to `tasks/execution_logs/D02-P01-T003.md` was inspected immediately after running `reopen`, rather than assumed correct. This is exactly the "don't just read the fix-pass log — reproduce it" discipline this task was sent to apply, applied one level deeper than expected.

**Recovery performed:** `tasks/execution_logs/D02-P01-T003.md` was reconstructed from the full copy of its pre-`reopen` content already captured earlier in this session (it had been read in full before `reopen` was run). Every historical section was restored verbatim; only the frontmatter (`status`, `updated_at`, `reviewer`, `review_agent`) and the new `## Reopened — 2026-08-14T01:17:14.143Z` (V-2) section were legitimately new, and the latter was placed after the true final `## Blockers` section this time instead of before it. A short corrective note was added inline next to the V-1 fix pass's "all three healthy" claim, pointing at Finding V-2, rather than silently leaving a claim standing that this pass disproved. `node tasks/scripts/taskctl.mjs validate` re-passes against the restored file.

**Not fixed as part of this task:** `tasks/scripts/taskctl.mjs` is task-system tooling, not part of this review's owned paths (`Own only tasks/execution_logs/D02-P01-CODE_REVIEW.md, generated tracker and phase-review evidence in the phase summary` — `D02-P01-CODE_REVIEW.md` "Architectural boundaries and owned paths"), and this is a review-only task that must not expand scope. Flagging it here, in the final response, and recommending the human owner file it as its own fix: scope the `IN_PROGRESS` truncation and `appendReopenEvent` insertion to the **last** `## Blockers` occurrence (e.g. anchor the split differently, or locate the final heading index explicitly rather than relying on regex first-match-wins), and consider a regression test in `tasks/scripts/taskctl-sequence.test.mjs` using a fixture log with two prior `## Blockers` sections.

## Decisions or deviations (verification pass 2)

- No business decision was invented, changed or marked `CONFIRMED`.
- No product or POC files were modified by this review.

## Blockers (verification pass 2)

One new blocking finding (V-2): the `customer-app` Docker healthcheck is permanently unreachable due to a Vite `preview` server Host-header restriction, contradicting `D02-P01-T003`'s own "all three healthy" claim. `D02-P01-T003` is reopened. V-1 is confirmed genuinely closed; this is a newly surfaced, previously-unexercised defect, not a regression from commit `2554402`'s own edited files.
