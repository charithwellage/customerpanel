# CarChief Sample Master Prompt

Replace `TASK-ID` with the task you want the AI agent to execute, for example `D01-P03-T002` or `D02-P04-T002`.

```text
Implement task TASK-ID from its task file.

Read:
1. tasks/README.md
2. tasks/TASK_EXECUTION_TRACKER.md
3. The latest applicable phase summary
4. tasks/**/TASK-ID.md
5. The CONTEXT.md in the same phase folder as the task file
6. tasks/TASK_EXECUTION_PROTOCOL.md

Use the task file as the source of truth. The phase CONTEXT.md carries the requirement text, decision dispositions, code map and file-path conventions for that phase; it replaces the per-task sweep of REQUIREMENT.md and FRONT_END_ARCHITECTURE.md. Open those larger documents only for an item the context pack marks unresolved. Read only the documents, evidence and POC paths named by the task. Do not scan the entire project or unrelated modules.

tasks/TASK_EXECUTION_PROTOCOL.md carries the shared execution mechanics: agent portability rules, preflight semantics, runtime profiles, browser-validation split, evidence block templates and the final-response contract.

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

For any UI task, `tasks/COMMON_FRONTEND_RULES.md` is mandatory: semantic tokens, reusable packages, CSS ownership, static-inline-style restrictions, responsive/accessibility checks and UI evidence. The phase CONTEXT.md summarizes the theme and boundary rules that apply; open `DEVELOPER_USER_GUIDE.md` or the theme section of `FRONT_END_ARCHITECTURE.md` only when the context pack marks an item unresolved. Task-specific requirements remain authoritative.

If the task frontmatter says `ui_validation: "playwright_mcp"`, confirm `INF-P00-T006` is COMPLETE and the active agent exposes MCP browser capabilities: navigate, accessibility snapshot, resize, console messages, network requests and screenshot. After the initial AI code review, build and start a runtime from the current worktree using a profile from `tasks/TASK_EXECUTION_PROTOCOL.md` §3 — Profile A (local, no Docker) unless the task is a container gate, which requires Profile B. Do not reuse an unknown process or Docker image already listening on the usual port. Record the exact commands, target URL, runtime process/container identity and health/API readiness.

Run one desktop MCP walkthrough of the task journey under the default `carchief` theme, inspecting required UI states, accessibility/keyboard/focus behavior, console messages and failed network requests. Viewport coverage comes from the automated Playwright projects (`chromium`, `mobile-chromium`, `tablet-chromium`) run against the same recorded URL, not from repeating the walkthrough at each size. Alternate-theme (`ocean`) parity is verified once in Phase 1.9, not per task.

Fix every in-scope defect, then repeat the AI code review and re-run the automated suite. Repeat the MCP walkthrough only when the correction changed layout, semantic tokens, CSS or markup structure, and record which applied. Reopen another task only when its owned path is genuinely required. Do not mark the task complete without fresh-runtime, readiness, MCP and automated-test PASS evidence. Playwright Test alone does not satisfy the MCP gate.

Use the exact final-response headings required by the task file.
```

The task file is the detailed source of truth. This prompt only provides the common startup context and token-saving guidance; do not duplicate the full task instructions here.

Before package setup, read `tasks/DEPENDENCY_INSTALLATION_POLICY.md`. Reuse the current frozen pnpm installation and run the offline check first. Do not delete `node_modules`, pnpm stores, Docker caches or lockfiles, or repeat a full install for each task. Use the frozen network install only when the policy permits it, and record the reason.
