# Phase 1.5 Context Pack — Freight estimate and quotation enquiry

Read this file first. It carries the requirement text, decisions, code map and conventions the Phase 1.5 tasks need, so `REQUIREMENT.md` and `FRONT_END_ARCHITECTURE.md` only need to be opened for an item this pack marks unresolved.

## 0. Requirement gap — read before planning any work

`DEC-PUB-FREIGHT-MODEL` and `DEC-PUB-CITY-DELIVERY` are `OPEN` in [`../../DECISION_REGISTER.md`](../../DECISION_REGISTER.md). **This no longer blocks Phase 1.5.** The phase proceeds under the Delivery 01 non-blocking requirement-gap register, [`../REQUIREMENT_GAPS_AND_ASSUMPTIONS.md`](../REQUIREMENT_GAPS_AND_ASSUMPTIONS.md), row `D01-ASM-001`.

**What that row permits and forbids.** A shipping rate is a Finance-owned financial figure, so it is `SKIPPED`, never `ASSUMED` (register operating rule 5). No task in this phase may invent, infer or derive a formula from the POC or the legacy site. Everything that does not depend on the formula is built normally:

| Built now | Deferred until the decision resolves |
|---|---|
| Destinations, ports, rate records, effective dates, currencies | The cubic-volume formula and its input units |
| No-rate and stale-rate handling | Freight, city-delivery, insurance and discount amounts |
| The estimate request/response contract and its line-item structure | Rate selection and the rounding rule |
| A first-class `estimate unavailable — pending confirmed rate` state, server and UI | Any computed monetary total |
| The full quotation-enquiry flow (`PUB-13`, `PUB-15`) and its confirmation | `PUB-12`'s priced estimate |

When the business approval arrives it must supply, in writing, from the named Finance/logistics owner: the cubic-volume formula and input units; rate selection, effective date and no-rate/stale-rate behaviour; currency and the rounding rule at each step and on the total; whether insurance and discount apply and the exact calculation order; whether city delivery is offered, its lookup inputs, how it combines with freight and its no-rate behaviour; and at least two worked examples usable directly as test fixtures.

That approval does **not** have to wait for Phase 1.10. Reopen `D01-P05-T002` with `taskctl reopen` the moment the decision is `RESOLVED` and take its Branch A. Phase 1.10 is the backstop that guarantees the row is reviewed, not the earliest chance to close it.

## 1. Requirements in scope (verbatim from `REQUIREMENT.md`)

**PUB-12** A visitor can estimate the shipping cost to their destination before enquiring.

> ⚠ **NEEDS A DECISION** — see Open Question 3. How shipping cost should actually be calculated was not something we could confirm.

**PUB-13** A visitor can submit an enquiry about a specific vehicle, or a general enquiry, giving their name, email, phone number and a message.

**PUB-15** After sending an enquiry, the visitor sees a clear confirmation that it was received.

**RULE-08** Whenever something is saved, edited, or deleted anywhere in the system, that change is reflected immediately and consistently everywhere it is shown. A save or delete must never appear to succeed while quietly not taking effect, and it must never take effect while the screen shows the old information as if nothing happened.

**RULE-09** When there is no data to show, the system shows an honest message saying so. It never fills the gap with a plausible-looking number that was not actually calculated from anything.

**RULE-10** The system never claims a capability it does not actually have. If a message tells the user something is happening automatically, securely, or successfully, that must be true.

## 2. Decisions and unable-to-verify entries

| Item | Status | Disposition for Phase 1.5 |
|---|---|---|
| `DEC-PUB-FREIGHT-MODEL` | OPEN | Not a gate. Recorded as `SKIPPED` in `D01-ASM-001`; no formula is implemented until it resolves. |
| `DEC-PUB-CITY-DELIVERY` | OPEN | Not a gate. Covered by the same row. If city delivery is later declined, record that decision and omit the feature — do not build a disabled placeholder. |
| `UV-3`, `UV-4` (`docs/implementation_risks.md` §5) | Unable to verify | The freight inputs and rate source could not be confirmed from evidence. They are resolved by the same business approval; cite the approval, not the risk register, in the implementation. |

While `D01-ASM-001` is `SKIPPED` there is no estimate to label: the visitor is told plainly that an estimate is not yet available. Once the rule is approved, every estimate shown to a visitor is labelled **indicative** until an approved rate source is confirmed. Never present an estimate as a quotation or a final price, and never substitute a placeholder figure for a missing one (RULE-09, RULE-10).

## 3. Code map — what already exists

| Area | Path | Notes |
|---|---|---|
| Domain types | `packages/domain/src/index.ts` | Add freight/destination/estimate types here. `VehicleDomainSummary` already carries `destinationPort`. |
| Calculation home | `packages/domain/src/` | The authoritative calculation is server-side. The mock API calls it; the browser never recomputes a total. |
| Mock store | `apps/mock-api/src/store.ts` | `DemoStore` interface plus `MemoryStore` and `PostgresStore`. New operations must be added to all three. Postgres schema changes require recreating the local Compose volume. |
| Mock routes | `apps/mock-api/src/server.ts` | `createMockApiApp(store)` factory with CORS and demo-JWT middleware already in place. |
| Typed client | `packages/api-client/src/services/` | Add a freight service module beside `vehicles.ts`. Features never import `http.ts` or `generated/**`. |
| OpenAPI | `openapi/openapi.json` → `corepack pnpm api:generate` | Contract first, then regenerate `packages/api-client/src/generated/schema.d.ts`. Never hand-edit the generated file. |
| Forms | `packages/validation/src/` | Shared schemas live here; form components consume them. |
| Feature slices | `apps/public-web/src/features/<feature>/{components,hooks}` + `<feature>.css` | Existing pattern from Phases 1.2–1.4. |

## 4. Conventions the validation commands depend on

| Artefact | Required path |
|---|---|
| Freight mock tests | `apps/mock-api/src/__tests__/freight.test.ts` |
| Calculation tests | `packages/domain/src/__tests__/freight.test.ts` |
| Mock calculation tests | `apps/mock-api/src/__tests__/freight-calculation.test.ts` |
| Public-web tests | `apps/public-web/src/__tests__/freight.test.ts` |
| End-to-end spec | `tests/e2e/freight-enquiry.spec.ts` |
| Contract tests | `packages/api-client/src/__tests__/contract.test.ts` (extend) |

## 5. Known pitfalls already paid for in earlier phases

- **CORS**: new mock routes reached from the browser rely on the existing middleware in `apps/mock-api/src/server.ts` staying in front of them.
- **Playwright strict mode**: a locator matching more than one element fails; prefer `getByRole` with an accessible name.
- **Docker schema drift**: `CREATE TABLE IF NOT EXISTS` does not add columns to an existing table; recreate the Compose volume after a schema change.
- **Money and rounding**: apply the approved rounding rule exactly once at the approved step. Never round for display and then reuse the rounded figure in a later calculation.
- **Vitest name filters**: run tests by explicit path; a filter matching nothing exits non-zero.

## 6. Boundaries

- The authoritative calculation, rate selection and currency handling stay server-side. The browser renders returned line items; it never derives a total.
- Features never import `api-client/generated/**` or `http.ts`; routes never import services directly; `packages/ui` never imports a service. `corepack pnpm test:boundaries` enforces this.
- No app imports `apps/mock-api`, Prisma, Firebase, Firestore or Supabase.
- Never claim a quotation was sent, received or actioned by staff unless an implemented service confirms it.
- Do not modify `POC/**`; `git diff -- POC` must stay empty.
