# Phase 1.8 Context Pack — Public SEO, acceptance and release readiness

Read this file first. Phase 1.8 is an acceptance phase: it proves what earlier phases built, adds the public SEO policy, and produces the Delivery 01 handoff.

## 1. Requirements in scope

Phase 1.8 must map **every** `PUB-01`–`PUB-35` acceptance statement to test evidence, so the full requirement text stays in `REQUIREMENT.md` Part 3. The statements this phase *implements* rather than merely verifies are:

**PUB-24** An address from CarChief's old website that a visitor or a search engine might still use leads to the correct new page, rather than a broken page.

> ⚠ **NEEDS A DECISION** — see Open Question 18. Which old addresses need to keep working was not something we could confirm.

**PUB-32 — Confirmed by legacy business requirements:** Public stock location and market eligibility are server-authoritative. For a vehicle's relevant destination port, the service shall classify it as **In Japan** when both ETD and ETA are absent or ETD is in the future; **In Transit** when ETD has passed and ETA is in the future; and **In Port** when ETA has passed. A subsequent ETD or ETA update must update the returned category. The public app shall use an automatically detected country where an approved privacy-compliant service is available, and shall always allow a manual country selection. It shall show only stock eligible for that market's approved port or ports; a market with several ports receives the union of eligible stock for those ports. The browser must never derive the category, infer a visitor's location itself, or expose a vehicle merely because it exists in the database.

Cross-system rules that apply throughout: **RULE-05**, **RULE-08**, **RULE-09**, **RULE-10**. Accessibility and responsiveness are governed by **UI-01**, **UI-02**, **UI-03**; PWA acceptance by **PWA-01** through **PWA-05** (`PWA-05` is an open question and stays excluded from the baseline).

## 2. Decisions

| Decision | Status | What Phase 1.8 does |
|---|---|---|
| `DEC-PUB-SEO-SCOPE` | RESOLVED | Complete public SEO — including PUB-24 redirects — is delivered here. Private applications stay non-indexable. There is no separate SEO delivery. |
| `DEC-PUB-LEGACY-PARITY` | OPEN | The legacy URL inventory is not approved. Record every unresolved legacy URL as an explicit blocker or named UAT constraint; never guess a redirect target. |
| `DEC-PUB-GEOIP-MARKET` | OPEN | No automatic country provider is approved. Manual market selection is the baseline; do not add geolocation. |
| `DEC-PUB-MARKET-STOCK-POLICY` | OPEN | Market-to-port mapping and stock precedence unconfirmed; verify only the implemented, approved behaviour. |
| `DEC-PWA-ENHANCEMENTS` | OPEN | Installable shell is approved; push, background sync, camera/file capture and install analytics stay excluded. |

## 3. Code map — what already exists

| Area | Path | Notes |
|---|---|---|
| Metadata | `apps/public-web/src/app/layout.tsx` | Root `metadata` export with title, description, manifest and icon. Route-level metadata is added per route. |
| Vehicle metadata | `apps/public-web/src/app/vehicles/[slug]/page.tsx` | Per-vehicle title/description/canonical delivered by `D01-P04-T003`; Phase 1.8 adds sitemap, robots and the indexation policy. |
| PWA assets | `apps/public-web/public/manifest.webmanifest`, `public/sw.js` | A minimal manifest and service worker already exist. PWA acceptance verifies and hardens them. |
| PWA helpers | `packages/pwa/src/`, `packages/testing/src/pwa-helpers.ts` | Shared install/update/connectivity primitives plus existing test helpers. |
| Health endpoint | `apps/public-web/src/app/healthz/route.ts` | Used by the fresh-runtime gate. |
| Boundary guard | `scripts/check-boundaries.mjs` via `corepack pnpm test:boundaries` | Already fails the build on forbidden imports and on a secret exposed through a `NEXT_PUBLIC_*`/`VITE_*` variable. Extend the security task's checks around it rather than duplicating it. |
| Existing e2e | `tests/e2e/` | `smoke`, `home-showroom`, `inventory-search`, `theme-responsive` specs already exist and must keep passing. |
| Playwright projects | `playwright.config.ts` | `chromium`, `mobile-chromium` (390×844), `tablet-chromium` (768×1024). The browser matrix is these projects. |
| Traceability sources | `docs/CarChief-Legacy-Public-Website-Traceability.md`, `docs/CarChief-Legacy-Public-Requirements-Reconciliation.md` | Evidence for the route inventory; not approval to copy content. |

## 4. Missing root scripts — this phase creates them

The Phase 1.8 tasks validate with root `package.json` scripts that **do not exist yet**. Each task lists the exact entry to add in its own In scope section: `test:seo-routes`, `test:metadata`, `test:traceability` (`D01-P08-T001`); `test:security`, `build:production`, `test:production-guard` (`D01-P08-T002`); `test:a11y`, `test:browsers`, `test:performance`, `test:seo-crawl` (`D01-P08-T003`). Do not invent variants, and do not rename the existing `lint`, `typecheck`, `build`, `test`, `test:contract`, `test:boundaries` or `quality` entries.

Playwright-backed scripts need a running target: export `PLAYWRIGHT_BASE_URL` for the runtime recorded in the fresh-runtime gate before running them.

## 5. Conventions the validation commands depend on

| Artefact | Required path |
|---|---|
| Critical journey spec | `tests/e2e/public-critical-journey.spec.ts` |
| SEO route tests | `apps/public-web/src/__tests__/seo-routes.test.ts` |
| Metadata tests | `apps/public-web/src/__tests__/metadata.test.ts` |
| Traceability tests | `tests/traceability/requirement-coverage.test.ts` |
| Security projection tests | `apps/public-web/src/__tests__/security-projection.test.ts`, `apps/mock-api/src/__tests__/security-projection.test.ts` |
| Production guard tests | `apps/public-web/src/__tests__/production-guard.test.ts` |
| Accessibility / performance / crawl specs | `tests/e2e/accessibility.spec.ts`, `tests/e2e/performance.spec.ts`, `tests/e2e/seo-crawl.spec.ts` |

## 6. Parallel execution

`D01-P08-T001`, `D01-P08-T002` and `D01-P08-T003` share parallel group `P08-A` and own disjoint paths. Once `D01-P08-T001` is `IN_PROGRESS`, the other two may run concurrently on the same phase branch. `D01-P08-T004` depends on all three. Confirm eligibility with `node tasks/scripts/taskctl.mjs sequence <ID>` before starting.

## 7. Known pitfalls already paid for in earlier phases

- **`D01-P08-T004` is the container gate** for this phase: it uses Profile B (Docker Compose) and must inspect `mock-api` logs, the live PostgreSQL schema, `/openapi.json` and reset. The other tasks may use Profile A.
- **Playwright strict mode**: crawl and accessibility specs touch many pages; ambiguous locators are the most common failure.
- **Docker schema drift**: `CREATE TABLE IF NOT EXISTS` does not add columns; recreate the Compose volume after a schema change.
- **Do not weaken a gate to make it pass.** A failing accessibility, performance or redirect check is a finding for the owning task, recorded and reopened — not a lowered budget.

## 8. Boundaries

- Private customer and salesperson routes emit `noindex` and never expose private metadata.
- Production builds must not be able to enable mock endpoints, demo personas or reset.
- Never publish a secret in source, build output, an image layer or a log.
- Do not modify `POC/**`; `git diff -- POC` must stay empty.
