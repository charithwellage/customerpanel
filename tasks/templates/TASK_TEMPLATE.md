# Executable Task Template

Copy the structure of an existing generated task. Every task must include frontmatter fields for ID, order, estimate, model, parallel group, dependencies, decision gates and branches; authority/evidence; blocker preflight; outcome/scope/exclusions; owned paths; incremental API/mock work; UX/accessibility/authorization; automated tests and exact commands; acceptance; execution-log/tracker workflow; and the required final response with `Blockers: None` when unblocked.

The first preflight command must always be:

```bash
git status --porcelain=v1 --untracked-files=all
```

Any output blocks the task before all branch, source, log and tracker mutations. Public phase branches must follow `feat_delivery<two-digit-delivery>_phase_<two-digit-phase>` and be created from the updated delivery integration branch. Phase 0 tasks must use `BRANCH_NEUTRAL` for both branch fields and must not switch or create branches. Include `taskctl precheck`, conditional phase/task branch commands, final `taskctl check`, and the exact dirty-tree response from an existing task.
