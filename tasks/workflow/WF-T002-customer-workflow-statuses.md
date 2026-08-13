# WF-T002 — Customer workflow status and notification visibility

**Prerequisite:** `WF-T001` COMPLETE and Customer Application foundation accepted.

## Context

Read `REQUIREMENT.md` CUST-14–CUST-22 and WF-08–WF-17, the Customer phases in the implementation plan, and the compiled customer evidence. Treat all compiled-only behavior as provisional until approved.

## Work

Consume `packages/vehicle-search` and `packages/vehicle-detail` for the customer showroom; configure customer visibility, tier pricing and reservation actions without copying public components.

Add customer projections for the `Under Negotiation With PI` 72-hour deadline/release, held or re-submission-required TT, approved allocation, Ship OK and document-release status. Only return a document after Finance-approved release and server-side `visibleToCustomer`; show mock outbox/email intent without claiming browser delivery.

## Tests and acceptance

Test customer isolation, consistent balances, status transitions, pre-release document denial, approved release visibility, read/unread notifications, refresh and error states. Run lint, typecheck, build, unit/integration and container UI tests at the Customer acceptance gate. Record the execution log and tracker update.
