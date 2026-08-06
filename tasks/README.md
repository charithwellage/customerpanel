# CarChief AI-Executable Task System

This directory coordinates read-only infrastructure verification and Delivery 01, the Public Website. It deliberately contains no Customer Application, Salesperson Application or full-SEO implementation tasks. Those are generated only after Public Website acceptance.

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
2. Select a `READY` task from `EXECUTION_ORDER.md`; for parallel work, coordinate the named lane and owned paths.
3. Read that single task file and only its named evidence/context.
4. Before doing anything else, run `git status --porcelain=v1 --untracked-files=all`. If it prints anything, stop and ask the user to commit the changes first. Do not change branches or task state.
5. Run the read-only `node tasks/scripts/taskctl.mjs precheck <ID>`.
6. For a Public Website task, create/resume the phase branch and child task branch exactly as documented in that task. Phase 0 is branch-neutral.
7. Run `node tasks/scripts/taskctl.mjs check <ID>`, report `Blockers: None`, then run `start` with an owner.
8. Implement exactly the stated scope and its missing feature tests.
9. Update the unique execution log, run `submit`, obtain independent review and run `approve`.
10. At phase acceptance, update the phase summary; after merges, run `render` instead of resolving tracker rows manually.

Phase 0 may change only task logs, summaries and the generated tracker. It must not change application source or configuration.

## Branch convention

- Phase 0 is branch-neutral and runs on the approved clean baseline branch.
- Delivery integration branch: `delivery/01-public`.
- Public phase branches: `feat_delivery01_phase_01` through `feat_delivery01_phase_08`.
- Short-lived `task/...` branches remain the unit of parallel implementation and independent review.
- A phase branch is created only from the latest local `delivery/01-public` after `git pull --ff-only origin delivery/01-public` succeeds.
- After phase acceptance, merge approved task branches into the phase branch, commit its tracker/summary, and create a PR from the phase branch into `delivery/01-public`. Never merge the PR automatically without explicit authorization.

After Phase 0 records and this task system are committed on `planning`, create the one-time delivery branch from that baseline:

```bash
git switch planning
git status --porcelain=v1 --untracked-files=all
git switch -c delivery/01-public
```

Publishing the delivery branch is an explicitly authorized human action. If `delivery/01-public` already exists, do not recreate it.

## Commands

`node tasks/scripts/taskctl.mjs validate` validates 42 task/gate files, metadata, decisions and the dependency DAG.

`node tasks/scripts/taskctl.mjs precheck <ID>` performs a read-only clean-tree, prerequisite, decision and delivery-branch check before any branch operation.

`node tasks/scripts/taskctl.mjs check <ID>` repeats the clean-tree/prerequisite checks and validates the current phase or child branch.

`node tasks/scripts/taskctl.mjs start <ID> --owner "Name"`, `block <ID> --reason "Reason"`, `submit <ID>`, `approve <ID> --reviewer "Name"`, and `render` maintain durable handoff state.

## Branches and review

Use `delivery/01-public`, then `feat_delivery01_phase_NN` and short-lived child task branches. Parallel children start from the same phase branch, own non-overlapping paths and merge back only after independent approval. Agents may create task-ID local commits when authorized; they do not push, merge, rewrite history or self-approve without explicit authority.
