# Phase 05 Summary: Freight Estimate and Quotation Enquiry

## Overview
Phase 1.5 delivers the public shipping-cost estimate journey and the quotation enquiry that follows it, on `feat_delivery01_phase_05`. `DEC-PUB-FREIGHT-MODEL` and `DEC-PUB-CITY-DELIVERY` remain `OPEN` throughout the phase (`D01-ASM-001`, `SKIPPED`): no pricing formula or monetary total is invented anywhere in this phase's UI or mock contract (RULE-09, RULE-10). Instead, every freight estimate deterministically resolves to an honest, explained "estimate unavailable — pending a confirmed freight rate" outcome, and the quotation enquiry is delivered in full independent of that open decision.

## Key Deliverables Completed
- **D01-P05-T001** — Destination/port/freight-rate data model and the `FreightEstimateRequest`/`FreightEstimateResponse` contract, with a deterministic unavailable-rate outcome; no formula, no computed total.
- **D01-P05-T002** — Relocated the freight calculation sequence (`resolveFreightRateStatus`, `validateFreightEstimateRequest`, `buildFreightEstimate`) to its authoritative home in `packages/domain`, with dedicated domain and mock-API test coverage.
- **D01-P05-T003** — Freight estimate selection form and result/explanation panel (`FreightEstimateSection`, `packages/theme`-driven `freight.css`) embedded on the vehicle detail page, consuming `FreightService`; every submission renders the honest unavailable-estimate state as a first-class accessible UI state.
- **D01-P05-T004** — Quotation enquiry flow (`EnquirySection`, `EnquiryForm`, `EnquiryConfirmation`, `useEnquiryForm`) at `/contact`, reachable from the vehicle detail page's declared-intent contact actions and from the freight estimate section's "Request a formal quotation" link. Backed by a new `POST /api/v1/enquiries` mock endpoint and `EnquiryService`, with server-authoritative validation and dedupe (identical resubmissions return the original receipt as `duplicate: true`, HTTP 200, rather than creating a second lead — RULE-08). The enquiry never carries a computed monetary total (RULE-09) and never claims staff notification beyond receipt (RULE-10).

## Evidence and Traceability
- Automated tests: `apps/mock-api/src/__tests__/enquiries.test.ts` (14), `apps/public-web/src/__tests__/enquiry.test.ts` (20), plus the pre-existing freight suites — full root `corepack pnpm test` run: 238/238 passed.
- Contract: `packages/api-client/src/__tests__/contract.test.ts` covers `EnquiryService` success, duplicate, quotation-snapshot and 400-validation paths against the OpenAPI-derived types.
- `tests/e2e/freight-enquiry.spec.ts` — Playwright end-to-end coverage of the general enquiry, field validation, duplicate-submission, recoverable service-failure/retry, and the freight-estimate-to-enquiry destination hand-off. Passed on all three required projects (`chromium`, `mobile-chromium`, `tablet-chromium`) — 15/15.
- Playwright MCP desktop walkthrough (carchief theme, 1440×900) against a fresh Profile A runtime: submitted a quotation enquiry end to end, verified the receipt confirmation content, verified duplicate-submission behavior returns the original reference, and inspected the accessibility snapshot, keyboard/focus flow and network requests. No enquiry-feature console/network errors; see `tasks/execution_logs/D01-P05-T004.md` for the recorded, pre-existing, unrelated Google Fonts 404 observed identically on the homepage.
- `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm -r build`, `corepack pnpm test:boundaries` and `node tasks/scripts/taskctl.mjs validate` all pass. `git diff -- POC` is empty throughout the phase.

## Decisions & Deviations
- `D01-ASM-001` (`SKIPPED`) governs the entire phase: `DEC-PUB-FREIGHT-MODEL`/`DEC-PUB-CITY-DELIVERY` remain `OPEN`. Phase acceptance covers the estimate-request journey and the honest unavailable-estimate state, and the quotation enquiry journey in full — it does not claim PUB-12's priced estimate is demonstrable until the decision resolves.
- D01-P05-T004: the required Playwright MCP evidence screenshot could not be captured — the `browser_take_screenshot` call consistently timed out waiting on an unreachable `fonts.gstatic.com` webfont fetch (the same pre-existing, site-wide, sandbox-network-only issue also observed on `/`). Per the task's "don't retry a hanging call" guidance, this was not retried; the walkthrough's accessibility snapshot and network-request evidence (recorded in the execution log) substitute for the screenshot. No repo screenshot artifact was created or left behind.

## Pull Request
[Pending manual PR creation]
