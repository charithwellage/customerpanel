---
task_id: "D01-P04-CODE_REVIEW"
status: "COMPLETE"
owner: "Claude Opus 5 (AI review agent)"
reviewer: "Tech Lead"
review_agent: "Claude Opus 5"
review_mode: "phase_manual"
phase_branch: "feat_delivery01_phase_04"
task_branch: "feat_delivery01_phase_04"
started_at: "2026-08-11T13:43:59.805Z"
updated_at: "2026-08-11T14:43:52.493Z"
blocker: ""
---

# D01-P04-CODE_REVIEW Execution Log

## Preflight

- Blockers: None
- Clean-tree command/result: `git status --porcelain=v1 --untracked-files=all` — empty at review start (clean)
- Phase branch: `feat_delivery01_phase_04` (already checked out; no task branch created)
- Child task branch: `feat_delivery01_phase_04`
- Baseline commands:
  - `node tasks/scripts/taskctl.mjs next` — Execution frontier: D01-P04-CODE_REVIEW
  - `node tasks/scripts/taskctl.mjs sequence D01-P04-CODE_REVIEW` — ELIGIBLE
  - `node tasks/scripts/taskctl.mjs precheck D01-P04-CODE_REVIEW` — passed, Blockers: None
  - `node tasks/scripts/taskctl.mjs check D01-P04-CODE_REVIEW` — passed, Blockers: None
- Phase task status at re-review: `D01-P04-T001`, `D01-P04-T002`, `D01-P04-T003` all `COMPLETE`.

## Completed work

Two review rounds against the Phase 1.4 diff.

- **Round 1 — FAIL.** 8 blocking and 6 non-blocking findings. `D01-P04-T001`, `D01-P04-T002` and `D01-P04-T003` were reopened with the exact findings as reopen reasons.
- **Round 2 — PASS.** All three tasks were remediated and recompleted. Every blocking finding was re-verified against a runtime freshly built from the corrected worktree, under both runtime profiles.

This review task changed no product code. The corrections were made under the reopened implementation tasks and are recorded in their execution logs.

## AI code review

- PR / comparison range: **`delivery_01_public_website...feat_delivery01_phase_04`**
  (base `660ec9be1129c72245ae32da1fe2a0104307bad3`). The remediation is present in the working tree pending the human owner's commit; the tech lead reviews the phase PR over this same range.
- Files reviewed (product code, tests and evidence):
  - `apps/mock-api/src/{store.ts,server.ts}` and `src/__tests__/vehicle-detail.test.ts`
  - `apps/public-web/src/app/vehicles/[slug]/{page.tsx,not-found.tsx}`, `src/app/globals.css`, `src/app/api/v1/[...path]/route.ts`
  - `apps/public-web/src/features/vehicle-detail/{VehicleDetailPage.tsx,loadVehicleDetail.ts,vehicle-detail.css}`
  - `packages/vehicle-detail/src/{VehicleGalleryPrimitive.tsx,vehicle-detail.css,index.ts,__tests__/detail.test.ts}`, `package.json`
  - `packages/domain/src/index.ts`, `packages/api-client/src/services/vehicles.ts`, `src/generated/schema.d.ts`, `openapi/{openapi.json,generate.mjs}`
  - `scripts/check-boundaries.mjs`, `docker/frontend.Dockerfile`, `.gitignore`, `pnpm-lock.yaml`
  - `tests/e2e/{vehicle-detail.spec.ts,vehicle-detail-share.spec.ts}`
  - `tasks/execution_logs/D01-P04-T00{1,2,3}.md`
- Rules checked: `CODE_REVIEW_RULES.md` #1–#11; `COMMON_FRONTEND_RULES.md` (architecture/reuse, styles and themes, accessible responsive UI, quality and evidence); the phase-specific checks in `D01-P04-CODE_REVIEW.md` (vehicle detail, media visibility, stable URLs, sharing/printing, metadata, public data projection, fresh-runtime evidence); `CONTEXT.md` §6 boundaries; `DEPENDENCY_INSTALLATION_POLICY.md`.
- **Result: PASS**

### Round 1 blocking findings and their verified closure

| # | Finding | Owner | Closure evidence |
|---|---|---|---|
| BLK-01 | `vehicle-detail.css`: ~45 fallback-palette declarations `var(--color-*, #hex)` plus 9 untokenised `rgba()`/`box-shadow` literals | T002/T003 | Residue scan over both detail stylesheets returns no `var(--x, …)`, `rgba(` or `#hex` outside the three documented print-medium constants. Every `var()` used resolves to a token emitted by `packages/theme/src/provider.ts`. Runtime proof: `.cc-gallery__nav` computes `color(srgb 0.0902 0.0902 0.0902 / 0.55)` — `--color-surface-dark` at 55% via `color-mix`, not a literal. |
| BLK-02 | Dead `VehicleGalleryPrimitive` duplicated inline; regression test covered only the dead copy | T002 | `grep -rl 'cc-gallery__main'` matches exactly one `.tsx`: `packages/vehicle-detail/src/VehicleGalleryPrimitive.tsx`. The app-local copy is deleted; the page renders the package primitive; tests target the shipped component. |
| BLK-03 | Route imported `VehicleService`/`HttpClient`; feature built `HttpClient` inline | T002 | `grep -rn "@carchief/api-client" apps/public-web/src/app/` returns nothing. Data flows through `features/vehicle-detail/loadVehicleDetail.ts`. `scripts/check-boundaries.mjs` now covers `src/app/**`; proven by reintroducing the offending import and observing exit 1, then restoring. |
| BLK-04 | Suffix matcher minted duplicate URLs; canonical derived from the requested slug | T001/T003 | Matcher fallback removed; canonical and `og:url` derive from the resolved `vehicle.slug`; aliases 308-redirect. Verified under **both** the in-memory and PostgreSQL stores. |
| BLK-05 | Unknown vehicle rendered at HTTP 200 (soft 404) | T003 | `notFound()` + `not-found.tsx`; MCP reports `HTTP status: 404 Not Found`. Root cause of the first failed attempt (a streaming `loading.tsx` committing 200 headers early) was found and removed — recorded as a deviation in T002. |
| BLK-06 | JSON-LD injected via `dangerouslySetInnerHTML` with unescaped `JSON.stringify` | T003 | `serializeJsonLd` escapes `<`, `>`, `&`. Live page: `ldHasRawAngleBracket: false`, `ldParses: true`. A model value containing `</script><script>alert(1)</script>` yields exactly one `<script` element. Unit + page-level regression tests added. |
| BLK-07 | MCP evidence contradicted the app (`carchief-default`, "dark mode"), provenance lacked commands/identity, review cited non-existent `--cc-color-*` | T002/T003 | Both logs carry new evidence blocks with exact build/start commands, PIDs, readiness output, and the theme read from the served document (`data-theme="carchief"`). The superseded blocks are retained, marked, and the false `--cc-color-*` claim is explicitly retracted. |
| BLK-08 | `.pnpm-store/v11/index.db` committed | T002 | `git ls-files .pnpm-store` → 0. `.pnpm-store/` added to `.gitignore`; the store is intact on disk per `DEPENDENCY_INSTALLATION_POLICY.md`. |

### Round 1 non-blocking findings

- NB-01 (EOF blank lines) — fixed; `git diff --check delivery_01_public_website` against the working tree exits 0.
- NB-02 (unused `catch (err)`) — fixed; the route no longer swallows errors.
- NB-03 (fixed DOM id `vehicle-title`) — fixed with `React.useId()`; the e2e test that asserted the literal id now asserts the `aria-labelledby` → `<h1>` relationship instead.
- NB-04 (fabricated `countryEligibility`, mirrored `japanPictures`) — eligibility is now the documented `DEMO_COUNTRY_ELIGIBILITY_PLACEHOLDER` constant with a named constraint in the T001 log; media categories are no longer re-labelled from `gallery`.
- NB-05 (e2e debug logging) — removed.
- NB-06 (`CLAUDE.md` in the phase diff) — informational only; left as is.

### Verified in round 2

- **No `POC/**` change**: `git diff -- POC` empty.
- **No private-field leakage**, confirmed against the live PostgreSQL table where `internal_notes` and `staff_owner_id` genuinely exist as columns: the public payload and the served HTML contain zero occurrences.
- **Boundaries**: `pnpm test:boundaries` passes, and the guard is now strong enough to have caught BLK-03.
- **Container gate** (`D01-P04-T003`'s required Profile B gate): rerun in full and passed — build, up, healthy containers, clean `mock-api` logs, `pg_isready`, live `\d+ public.vehicles` matching the store's SELECT, healthz/openapi/`__reset`, 63/63 container Playwright, manual supervisor smoke, clean `down`.
- **Dependency handling**: `packages/vehicle-detail` gained `react`/`@types/react`, a legitimate dependency-graph change. `corepack pnpm install --offline` reused 170 packages and downloaded none; the Dockerfile dependency layer was served from cache. Both are expected under `DEPENDENCY_INSTALLATION_POLICY.md` and were not treated as findings.

### Accepted with rationale (recorded, not silently passed)

- The gallery container carries `tabIndex={0}` to receive arrow keys and contains the nav/thumbnail buttons. This is the standard composite-widget pattern, not the prohibited nesting of interactive controls: the container has no activation behaviour (`role="region"`, no click/Enter handler), so there is no ambiguous target and no focus trap. Flagged for the Phase 1.9 accessibility pass as a candidate for roving `tabindex`.
- One console error remains on the detail page: a `404` from `https://fonts.gstatic.com/...woff2`. Reproduced identically on the Phase 1.2-owned home page, so it is shell-wide and pre-existing, not introduced by Phase 1.4. Recorded rather than reported as clean.

### Remaining concerns carried forward (not blocking this phase)

- `apps/public-web/src/app/globals.css` still contains ~50 **bare** literal colours in the header/hero/footer chrome, inherited from `D01-P02-T003` "exact POC visual parity". The inert fallback declarations were removed in this phase, but removing these requires new accent/on-dark-ramp tokens in `packages/theme` and would change an approved Phase 1.2 visual baseline. **Deferred to Phase 1.9**, where alternate-theme parity is the gate and these literals will visibly fail under `ocean`. Disclosed in the T002 log, not silently omitted.
- The four retained `:root`/`html` fallbacks in `globals.css` are load-bearing because `layout.tsx` applies theme variables to `<body>`. The clean fix — apply them to `<html>` — is also recorded for Phase 1.9.
- Two cross-owner changes were required to close blockers and carry merge-owner notes in the T002 log: `scripts/check-boundaries.mjs` (Phase 1.1) and `apps/public-web/src/app/globals.css` (Phase 1.1/1.2).

- Fixes applied by this review task: **None** — no product code was modified here.
- Reopen actions: `D01-P04-T001`, `D01-P04-T002`, `D01-P04-T003` reopened in round 1; all three remediated and `COMPLETE` before round 2.
- Tech-lead decision: **Pending.** The AI review passes; the task moves to `IN_REVIEW` for the manual PR review.
- Result: **PASS**

## Tests executed

| Command | Result |
|---|---|
| `git status --porcelain=v1 --untracked-files=all` (at review start) | PASS (empty) |
| `taskctl next` / `sequence` / `precheck` / `check` | PASS — frontier, ELIGIBLE, Blockers: None |
| `git diff --check delivery_01_public_website` (working tree) | **PASS (exit 0)** — was exit 2 with 9 findings in round 1 |
| `git diff -- POC` | PASS (empty) |
| `corepack pnpm lint` | PASS — note: every workspace lint script is an `echo` placeholder, so this is not static-analysis evidence |
| `corepack pnpm typecheck` | PASS — `tsc --noEmit` across all workspaces |
| `corepack pnpm -r build` | PASS |
| `corepack pnpm test` | PASS — 18 files, **130 tests** (122 before remediation) |
| `corepack pnpm test:boundaries` | PASS — 0 violations; guard verified to fail on the reintroduced BLK-03 pattern |
| `node tasks/scripts/taskctl.mjs validate` | PASS — 106 task/gate files, complete and acyclic |
| `corepack pnpm api:generate` | PASS — regenerated schema byte-identical |
| `corepack pnpm test:contract` | PASS — 10 tests |
| Playwright, Profile A, 3 viewport projects | PASS — **63/63** |
| Playwright, Profile B (containers), 3 viewport projects | PASS — **63/63** |
| Container gate (config/build/up/ps/logs/pg_isready/psql/healthz/openapi/__reset/down) | PASS |
| Playwright MCP walkthrough, `carchief`, 1440×900 | PASS |

Targeted blocker verification against the running stack:

| Requested path | Profile A | Profile B (PostgreSQL) |
|---|---|---|
| `/vehicles/2021-toyota-corolla-axio-veh-1` | `200` | `200` |
| `/vehicles/veh-1` | `308` → canonical | `308` → canonical |
| `/vehicles/NZE141-1234567` | `308` → canonical | `308` → canonical |
| `/vehicles/totally-bogus-junk-veh-1` | `404` | `404` |
| `/vehicles/XYZ-veh-1` | `404` | `404` |
| `/vehicles/non-existent-…` | `404` | `404` |

## Decisions and deviations

None for this review task. It stayed on `feat_delivery01_phase_04`, used only the comparison range named in the task file, and modified no product code, `POC/**`, requirement, architecture document or unrelated task file. Deviations recorded by the implementation tasks (no segment `loading.tsx`; deferred `globals.css` POC literals; two cross-owner changes) are listed under "Remaining concerns" above and in the respective task logs.

## Blockers

None.
