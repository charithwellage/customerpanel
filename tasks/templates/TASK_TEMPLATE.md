# Executable Task Template

Copy the structure of an existing generated task. Every task must include frontmatter fields for ID, order, estimate, model, parallel group, dependencies, decision gates and the phase branch; authority/evidence; blocker preflight; outcome/scope/exclusions; owned paths; incremental API/mock work; UX/accessibility/authorization; automated tests and exact commands; acceptance; execution-log/tracker workflow; and the required final response with `Blockers: None` when unblocked. Tasks work directly on the phase branch and must not create task-specific child branches.

The first preflight command must always be:

```bash
git status --porcelain=v1 --untracked-files=all
```

Any output blocks the task before all branch, source, log and tracker mutations. Application phase branches must follow `feat_delivery<two-digit-delivery>_phase_<two-digit-phase>` and be created from the delivery integration branch named for that task. Phase 0 tasks must use `BRANCH_NEUTRAL` for both branch fields and must not switch or create branches. Include `taskctl precheck`, conditional phase-branch commands, final `taskctl check`, and the exact dirty-tree response from an existing task. Never create a task-specific child branch.
Run `taskctl next` and `taskctl sequence` before `taskctl precheck`. The precheck/check commands enforce the execution frontier: later tasks are blocked when earlier tasks are incomplete, except for explicitly eligible same-group parallel work. Never create a task-specific child branch.

## Verification requirements

Every implementation task must include exact feature-test commands and these repository-wide checks in `## Validation commands`, recording their results in the execution log:

```bash
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm -r build
```

Before those tests, include an `## AI code review before tests` section requiring the agent to inspect only its owned diff and named dependencies against `CODE_REVIEW_RULES.md`, fix violations, repeat review until PASS, and record the required review result. Add `### AI code review` to the final response format.

Every Delivery task declares `review_mode`: use `self_ai` for implementation work and `phase_manual` only for the dedicated phase PR review. A `self_ai` task must review its owned diff against `CODE_REVIEW_RULES.md`, fix all in-scope findings, record PASS, run tests and then use `taskctl complete`. It does not require manual task-level PR approval. A `phase_manual` task reviews only its phase branch diff against the correct delivery integration branch, records the AI review, then awaits tech-lead PR approval through `taskctl approve`.

Task agents must never run `git commit`, `git push`, create a pull request, merge, rewrite history or self-approve. They may update the task execution log and generated tracker as required by the task. The human owner reviews the working-tree diff and performs all commits, pushes, PR creation and merges manually.

Acceptance criteria must require lint, typecheck and recursive builds to pass with no compiler/build errors. Infrastructure and phase-acceptance tasks must also include `## Containerized verification`: rebuild the target Compose stack (`docker/docker-compose.yml` plus `docker/docker-compose.dev.yml`), start it, run container Playwright tests, complete a manual UI smoke checklist, record evidence, and shut it down. Ordinary component tasks do not need a Docker redeploy when their phase gate performs it.

Every containerized verification must inspect the mock API directly, not only the frontend: run `docker compose ... logs --no-color mock-api` and fail on database initialization/schema errors; verify PostgreSQL readiness and inspect the live tables used by the store seed/reset SQL; call mock `/healthz`, `/openapi.json` and deterministic reset; then run container Playwright. A stale volume or `CREATE TABLE IF NOT EXISTS` schema drift is a blocking finding that must be repaired/migrated before acceptance.

Every UI task must state its responsive behavior and test phone, tablet and desktop widths where applicable. If a domain interaction is used by two or more applications, the task must implement or consume a reusable package under `packages/` (for example `packages/vehicle-search`) rather than copying app-local components. App-specific wrappers may configure audience, permissions, routes, prices and actions, but must not fork shared search/detail behavior.

Every UI task must read `DEVELOPER_USER_GUIDE.md` and the theming section of `FRONT_END_ARCHITECTURE.md`, consume `packages/theme` and `packages/ui`, use semantic theme roles, and test both the default `carchief` theme and alternate `ocean` theme. New visual screens require responsive, keyboard, focus, contrast, reduced-motion, browser-zoom and visual/Playwright coverage. Required token changes belong in `packages/theme`, not feature-local CSS.

Every new task must declare `ui_scope` and `ui_validation` in frontmatter. Use `required` plus `playwright_mcp` when the task creates or modifies visible UI; otherwise use `none` plus `not_applicable`. A Playwright MCP task performs AI review, starts the local application, inspects both themes at `390x844`, `768x1024` and `1440x900`, checks console/network and required states, fixes in-scope findings, repeats review after corrections, then runs the deterministic Playwright Test suite. Its execution log must record the client, URL, viewports, themes, console/network result, findings/corrections, `Playwright MCP Result: PASS` and `Automated Playwright Test Result: PASS` before `taskctl complete`.

Every task that displays or submits backend data must include an explicit `### Frontend API integration` subsection. It must name the generated service operation(s), state that the UI calls them through the feature hook/service boundary, define loading/empty/error/validation behavior, and require an integration or Playwright test against the mock HTTP server. Mock fixtures must never be imported by a frontend page. The implementation sequence is: update OpenAPI, regenerate the client, implement the mock route/adapter and linked seed/reset scenario, wire the frontend service, then test the browser-to-mock path. If a task is mock-only, state that no UI wiring is owned and name the downstream UI task that consumes it.

The mock-server foundation task must expose a local Swagger UI and raw generated OpenAPI document (for example `/swagger` and `/openapi.json`). Swagger must use the same contract that generates the client, support safe local “Try it out” requests, contain no secrets, and be disabled in production-like configuration. The phase acceptance task must verify both local routes in the running container.

For an application shell or acceptance task, include PWA verification: manifest/icons, installability, offline shell, online/offline state, service-worker update/versioning, logout cache cleanup, stale-cache recovery and a negative test proving sensitive data and financial/approval mutations are not available offline. Push notifications, background sync, camera capture and install analytics require an explicit resolved decision.
