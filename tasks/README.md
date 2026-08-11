# CarChief AI-Executable Task System

This directory coordinates read-only infrastructure verification, Delivery 01 Public Website and Delivery 02 Customer Application. It deliberately contains no Salesperson implementation tasks. Complete public SEO is accepted inside Delivery 01 Phase 1.8; Delivery 02 remains blocked until that Public review is complete and merged.

Delivery 02 requirement gaps are non-blocking in Phases 2.1–2.9. Agents record a safe MVP default or an isolated skipped capability in [`delivery_02/REQUIREMENT_GAPS_AND_ASSUMPTIONS.md`](delivery_02/REQUIREMENT_GAPS_AND_ASSUMPTIONS.md), then reconcile it in Phase 2.10. This never permits invented business rules, unsafe security/finance behaviour or false external-integration claims.

The BA workflow reconciliation backlog is in `tasks/workflow/`. It is decision-gated and supplements the future Customer/Salesperson task sets; it must not be started while the workflow decisions remain open.

## Authority order

1. `REQUIREMENT.md` — business behavior.
2. `FRONT_END_ARCHITECTURE.md` — implementation boundaries.
3. `docs/CarChief-Frontend-Implementation-plan.md` — scope, phases and estimates.
4. `docs/CarChief-Frontend-Implementation-Roadmap.md` — business outcomes and demos.
5. Risks and decision records.
6. Runtime evidence, screenshots and gap reports — POC evidence only.
7. `POC/**` — conceptual reference only, never production code to copy.
8. `docs/old_docs_v1/**` — historical only.

## Starting or continuing work

1. Read `TASK_EXECUTION_TRACKER.md` and the latest applicable phase summary.
2. Run `node tasks/scripts/taskctl.mjs next`, then select the execution-frontier task from `EXECUTION_ORDER.md`. Work is sequential by default; an optional same-`parallel_group` task is available only after the first task in that group is active.
3. Read that single task file and only its named evidence/context. For Delivery 02 also read `delivery_02/REQUIREMENT_GAPS_AND_ASSUMPTIONS.md`.
4. Before doing anything else, run `git status --porcelain=v1 --untracked-files=all`. If it prints anything, stop and ask the user to commit the changes first. Do not change branches or task state.
5. Run the read-only `node tasks/scripts/taskctl.mjs precheck <ID>`.
6. For an application task, create/resume its phase branch exactly as documented. Delivery 01 phases derive from `delivery_01_public_website`; Delivery 02 phases derive from `delivery_02_customer_application`. Do not create a child task branch. Phase 0 is branch-neutral.
7. Run `node tasks/scripts/taskctl.mjs check <ID>`, report `Blockers: None`, then run `start` with an owner.
8. Implement exactly the stated scope and its missing feature tests. For a Delivery 02 requirement gap, record a safe MVP default or skip only the unsafe capability; do not use `taskctl block` for requirement ambiguity alone.
9. For a frontend task, read `COMMON_FRONTEND_RULES.md` before coding. For a `self_ai` task, review the owned diff against `CODE_REVIEW_RULES.md` and fix every in-scope finding.
10. If frontmatter says `ui_validation: "playwright_mcp"`, first build/recreate a controlled runtime from the current worktree. Record the target URL, exact build/recreate command, process/container identity, and health/API readiness. Do not reuse an unknown server or image already listening on a standard port. Run the MCP browser walkthrough against that target, test both themes and phone/tablet/desktop viewports, inspect console/network behavior, fix in-scope findings, recreate the runtime after a correction, and repeat code review after any correction.
11. Run feature tests plus `corepack pnpm lint`, `corepack pnpm typecheck` and `corepack pnpm -r build`. A UI task must also record `Playwright MCP Result: PASS` and `Automated Playwright Test Result: PASS`.
12. After passing tests, run `taskctl complete <ID> --review-agent "<name>"`. Normal tasks do not require manual task-level PR review.
13. A `phase_manual` code-review task is the one human review gate: the owner creates/updates the phase PR, AI records the phase-diff review, and the tech lead runs `approve` only after manual PR review.
14. At phase acceptance, update the phase summary; after merges, run `render` instead of resolving tracker rows manually.

Agents never commit, push, create PRs, merge or rewrite history. They only implement, self-review, test, update the execution log/tracker and return the working-tree diff. The human owner performs Git review, commit, push, PR and merge actions manually.

## Choosing a master prompt

- Use [`SAMPLE_MASTER_PROMPT_INFRA_CHECK.md`](SAMPLE_MASTER_PROMPT_INFRA_CHECK.md) for branch-neutral Phase 0 tasks under `tasks/infra_check/`. It emphasizes read-only checks, safe project-local provisioning and explicit permission before changing AI-client settings.
- Use [`SAMPLE_MASTER_PROMPT_TASKS.md`](SAMPLE_MASTER_PROMPT_TASKS.md) for normal implementation tasks.
- Use [`SAMPLE_MASTER_PROMPT_PR_REVIEW.md`](SAMPLE_MASTER_PROMPT_PR_REVIEW.md) for phase-level manual PR review tasks.

The selected prompt is only common guidance. The individual task file remains authoritative for its exact commands, evidence paths, status transitions and final-response headings.

Phase 0 may change only task logs, summaries and the generated tracker inside the repository. It must not change application source or product configuration. `INF-P00-T006` may install developer-local browser/package caches and, only after explicit user approval, register Playwright MCP in the developer's user-level AI-client configuration.

## Build and container verification policy

Every Delivery 01 and Delivery 02 implementation task includes root lint, TypeScript typecheck and recursive workspace build commands. These checks are required even for a small UI task so compiler errors cannot accumulate unnoticed. A missing shared test harness or target workspace is a prerequisite failure; do not silently skip it.

Responsive behavior and reuse are mandatory task concerns: UI tasks test phone/tablet/desktop behavior, and any feature shared by Public, Customer and Salesperson applications is implemented once in a reusable `packages/` feature package. The vehicle search module is the first required example (`packages/vehicle-search`); consuming apps configure it rather than copying it.

Playwright MCP and Playwright Test have different responsibilities. MCP gives the active AI agent an interactive browser for accessibility snapshots, visual inspection, console/network diagnosis and correction loops. Playwright Test is the deterministic automated suite used locally, in Docker and in CI. A task marked `playwright_mcp` must pass both layers; one cannot substitute for the other. `INF-P00-T006` verifies the active client's tools before any such task can start.

PWA support is also a shared baseline: `packages/pwa` supplies safe install/update/connectivity primitives and each application supplies its manifest, icons and offline shell. PWA tasks must prove that sensitive data is not broadly cached and that finance, approval, allocation, document and identity mutations are blocked while offline.

Every UI task needs a fresh-runtime UI test; this is deliberately separate from the heavier phase Docker gate. A task may use a controlled local runtime or `docker-compose.frontend.yml`, but it must build/recreate the current worktree and record its exact target/provenance before MCP or Playwright starts. The phase gate remains responsible for the full container acceptance: build/start the stack, inspect `mock-api` logs and the live PostgreSQL schema, verify health/OpenAPI/reset, run container Playwright, complete the named manual supervisor smoke scenario, record evidence, and shut it down cleanly. These are the required Docker deployment gates, not the separate compiled-POC `docker-compose.poc.yml`.

Delivery 02 repeats that container gate at the last implementation task in every customer phase. It builds `customer-app`, `mock-api` and PostgreSQL, verifies health and local Swagger/OpenAPI, runs customer container Playwright and records a manual supervisor smoke scenario. Frontend code reaches the mock only by HTTP through the generated client; it never imports fixtures.

## Branch convention

- Phase 0 is branch-neutral and runs on the approved clean baseline branch.
- Delivery integration branch: `delivery_01_public_website`.
- Public phase branches: `feat_delivery01_phase_01` through `feat_delivery01_phase_08`.
- Customer integration branch: `delivery_02_customer_application`, created by a human from the fully accepted updated Public delivery branch.
- Customer phase branches: `feat_delivery02_phase_01` through `feat_delivery02_phase_10`.
- Tasks do not create child branches. Every task works directly on its phase branch, for example `feat_delivery01_phase_01`; parallel groups are coordination lanes on that same branch, not separate Git branches.
- A phase branch is created only from its latest local delivery integration branch after the task's `git pull --ff-only` succeeds.
- After phase acceptance, the human owner reviews the phase diff, commits its tracker/summary and creates a PR from the phase branch into its delivery integration branch manually. Agents do not perform these actions.

After Phase 0 records and this task system are committed on `planning`, create the one-time delivery branch from that baseline:

```bash
git switch planning
git status --porcelain=v1 --untracked-files=all
git switch -c delivery_01_public_website
```

Publishing the delivery branch is an explicitly authorized human action. If `delivery_01_public_website` already exists, do not recreate it.

## Commands

`node tasks/scripts/taskctl.mjs validate` validates 103 task/gate files, UI-validation metadata, shared-frontend-rule references, Delivery 02 assumption-register references, decisions, delivery-specific branches, requirement coverage and the dependency DAG.

`node tasks/scripts/taskctl.mjs next` reports the current execution frontier and permitted same-group parallel tasks.

`node tasks/scripts/taskctl.mjs sequence <ID>` explains whether a task is sequentially eligible or blocked by an earlier tracker task.

`node tasks/scripts/taskctl.mjs precheck <ID>` performs a read-only clean-tree, prerequisite, decision, execution-frontier and delivery-branch check before any branch operation. It blocks skipped tasks and reports the exact earlier task that must be completed.

`node tasks/scripts/taskctl.mjs check <ID>` repeats the clean-tree/prerequisite checks and validates the required phase branch.
`node tasks/scripts/taskctl.mjs check <ID>` repeats the clean-tree/prerequisite checks and validates the required phase branch.

`node tasks/scripts/taskctl.mjs start <ID> --owner "Name"`, `complete <ID> --review-agent "Name"`, `reopen <ID> --reason "Reason"`, `block <ID> --reason "Reason"`, `submit <ID>`, `approve <ID> --reviewer "Name"`, and `render` maintain durable handoff state. `submit`/`approve` are reserved for phase code-review tasks.

Run `node --test tasks/scripts/taskctl-sequence.test.mjs` to verify the current frontier report, skipped-task blocker and dependency/cycle guards.

## Branches and review

Use the delivery integration branch named in the task, then its `feat_deliveryNN_phase_NN` branch. Each task stays on the phase branch and never creates a task-specific branch. Agents do not commit, push, create PRs, merge, rewrite history or self-approve; the human owner performs Git operations manually after reviewing the diff.

## Delivery 02 start gate

The task files can be reviewed now, but implementation begins only after all of the following are true:

1. `D01-P08-CODE_REVIEW` is `COMPLETE` and the complete Public Website PR is merged.
2. A human synchronizes `delivery_01_public_website` and creates `delivery_02_customer_application` from that exact commit.
3. `D02-P01-G001` is the global execution frontier. Requirement gaps use the Delivery 02 assumption register and do not block Phases 2.1–2.9.
4. The Customer compiled/runtime scope is treated as provisional and the negative POC evidence is not copied.

After the Public PR is merged and the working tree is clean, an authorized human creates the one-time Customer integration branch manually:

```bash
git switch delivery_01_public_website
git pull --ff-only origin delivery_01_public_website
git status --porcelain=v1 --untracked-files=all
git switch -c delivery_02_customer_application
```

Any output from the status command, a failed pull or an unexpectedly existing branch is a blocker. Publishing the new branch remains a manual, explicitly authorized human action; task agents do not push it.
