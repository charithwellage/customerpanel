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
6. tasks/TASK_EXECUTION_PROTOCOL.md
7. tasks/DELIVERY-NN/PHASE-NN/PHASE-REVIEW-TASK-ID.md
8. tasks/DELIVERY-NN/PHASE-NN/CONTEXT.md — the phase context pack, where one exists
9. Only the completed task files, execution logs, requirements, architecture sections, evidence and POC paths explicitly named by that phase-review task.

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

For every completed task marked `ui_validation: "playwright_mcp"`, verify its execution log proves a fresh runtime was built/recreated from the task's current worktree before browser validation. The evidence must identify the build/start commands, runtime profile, target URL, runtime process/container identity, health/readiness results, the default `carchief` theme, the phone/tablet/desktop viewports covered by the automated Playwright projects, console/network result, and both MCP and automated Playwright PASS outcomes. Treat stale-image/unknown-server evidence, missing API readiness evidence, or browser tests aimed at a different target as a blocking finding; reopen the responsible task rather than approving the phase.

Alternate-theme (`ocean`) evidence is not expected per task: it is verified once for the whole Public Website in Phase 1.9. The Phase 1.9 review is the exception — there, evidence for both themes is required, with the served `data-theme` value confirmed for each.

## Complete the whole review before stopping

**Never stop at the first defect.** Work the entire checklist to the end and catalogue every finding, then act on all of them once. A review that reopens one task and stops forces the whole cycle to repeat per defect: Phase 1.7 took seven review passes and six fix passes (~1.6M tokens, ~95 minutes) to surface seven defects that one thorough pass would have found together.

Run the checks in this order so the cheap ones fail fast and the expensive ones run once:

1. **Deterministic gate** — `node tasks/scripts/taskctl.mjs validate`, `corepack pnpm quality`, `corepack pnpm -r build`, `corepack pnpm test`, `git diff --check <range>`, `git diff <range> -- POC`. Record each result; do not abort on the first failure, collect them.
2. **Static sweep** of the diff against `CODE_REVIEW_RULES.md` and `COMMON_FRONTEND_RULES.md`.
3. **One runtime build**, reused for everything that follows.
4. **The full Playwright suite** (see below) against that runtime.
5. **MCP inspection** last, since it is the most expensive step.

Only genuinely unavailable infrastructure — cannot build, cannot start a runtime — justifies aborting early. Report that as a blocker.

## Sweep systematically, not opportunistically

For any defect class, examine **every** place it could occur in the diff, not the first place you find it. Phase 1.7 spent three separate review-and-fix cycles on one class of defect (fabricated business content) because each pass checked only the area it happened to look at: branch fixtures, then auction/shipping page copy, then FAQ and contact details. One systematic sweep across all seed data and all page copy would have found all three together.

Apply this in particular to:

- **Invented content** — statistics, prices, dates, schedules, regulations, certifications, named people, addresses and phone numbers. Sweep all fixtures *and* all page-level fallback copy; the same fabricated value is often duplicated in both, and fixing only one leaves the rendered page wrong.
- **Evidence quality** — check every task declaring `ui_validation: "playwright_mcp"`, not a sample.
- **Behaviour removal** — a route rewritten wholesale may have dropped capability delivered in an earlier phase. The full suite is what catches this.

## The full suite is the gate

Run the whole Playwright suite across all three viewport projects against the recorded target:

PLAYWRIGHT_BASE_URL=<recorded-target-url> corepack pnpm exec playwright test --project=chromium --project=mobile-chromium --project=tablet-chromium

A spec-scoped run never satisfies this gate. Phase 1.7's most serious defect — a deleted quotation form that broke 21 tests — survived six review passes because every pass ran one narrow spec. Record the outcome in the review log as:

Full suite result: <passed>/<total> passed across chromium, mobile-chromium, tablet-chromium

`taskctl submit` requires that line.

## Record findings, then batch the reopens

For each finding, record: severity (blocking or non-blocking), file/path and evidence, violated rule or acceptance criterion, responsible implementation task, required correction.

Write the findings into `tasks/execution_logs/PHASE-REVIEW-TASK-ID.md` under a `## Findings` section, as a numbered table, **on every pass — whether the review passes or fails**. A failing pass that records nothing leaves the next reviewer to rediscover everything from scratch, and scatters the phase's history across the implementation logs instead of its own.

| # | Severity | File:line | Rule / criterion | Responsible task | Required correction |
|---|---|---|---|---|---|

Do not fix product code in this review task. Once the catalogue is complete, reopen **every** responsible task in one batch — `taskctl reopen` may be called as many times as there are responsible tasks:

node tasks/scripts/taskctl.mjs reopen RESPONSIBLE-TASK-ID --reason "Finding N — <exact finding>; see ## Findings in tasks/execution_logs/PHASE-REVIEW-TASK-ID.md"

Then stop and report:

Blocking findings identified: <count>. Responsible tasks reopened: <ids>.
No implementation started.

If nothing blocking was found, record `## Findings` (with `None.` or the non-blocking list), the exact comparison range, files reviewed, rules checked, remaining concerns, test evidence including the full-suite line, and:

Result: PASS

Run the phase review validation commands listed in the task file, plus the deterministic gate and full suite above, whether or not the task file happens to name them. Do not invent missing tests or business rules.

After the AI review passes, run:

node tasks/scripts/taskctl.mjs submit PHASE-REVIEW-TASK-ID

This moves the phase review to IN_REVIEW. Do not run approve yourself. Do not commit, push, create, merge or self-approve a PR.

The human tech lead must manually review the PR and, if satisfied, run:

node tasks/scripts/taskctl.mjs approve PHASE-REVIEW-TASK-ID --reviewer "Tech Lead Name"

Use the exact final-response headings required by the phase-review task. Always state the comparison range, review result, tests, execution-log/tracker status, PR/tech-lead handoff and blockers.
```

This prompt is for Delivery 01 and Delivery 02 `phase_manual` review tasks only. For implementation tasks, use `SAMPLE_MASTER_PROMPT_TASKS.md`.
