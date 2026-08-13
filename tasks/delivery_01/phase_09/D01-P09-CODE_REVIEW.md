---
task_id: "D01-P09-CODE_REVIEW"
title: "Phase 1.9 PR code review and tech-lead approval"
delivery: "Delivery 01 — Public Website"
phase: "Phase 1.9 — Alternate theme parity"
execution_order: 60
estimate: "0.25 day"
model_tier: "FRONTIER"
parallel_group: "P09-REVIEW"
dependencies: ["D01-P09-T002"]
decision_gates: []
phase_branch: "feat_delivery01_phase_09"
task_branch: "feat_delivery01_phase_09"
product_source_mutation: "forbidden"
review_mode: "phase_manual"
ui_scope: "none"
ui_validation: "not_applicable"
---

# D01-P09-CODE_REVIEW — Phase PR code review and tech-lead approval

## Agent assignment

- Recommended tier: **FRONTIER** because this is the final Delivery 01 review gate before the Customer delivery may start.
- This is the only manual code-review gate for this phase. Work directly on `feat_delivery01_phase_09`; do not create a task-specific branch.

## Authority and context to read

1. [`CONTEXT.md`](CONTEXT.md) — Phase 1.9 context pack: what parity means, how to serve each theme, the code map and the route list. **Read this first.**
2. [`../../TASK_EXECUTION_PROTOCOL.md`](../../TASK_EXECUTION_PROTOCOL.md) — preflight, runtime profiles, browser validation, evidence blocks and the final-response contract.
3. [`../../COMMON_FRONTEND_RULES.md`](../../COMMON_FRONTEND_RULES.md) — mandatory shared frontend conventions.
4. Open `REQUIREMENT.md` (`UI-01`, `UI-02`, `UI-03`) or `FRONT_END_ARCHITECTURE.md` §11 Theming only for an item the context pack marks unresolved.

## Requirements and rules

Apply every applicable shared code-review rule and these phase-specific checks:

- Confirm the parity suite covers **every** delivered public route, and that the covered list in the execution logs matches the routes the application actually serves. An uncovered route is blocking.
- Confirm parity is asserted on structure, roles, accessible names and content — not on colour similarity — and that token-derived values are asserted to differ, so a no-op configuration cannot pass.
- Confirm both themes define every semantic token and meet the required contrast ratios, with no component-level visual fallback introduced to mask a missing token.
- Confirm no theme-conditional branch was added to application or package code, and no feature component was forked by theme.
- Verify Playwright MCP evidence for `D01-P09-T002`: client, URL, both themes with the `data-theme` value confirmed for each, viewports, console/network result, findings/corrections, MCP PASS and automated Playwright Test PASS. Missing or contradictory evidence is blocking.
- Confirm every non-token defect found during the walkthrough was recorded against its owning task and reopened, not patched around in this phase.

## Mandatory preflight and blocker protocol

1. **Before doing anything else**, run:

   ```bash
   git status --porcelain=v1 --untracked-files=all
   ```

   If output exists, stop and report exactly:

   ```text
   Uncommitted changes detected. Commit the changes first, then rerun this task.
   No implementation started.
   ```

2. Run `node tasks/scripts/taskctl.mjs next`, `node tasks/scripts/taskctl.mjs sequence D01-P09-CODE_REVIEW` and `node tasks/scripts/taskctl.mjs precheck D01-P09-CODE_REVIEW`.
3. Resume or create the phase branch. Do not create or switch to a task-specific child branch:

   ```bash
   if git show-ref --verify --quiet refs/heads/feat_delivery01_phase_09; then
     git switch feat_delivery01_phase_09
   else
     git switch delivery_01_public_website
     git pull --ff-only origin delivery_01_public_website
     git switch -c feat_delivery01_phase_09
   fi
   ```

4. Run `node tasks/scripts/taskctl.mjs check D01-P09-CODE_REVIEW`, then `node tasks/scripts/taskctl.mjs start D01-P09-CODE_REVIEW --owner "<AI-review-agent>"`.
5. The human owner must commit phase work and create a PR with base `delivery_01_public_website` or update that existing PR before tech-lead review. If the PR/diff is unavailable, record the exact blocker and stop.

## Business-visible outcome

A tech lead receives an AI-assisted review proving the alternate theme is a safe presentation swap before Delivery 01 is closed and Delivery 02 may begin.

## In scope

- Review only `delivery_01_public_website...feat_delivery01_phase_09` using `git diff --check delivery_01_public_website...feat_delivery01_phase_09` and the matching PR diff.
- Record the AI review report, phase-specific findings, test evidence and tech-lead decision in this task's execution log.
- Reopen responsible implementation tasks when a blocking defect is found; do not fix product code in this review task.

## Explicitly excluded

- Implementing features, modifying POC files, changing business rules, committing, pushing, creating/merging PRs, or self-approving.

## Architectural boundaries and owned paths

Owned paths are only this review task's execution log, tracker and phase summary. Product-code corrections belong to the responsible implementation task after `taskctl reopen`.

## Contract and incremental mock work

No API, mock, OpenAPI, fixture, database or BFF change is owned. Any contract change appearing in this phase diff is out of scope for Phase 1.9 and is a blocking finding.

## Implementation and UX requirements

### Fresh-runtime evidence review

For `D01-P09-T002`, verify its execution log proves a fresh current-worktree runtime: `Fresh-runtime verification: PASS`, `Runtime provenance:`, `Service readiness: PASS`, a recorded target URL, and Playwright MCP/automated results against that same URL for **both** themes. Treat a stale server, a missing health check, an unconfirmed `data-theme` value, or a browser failure deferred from the implementation task as a **blocking** finding. Reopen the responsible task; do not approve the phase on earlier or source-only evidence.

Read and apply [COMMON_FRONTEND_RULES.md](../../COMMON_FRONTEND_RULES.md). Treat any violation of semantic token use, stylesheet ownership, reusable-package styling or the static-inline-style rule as blocking unless the documented runtime-data custom-property exception applies.

## Automated tests to add

No new product test is owned. Verify that the parity and contrast suites are present, meaningful and passing; report missing coverage as a blocking finding.

## Validation commands

- `git diff --check delivery_01_public_website...feat_delivery01_phase_09`
- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm -r build`
- `node tasks/scripts/taskctl.mjs validate`
- `git diff -- POC` (must be empty)

## Acceptance criteria

- The AI review report records the exact comparison range, applicable rules, findings, fixes/reopen actions and result.
- The tech lead manually reviews the PR and approves this task only when no blocking findings remain.
- Root lint, TypeScript typecheck and recursive workspace builds pass with no compiler or build errors.
- The PR cannot merge until this task is `COMPLETE`.
- Delivery 02 cannot start until this task is `COMPLETE` and the Public Website PR is merged.

## Completion, handoff and tracker update

1. Record the AI review using the required format from `CODE_REVIEW_RULES.md` in `tasks/execution_logs/D01-P09-CODE_REVIEW.md`.
2. If a defect is found, run `node tasks/scripts/taskctl.mjs reopen <responsible-task-id> --reason "<exact finding>"`, then stop until the corrected task is COMPLETE and this review is rerun.
3. If AI review passes, run `node tasks/scripts/taskctl.mjs submit D01-P09-CODE_REVIEW` to move this review task to `IN_REVIEW`.
4. The tech lead reviews the PR and, if satisfied, runs `node tasks/scripts/taskctl.mjs approve D01-P09-CODE_REVIEW --reviewer "<tech-lead-name>"`.

## Phase branch and PR handoff

After this review task is COMPLETE, the human owner may merge the approved PR into `delivery_01_public_website`. Do not commit, push, create a PR, merge, rewrite history or self-approve. Delivery 02 starts only after this PR is merged and `delivery_01_public_website` is synchronized.

## Required final response

### Completed work
<AI review report and tech-lead decision, or “No implementation started”>

### AI code review
<comparison range, rules checked, findings, fixes/reopen actions and PASS or FAIL>

### Tests executed
<commands and results>

### Tracker and handoff
<execution log, PR/tech-lead status and next action>

### Decisions or deviations
<None, or exact reference>

### Blockers
None
