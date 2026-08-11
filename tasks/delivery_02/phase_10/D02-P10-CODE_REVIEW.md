---
task_id: "D02-P10-CODE_REVIEW"
title: "Phase 2.10 PR code review and tech-lead approval"
delivery: "Delivery 02 — Customer Application"
phase: "Phase 2.10 — Assumption reconciliation and MVP closure"
execution_order: 103
estimate: "0.25 day"
model_tier: "FRONTIER"
parallel_group: "D02-P10-REVIEW"
dependencies: ["D02-P10-T003"]
decision_gates: []
phase_branch: "feat_delivery02_phase_10"
task_branch: "feat_delivery02_phase_10"
product_source_mutation: "forbidden"
review_mode: "phase_manual"
ui_scope: "none"
ui_validation: "not_applicable"
---

# D02-P10-CODE_REVIEW — Phase 2.10 PR code review and tech-lead approval

## Agent assignment

- Recommended tier: **FRONTIER** for the final Customer assumption and PR review.
- Work on `feat_delivery02_phase_10`; do not modify product code or create a child branch.

## Authority and context to read

- [CODE_REVIEW_RULES.md](../../CODE_REVIEW_RULES.md) and [COMMON_FRONTEND_RULES.md](../../COMMON_FRONTEND_RULES.md).
- [REQUIREMENT_GAPS_AND_ASSUMPTIONS.md](../REQUIREMENT_GAPS_AND_ASSUMPTIONS.md), completed Phase 2.10 task files/logs and `tasks/phase_summaries/D02-P10-SUMMARY.md`.
- Only requirement, architecture and evidence paths explicitly named by those tasks.

## Requirements and rules

Verify that every unresolved requirement is a transparent `ASSUMED` or `SKIPPED` MVP item, not an undisclosed feature gap or false external-integration claim. Review only `delivery_02_customer_application...feat_delivery02_phase_10`.

## Mandatory preflight and blocker protocol

1. **Before doing anything else**, run:

   ```bash
   git status --porcelain=v1 --untracked-files=all
   ```

   If output exists, stop before branch/task-state changes and report exactly:

   ```text
   Uncommitted changes detected. Commit the changes first, then rerun this task.
   No implementation started.
   ```
2. Run `node tasks/scripts/taskctl.mjs next`, `node tasks/scripts/taskctl.mjs sequence D02-P10-CODE_REVIEW`, then read-only `node tasks/scripts/taskctl.mjs precheck D02-P10-CODE_REVIEW`.
3. Create/resume the phase branch only from the synchronized delivery branch:

   ```bash
   if git show-ref --verify --quiet refs/heads/feat_delivery02_phase_10; then
     git switch feat_delivery02_phase_10
   else
     git switch delivery_02_customer_application
     git pull --ff-only origin delivery_02_customer_application
     git switch -c feat_delivery02_phase_10
   fi
   ```

4. Do not create or switch to a task-specific child branch. Work directly on `feat_delivery02_phase_10`.
5. Run `node tasks/scripts/taskctl.mjs check D02-P10-CODE_REVIEW`, then baseline checks. If they pass, report **Blockers: None** and run `node tasks/scripts/taskctl.mjs start D02-P10-CODE_REVIEW --owner "<name>"`.
6. The human owner must commit phase work and create a PR with base `delivery_02_customer_application` before review.

## Business-visible outcome

A tech lead receives a final Customer MVP PR review with transparent assumptions and release exceptions.

## In scope

- Review only `delivery_02_customer_application...feat_delivery02_phase_10`.
- Apply shared review rules plus assumption-register traceability, Mock/AutoPulse boundaries, customer isolation, finance/document safety, PWA safety, Docker/MCP evidence and golden-journey acceptance.
- Record blocking defects and reopen their responsible implementation task; do not fix product code here.

## Explicitly excluded

- Product changes, new business rules, live integrations, commits, pushes, PR creation/merge or self-approval.

## Architectural boundaries and owned paths

Own only `tasks/execution_logs/D02-P10-CODE_REVIEW.md`, generated tracker and phase-review evidence. Corrections belong to a reopened implementation task.

## Contract and incremental mock work

No contract or mock change is owned. Verify that any changed API uses the generated-client and Mock API boundary, and that unresolved AutoPulse payloads remain uninvented.

## Implementation and UX requirements

Verify fresh-runtime evidence for every completed UI task: runtime provenance, readiness, themes, viewports, console/network, MCP PASS and automated Playwright PASS. Missing evidence is a blocking finding.

## Automated tests to add

No new product tests are owned. Missing coverage, failed evidence or undisclosed assumption is a blocking finding assigned to the responsible task.

## Validation commands

- `git diff --check delivery_02_customer_application...feat_delivery02_phase_10`
- `git diff --stat delivery_02_customer_application...feat_delivery02_phase_10`
- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm -r build`
- `node tasks/scripts/taskctl.mjs validate`
- `git diff -- POC` (must be empty)

Root lint, TypeScript typecheck and recursive workspace builds pass with no compiler or build errors.

## Acceptance criteria

- Review covers only `delivery_02_customer_application...feat_delivery02_phase_10`.
- Assumption register rows are complete and final MVP exceptions are explicit.
- Every normal phase task is COMPLETE, evidence is passing and no blocking finding remains.
- AI report records **Result: PASS** before tech-lead review.

## Completion, handoff and tracker update

1. Record comparison range, register review, findings and test evidence in `tasks/execution_logs/D02-P10-CODE_REVIEW.md`.
2. Run `node tasks/scripts/taskctl.mjs submit D02-P10-CODE_REVIEW` after AI review PASS.
3. A tech lead other than the owner runs `node tasks/scripts/taskctl.mjs approve D02-P10-CODE_REVIEW --reviewer "<tech-lead-name>"` after manual PR review.

## Phase branch and PR handoff

After approval, the human owner may merge the PR into `delivery_02_customer_application`. Do not commit, push, create a PR, merge, rewrite history or self-approve.

## Required final response

### Completed work
<review scope and result, or “No implementation started”>

### AI code review
<rules, findings and PASS or FAIL>

### Tests executed
<commands and results>

### Tracker and handoff
<log, resulting status and tech-lead action>

### Decisions or deviations
<assumption-register disposition>

### Blockers
None
