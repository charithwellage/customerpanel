---
task_id: "D02-P12-CODE_REVIEW"
title: "Phase 2.12 PR code review and tech-lead approval"
delivery: "Delivery 02 — Customer Application"
phase: "Phase 2.12 — Customer self-registration and real authentication"
execution_order: 114
estimate: "0.5 days"
model_tier: "FRONTIER"
parallel_group: "D02-P12-REVIEW"
dependencies: ["D02-P12-T007"]
decision_gates: []
phase_branch: "feat_delivery02_phase_12"
task_branch: "feat_delivery02_phase_12"
product_source_mutation: "allowed"
review_mode: "phase_manual"
ui_scope: "none"
ui_validation: "not_applicable"
---

# D02-P12-CODE_REVIEW — Phase 2.12 PR code review and tech-lead approval

## Agent assignment

- Recommended tier: **FRONTIER** — the phase introduces the repository's first credential-handling code and needs a security-literate review.
- Work directly on `feat_delivery02_phase_12`; no child task branch.

## Authority and context to read

- [CONTEXT.md](CONTEXT.md) — read this phase context pack before the large requirement and architecture documents.
- `REQUIREMENT.md`, `FRONT_END_ARCHITECTURE.md` and [DELIVERY_02_COVERAGE_MATRIX.md](../DELIVERY_02_COVERAGE_MATRIX.md) rows CUST-01, CUST-03, CUST-26, CUST-27, CUST-28, CUST-29 and CUST-30.
- [COMMON_FRONTEND_RULES.md](../../COMMON_FRONTEND_RULES.md), [CODE_REVIEW_RULES.md](../../CODE_REVIEW_RULES.md) and [D02_TEST_MATRIX.md](../D02_TEST_MATRIX.md).
- [REQUIREMENT_GAPS_AND_ASSUMPTIONS.md](../REQUIREMENT_GAPS_AND_ASSUMPTIONS.md) — rows `D02-ASM-005`, `D02-ASM-006` and `D02-ASM-007`.

## Requirements and rules

**Delivery 02 execution policy:** Use only the default `carchief` theme. Run the task-owned tests and dependency-closure build named in [D02_TEST_MATRIX.md](../D02_TEST_MATRIX.md) plus the root quality gates listed under **Validation commands**. Do not edit another task's owned paths.

**Phase 2.12 identity policy.** The Mock API is the only authority for credentials and sessions. A password is never stored, logged, cached or returned in plaintext; a password hash never leaves the server. The browser never derives authorization from its own state. `DEC-CUST-IDENTITY-RECOVERY` is unchanged: AutoPulse/Keycloak still owns production identity, and this phase supplies a Keycloak-compatible mock credential path, never a claim of live identity, email delivery or MFA.

Review the phase PR diff only. The tech lead performs the single required manual code review; the AI review precedes and informs it but never substitutes for it.

## Mandatory preflight and blocker protocol

1. **Before doing anything else**, run:

   ```bash
   git status --porcelain=v1 --untracked-files=all
   ```

   If output exists, stop before branch/task-state changes and report exactly:

   ```text
   Uncommitted changes detected. Commit the changes first, then rerun this task.
   No implementation started.
   ```
2. Run `node tasks/scripts/taskctl.mjs next`, `node tasks/scripts/taskctl.mjs sequence D02-P12-CODE_REVIEW`, then read-only `node tasks/scripts/taskctl.mjs precheck D02-P12-CODE_REVIEW`.
3. Create/resume the phase branch only from the synchronized delivery branch:

   ```bash
   if git show-ref --verify --quiet refs/heads/feat_delivery02_phase_12; then
     git switch feat_delivery02_phase_12
   else
     git switch delivery_02_customer_application
     git pull --ff-only origin delivery_02_customer_application
     git switch -c feat_delivery02_phase_12
   fi
   ```

4. Do not create or switch to a task-specific child branch. Work directly on `feat_delivery02_phase_12`.
5. Run `node tasks/scripts/taskctl.mjs check D02-P12-CODE_REVIEW`, then baseline checks. If they pass, report **Blockers: None** and run `node tasks/scripts/taskctl.mjs start D02-P12-CODE_REVIEW --owner "<name>"`.
6. Requirement gaps recorded in [REQUIREMENT_GAPS_AND_ASSUMPTIONS.md](../REQUIREMENT_GAPS_AND_ASSUMPTIONS.md) are not blockers; build, test, security, credential-handling, authorization and data-isolation failures are.

## Business-visible outcome

The self-registration and authentication phase is reviewed as one auditable change set and approved before it merges.

## In scope

- Review only `delivery_02_customer_application...feat_delivery02_phase_12` and the completed-task evidence in `tasks/execution_logs/D02-P12-*.md`.
- Verify against [CODE_REVIEW_RULES.md](../../CODE_REVIEW_RULES.md) and [COMMON_FRONTEND_RULES.md](../../COMMON_FRONTEND_RULES.md), with explicit findings on:
  - password hashing, salting and the absence of any plaintext or hash in a response, a log or a cached payload;
  - account enumeration — the register, login and password-reset responses must not reveal whether an email exists;
  - authorization and customer-scope isolation for registered accounts;
  - the completeness of the demo-mode removal across both applications and the shared packages;
  - accessibility, responsive coverage and theme-token compliance on the four new or rewritten screens;
  - the layering rules enforced by `scripts/check-boundaries.mjs`.
- Confirm every assumption row raised by the phase is recorded in [REQUIREMENT_GAPS_AND_ASSUMPTIONS.md](../REQUIREMENT_GAPS_AND_ASSUMPTIONS.md).

## Explicitly excluded

- Implementing features or refactoring beyond a review finding.
- Approving the phase without the container and Playwright evidence from `D02-P12-T007`.
- Self-approval by the implementing agent.

## Architectural boundaries and owned paths

- Owned paths: `tasks/execution_logs/D02-P12-CODE_REVIEW.md` and `tasks/phase_summaries/D02-P12-SUMMARY.md`.
- A finding that requires a code change reopens the responsible task; this review does not silently edit product code.

## Contract and incremental mock work

No Mock API or OpenAPI change is owned. Verify that the committed `openapi/openapi.json`, the `openapi/generate.mjs` literal and `packages/api-client/src/generated/schema.d.ts` are consistent and that no generated file was hand-edited.

### Frontend API integration

Confirm every authentication call in the diff goes through a service and a feature hook, that no route imports a service directly, that no feature imports the generated schema, and that no `NEXT_PUBLIC_*` or `VITE_*` variable carries a secret, password or token.

## Implementation and UX requirements

- Read and follow [COMMON_FRONTEND_RULES.md](../../COMMON_FRONTEND_RULES.md).
- Verify the recorded evidence covers 390x844, 768x1024 and 1440x900, keyboard focus, contrast, reduced motion and the loading, empty, error, validation and success states on every new screen.

## AI code review before tests

Review the full `delivery_02_customer_application...feat_delivery02_phase_12` diff and every completed-task evidence block against [CODE_REVIEW_RULES.md](../../CODE_REVIEW_RULES.md). Fix or reopen every finding and record **Result: PASS** before the focused suite.

## Automated tests to add

- Add no new product tests. Re-run only the targets whose code changed after the recorded task evidence, and record `Focused suite result:` in the log.

## Validation commands

- `git diff --check delivery_02_customer_application...feat_delivery02_phase_12`
- Re-run only the suites whose code changed after the recorded task evidence.

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm -r build`
- `corepack pnpm test:boundaries`
- `node tasks/scripts/taskctl.mjs validate`
- `git diff --check`
- `git diff -- POC` (must be empty)

Root lint, TypeScript typecheck and recursive workspace builds pass with no compiler or build errors.

## Acceptance criteria

- Every finding is fixed in the responsible task or explicitly accepted with a recorded rationale.
- Credential handling, enumeration resistance and customer isolation are individually confirmed in the review record.
- The demo-mode removal is confirmed complete across `apps` and `packages`.
- `node tasks/scripts/taskctl.mjs validate` passes and the tracker renders cleanly.
- Root lint, TypeScript typecheck and recursive workspace builds pass with no compiler or build errors.

## Phase branch and PR handoff

The human owner must create a PR with base `delivery_02_customer_application` comparing `delivery_02_customer_application...feat_delivery02_phase_12`. Record the AI review and run `node tasks/scripts/taskctl.mjs submit D02-P12-CODE_REVIEW`. A tech lead then runs `node tasks/scripts/taskctl.mjs approve D02-P12-CODE_REVIEW --reviewer "<name>"`. Do not commit, push, create a PR, merge, rewrite history or self-approve.

## Completion, handoff and tracker update

1. Update `tasks/execution_logs/D02-P12-CODE_REVIEW.md` with the reviewed range, findings, focused-suite evidence and blockers.
2. Submit after AI **Result: PASS** and focused-suite evidence; tech-lead approval completes this task and the phase.
3. Produce `tasks/phase_summaries/D02-P12-SUMMARY.md` from [PHASE_SUMMARY_TEMPLATE.md](../../templates/PHASE_SUMMARY_TEMPLATE.md).
4. Do not commit, push, create a PR, merge, rewrite history or self-approve.

## Required final response

### Completed work
<concise list, or "No implementation started">

### AI code review
<rules, findings/fixes and PASS or FAIL>

### Tests executed
<commands and results>

### Tracker and handoff
<log and resulting status>

### Decisions or deviations
<None, or the exact REQUIREMENT_GAPS_AND_ASSUMPTIONS.md row ID>

### Blockers
None
