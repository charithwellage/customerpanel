# CarChief Sample Master Prompt

Replace `TASK-ID` with the task you want the AI agent to execute, for example `D01-P03-T002` or `D02-P04-T002`.

```text
Implement task TASK-ID from its task file.

Read:
1. tasks/README.md
2. tasks/TASK_EXECUTION_TRACKER.md
3. The latest applicable phase summary
4. tasks/**/TASK-ID.md

Use the task file as the source of truth. Read only the documents, evidence and POC paths named there. Do not scan the entire project or unrelated modules.

For a Delivery 02 task, also read `tasks/delivery_02/REQUIREMENT_GAPS_AND_ASSUMPTIONS.md`. A requirement gap does not block Phases 2.1–2.9: use an approved rule, then the documented safe MVP default, or skip only the unsafe capability with an honest unavailable state. Record the assumption or skipped feature in that register and the execution log; never invent a business rule or claim a live integration.

Follow the task’s preflight exactly. Before any branch, source or task-state change, run:

git status --porcelain=v1 --untracked-files=all

If the working tree is dirty, stop and report exactly:

Uncommitted changes detected. Commit the changes first, then rerun this task.
No implementation started.

Run `node tasks/scripts/taskctl.mjs next` and `node tasks/scripts/taskctl.mjs sequence TASK-ID` before branch setup. If the task is not the current execution frontier, or is not an explicitly eligible same-`parallel_group` task, stop and report the exact earlier task and `No implementation started`.

If unblocked, run the task’s `precheck`, then remain on the named phase branch; do not create or switch to a task-specific child branch. Run `check` and `start`, implement only the stated scope, and follow the task’s completion workflow.

For a `self_ai` task, before running tests review only the owned diff and named dependencies against `tasks/CODE_REVIEW_RULES.md`. Fix every in-scope finding and repeat until the execution-log review result is PASS. Then run all required tests and use `taskctl complete TASK-ID --review-agent "<agent-name>"`. Do not request manual task-level PR approval.

For a `phase_manual` task, review only the exact delivery-integration-to-phase range named by its task file, record the AI review, run `submit`, and wait for the tech lead to perform manual PR review and `approve` it. Prefer `tasks/SAMPLE_MASTER_PROMPT_PR_REVIEW.md` for these review tasks.

Do not modify POC/**, invent unresolved business rules, commit, push, create a pull request, merge, rewrite history or self-approve. The agent must leave implementation changes as a working-tree diff for the human owner to review and commit manually. Updating the task execution log and generated tracker is required and permitted.

For any UI task, also read `DEVELOPER_USER_GUIDE.md`, the theme section of `FRONT_END_ARCHITECTURE.md`, and `tasks/COMMON_FRONTEND_RULES.md`. The common rules are mandatory for semantic tokens, reusable packages, CSS ownership, static-inline-style restrictions, responsive/accessibility checks and UI evidence. Task-specific requirements remain authoritative.

If the task frontmatter says `ui_validation: "playwright_mcp"`, confirm `INF-P00-T006` is COMPLETE and the active agent exposes Playwright MCP browser tools. After the initial AI code review, build/recreate a controlled runtime from the current worktree; do not reuse an unknown process or Docker image already listening on the usual port. Record the target URL, exact command, runtime process/container identity, and health/API readiness. Run the task's MCP walkthrough and automated Playwright suite against that recorded URL, inspect console/network and required UI states, fix every in-scope defect, recreate/retest after corrections, and reopen another task only when its owned path is genuinely required. Do not mark the task complete without fresh-runtime, readiness, MCP and automated-test PASS evidence. Playwright Test alone does not satisfy the MCP gate.

Use the exact final-response headings required by the task file.
```

The task file is the detailed source of truth. This prompt only provides the common startup context and token-saving guidance; do not duplicate the full task instructions here.
