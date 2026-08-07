# WF-T001 — Approve workflow contract and status vocabulary

**Prerequisites:** `DEC-WF-COLOUR-OWNERSHIP`, `DEC-WF-TIMER-SEMANTICS`, `DEC-WF-PI-PAYMENT-WINDOW`, `DEC-WF-PUBLICATION-PRICE`, `DEC-WF-EXTERNAL-BOUNDARIES`, `DEC-WF-SHIP-DOC-APPROVAL` resolved.

## Context

Read `REQUIREMENT.md` WF-01–WF-14, `FRONT_END_ARCHITECTURE.md` §4, and `docs/CarChief-BA-Workflow-Coverage-Matrix.md`. Do not infer final names or payloads from the draw.io labels.

## Work

Produce the approved state vocabulary and transition table for publication, price readiness, enquiry/screening, negotiation, reservation, PI, TT, allocation, Ship OK, ERP checkpoints, document release and customer visibility. Update the OpenAPI/domain design only after human approval.

## Tests and acceptance

Validate every transition, role, timer and idempotency rule with contract examples. Acceptance requires BA/finance/logistics approval, no contradictory state names, and a recorded decision log. If any prerequisite decision is unresolved: `No implementation started`.
