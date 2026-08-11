# CarChief Phase PR Review Master Prompt

Replace `PHASE-REVIEW-TASK-ID`, `DELIVERY-NN` and `PHASE-NN` with the values from the phase review task, for example Delivery 02 Phase 04 uses `D02-P04-CODE_REVIEW`, `delivery_02` and `phase_04`.

```text
Perform the phase PR review task PHASE-REVIEW-TASK-ID from its task file.

Read, in this order:
1. tasks/README.md
2. tasks/TASK_EXECUTION_TRACKER.md
3. The latest applicable phase summary
4. tasks/CODE_REVIEW_RULES.md
5. tasks/COMMON_FRONTEND_RULES.md
6. tasks/DELIVERY-NN/PHASE-NN/PHASE-REVIEW-TASK-ID.md
7. Only the completed task files, execution logs, requirements, architecture sections, evidence and POC paths explicitly named by that phase-review task.

The phase-review task is the source of truth. Do not scan the entire project or unrelated modules. Do not treat POC code as production code to copy.

Read `tasks/DEPENDENCY_INSTALLATION_POLICY.md` when evaluating build evidence. Treat cached dependency layers and reused workspace installations as expected; require a fresh package installation only when the lockfile, dependency graph or isolated build environment justifies it.

For a Delivery 02 review, also read `tasks/delivery_02/REQUIREMENT_GAPS_AND_ASSUMPTIONS.md` when named by the task. Verify that every safe MVP default or skipped feature is recorded and honestly presented; do not reopen a task merely because a documented requirement gap remains unresolved.

Follow the review task preflight exactly. Before any branch, source or task-state change, run:

git status --porcelain=v1 --untracked-files=all

If the working tree is dirty, stop and report exactly:

Uncommitted changes detected. Commit the changes first, then rerun this task.
No implementation started.

Run:

node tasks/scripts/taskctl.mjs next
node tasks/scripts/taskctl.mjs sequence PHASE-REVIEW-TASK-ID
node tasks/scripts/taskctl.mjs precheck PHASE-REVIEW-TASK-ID

Confirm that every normal task in the phase is COMPLETE and that the phase PR/diff is available. Use only the exact comparison range stated in the phase-review task. Do not infer the base branch from an older delivery.

Remain on the named phase branch. Do not create a task branch. Do not modify product code, POC/**, requirements, architecture or unrelated task files during the review.

Review the diff against every applicable rule in tasks/CODE_REVIEW_RULES.md and every phase-specific rule in the phase review task. Check architecture boundaries, reusable packages, responsive behavior, accessibility, security, API/mock separation, tests, Docker/PWA requirements and the phase acceptance criteria.

For every completed task marked `ui_validation: "playwright_mcp"`, verify its execution log proves a fresh runtime was built/recreated from the task's current worktree before browser validation. The evidence must identify the build/recreate command, target URL, runtime process/container identity, health/readiness results, both themes/viewports, console/network result and both MCP and automated Playwright PASS outcomes. Treat stale-image/unknown-server evidence, missing API readiness evidence, or browser tests aimed at a different target as a blocking finding; reopen the responsible task rather than approving the phase.

For each finding, record:
- severity (blocking or non-blocking)
- file/path and evidence
- violated rule or acceptance criterion
- responsible implementation task
- required correction

Do not fix product code in this review task. For a blocking defect, run:

node tasks/scripts/taskctl.mjs reopen RESPONSIBLE-TASK-ID --reason "Exact finding"

Then stop and report:

Blocking finding identified. Responsible task reopened.
No implementation started.

If the review passes, record the required AI review report in:

tasks/execution_logs/PHASE-REVIEW-TASK-ID.md

The report must include the exact comparison range, files reviewed, rules checked, findings, corrections/reopened tasks, remaining concerns, test evidence and:

Result: PASS

Run the phase review validation commands listed in the task file, including lint, typecheck, recursive build, task validation, diff checks and the required phase tests. Do not invent missing tests or business rules. Report unavailable infrastructure as a blocker.

After the AI review passes, run:

node tasks/scripts/taskctl.mjs submit PHASE-REVIEW-TASK-ID

This moves the phase review to IN_REVIEW. Do not run approve yourself. Do not commit, push, create, merge or self-approve a PR.

The human tech lead must manually review the PR and, if satisfied, run:

node tasks/scripts/taskctl.mjs approve PHASE-REVIEW-TASK-ID --reviewer "Tech Lead Name"

Use the exact final-response headings required by the phase-review task. Always state the comparison range, review result, tests, execution-log/tracker status, PR/tech-lead handoff and blockers.
```

This prompt is for Delivery 01 and Delivery 02 `phase_manual` review tasks only. For implementation tasks, use `SAMPLE_MASTER_PROMPT_TASKS.md`.
