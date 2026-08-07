# CarChief Sample Master Prompt

Replace `TASK-ID` with the task you want the AI agent to execute, for example `D01-P03-T002`.

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

<<<<<<< Updated upstream
Run `node tasks/scripts/taskctl.mjs next` and `node tasks/scripts/taskctl.mjs sequence TASK-ID` before branch setup. If the task is not the current execution frontier, or is not an explicitly eligible same-`parallel_group` task, stop and report the exact earlier task and `No implementation started`.

If unblocked, run the task’s `precheck`, branch setup, `check` and `start` commands. Implement only the stated scope, add the required tests, update the execution log and tracker, and follow the task’s completion workflow.
=======
If unblocked, run the task’s `precheck`, then remain on the named phase branch; do not create or switch to a task-specific child branch. Run `check` and `start`, implement only the stated scope, add the required tests, update the execution log and tracker, and follow the task’s completion workflow.
>>>>>>> Stashed changes

Do not modify POC/**, invent unresolved business rules, self-approve, push or merge without authorization.

Use the exact final-response headings required by the task file.
```

The task file is the detailed source of truth. This prompt only provides the common startup context and token-saving guidance; do not duplicate the full task instructions here.
