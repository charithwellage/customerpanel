# CarChief Infrastructure-Check Master Prompt

Use this prompt for a Phase 0 infrastructure task under `tasks/infra_check/`. Replace `INF-P00-TASK` with the exact task ID, for example `INF-P00-T001` or `INF-P00-T006`.

```text
Execute infrastructure task INF-P00-TASK from its task file.

Read only, in this order:
1. tasks/README.md
2. tasks/TASK_EXECUTION_TRACKER.md
3. The latest applicable phase summary, if the task names one
4. tasks/infra_check/INF-P00-TASK.md
5. Only the documents, configuration files, evidence and commands explicitly named by that task

The infrastructure task file is the source of truth. Do not scan the entire repository, unrelated application modules, or POC source unless the task explicitly names a path. Do not copy POC code into production.

This is a Phase 0 verification task. Remain on the current approved clean baseline branch. Do not create or switch to a phase branch or task branch.

Before any command that could change branches, install files, task status, logs or the tracker, run exactly:

git status --porcelain=v1 --untracked-files=all

If it prints anything, stop immediately. Do not run taskctl start, taskctl block, install commands, branch commands, or write any file. Report exactly:

Uncommitted changes detected. Commit the changes first, then rerun this task.
No implementation started.

If the tree is clean, run the task’s read-only preflight commands exactly. At minimum run:

node tasks/scripts/taskctl.mjs next
node tasks/scripts/taskctl.mjs sequence INF-P00-TASK
node tasks/scripts/taskctl.mjs precheck INF-P00-TASK
node tasks/scripts/taskctl.mjs check INF-P00-TASK

Confirm that the task is the current execution frontier or an explicitly permitted task according to the tracker. If an earlier task is incomplete, a dependency is not COMPLETE, a decision is unresolved, the branch is wrong, or a baseline command fails, do not continue. Record the exact blocker using the task’s prescribed procedure, report `No implementation started`, and stop.

Before claiming the task, report `Blockers: None`, then run:

node tasks/scripts/taskctl.mjs start INF-P00-TASK --owner "<developer-or-agent-name>"

Follow only the validation and evidence collection steps in the task file. Phase 0 tasks are read-only with respect to product code and POC files. Do not modify `.tsx`, `.ts`, CSS, application configuration, Docker application files, lockfiles, Firebase/Supabase settings or POC files unless the task explicitly permits a safe project-tooling change. Never print secrets, API keys, passwords, tokens or connection strings; record only that sensitive configuration exists and needs review.

For tooling-install tasks, install only project-local dependencies or browser binaries explicitly allowed by the task. Do not perform global installs. Do not modify user-level Codex, Antigravity, Claude or other AI-client configuration without explicit user permission. If the active AI client cannot be detected, ask the user which client is active before changing client configuration. Explain when a client restart/reload is required.

If the task checks Playwright MCP, distinguish it from Playwright Test. Playwright Test alone does not prove MCP availability. Record the active AI client, server version, local target URL, navigation, accessibility snapshot, resize, interaction, console, network and screenshot results. If MCP tools are not exposed to the active agent, mark the task BLOCKED; do not claim completion by substituting ordinary Playwright tests.

Update only the task’s permitted execution log, tracker and phase-summary records. Do not commit, push, create a PR, merge, stash, discard or self-approve. If the task is a self-AI task, complete it only through the task’s documented `taskctl complete` command after all required evidence is recorded. If it is a manual phase-review task, use its submit/tech-lead handoff instead.

Use the exact final-response headings required by the task file. Always report:
- commands and versions checked;
- evidence and result for each required check;
- files changed, if any;
- execution log and tracker status;
- decisions or deviations;
- blockers.

When unblocked, explicitly state `Blockers: None`. When blocked, state the exact blocker and `No implementation started`.
```

This prompt is intentionally narrower than `SAMPLE_MASTER_PROMPT_TASKS.md`: it emphasizes branch-neutral, read-only verification, safe tooling provisioning and client-permission boundaries. The infrastructure task remains authoritative for its exact commands and completion rules.
