---
task_id: "D02-P09-CODE_REVIEW"
title: "Phase 2.9 PR code review and tech-lead approval"
delivery: "Delivery 02 — Customer Application"
phase: "Phase 2.9 — Customer Application acceptance"
execution_order: 96
estimate: "0.25 day"
model_tier: "FRONTIER"
parallel_group: "D02-P09-REVIEW"
dependencies: ["D02-P09-T004"]
decision_gates: []
phase_branch: "feat_delivery02_phase_09"
task_branch: "feat_delivery02_phase_09"
product_source_mutation: "forbidden"
review_mode: "phase_manual"
ui_scope: "none"
ui_validation: "not_applicable"
---

# D02-P09-CODE_REVIEW — Phase 2.9 PR code review and tech-lead approval

## Agent assignment

- Recommended tier: **FRONTIER** because this is the phase-wide AI-assisted PR review.
- This is the phase's only manual review gate. Work on `feat_delivery02_phase_09`; no child branch and no product changes.

## Authority and context to read

- [CODE_REVIEW_RULES.md](../../CODE_REVIEW_RULES.md).
- This phase's completed task files, execution logs and `tasks/phase_summaries/D02-P09-SUMMARY.md`.
- Only requirements, architecture sections and evidence explicitly named by those completed tasks.

## Requirements and rules

Apply every shared code-review rule and specifically verify CUST/UI/PWA/BA traceability, IDOR/privacy/security, responsive accessibility, themes, PWA, performance, Docker UAT and Delivery 03 readiness.

Customer compiled behavior is evidence only. Confirm known POC defects were prohibited and no unapproved business rule or external integration was invented.

- Verify Playwright MCP evidence for every completed UI task in this phase: client, URL, themes, viewports, console/network result, findings/corrections, MCP PASS and automated Playwright Test PASS. Missing or contradictory evidence is blocking.

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
2. Run `node tasks/scripts/taskctl.mjs next`, `node tasks/scripts/taskctl.mjs sequence D02-P09-CODE_REVIEW`, then read-only `node tasks/scripts/taskctl.mjs precheck D02-P09-CODE_REVIEW`. A skipped earlier task, incomplete dependency, unresolved decision or missing delivery branch is a blocker.
3. Create/resume the phase branch only from the synchronized delivery branch:

   ```bash
   if git show-ref --verify --quiet refs/heads/feat_delivery02_phase_09; then
     git switch feat_delivery02_phase_09
   else
     git switch delivery_02_customer_application
     git pull --ff-only origin delivery_02_customer_application
     git switch -c feat_delivery02_phase_09
   fi
   ```

4. Do not create or switch to a task-specific child branch. Work directly on `feat_delivery02_phase_09`.
5. Run `node tasks/scripts/taskctl.mjs check D02-P09-CODE_REVIEW`, then the baseline lint/typecheck/affected tests. If they pass, report **Blockers: None** and run `node tasks/scripts/taskctl.mjs start D02-P09-CODE_REVIEW --owner "<name>"`.
6. On any clean-tree preflight failure, record it with `taskctl block`, report **No implementation started**, and stop. Never stash, discard, commit, pull through conflicts or resolve decisions automatically.

The human owner must commit phase work and create a PR with base `delivery_02_customer_application` before review. If the comparison/PR is unavailable, block and stop.

## Business-visible outcome

A tech lead receives an AI-assisted review of the complete phase PR before it can merge.

## In scope

- Review only delivery_02_customer_application...feat_delivery02_phase_09.
- Apply shared rules plus CUST/UI/PWA/BA traceability, IDOR/privacy/security, responsive accessibility, themes, PWA, performance, Docker UAT and Delivery 03 readiness.
- Record findings by severity and reopen the responsible implementation task for any blocking defect; do not fix product code here.

## Explicitly excluded

- Product fixes, POC changes, new requirements/contracts or expanding scope.
- Committing, pushing, creating/merging the PR or approving this task as the review agent.

## Architectural boundaries and owned paths

Own only `tasks/execution_logs/D02-P09-CODE_REVIEW.md`, generated tracker and phase-review evidence in the phase summary. Corrections belong to a reopened implementation task.

## Contract and incremental mock work

No contract, mock, database or product change is owned; review conformance only.

## Implementation and UX requirements

Review the phase diff for shared package boundaries, both themes, phone/tablet/desktop behavior, keyboard/focus/contrast/zoom/reduced motion, customer isolation, sensitive-cache/PWA safety and honest external labels.

## Automated tests to add

- Verify all required phase tests, builds, Docker evidence and acceptance records are present and passing. No new product test is owned; missing coverage is a blocking finding assigned to the responsible implementation task.

## Validation commands

- `git diff --check delivery_02_customer_application...feat_delivery02_phase_09`
- `git diff --stat delivery_02_customer_application...feat_delivery02_phase_09`
- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm -r build`
- Phase-specific unit/integration/Playwright/container commands named by completed tasks.
- `node tasks/scripts/taskctl.mjs validate`
- `git diff -- POC` (must be empty)

Root lint, TypeScript typecheck and recursive workspace builds pass with no compiler or build errors. Infrastructure unavailable for a required check is a blocker.

## Acceptance criteria

- Review covers only `delivery_02_customer_application...feat_delivery02_phase_09` and applies CODE_REVIEW_RULES plus the phase-specific focus.
- Findings record severity, path/evidence, violated rule, responsible task and correction.
- Every normal phase task is COMPLETE and required tests/Docker evidence are present and passing.
- No blocking finding remains; AI report records **Result: PASS**.
- Root lint, TypeScript typecheck and recursive workspace builds pass with no compiler or build errors.
- Tech lead manually reviews the PR; PR cannot merge until this task is COMPLETE.

## Completion, handoff and tracker update

1. Start the review after preflight and review only `delivery_02_customer_application...feat_delivery02_phase_09`.
2. For a blocking defect run `node tasks/scripts/taskctl.mjs reopen <responsible-task-id> --reason "<exact finding>"`; stop until it is corrected, self-reviewed and COMPLETE.
3. On PASS, record the exact range, files, rules, findings, test evidence and **Result: PASS** in `tasks/execution_logs/D02-P09-CODE_REVIEW.md`.
4. Run `node tasks/scripts/taskctl.mjs submit D02-P09-CODE_REVIEW`.
5. A tech lead other than the owner runs `node tasks/scripts/taskctl.mjs approve D02-P09-CODE_REVIEW --reviewer "<tech-lead-name>"` after manual PR review.

## Phase branch and PR handoff

After approval, the human owner may merge the PR. Do not commit, push, create a PR, merge, rewrite history or self-approve. Synchronize `delivery_02_customer_application` after merge; the next phase starts from it.

## Required final response

### Completed work
<review report or “No implementation started”>

### AI code review
<range, rules, findings/reopens and PASS or FAIL>

### Tests executed
<commands and results>

### Tracker and handoff
<log, PR/tech-lead state and next action>

### Decisions or deviations
<None or exact reference>

### Blockers
None
