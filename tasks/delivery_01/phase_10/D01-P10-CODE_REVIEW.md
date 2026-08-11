---
task_id: "D01-P10-CODE_REVIEW"
title: "Phase 1.10 PR code review and tech-lead approval"
delivery: "Delivery 01 — Public Website"
phase: "Phase 1.10 — Assumption reconciliation and MVP closure"
execution_order: 60.4
estimate: "0.25 day"
model_tier: "FRONTIER"
parallel_group: "D01-P10-REVIEW"
dependencies: ["D01-P10-T003"]
decision_gates: []
phase_branch: "feat_delivery01_phase_10"
task_branch: "feat_delivery01_phase_10"
product_source_mutation: "forbidden"
review_mode: "phase_manual"
ui_scope: "none"
ui_validation: "not_applicable"
---

# D01-P10-CODE_REVIEW — Phase 1.10 PR code review and tech-lead approval

## Agent assignment

- Recommended tier: **FRONTIER** for the final Public assumption and PR review.
- Work on `feat_delivery01_phase_10`; do not modify product code or create a child branch.

## Authority and context to read

- [CODE_REVIEW_RULES.md](../../CODE_REVIEW_RULES.md) and [COMMON_FRONTEND_RULES.md](../../COMMON_FRONTEND_RULES.md).
- [REQUIREMENT_GAPS_AND_ASSUMPTIONS.md](../REQUIREMENT_GAPS_AND_ASSUMPTIONS.md), the completed Phase 1.10 task files and logs, and the Delivery 01 phase summaries.
- [`../../DECISION_REGISTER.md`](../../DECISION_REGISTER.md) for the named authority behind any row marked `CONFIRMED`.
- Only requirement, architecture and evidence paths explicitly named by those tasks.

## Requirements and rules

Verify that every unresolved requirement is a transparent `ASSUMED` or `SKIPPED` MVP item, not an undisclosed feature gap, a fabricated value or a false capability claim. Review only `delivery_01_public_website...feat_delivery01_phase_10`.

Cross-system rules: `RULE-09`, `RULE-10`.

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
2. Run `node tasks/scripts/taskctl.mjs next`, `node tasks/scripts/taskctl.mjs sequence D01-P10-CODE_REVIEW`, then read-only `node tasks/scripts/taskctl.mjs precheck D01-P10-CODE_REVIEW`.
3. Create/resume the phase branch only from the synchronized delivery branch:

   ```bash
   if git show-ref --verify --quiet refs/heads/feat_delivery01_phase_10; then
     git switch feat_delivery01_phase_10
   else
     git switch delivery_01_public_website
     git pull --ff-only origin delivery_01_public_website
     git switch -c feat_delivery01_phase_10
   fi
   ```

4. Do not create or switch to a task-specific child branch. Work directly on `feat_delivery01_phase_10`.
5. Run `node tasks/scripts/taskctl.mjs check D01-P10-CODE_REVIEW`, then baseline checks. If they pass, report **Blockers: None** and run `node tasks/scripts/taskctl.mjs start D01-P10-CODE_REVIEW --owner "<name>"`.
6. The human owner must commit phase work and create a PR with base `delivery_01_public_website` before review.

## Business-visible outcome

A tech lead receives a final Public MVP PR review with transparent assumptions and release exceptions.

## In scope

- Review only `delivery_01_public_website...feat_delivery01_phase_10`.
- Apply the shared review rules plus register traceability: every row's status matches shipped behaviour, every `CONFIRMED` row cites a named authority and date, and every `ASSUMED`/`SKIPPED` row has an honest state in the product.
- Verify no fabricated monetary value, placeholder rate or "indicative" total was introduced for a rule that is still unapproved (RULE-09, RULE-10, register operating rule 5).
- Verify theme-parity re-verification evidence for every screen Phase 1.10 changed.
- Record blocking defects and reopen their responsible implementation task; do not fix product code here.

## Explicitly excluded

- Product changes, new business rules, live integrations, commits, pushes, PR creation/merge or self-approval.
- Marking a register row `CONFIRMED` on the business's behalf.

## Architectural boundaries and owned paths

- Own `tasks/execution_logs/D01-P10-CODE_REVIEW.md` only.
- Do not modify product source, `POC/**`, requirement or architecture documents, or another task's owned path.

## Contract and incremental mock work

No contract or Mock API change is owned. A contract defect is reported as a blocking finding against its owning task.

## Implementation and UX requirements

No implementation is owned. Assess the delivered UX evidence against the shared rules rather than re-running the phase's work.

## AI code review before tests

Record the phase-diff review in `tasks/execution_logs/D01-P10-CODE_REVIEW.md` using the rules above, then run the validation commands. Prefer [SAMPLE_MASTER_PROMPT_PR_REVIEW.md](../../SAMPLE_MASTER_PROMPT_PR_REVIEW.md) for this review.

## Automated tests to add

None. This task adds no tests; it verifies that the phase's own recorded evidence is present, internally consistent and truthful.

## Validation commands

- `node tasks/scripts/taskctl.mjs validate`
- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm -r build`
- `git diff --check delivery_01_public_website...feat_delivery01_phase_10`
- `git diff delivery_01_public_website...feat_delivery01_phase_10 -- POC` (must be empty)

Root lint, TypeScript typecheck and recursive workspace builds pass with no compiler or build errors.

## Acceptance criteria

- The phase diff was reviewed against the named range and the shared review rules.
- Every register row is traceable, truthful and matches shipped behaviour.
- Blocking findings are recorded and their responsible tasks reopened.
- The execution log records the AI review result before `submit`.

## Phase branch and PR handoff

After approval, the human owner may merge the PR into `delivery_01_public_website`. Do not commit, push, create a PR, merge, rewrite history or self-approve.

## Completion, handoff and tracker update

1. Record the review in `tasks/execution_logs/D01-P10-CODE_REVIEW.md`.
2. Run `node tasks/scripts/taskctl.mjs submit D01-P10-CODE_REVIEW`, then wait for the tech lead to run `node tasks/scripts/taskctl.mjs approve D01-P10-CODE_REVIEW --reviewer "<name>"` after manual PR review.
3. Do not self-approve.

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
<register IDs and disposition>

### Blockers
None
