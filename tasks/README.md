# CarChief AI-Executable Task System

This directory coordinates read-only infrastructure verification and Delivery 01, the Public Website. It deliberately contains no Customer Application or Salesperson implementation tasks. Complete public SEO is implemented and accepted inside Delivery 01 Phase 1.8; later application task sets are generated after Public Website acceptance.

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
3. Read that single task file and only its named evidence/context.
4. Before doing anything else, run `git status --porcelain=v1 --untracked-files=all`. If it prints anything, stop and ask the user to commit the changes first. Do not change branches or task state.
5. Run the read-only `node tasks/scripts/taskctl.mjs precheck <ID>`.
6. For a Public Website task, create/resume the phase branch exactly as documented in that task. Do not create a child task branch. Phase 0 is branch-neutral.
7. Run `node tasks/scripts/taskctl.mjs check <ID>`, report `Blockers: None`, then run `start` with an owner.
8. Implement exactly the stated scope and its missing feature tests.
9. Run the task's feature tests plus the mandatory repository checks: `corepack pnpm lint`, `corepack pnpm typecheck` and `corepack pnpm -r build`. Record exact results and any compiler/build error in the unique execution log.
10. Update the unique execution log, run `submit`, obtain independent review and run `approve`.
11. At phase acceptance, update the phase summary; after merges, run `render` instead of resolving tracker rows manually.

Phase 0 may change only task logs, summaries and the generated tracker. It must not change application source or configuration.

## Build and container verification policy

Every Delivery 01 implementation task includes root lint, TypeScript typecheck and recursive workspace build commands. These checks are required even for a small UI task so compiler errors cannot accumulate unnoticed. A missing shared test harness or target workspace is a prerequisite failure; do not silently skip it.

Responsive behavior and reuse are mandatory task concerns: UI tasks test phone/tablet/desktop behavior, and any feature shared by Public, Customer and Salesperson applications is implemented once in a reusable `packages/` feature package. The vehicle search module is the first required example (`packages/vehicle-search`); consuming apps configure it rather than copying it.

PWA support is also a shared baseline: `packages/pwa` supplies safe install/update/connectivity primitives and each application supplies its manifest, icons and offline shell. PWA tasks must prove that sensitive data is not broadly cached and that finance, approval, allocation, document and identity mutations are blocked while offline.

Container redeployment is intentionally concentrated at the infrastructure gate and phase acceptance tasks rather than repeated for every component task. `D01-P01-T010` and the final acceptance task of each phase must rebuild the target architecture stack from `docker/docker-compose.yml` plus `docker/docker-compose.dev.yml`, start it, run the container Playwright project, complete the named manual supervisor smoke scenario, record evidence, and shut it down cleanly. These are the required UI gates for the Docker deployment. They verify the target solution stack, not the separate compiled-POC `docker-compose.poc.yml`.

## Branch convention

- Phase 0 is branch-neutral and runs on the approved clean baseline branch.
- Delivery integration branch: `delivery/01-public`.
- Public phase branches: `feat_delivery01_phase_01` through `feat_delivery01_phase_08`.
- Tasks do not create child branches. Every task works directly on its phase branch, for example `feat_delivery01_phase_01`; parallel groups are coordination lanes on that same branch, not separate Git branches.
- A phase branch is created only from the latest local `delivery/01-public` after `git pull --ff-only origin delivery/01-public` succeeds.
- After phase acceptance, review approved task work on the phase branch, commit its tracker/summary, and create a PR from the phase branch into `delivery/01-public`. Never merge the PR automatically without explicit authorization.

After Phase 0 records and this task system are committed on `planning`, create the one-time delivery branch from that baseline:

```bash
git switch planning
git status --porcelain=v1 --untracked-files=all
git switch -c delivery/01-public
```

Publishing the delivery branch is an explicitly authorized human action. If `delivery/01-public` already exists, do not recreate it.

## Commands

`node tasks/scripts/taskctl.mjs validate` validates 42 task/gate files, metadata, decisions and the dependency DAG.

`node tasks/scripts/taskctl.mjs next` reports the current execution frontier and permitted same-group parallel tasks.

`node tasks/scripts/taskctl.mjs sequence <ID>` explains whether a task is sequentially eligible or blocked by an earlier tracker task.

`node tasks/scripts/taskctl.mjs precheck <ID>` performs a read-only clean-tree, prerequisite, decision, execution-frontier and delivery-branch check before any branch operation. It blocks skipped tasks and reports the exact earlier task that must be completed.

`node tasks/scripts/taskctl.mjs check <ID>` repeats the clean-tree/prerequisite checks and validates the required phase branch.

`node tasks/scripts/taskctl.mjs start <ID> --owner "Name"`, `block <ID> --reason "Reason"`, `submit <ID>`, `approve <ID> --reviewer "Name"`, and `render` maintain durable handoff state.

Run `node --test tasks/scripts/taskctl-sequence.test.mjs` to verify the current frontier report, skipped-task blocker and dependency/cycle guards.

## Branches and review

Use `delivery/01-public`, then `feat_delivery01_phase_NN`. Each task stays on the phase branch and may create a task-ID local commit when authorized; it must not create or switch to a task-specific branch. Parallel tasks require explicit coordination and non-overlapping owned paths on the same phase branch. Agents do not push, merge, rewrite history or self-approve without explicit authority.
