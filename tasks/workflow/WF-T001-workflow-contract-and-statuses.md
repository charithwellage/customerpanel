# WF-T001 — Approve workflow contract and status vocabulary

**Prerequisites:** The confirmed BA workflow decisions in `REQUIREMENT.md` WF-01–WF-17. `DEC-WF-EXTERNAL-BOUNDARIES` remains open only for later live vendor/ERP integration details.

## Context

Read `REQUIREMENT.md` WF-01–WF-17, `FRONT_END_ARCHITECTURE.md` §4, `docs/CarChief-BA-Workflow-Coverage-Matrix.md`, and `docs/CarChief-BA-Workflow-JPEG-Interpretation.md`. Do not infer final names or payloads from the workflow labels.

## Work

Produce the approved state vocabulary and transition table for distinct `Active`/`Now On Sale`, price readiness, enquiry/screening, negotiation/reservation, PI, TT, allocation, Ship OK, ERP checkpoints, document release and `visibleToCustomer`. Include the confirmed 48-hour and 72-hour expiry-to-`Now On Sale` transitions, Finance rejection reasons/resubmission, Mock API outbox and future AutoPulse/Keycloak boundary. Update final OpenAPI/domain design only after human approval.

## Tests and acceptance

Validate every transition, role, timer and idempotency rule with contract examples. Acceptance requires BA/finance/logistics approval, no contradictory state names, and a recorded decision log. If any prerequisite decision is unresolved: `No implementation started`.
