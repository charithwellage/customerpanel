# Phase 1.10 Context Pack — Assumption reconciliation and MVP closure

Read this file first. Phase 1.10 closes out Delivery 01 by reconciling every recorded requirement gap. It mirrors Delivery 02's Phase 2.10.

## 0. What this phase is for

Phases 1.5–1.9 are allowed to proceed past an unanswered business question by recording a row in [`../REQUIREMENT_GAPS_AND_ASSUMPTIONS.md`](../REQUIREMENT_GAPS_AND_ASSUMPTIONS.md) — a safe MVP default (`ASSUMED`) or an honest omission (`SKIPPED`). That keeps delivery moving without inventing business rules, but it accumulates decisions the business still owes.

This phase is the backstop that guarantees every one of those rows is reviewed before the Public Website is declared done. It is **not** the earliest opportunity to close a row: when a decision resolves mid-delivery, reopen the owning task with `taskctl reopen` and implement it there. Phase 1.10 exists so nothing is forgotten, not so everything waits.

## 1. Position in the sequence

Phase 1.10 sits between Phase 1.9 (`execution_order` 60) and Delivery 02's first task (61), at orders 60.1–60.4. Because `taskctl` resolves the execution frontier purely by lowest `execution_order`, Phase 1.10 gates the start of Delivery 02 without any change to Delivery 02's own task files.

Phase 1.9 remains the alternate-theme parity gate and the point at which the Public delivery is functionally accepted. Phase 1.10 adds a documentation-and-adjustment pass on top, plus targeted re-verification of anything it changes.

## 2. Tasks

| Task | Purpose | Product code |
|---|---|---|
| `D01-P10-T001` | Reconcile every register row against the task logs; produce the business-review checklist and the adjustment-candidate list | Forbidden |
| `D01-P10-T002` | Implement only the approved adjustments; update the affected rows | Allowed |
| `D01-P10-T003` | Re-verify `ocean`/`carchief` parity for changed screens; confirm the register matches shipped behaviour | Allowed (fixes only) |
| `D01-P10-CODE_REVIEW` | Phase PR review and tech-lead approval | Forbidden |

Each of `T001`–`T003` must record two evidence markers in its execution log — `Requirement-gap register:` and `Phase 1.10 disposition:` — which `taskctl complete` enforces.

## 3. The completion rule that matters most

**A phase with no approved adjustments still completes.** If the business has not resolved anything by the time this phase runs, `T001` records that truthfully, `T002` verifies the unresolved rows still behave as documented and changes no product code, and `T003` confirms the register matches reality. The MVP ships with an honest, auditable list of what is assumed and what is deliberately unavailable.

What must never happen is closing a row by inventing the answer. A row is only `CONFIRMED` with a named business authority and date.

## 4. Known open items entering this phase

| Row | Status | What it needs |
|---|---|---|
| `D01-ASM-001` | SKIPPED | `DEC-PUB-FREIGHT-MODEL` and `DEC-PUB-CITY-DELIVERY`: the cubic-volume formula and units, rate selection and effective date, currency and rounding, insurance/discount and calculation order, city-delivery disposition, and at least two worked examples usable as test fixtures. Until then the freight estimate renders an honest `estimate unavailable — pending confirmed rate` state. |

Check the register at the start of the phase; later phases may have added rows.

## 5. Boundaries

- Never invent a business rule, financial figure, rate, currency conversion or rounding rule, and never present one as indicative (RULE-09, RULE-10, register operating rule 5).
- The authoritative calculation stays server-side; the browser renders returned line items and never derives a total.
- Features never import `api-client/generated/**` or `http.ts`; routes never import services directly; `packages/ui` never imports a service. `corepack pnpm test:boundaries` enforces this.
- Do not modify `POC/**`; `git diff -- POC` must stay empty.
- Agents never commit, push, create PRs, merge, rewrite history or self-approve.
