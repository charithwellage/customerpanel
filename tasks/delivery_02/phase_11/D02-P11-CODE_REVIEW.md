---
task_id: "D02-P11-CODE_REVIEW"
title: "Optional Customer multi-theme PR code review and tech-lead approval"
delivery: "Delivery 02 — Customer Application"
phase: "Phase 2.11 — Optional multi-theme support"
execution_order: 106.3
estimate: "0.25 days"
model_tier: "FRONTIER"
parallel_group: "D02-P11-OPTIONAL"
dependencies: ["D02-P11-T002"]
decision_gates: []
phase_branch: "feat_delivery02_phase_11"
task_branch: "feat_delivery02_phase_11"
product_source_mutation: "allowed"
review_mode: "phase_manual"
ui_scope: "none"
ui_validation: "not_applicable"
optional: true
---

# D02-P11-CODE_REVIEW — Optional Customer multi-theme PR code review and tech-lead approval

## Agent assignment

- This optional phase requires explicit start opt-in: --opt-in theme.
- Work directly on feat_delivery02_phase_11; no child branch.

## Authority and context to read

- FRONT_END_ARCHITECTURE.md, DEVELOPER_USER_GUIDE.md, tasks/CODE_REVIEW_RULES.md, tasks/COMMON_FRONTEND_RULES.md and tasks/delivery_02/D02_TEST_MATRIX.md.
- tasks/delivery_02/REQUIREMENT_GAPS_AND_ASSUMPTIONS.md — theme rows only.

## Requirements and rules

This opt-in phase does not block Delivery 03. It preserves carchief as default, uses shared semantic tokens only, and never changes API calls, authorization or PWA data policy.

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
2. Run node tasks/scripts/taskctl.mjs next, node tasks/scripts/taskctl.mjs sequence D02-P11-CODE_REVIEW, then read-only node tasks/scripts/taskctl.mjs precheck D02-P11-CODE_REVIEW.
3. Create/resume the phase branch only from the synchronized delivery branch:

   ```bash
   if git show-ref --verify --quiet refs/heads/feat_delivery02_phase_11; then
     git switch feat_delivery02_phase_11
   else
     git switch delivery_02_customer_application
     git pull --ff-only origin delivery_02_customer_application
     git switch -c feat_delivery02_phase_11
   fi
   ```

4. Do not create or switch to a task-specific child branch. Work directly on feat_delivery02_phase_11.
5. Run node tasks/scripts/taskctl.mjs check D02-P11-CODE_REVIEW, then node tasks/scripts/taskctl.mjs start D02-P11-CODE_REVIEW --owner "<name>" --opt-in theme.

## Business-visible outcome

The optional Customer multi-theme capability is isolated, auditable and safe to merge independently.

## In scope

- Review only delivery_02_customer_application...feat_delivery02_phase_11 and the completed theme evidence.

## Explicitly excluded

- Business feature changes, API contracts, POC changes, app-local visual literals and feature-specific theme forks.

## Architectural boundaries and owned paths

- Use the existing shared theme registry/provider and Customer theme configuration only.
- Feature components consume semantic roles through shared UI primitives.

## Contract and incremental mock work

No Mock API or OpenAPI change is owned.

### Frontend API integration

Theme selection must not alter generated-client calls, mock fixtures or server authorization.

## Implementation and UX requirements

- Read and follow COMMON_FRONTEND_RULES.md.
- Verify keyboard focus, contrast, zoom, reduced motion, responsive layout and PWA cache safety.

## AI code review before tests

Review only this task-owned diff against CODE_REVIEW_RULES.md, fix every finding and record **Result: PASS** before tests.

## Automated tests to add

- Add only theme-provider, fallback and Customer visual-parity tests required by this task.

## Validation commands

- git diff --check delivery_02_customer_application...feat_delivery02_phase_11
- Run the optional-theme focused suite in D02_TEST_MATRIX.md headlessly and in parallel.
- node tasks/scripts/taskctl.mjs validate

## Acceptance criteria

- Both themes preserve Customer behavior, accessibility and responsive layout.
- carchief remains default; no feature fork or local visual literal is introduced.

## Phase branch and PR handoff

The human owner must create a PR with base `delivery_02_customer_application`. Record the AI review and run node tasks/scripts/taskctl.mjs submit D02-P11-CODE_REVIEW. A tech lead then runs node tasks/scripts/taskctl.mjs approve D02-P11-CODE_REVIEW --reviewer "<name>". Do not commit, push, create a PR, merge, rewrite history or self-approve.

## Completion, handoff and tracker update

1. Update tasks/execution_logs/D02-P11-CODE_REVIEW.md with completed work, review, tests and blockers.
2. Submit after AI PASS and focused-suite evidence; tech-lead approval completes this task.

## Required final response

### Completed work
<concise list, or "No implementation started">

### AI code review
<rules, findings/fixes and PASS or FAIL>

### Tests executed
<commands and results>

### Tracker and handoff
<log and resulting status>

### Decisions or deviations
<None or exact assumption reference>

### Blockers
None
