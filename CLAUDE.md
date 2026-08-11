# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A pnpm + TypeScript monorepo rebuilding the CarChief (Japanese used-vehicle export) frontend from a legacy HTML POC. Three applications (`public-web`, `customer-app`, `salesperson-app`) share feature/UI packages and talk only over HTTP to a local Express `mock-api` backed by PostgreSQL. Node 22, pnpm 10 via corepack, `save-exact=true` and `engine-strict=true` are enforced.

Work is driven by an AI task system under `tasks/` — read "Task system" below before touching application code; it constrains branches, commits and completion criteria.

## Commands

Run everything from the repository root, prefixed with `corepack` as the docs do.

```bash
corepack pnpm install --frozen-lockfile --offline   # reuse the existing install; network fallback only if not cached
corepack pnpm lint                                   # per-package lint (most are placeholders today)
corepack pnpm typecheck                              # tsc --noEmit across the workspace, topological
corepack pnpm -r build                               # build all; packages must emit dist/*.d.ts before apps compile
corepack pnpm test                                   # root vitest run (all **/*.test.ts)
corepack pnpm test:boundaries                        # scripts/check-boundaries.mjs architecture guard
corepack pnpm quality                                # lint + typecheck + test:boundaries
corepack pnpm api:generate                           # regenerate packages/api-client/src/generated/schema.d.ts from openapi/openapi.json
```

Targeted work:

```bash
corepack pnpm --filter @carchief/public-web... build   # app plus its workspace deps, in dependency order
corepack pnpm --filter @carchief/theme test
corepack pnpm exec vitest run packages/ui/src/__tests__/ui-primitives.test.ts   # single test file
corepack pnpm exec vitest run -t "resolves unknown theme"                       # single test by name
```

End-to-end (Playwright, `tests/e2e`, projects `chromium` / `mobile-chromium` / `tablet-chromium`):

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 corepack pnpm test:e2e
corepack pnpm exec playwright test tests/e2e/smoke.spec.ts --project=chromium
```

Full runtime stack (the validation target for UI work):

```bash
docker compose -f docker-compose.frontend.yml build       # cached; --no-cache only to diagnose the dependency layer
docker compose -f docker-compose.frontend.yml up -d
curl --fail http://127.0.0.1:3000/healthz
curl --fail http://127.0.0.1:4000/healthz
curl --fail http://127.0.0.1:4000/openapi.json
curl --fail -X POST http://127.0.0.1:4000/api/v1/__reset
docker compose -f docker-compose.frontend.yml down
```

`docker-compose.poc.yml` serves the legacy compiled POC only; it is not a validation gate.

Never delete `node_modules`, the pnpm store or Docker caches as routine cleanup (`tasks/DEPENDENCY_INSTALLATION_POLICY.md`). To clear stale build output, delete `dist`/`.next`/`tsconfig.tsbuildinfo` under `apps` and `packages` only.

## Architecture

Layering (`FRONT_END_ARCHITECTURE.md` §5) — dependencies point downward only:

```
routes/pages → features → services → generated client → HTTP
routes, features → packages/ui + packages/theme
features, services → packages/domain + packages/validation
```

Hard prohibitions, mechanically checked by `scripts/check-boundaries.mjs` (`pnpm test:boundaries`):

- A frontend app or package may not import `mock-api`, prisma, firebase or supabase — the mock is reachable only over HTTP.
- Files under `features/` may not import `api-client/generated/schema` directly; go through a service.
- Files under `routes/` may not import `services/` directly; go through a feature hook.
- `packages/ui` may not import services — it stays presentational.
- A `NEXT_PUBLIC_*` / `VITE_*` variable may not carry a secret/password/token.

Package roles:

| Package | Role |
|---|---|
| `packages/domain` | Status vocabularies, domain types, demo JWT parsing and role permissions. Imports nothing above it. |
| `packages/api-client` | `HttpClient` (correlation ID, bearer token, timeout, `NormalizedApiError`) + one service class per domain (`services/vehicles.ts`). `src/generated/schema.d.ts` is generated — never hand-edit. |
| `packages/ui` | Cross-app presentational primitives (Button, Dialog, StatusBadge, …). |
| `packages/theme` | Semantic tokens plus the `carchief` (default) and `ocean` registry; `resolveThemeId` falls back to `carchief` for unknown IDs. |
| `packages/vehicle-search`, `packages/vehicle-detail` | Cross-app domain features (search parsing, URL state, card/collection primitives). Apps configure these; they must not fork them. |
| `packages/validation`, `packages/pwa`, `packages/testing` | Schemas, install/offline primitives, test builders and MSW handlers. |
| `packages/config` | `tsconfig.base.json` shared by every workspace (strict, NodeNext, composite). |

Applications:

- `apps/public-web` — Next.js 15 App Router, React 19, `output: 'standalone'`, `transpilePackages` for every `@carchief/*`. Server components fetch the mock directly via `API_BASE_URL`; the browser reaches it through the `src/app/api/v1/[...path]/route.ts` proxy. Theme CSS variables are applied on `<body>` in `layout.tsx`; the dev-only `ThemeSwitcher` never renders in production. `src/server.ts` is an older plain-Node renderer kept for tests — new work goes in `src/app` and `src/features`.
- `apps/mock-api` — Express app factory `createMockApiApp(store)` with `/healthz`, `/api/v1/config/public`, `/api/v1/vehicles`, `/api/v1/vehicles/search`, `/api/v1/auth/me`, `POST /api/v1/__reset`, `/openapi.json`, `/swagger`. `src/store.ts` owns the PostgreSQL schema, seed and query logic. `CREATE TABLE IF NOT EXISTS` does not add columns — a schema change means recreating the `carchief-postgres-data` volume locally.
- `apps/customer-app`, `apps/salesperson-app` — Vite-based shells, still skeletal.

Both server entrypoints self-start only when `NODE_ENV !== 'test'`, so tests import the app/render function directly.

## Frontend conventions (`tasks/COMMON_FRONTEND_RULES.md`)

- No static `style={{...}}` and no literal colours/fonts/spacing/radii/shadows in TSX. Use semantic classes and `packages/theme` tokens. The only exception is a runtime-data CSS custom property with no visual fallback, documented in the execution log.
- Put reuse in the narrowest correct owner: `packages/ui` → shared feature package → app feature stylesheet → `globals.css` last.
- `carchief` and `ocean` must stay markup-compatible; components consume semantic roles, never a named theme.
- Every screen supports phone `390×844`, tablet `768×1024` and desktop `1440×900`, keyboard operation, visible focus, contrast and reduced motion, plus loading/empty/error/validation/success states.
- Reusable components must not emit fixed DOM `id`s (use `useId`) and must not nest interactive controls.

## Task system

`tasks/` drives all delivery work; `tasks/README.md` is the entry point and states the authority order (`REQUIREMENT.md` → `FRONT_END_ARCHITECTURE.md` → `docs/CarChief-Frontend-Implementation-plan.md` → roadmap → decisions → evidence; `POC/**` is reference only and must never be modified or copied).

```bash
node tasks/scripts/taskctl.mjs validate            # validate all task/gate files and the dependency DAG
node tasks/scripts/taskctl.mjs next                # current execution frontier
node tasks/scripts/taskctl.mjs precheck <ID>       # read-only clean-tree / prerequisite / branch check
node tasks/scripts/taskctl.mjs check <ID>
node tasks/scripts/taskctl.mjs start <ID> --owner "Name"
node tasks/scripts/taskctl.mjs complete <ID> --review-agent "Name"
node tasks/scripts/taskctl.mjs render              # regenerate TASK_EXECUTION_TRACKER.md after merges
node --test tasks/scripts/taskctl-sequence.test.mjs
```

Working rules that differ from ordinary repos:

- **Agents do not commit, push, create PRs, merge or rewrite history.** Implement, self-review, test, update the execution log under `tasks/execution_logs/`, and hand back the working-tree diff. The human owner performs all Git operations.
- Start from a clean tree: run `git status --porcelain=v1 --untracked-files=all` first; any output is a blocker.
- Work happens directly on the phase branch (`feat_delivery01_phase_NN`, cut from `delivery_01_public_website`); never create task-level branches and never start a phase from an unreviewed phase branch (`BRANCHING_STRATEGY.md`).
- Before finishing an implementation task, self-review the owned diff against `tasks/CODE_REVIEW_RULES.md` and record the `## AI code review` block in the execution log, then run lint, typecheck and the recursive build.
- A task whose frontmatter says `ui_validation: "playwright_mcp"` must build/start a runtime from the *current* worktree (never reuse an unknown listener on port 3000), walk it with an MCP browser under the default `carchief` theme, and also pass automated Playwright Test against that same URL. Both layers are required; neither substitutes for the other. Viewport coverage comes from the `chromium`/`mobile-chromium`/`tablet-chromium` projects; `ocean` theme parity is verified once in Phase 1.9. Playwright MCP is pinned in `.mcp.json` — do not swap it to `@latest` during a feature task.
- `tasks/TASK_EXECUTION_PROTOCOL.md` holds the shared execution mechanics, including two runtime profiles. **Profile A** is the fast default: `createStore()` falls back to an in-memory store when `DATABASE_URL` is unset, so `node apps/mock-api/dist/server.js` plus `next start` gives a full stack with no Docker and no PostgreSQL. **Profile B** (`docker-compose.frontend.yml`) is required only for container-gate tasks.
- Each phase folder has a `CONTEXT.md` carrying that phase's requirement text, decision dispositions, code map and required test paths. Read it before the large requirement/architecture documents.
