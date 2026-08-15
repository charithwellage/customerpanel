# Delivery 02 Requirement Gaps and Assumptions

This is the authoritative non-blocking requirement-gap register for the Customer Application. It prevents an unanswered business question from stopping Phases 2.1–2.9 while preserving an auditable record for Phase 2.10.

## Operating rule

1. Apply an approved requirement or BA decision when it exists.
2. Otherwise use the smallest safe, conventional MVP default and record it below before implementation completes.
3. If no safe default is possible, omit only the uncertain capability and present an honest unavailable state where the UI needs one. Record it as `SKIPPED` and continue the task.
4. Requirement uncertainty alone is never a `taskctl` blocker in Delivery 02 Phases 2.1–2.9. Dependency, clean-tree, build/test, security, authorization, data-isolation and required-infrastructure failures remain blockers.
5. Do not use a default to claim a live AutoPulse, Keycloak, email, bank, ERP, carrier or legal-document capability.

## Statuses

- `ASSUMED` — safe MVP default implemented; review in Phase 2.10.
- `SKIPPED` — unsafe or insufficiently defined capability deliberately omitted; review in Phase 2.10.
- `CONFIRMED` — business authority approved the implemented behaviour.
- `SUPERSEDED` — replaced by a later approved rule or AutoPulse contract.

## Register

| ID | Status | Affected task / requirement | Date | Safe MVP default or skipped capability | Rationale and mock/API impact | Tests | Risk | Phase 2.10 outcome |
|---|---|---|---|---|---|---|---|---|
| D02-ASM-001 | ASSUMED | D02-P02-G001; CUST-04, CUST-06, CUST-16, RULE-01 | 2026-08-11 | Derive dashboard values server-side from linked mock records: outstanding balance = issued invoice total minus approved allocations; credit utilisation = outstanding balance ÷ mock credit limit; vehicle counts use canonical vehicle IDs and current server status. | One customer aggregate endpoint; no browser calculation or fabricated values. | Unit worked examples, mock HTTP reconciliation and cross-page UI test. | Finance may later define a different formula/status mapping. | Pending business confirmation or approved adjustment. |
| D02-ASM-002 | ASSUMED | D02-P07; CUST-20, CUST-21 | 2026-08-11 | Use existing ten named document categories as display labels. Expose metadata/access only when Finance-approved release and `visibleToCustomer` are both true. | Mock API returns authorised metadata only; no raw storage provider, virus scanner or final download implementation is inferred. | Customer isolation, release/visibility matrix, hidden/restricted states and cache-safety tests. | Final category, retention, storage and file policy may change. | Pending repository-policy review. |
| D02-ASM-003 | ASSUMED | D02-P01-T002/T003, D02-P08-T003; CUST-01, CUST-03, CUST-25 | 2026-08-11 | Mock API issues compatible demo session outcomes and recovery/MFA presentation; production replacement is AutoPulse/Keycloak. | No production password store, MFA secret or identity-provider integration is created. | Session expiry, unauthorised access, recovery/MFA presentation and adapter-conformance tests. | Keycloak claims/screens may differ. | Pending AutoPulse contract review. |
| D02-ASM-004 | ASSUMED | D02-P06; CUST-17–CUST-19, WF-16 | 2026-08-11 | Store PDF/JPG/PNG proof metadata only, configurable demo size, simulated scan state and deterministic notification outbox records. | Browser never sends email or logs proof content; AutoPulse later replaces the outbox adapter. | Invalid type/size, no-content-in-log, hold/re-submit, duplicate allocation and outbox-event tests. | Final storage, scanning and email-provider rules may differ. | Pending AutoPulse/security review. |

## Phase 2.10 reconciliation checklist

The Phase 2.1–2.9 execution logs reconcile to the four register rows below. No new gap was found, no row has named business-authority evidence for `CONFIRMED`, and no Phase 2.1–2.9 task retains an unresolved decision gate. T002 may implement only a row selected by a named authority; otherwise T003 preserves the safe MVP baseline and honest deferred boundary.

| Register ID | Phase 2.1–2.9 evidence reconciliation | Current outcome | T002 adjustment candidate | Business review evidence required |
|---|---|---|---|---|
| D02-ASM-001 | Dashboard aggregate, invoice/payment reconciliation and Phase 2.9 traceability evidence use one server-side balance/utilisation projection. | Retain `ASSUMED`; no client-side finance formula is claimed. | Update only if Finance confirms the balance, allocation or utilisation formula/status mapping. | Named Finance authority, dated decision, worked examples and rerun dashboard/ledger checks. |
| D02-ASM-002 | Document category, release and customer-visibility logs/tests use ten display categories and server-side release gates. | Retain `ASSUMED`; storage, retention, scanning and binary policy remain deferred. | Update only if Repository/Finance authority confirms category, retention, scanning or download policy. | Named policy owner, dated repository decision and rerun visibility/cache-safety checks. |
| D02-ASM-003 | Session, expiry, recovery/MFA presentation and profile/password-handoff evidence preserve the identity-provider boundary. | Retain `ASSUMED`; no production password, MFA secret or Keycloak behavior is claimed. | Update only when the approved AutoPulse/Keycloak contract is available. | Named identity authority, dated contract/screens, claims mapping and rerun session/expiry checks. |
| D02-ASM-004 | Payment proof metadata, hold/resubmission, notification outbox and offline-safety evidence preserve the metadata-only Mock boundary. | Retain `ASSUMED`; no live bank, storage, scanner, email or ERP action is claimed. | Update only if the approved payment/provider contract changes the metadata or outbox boundary. | Named Finance/Security authority, dated provider decision and rerun proof/privacy/idempotency checks. |

### Business review checklist

- [ ] Name a business authority and date for each row before changing any status to `CONFIRMED`.
- [ ] For D02-ASM-001, approve or revise the balance, allocation and credit-utilisation definitions with worked examples.
- [ ] For D02-ASM-002, approve document categories, retention, scanning, preview and download policy.
- [ ] For D02-ASM-003, provide the AutoPulse/Keycloak claims, recovery, reauthentication and MFA contract.
- [ ] For D02-ASM-004, approve proof storage/scanning, payment-provider verification, notification delivery and ERP boundary.
- [ ] If a decision changes a row, reopen the owning implementation task, apply the narrowest contract/UI/mock change, rerun its tests, and update the relevant phase summary.
- [ ] If no decision changes a row, retain the `ASSUMED` baseline or the explicit deferred/skipped behavior and record management acceptance in Phase 2.10 T003.

## How a task updates this register

Before `taskctl complete`, append or update one row when the task introduces an assumption or skips an uncertain feature. Include the task ID, exact requirement gap, chosen safe baseline or omission, mock/API effect and test evidence. Also add the row ID to the task execution log under **Decisions and deviations**. Do not change a row to `CONFIRMED` without named business-authority evidence.

Phase 2.10 reviews every row and either records the approved adjustment, confirms the baseline for MVP, or keeps the feature explicitly skipped with a management release exception.
