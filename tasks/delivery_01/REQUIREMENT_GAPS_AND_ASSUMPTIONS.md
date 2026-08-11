# Delivery 01 Requirement Gaps and Assumptions

This is the authoritative non-blocking requirement-gap register for the Public Website. It prevents an unanswered business question from stopping Phases 1.5–1.9 while preserving an auditable record for Phase 1.10.

## Operating rule

1. Apply an approved requirement or business decision when it exists.
2. Otherwise use the smallest safe, conventional MVP default and record it below before implementation completes.
3. If no safe default is possible, omit only the uncertain capability and present an honest unavailable state where the UI needs one. Record it as `SKIPPED` and continue the task.
4. Requirement uncertainty alone is never a `taskctl` blocker in Delivery 01 Phases 1.5–1.9. Dependency, clean-tree, build/test, security, authorization, data-isolation and required-infrastructure failures remain blockers.
5. Do not use a default to claim a live external capability, and never use one to invent a business-owned financial figure. A shipping rate, freight formula, price, discount, insurance basis or currency conversion is owned by Finance; absent an approved rule it is `SKIPPED` with an honest unavailable state, never `ASSUMED` (RULE-09, RULE-10).

## Statuses

- `ASSUMED` — safe MVP default implemented; review in Phase 1.10.
- `SKIPPED` — unsafe or insufficiently defined capability deliberately omitted; review in Phase 1.10.
- `CONFIRMED` — business authority approved the implemented behaviour.
- `SUPERSEDED` — replaced by a later approved rule or contract.

## Register

| ID | Status | Affected task / requirement | Date | Safe MVP default or skipped capability | Rationale and mock/API impact | Tests | Risk | Phase 1.10 outcome |
|---|---|---|---|---|---|---|---|---|
| D01-ASM-001 | SKIPPED | D01-P05-G001, T001, T002, T003, T004; PUB-12, RULE-09, RULE-10 | 2026-08-11 | Implement destinations, ports, rate records, effective-date and no-rate/stale-rate handling, the estimate request/response contract and the estimate UI. Do **not** implement any cubic-volume, freight, city-delivery, insurance or discount formula. Every destination returns a deterministic `estimate unavailable — pending confirmed rate` result until the rule is approved. | `DEC-PUB-FREIGHT-MODEL` and `DEC-PUB-CITY-DELIVERY` are `OPEN`; a shipping rate is a Finance-owned financial figure that must never be inferred from the POC or legacy site (operating rule 5). The service exposes the unavailable outcome as a first-class contract state, so no fabricated total reaches the browser and no calculation authority moves client-side. | The no-rate/unavailable contract state, the honest UI unavailable state, and the destinations/ports catalog. Explicitly **no** worked-example total assertions until the decision resolves. | None to correctness or finance: the system makes no monetary claim. Product risk is that PUB-12's priced estimate is not demonstrable until the decision lands. | Reconcile when `DEC-PUB-FREIGHT-MODEL` / `DEC-PUB-CITY-DELIVERY` resolve. The approved formula does not need to wait for Phase 1.10: reopen `D01-P05-T002` as soon as the decision is `RESOLVED` and take its resolved branch. |

## How a task updates this register

Before `taskctl complete`, append or update one row when the task introduces an assumption or skips an uncertain feature. Include the task ID, exact requirement gap, chosen safe baseline or omission, mock/API effect and test evidence. Also add the row ID to the task execution log under **Decisions and deviations**. Do not change a row to `CONFIRMED` without named business-authority evidence.

Phase 1.10 reviews every row and either records the approved adjustment, confirms the baseline for MVP, or keeps the feature explicitly skipped with a management release exception.

A `SKIPPED` financial rule does not have to wait for Phase 1.10. When its decision is approved, reopen the owning task with `taskctl reopen`, implement the approved rule with its worked examples, and update this row to `CONFIRMED` or `SUPERSEDED`. Phase 1.10 is the backstop that guarantees every row is reviewed, not the earliest opportunity to close one.
