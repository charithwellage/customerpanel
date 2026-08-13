# CarChief Task Execution Protocol

Shared execution mechanics for every Delivery 01 and Delivery 02 task. A task file names *what* to build and *which* commands prove it; this file explains *how* the surrounding protocol works, so the same text is not repeated in every task.

The individual task file remains authoritative. Where a task explicitly differs from this protocol, the task wins.

## 1. Agent portability

These task files are executed by different AI coding agents — Codex (Luna/Terra), Antigravity, Claude Code and others — each starting with no memory of previous tasks. Both task authors and executing agents follow these rules:

- Use plain POSIX shell plus `node` and `corepack pnpm` only. Do not assume `rg`, `jq`, `python3`, or GNU-only flags are installed; use `grep`/`grep -E` and Node instead.
- Every command must be copy-pasteable, non-interactive, run from the repository root, and use repository-relative paths.
- Never reference one AI client's tooling, tool identifiers, command syntax, subagents or configuration files. Browser requirements are stated as capabilities, not tool names.
- Assume a cold start. A task file plus its phase `CONTEXT.md` must be sufficient. Prior context comes only from committed artefacts: the tracker, the phase summary and execution logs.
- `model_tier` is a capability floor, not a vendor or product name. See [AI_MODEL_STRATEGY.md](AI_MODEL_STRATEGY.md).
- Markdown files are UTF-8 with LF endings and no BOM. The delivery CSV exports keep their required BOM.

## 2. Preflight

Each task file carries its own exact preflight commands, in this order:

1. Clean-tree check. Any output means stop immediately, print the exact dirty-tree message from the task, and make no task-system mutation — no branch change, no `taskctl` write, no source edit.
2. `taskctl next` / `sequence <ID>` / `precheck <ID>` — read-only frontier, dependency, decision and delivery-branch checks.
3. Create or resume the phase branch. Task work always happens on the phase branch; child task branches are never created.
4. `taskctl check <ID>` — repeats the clean-tree and prerequisite checks and verifies the current branch.
5. Run only the *nearest affected tests* as a baseline. Root `lint`, `typecheck` and `-r build` run once at completion, not twice per task.
6. Report `Blockers: None`, then `taskctl start <ID> --owner "<name>"`.

On any non-dirty-tree preflight failure: `taskctl block <ID> --reason "<exact failure>"`, update the execution log, report **No implementation started**, and stop. Never stash, discard, commit, create extra branches or auto-resolve a conflict.

## 3. Runtime profiles for UI validation

A UI task must browse a runtime built from the **current worktree**. Never point a browser at a process or image that was already listening on a port; its provenance is unknown.

A **phase reviewer** stands one up too, and builds it **once** per pass — the same runtime serves the full Playwright suite, any MCP spot-checks and any behaviour the reviewer needs to confirm first-hand. A reviewer who only reads execution logs cannot detect a capability that was deleted, because the logs of the task that deleted it will look clean. Stop the runtime and free its ports before finishing.

`Runtime provenance:` must name what was actually browsed — a PID, a container/service identity, or a Docker/Compose target, with the start time. `taskctl` rejects a provenance line that records no identity: `Fresh-runtime verification: PASS` beside a vague `dev server on port 3000` is an attestation, not evidence, and Profile A means `build` then `start`, never `next dev`.

### Profile A — local runtime (default)

Fast, no Docker and no PostgreSQL: `createStore()` falls back to an in-memory store when `DATABASE_URL` is unset. Use this for every UI task that is not a container gate.

```bash
corepack pnpm --filter @carchief/mock-api... build
corepack pnpm --filter @carchief/public-web... build
node apps/mock-api/dist/server.js
```

In a second shell, from the repository root:

```bash
cd apps/public-web && API_BASE_URL=http://127.0.0.1:4000 corepack pnpm exec next start -p 3000
```

Readiness, from the repository root:

```bash
curl --fail http://127.0.0.1:4000/healthz
curl --fail http://127.0.0.1:3000/healthz
```

Record the two build commands, the two start commands and the process IDs as runtime provenance. Stop both processes when the task ends.

To serve the alternate theme from the same build, restart the web process with `NEXT_PUBLIC_THEME_ID=ocean`; the server reads it at start time, so no rebuild is required. `next start` runs in production mode, so the development-only theme selector is not rendered.

### Profile B — container gate (required for container-gate tasks only)

Container-gate tasks additionally verify the real PostgreSQL schema, `/openapi.json` and reset behaviour:

```bash
docker compose -f docker-compose.frontend.yml down --remove-orphans
docker compose -f docker-compose.frontend.yml build
docker compose -f docker-compose.frontend.yml up -d
docker compose -f docker-compose.frontend.yml ps
docker compose -f docker-compose.frontend.yml logs --no-color mock-api
curl --fail http://127.0.0.1:3000/healthz
curl --fail http://127.0.0.1:4000/healthz
curl --fail http://127.0.0.1:4000/openapi.json
curl --fail -X POST http://127.0.0.1:4000/api/v1/__reset
docker compose -f docker-compose.frontend.yml down
```

Use the cached build for normal validation and record `Dependency layer: REUSED` or `Dependency layer: REBUILT (<reason>)`. Use `build --no-cache` only to diagnose a Dockerfile, base-image or dependency-layer problem. A missing column such as `column "category" ... does not exist` means the running code and the live schema disagree — see the troubleshooting section of [`DEVELOPER_USER_GUIDE.md`](../DEVELOPER_USER_GUIDE.md); never hide it by repeatedly resetting Docker.

## 4. Browser validation

Two layers with different jobs; neither substitutes for the other.

| Layer | Job | Coverage |
|---|---|---|
| Automated Playwright Test | Deterministic, repeatable proof | Viewport matrix via the existing `chromium`, `mobile-chromium` and `tablet-chromium` projects (desktop `1440x900`, phone `390x844`, tablet `768x1024`) |
| Interactive MCP browser | Agent-driven inspection and correction | One desktop acceptance journey, plus accessibility/keyboard/focus behaviour, console messages and failed network requests |

Run the automated suite against the exact recorded target. **The full suite is the gate:**

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 corepack pnpm exec playwright test --project=chromium --project=mobile-chromium --project=tablet-chromium
```

Appending a `<spec>` filter is an inner-loop convenience while iterating on one area. **It never satisfies a gate** — not for a task's completion evidence, not for a container gate, and not for a phase review. Only the unfiltered suite proves a change did not break behaviour delivered by an earlier task or phase.

This is not a theoretical rule. In Phase 1.7 every task and the first six review passes ran only `tests/e2e/public-content.spec.ts`. A route rewritten by one task had silently deleted a quotation form delivered two phases earlier, breaking 21 tests in specs nobody ran; the seventh review pass found it only by running the whole suite. Record the outcome as:

```text
Full suite result: <passed>/<total> passed across chromium, mobile-chromium, tablet-chromium
```

`taskctl submit` requires that line in a phase review log.

Required MCP browser capabilities: navigate, accessibility snapshot, resize viewport, read console messages, read network requests, capture a screenshot. Any MCP-capable client is acceptable; per-client setup is documented in [`DEVELOPER_USER_GUIDE.md`](../DEVELOPER_USER_GUIDE.md) §"Playwright MCP setup and UI-validation workflow". If those capabilities are unavailable, stop and resolve `INF-P00-T006`; a server process check, an unrelated screenshot or the automated suite alone does not satisfy the MCP gate.

**Themes.** Per-task UI validation covers the default `carchief` theme only. Alternate-theme (`ocean`) parity for the whole Public Website is verified once in Phase 1.9, not per task. The design rules are unchanged: both themes share the same semantic tokens, component markup and behaviour, and no page or component is forked by theme.

**Re-validation after a correction.** Always re-run the automated suite. Re-run the MCP walkthrough only when the correction changed layout, semantic tokens, CSS or markup structure; for a logic-, copy- or test-only correction, record that the MCP walkthrough was not affected and why. Always repeat the AI code review after any source correction.

## 5. Evidence blocks

Paste these into `tasks/execution_logs/<TASK-ID>.md` and fill them in. Do not omit a line; record `Not applicable — <reason>` instead.

```text
## AI code review

- Reviewed range/files: <paths or Git range>
- Rules checked: <applicable CODE_REVIEW_RULES.md checklist numbers>
- Findings: None | <finding and severity>
- Fixes applied: None | <concise list>
- Remaining concerns: None | <explicit approved deviation/blocker>
- Result: PASS | FAIL
```

For a task with `ui_validation: "playwright_mcp"`:

```text
## Playwright MCP UI validation

- AI client: <Codex|Antigravity|Claude Code|other>
- Runtime profile: A (local) | B (container)
- Fresh-runtime verification: PASS — <exact build and start commands>
- Runtime provenance: <process IDs or container identity, and start time>
- Service readiness: PASS — <health/API/OpenAPI/reset results, or Not applicable — reason>
- Target URL: http://127.0.0.1:3000
- Viewports: 1440x900; 390x844; 768x1024
- Themes: carchief (default only; ocean parity is verified in Phase 1.9)
- Console/network result: PASS — <material observations>
- Findings and corrections: None | <details, and whether the MCP walkthrough was repeated>
- Playwright MCP Result: PASS
- Automated Playwright Test Result: PASS
```

## 6. Review and completion

1. Review only the task-owned diff and its named dependencies against [CODE_REVIEW_RULES.md](CODE_REVIEW_RULES.md); for frontend work apply [COMMON_FRONTEND_RULES.md](COMMON_FRONTEND_RULES.md). Fix every in-scope finding and repeat until the result is **PASS**.
2. Only after PASS, run the task's tests plus `corepack pnpm lint`, `corepack pnpm typecheck` and `corepack pnpm -r build`.
3. Record commands and results in the execution log, then run `taskctl complete <ID> --review-agent "<name>"`.
4. If a finding needs a decision, a prerequisite, or another task's owned path, record a blocker instead of expanding scope.

Agents never commit, push, create pull requests, merge, rewrite history or self-approve. The human owner performs all Git operations after reviewing the working-tree diff.

### Phase review lifecycle — three passes, not one per defect

A phase review runs as three passes, regardless of how many defects it finds:

1. **Review** — work the whole checklist, catalogue **every** finding in the review log's `## Findings` table, then reopen all responsible tasks in one batch. Never stop at the first defect. Prompt: [SAMPLE_MASTER_PROMPT_PR_REVIEW.md](SAMPLE_MASTER_PROMPT_PR_REVIEW.md).
2. **Batched fix** — close every catalogued finding in one pass, grouped by defect class, then re-run the full gate. A content or fixture change usually invalidates a test assertion elsewhere; reconcile those in the same pass. Prompt: [SAMPLE_MASTER_PROMPT_BATCH_FIX.md](SAMPLE_MASTER_PROMPT_BATCH_FIX.md).
3. **Verification** — re-run the deterministic gate and full suite, confirm each finding is genuinely closed, then record `Result: PASS` and `submit`.

Completion evidence is an invariant of being `COMPLETE`, not a check that runs only at the moment `complete` executes: `taskctl validate` re-asserts it for every completed task, so hand-writing a log to `COMPLETE` fails the next validate rather than shipping.

## 7. POC handling

`POC/**` is conceptual reference only and is never modified: `git diff -- POC` must stay empty. Never reproduce these known POC defects: contradictory balances, phantom vehicles, fabricated figures, disconnected lead writes/reads, browser-native-only validation, forced identities, client-controlled roles, unsafe raw SVG/HTML injection, broad service-worker caching of sensitive data, or disabled browser zoom.

## 8. Required final response

Every task ends with exactly these headings, in this order:

```text
### Completed work
### AI code review
### Tests executed
### Tracker and handoff
### Decisions or deviations
### Blockers
```

`### Blockers` is `None` on success. If blocked, name the exact blocker and keep **No implementation started** under `### Completed work`.
