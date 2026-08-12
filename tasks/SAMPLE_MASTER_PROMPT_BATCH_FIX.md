# Sample master prompt — batched review-fix pass

Use this after a phase review has catalogued its findings and reopened the responsible tasks. One fix pass closes **all** findings, rather than one pass per finding.

Replace `PHASE-REVIEW-TASK-ID` and the reopened task IDs before pasting.

---

Fix every finding catalogued by PHASE-REVIEW-TASK-ID in one pass.

Read, in this order:
1. `tasks/execution_logs/PHASE-REVIEW-TASK-ID.md` — the `## Findings` table is your complete work list and the authoritative scope of this pass
2. The execution log of each reopened task, including its `## Reopened` events
3. The task file of each reopened task — its `## In scope` / `## Explicitly excluded` still bound you
4. `tasks/CODE_REVIEW_RULES.md`, `tasks/COMMON_FRONTEND_RULES.md`, `tasks/TASK_EXECUTION_PROTOCOL.md`

## Preflight

Run `git status --porcelain=v1 --untracked-files=all`. The accumulated phase diff is expected and is not a blocker; flag anything genuinely unexpected. Stay on the phase branch; create no child branch. The reopened tasks are already `IN_PROGRESS` — do **not** run `taskctl start` for them.

## Group the findings before you start

Fix by defect class, not by finding number. Findings that share a root cause must be fixed together and consistently, or the next review pass will simply rediscover the other half:

- The same invented value often appears in both a fixture and a page-level fallback. Fix both; the live route may read only one of them.
- The same class of defect usually recurs in files the review did not name. When you fix one instance, sweep for siblings across the same file type and fix those too, recording that you did.
- If a finding names a file owned by a different task, that cross-boundary edit is authorised by the review that reopened you — record it explicitly in your execution log with the justification.

## Reconcile everything your change touches

**A content or fixture change usually invalidates a test assertion somewhere else.** Before you finish, grep for every literal string, heading and value you changed, across unit tests *and* e2e specs, and update the assertions to match the corrected content without weakening what they verify.

This is not hypothetical: in Phase 1.7 a fix corrected fabricated fixture values but never re-ran the affected spec, which still asserted the old values. That broke three tests and cost an entire additional review-and-fix cycle.

## Verify with the full suite

Build one fresh runtime from the current worktree per `tasks/TASK_EXECUTION_PROTOCOL.md` §3, then run the **whole** Playwright suite — never a single spec:

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 corepack pnpm exec playwright test --project=chromium --project=mobile-chromium --project=tablet-chromium
```

Also run: `corepack pnpm test`, `corepack pnpm quality`, `corepack pnpm -r build`, `node tasks/scripts/taskctl.mjs validate`, and `git diff -- POC` (must be empty). Record the exact commands and results; claim no result you have not personally observed in this session.

Stop every runtime process you started and leave no stray artifacts (`test-results/`, `playwright-report/`, `.playwright-mcp/`, screenshots) in the working tree.

## Close out

For each reopened task, append a fix-pass section to its execution log recording: which findings it closed (by number), what changed, the cross-boundary edits and their justification, the `## AI code review` record, and the verified test results. Then run `node tasks/scripts/taskctl.mjs complete <TASK-ID> --review-agent "<agent-name>"` for each.

If a finding cannot be closed within the reopened tasks' scope — it needs a decision, a different phase, or an unresolved requirement — do not force it. Record it honestly, say so in your final response, and leave it for the human owner to route.

Do not commit, push, create a PR, merge, rewrite history or self-approve. Do not run or submit the phase review itself; that is a separate follow-up.

## Required final response

### Completed work
<findings closed, by number, and what changed for each>

### AI code review
<rules, findings/fixes and PASS or FAIL>

### Tests executed
<commands and results, including the full-suite line, all freshly verified this session>

### Tracker and handoff
<logs updated and resulting status of each reopened task>

### Decisions or deviations
<cross-boundary edits, register rows, and any finding left open with the reason>

### Blockers
None
