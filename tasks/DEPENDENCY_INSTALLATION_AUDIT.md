# Dependency Installation Audit

Audit date: 2026-08-11

The reviewed Delivery 01 Phase 1.4–1.8 and Delivery 02 task files contain no commands that delete `node_modules`, remove pnpm caches, or run `pnpm install` for every task. Their repeated commands are lint, typecheck, build, tests and, where applicable, cached Docker validation.

| Area | Observed instruction | Classification | Action |
|---|---|---|---|
| Delivery 01 phases 1.4–1.8 | Workspace lint/typecheck/build/test commands | Reusable installation | Keep; use the shared policy |
| Delivery 02 phases 2.1–2.10 | Workspace lint/typecheck/build/test commands | Reusable installation | Keep; use the shared policy |
| Docker frontend build | `docker compose ... build` | Required isolated installation with cache opportunity | Keep; preserve dependency layers |
| Clean rebuild guide | `pnpm install --frozen-lockfile` | Required recovery/first setup | Retain, with offline-first guidance |
| Docker troubleshooting | `build --no-cache` after disposable volume reset | Fresh dependency reset | Keep only for schema/image diagnosis |

The Dockerfile previously copied all source before installing, which could invalidate the dependency layer for ordinary source edits. It is now arranged as manifest/lockfile → frozen install → source copy/build, so Docker still installs required packages but can reuse that layer. Future tasks now use the shared policy so agents do not add cleanup or reinstall steps implicitly.
