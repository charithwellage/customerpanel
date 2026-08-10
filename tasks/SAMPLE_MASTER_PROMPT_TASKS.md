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

For any UI task, also read `DEVELOPER_USER_GUIDE.md` and the theme section of `FRONT_END_ARCHITECTURE.md`. Use `packages/theme` and `packages/ui`, semantic tokens, reusable feature packages, and test both `carchief` and `ocean` at phone, tablet and desktop widths. Do not add page-local color/font/spacing values or duplicate shared vehicle/search/detail components.

Use the exact final-response headings required by the task file.
```

The task file is the detailed source of truth. This prompt only provides the common startup context and token-saving guidance; do not duplicate the full task instructions here.
