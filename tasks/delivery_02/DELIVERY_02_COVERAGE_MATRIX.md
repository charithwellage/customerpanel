# Delivery 02 Customer Application Coverage Matrix

This matrix is the Delivery 02 source-to-task index. `REQUIREMENT.md`, approved BA workflow decisions and `FRONT_END_ARCHITECTURE.md` are authoritative. Customer POC behavior is compiled/runtime evidence only; Firebase/Firestore are POC-only dependencies and missing Customer/POC modules do not block requirements-based implementation. Unresolved requirement gaps are handled through [`REQUIREMENT_GAPS_AND_ASSUMPTIONS.md`](REQUIREMENT_GAPS_AND_ASSUMPTIONS.md): safe MVP default now, reconcile in Phase 2.10.

Known demonstration defects are negative evidence and must not be reproduced: contradictory balances, incorrect credit utilisation, phantom/duplicated vehicles, inconsistent invoice references, allocated TT funds shown as available, documents disconnected from generated invoices, browser-selected identity/roles and unsupported claims about security or external integrations.

## Requirement coverage

| Requirement | Approved intent | Evidence classification | Primary task(s) | Incremental mock capability | Acceptance evidence |
|---|---|---|---|---|---|
| CUST-01 | Protected customer access | Requirement; AutoPulse/Keycloak production boundary confirmed | D02-P01-G001, T001–T003; P09-T002 | Mock session, recovery/MFA presentation and compatible token claims | Invalid/expired sessions cannot reach customer routes |
| CUST-02 | Customer sees only own records | Requirement | Every data phase; P09-T002 | Token-derived ownership on every customer domain | Cross-customer/IDOR matrix passes |
| CUST-03 | Password recovery | Requirement; AutoPulse/Keycloak ownership confirmed | D02-P01-G001, T002 | Mock recovery presentation/command | Recovery boundary matches Keycloak replacement adapter |
| CUST-04 | Overview vehicles, balance, alerts | Requirement; compiled evidence provisional | D02-P02-G001, T001–T002; P10 | Derived dashboard aggregate | Linked-record MVP baseline reconciles; final finance mapping reviewed in P10 |
| CUST-05 | Tier and discount | Requirement | D02-P02-T001–T002; P03-T001–T002 | Tier projection and approved price presentation | RULE-06 examples and audience projection pass |
| CUST-06 | Credit limit/utilisation | Requirement; known POC defect | D02-P02-G001, T001–T002 | Server-derived credit aggregate | Worked 24% example and reconciliation pass |
| CUST-07 | Light/dark appearance | Requirement; implemented as named themes | D02-P01-T001/T003; P09-T003 | No API; carchief/ocean registry | Both themes pass responsive/accessibility tests |
| CUST-08 | Manual refresh | Requirement; compiled evidence provisional | D02-P02-T001–T002 | Aggregate freshness/reset | Refresh invalidates and refetches authoritative data |
| CUST-09 | Browse/search stock in account | Requirement | D02-P03-T001–T003 | Customer inventory projection | Shared search/detail packages are reused |
| CUST-10 | Reserved/with PI/invoiced groups | Requirement; compiled evidence provisional | D02-P04-T001–T003 | Transaction vehicle projection | Counts are unique and match records |
| CUST-11 | Five approved shipping stages | Requirement plus BA projections | D02-P04-T001–T003; P07-T001–T004 | Status history/shipment projection | Approved mapping/order and exceptions pass |
| CUST-12 | Deposit owed | Requirement | D02-P04-T001/T003 | Server-computed approved deposit | RULE-07 worked example passes |
| CUST-13 | No duplicate/phantom vehicles | Requirement; known POC defect | D02-P04-T001–T003; P09-T002 | Canonical transaction identity | Unique-count and cross-view tests pass |
| CUST-14 | Invoice totals/paid/outstanding | Requirement | D02-P05-T001–T003; P06-T004 | Customer invoice projection | Values reconcile across all pages |
| CUST-15 | Print/download invoices | Requirement; delivery mechanism uncertain | D02-P05-T001–T003 | Authorized print/download metadata | Allowed, unavailable and denied states pass |
| CUST-16 | One outstanding balance | Requirement; known POC defect | D02-P02, P05 and P06; P09-T002 | One server-authoritative balance projection | Cross-page RULE-01 test passes |
| CUST-17 | Payment journal | Requirement | D02-P06-T001–T002/T004 | Payment list/detail/status | Correct references, amounts, dates and states shown |
| CUST-18 | Submit payment and proof | Requirement; safe Mock-MVP policy confirmed | D02-P06-G001, T001/T003/T004 | Idempotent TT create/PDF-JPG-PNG metadata/simulated scan/resubmit | Validation, privacy, retry and duplicate tests pass |
| CUST-19 | Allocated payment unavailable | Requirement; known POC defect | D02-P06-T001/T002/T004; P09-T002 | Allocation/remaining-balance projection | Double allocation and availability tests pass |
| CUST-20 | Ten-category Secure Vault | Requirement; repository policy is non-blocking | D02-P07-G001, T001/T003/T004; P10 | Authorized document metadata/access and `visibleToCustomer` projection | MVP labels/visibility pass; final repository policy is reconciled in P10 |
| CUST-21 | Generated document appears when approved | Requirement plus BA release gate | D02-P05-T001/T003; P07-T001/T003/T004 | Release-gated document visibility | No visibility before approval; appears after approved upload |
| CUST-22 | Notifications/read state | Requirement | D02-P08-T001–T002 | Notification list/read/mark-all | Linked state and counts remain consistent |
| CUST-23 | Edit approved contact details | Requirement | D02-P08-T001/T003 | Profile read/update | Company/phone/address persist and reset |
| CUST-24 | Name/email fixed | Requirement | D02-P01, P08-T001/T003 | Fixed-field policy | Direct and API edits are rejected |
| CUST-25 | Change password | Requirement; identity decision | D02-P01-G001/T002; P08-T003 | Identity-provider handoff only | No frontend password storage; approved flow shown |

## Cross-cutting rules and workflow projections

| Projection/rule | Classification | Delivery 02 task coverage | Required decision/evidence |
|---|---|---|---|
| RULE-01 one balance | Authoritative requirement | P02, P05, P06, P09 and P10 | D02-ASM-001 linked-record baseline; finance confirmation in P10 |
| RULE-04 shipping stages | Authoritative requirement; Finance approval ownership confirmed | P04 and P07 | Finance Ship OK/document-release decision and customer-safe projection |
| RULE-05 reservation hold | Authoritative requirement; 48-hour expiry confirmed | P03 and P04 | Exclusive hold, conflict and `Now On Sale` expiry tests |
| RULE-06 tier discount | Authoritative requirement | P02 and P03 | Approved customer-price projection |
| RULE-07 50% deposit | Authoritative requirement | P04 | Server-side worked example |
| RULE-08 consistent persistence | Authoritative requirement | Every mutable phase | Contract/integration/reset tests |
| RULE-09 no invented data | Authoritative requirement; POC negative evidence | P02, P04, P07 and P09 | Honest empty/partial/stale states |
| RULE-10 honest capability claims | Authoritative requirement | Every phase | External/manual boundary labels |
| PI-created status and 72-hour deadline | BA workflow; policy confirmed | P05 and P06 | `Under Negotiation With PI`, hold and `Now On Sale` expiry tests |
| TT held and proof resubmission | BA workflow; Mock-MVP policy confirmed | P06 | Held reason, resubmission, simulated scan and idempotency |
| Allocation and remaining balance | BA workflow plus requirement | P06 | Finance-approved reconciliation examples |
| Ship OK status | BA workflow; Finance approval confirmed | P07 | Customer-safe read-only projection, rejection/status tests |
| Document-release status/visibility | BA workflow plus CUST-21 | P07 and P10 | Finance-approved release plus `visibleToCustomer`; final repository policy is a non-blocking P10 review |
| Email, bank, carrier, ERP/IBQ actions | AutoPulse email later; bank/ERP remain manual/external | Mock outbox evidence, honest external checkpoints | Future adapter contracts |
| UI-01 through UI-03 | Authoritative cross-app UI requirements | Every UI task; P09-T003 | Responsive/accessibility evidence |
| PWA-01 through PWA-04 | Authoritative safe PWA baseline | P01-T003 and P09-T002/T003 | Install/offline/update/logout evidence |
| PWA-05 enhancements | Open/excluded unless approved | P01, P08 and P09 | DEC-PWA-ENHANCEMENTS |
| Requirement assumptions / skipped features | Delivery 02 governance policy | Every phase and P10 | Register entry, honest MVP behaviour and P10 reconciliation |

## Evidence and confidence

- Source-confirmed shared contracts/types may be inspected only where a task names them; they do not prove Customer screen behavior.
- `POC/build/carchief_customer_backend.html`, runtime reports and screenshots are compiled/runtime evidence, not production code or approved rules.
- BA customer projections are authoritative workflow evidence only after the named ownership/timer/payment/document decisions are resolved.
- Any behavior not covered by an approved requirement or decision is recorded as `ASSUMED` or `SKIPPED` in the Delivery 02 register. It uses a safe MVP default or honest unavailable state and is reconciled in Phase 2.10 rather than blocking Phases 2.1–2.9.
