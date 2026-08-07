# Executable Task Template

Copy the structure of an existing generated task. Every task must include frontmatter fields for ID, order, estimate, model, parallel group, dependencies, decision gates and branches; authority/evidence; blocker preflight; outcome/scope/exclusions; owned paths; incremental API/mock work; UX/accessibility/authorization; automated tests and exact commands; acceptance; execution-log/tracker workflow; and the required final response with `Blockers: None` when unblocked.

The first preflight command must always be:

```bash
git status --porcelain=v1 --untracked-files=all
```

Any output blocks the task before all branch, source, log and tracker mutations. Public phase branches must follow `feat_delivery<two-digit-delivery>_phase_<two-digit-phase>` and be created from the updated delivery integration branch. Phase 0 tasks must use `BRANCH_NEUTRAL` for both branch fields and must not switch or create branches. Include `taskctl precheck`, conditional phase/task branch commands, final `taskctl check`, and the exact dirty-tree response from an existing task.

## Verification requirements

Every implementation task must include exact feature-test commands and these repository-wide checks in `## Validation commands`, recording their results in the execution log:

```bash
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm -r build
```

Acceptance criteria must require lint, typecheck and recursive builds to pass with no compiler/build errors. Infrastructure and phase-acceptance tasks must also include `## Containerized verification`: rebuild the target Compose stack (`docker/docker-compose.yml` plus `docker/docker-compose.dev.yml`), start it, run container Playwright tests, complete a manual UI smoke checklist, record evidence, and shut it down. Ordinary component tasks do not need a Docker redeploy when their phase gate performs it.

Every UI task must state its responsive behavior and test phone, tablet and desktop widths where applicable. If a domain interaction is used by two or more applications, the task must implement or consume a reusable package under `packages/` (for example `packages/vehicle-search`) rather than copying app-local components. App-specific wrappers may configure audience, permissions, routes, prices and actions, but must not fork shared search/detail behavior.

For an application shell or acceptance task, include PWA verification: manifest/icons, installability, offline shell, online/offline state, service-worker update/versioning, logout cache cleanup, stale-cache recovery and a negative test proving sensitive data and financial/approval mutations are not available offline. Push notifications, background sync, camera capture and install analytics require an explicit resolved decision.
