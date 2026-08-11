# WF-T003 — Sales negotiation, confirmation and PI timers

**Prerequisite:** `WF-T001` COMPLETE; Public enquiry handoff accepted.

## Context

Read `REQUIREMENT.md` WF-05–WF-08, RULE-02 and RULE-05, Sales phases 3.4–3.5, and the BA coverage matrix.

## Work

Consume the shared vehicle-search/detail packages for staff inventory and customer/vehicle selection; staff-only filters and commands belong in app wrappers or dedicated staff features.

Implement the staff workflow for screened lead intake, country salesperson assignment, Under Negotiation, customer confirmation/cancellation, PI creation and Under Negotiation With PI. The 48-hour timer is the exclusive reservation hold and the 72-hour PI window retains the reservation; either expiry returns the vehicle to `Now On Sale`. The server/mock service owns transitions and expiry; the UI only presents commands and states.

## Tests and acceptance

Cover role checks, timer boundaries, expiry, retry/idempotency, cancellation, reservation conflicts and PI linkage. Demonstrate enquiry → assignment → negotiation → confirmation → PI. Record decisions and blockers in the task log.
