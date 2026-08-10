---
task_id: "D01-P03-CODE_REVIEW"
title: "Phase 1.3 PR code review and tech-lead approval"
delivery: "Delivery 01 — Public Website"
phase: "Phase 1.3 — Inventory and search"
execution_order: 30
estimate: "0.25 day"
model_tier: "FRONTIER"
parallel_group: "P03-REVIEW"
dependencies: ["D01-P03-T004"]
decision_gates: []
phase_branch: "feat_delivery01_phase_03"
task_branch: "feat_delivery01_phase_03"
product_source_mutation: "forbidden"
review_mode: "phase_manual"
ui_scope: "none"
ui_validation: "not_applicable"
---

# D01-P03-CODE_REVIEW — Phase PR code review and tech-lead approval

## Agent assignment

- Recommended tier: **FRONTIER** because this reviews the entire phase diff, requirements and release risks.
- This is the only manual code-review gate for this phase. Work directly on `feat_delivery01_phase_03`; do not create a task-specific branch.

## Authority and context to read

- [CODE_REVIEW_RULES.md](../../CODE_REVIEW_RULES.md).
- This phase's completed task files, execution logs and phase summary.
- The requirements, architecture, implementation-plan and evidence explicitly named by those completed task files.

## Requirements and rules

Apply every applicable shared code-review rule and these phase-specific checks:

- Verify every changed public screen under the default `carchief` theme against the authoritative POC visual baseline `docs/evidence/phase0/phase0-public-landing.png`; verify documented responsive/accessibility exceptions and confirm `ocean` uses the same shared components and behavior.

- Search, filters, sorting, pagination, URL state, query contracts, accessibility, and deterministic results.
- Verify the phase acceptance criteria, required mock/API boundaries and required automated/container evidence are present in the PR diff or its committed execution records.

- Verify Playwright MCP evidence for every completed UI task in this phase: client, URL, themes, viewports, console/network result, findings/corrections, MCP PASS and automated Playwright Test PASS. Missing or contradictory evidence is blocking.

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

2. Run `node tasks/scripts/taskctl.mjs next`, `node tasks/scripts/taskctl.mjs sequence D01-P03-CODE_REVIEW` and `node tasks/scripts/taskctl.mjs precheck D01-P03-CODE_REVIEW`.
3. Resume or create the phase branch. Do not create or switch to a task-specific child branch:

   ```bash
   if git show-ref --verify --quiet refs/heads/feat_delivery01_phase_03; then
     git switch feat_delivery01_phase_03
   else
     git switch delivery_01_public_website
     git pull --ff-only origin delivery_01_public_website
     git switch -c feat_delivery01_phase_03
   fi
   ```

4. Run `node tasks/scripts/taskctl.mjs check D01-P03-CODE_REVIEW`, then `node tasks/scripts/taskctl.mjs start D01-P03-CODE_REVIEW --owner "<AI-review-agent>"`.
5. The human owner must commit phase work and create a PR with base `delivery_01_public_website` or updated that existing PR before tech-lead review. If the PR/diff is unavailable, record the exact blocker and stop.

## Business-visible outcome

A tech lead receives an AI-assisted, phase-specific review of the PR before it can merge into the delivery branch.

## In scope

- Review only `delivery_01_public_website...feat_delivery01_phase_03` using `git diff --check delivery_01_public_website...feat_delivery01_phase_03` and the matching PR diff.
- Record the AI review report, phase-specific findings, test evidence and tech-lead decision in this task's execution log.
- Reopen responsible implementation tasks when a blocking defect is found; do not fix product code in this review task.

## Explicitly excluded

- Implementing features, modifying POC files, changing business rules, committing, pushing, creating/merging PRs, or self-approving.

## Architectural boundaries and owned paths

Owned paths are only this review task's execution log, tracker and phase summary. Product-code corrections belong to the responsible implementation task after `taskctl reopen`.

## Contract and incremental mock work

No API, mock, OpenAPI, fixture, database or BFF change is owned. Review their correctness only when changed by the phase diff.

## Implementation and UX requirements

Review responsive phone/tablet/desktop behavior, semantic theme usage, keyboard/focus/contrast/reduced-motion behavior and PWA safety where this phase changes UI.

## Automated tests to add

No new product test is owned. Verify that required phase tests are present, meaningful and passing; report missing coverage as a blocking finding.

## Validation commands

- `git diff --check delivery_01_public_website...feat_delivery01_phase_03`
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

## Completion, handoff and tracker update

1. Record the AI review using the required format from `CODE_REVIEW_RULES.md` in `tasks/execution_logs/D01-P03-CODE_REVIEW.md`.
2. If a defect is found, run `node tasks/scripts/taskctl.mjs reopen <responsible-task-id> --reason "<exact finding>"`, then stop until the corrected task is COMPLETE and this review is rerun.
3. If AI review passes, run `node tasks/scripts/taskctl.mjs submit D01-P03-CODE_REVIEW` to move this review task to `IN_REVIEW`.
4. The tech lead reviews the PR and, if satisfied, runs `node tasks/scripts/taskctl.mjs approve D01-P03-CODE_REVIEW --reviewer "<tech-lead-name>"`.

## Phase branch and PR handoff

After this review task is COMPLETE, the human owner may merge the approved PR into `delivery_01_public_website`. Do not commit, push, create a PR, merge, rewrite history or self-approve. The next phase starts only after the PR is merged and `delivery_01_public_website` is synchronized.

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
