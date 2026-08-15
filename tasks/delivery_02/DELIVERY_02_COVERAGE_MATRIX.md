# Delivery 02 Customer Application Coverage Matrix

This matrix is the Delivery 02 source-to-task index. `REQUIREMENT.md`, approved BA workflow decisions and `FRONT_END_ARCHITECTURE.md` are authoritative. Customer POC behavior is compiled/runtime evidence only; Firebase/Firestore are POC-only dependencies and missing Customer/POC modules do not block requirements-based implementation. Unresolved requirement gaps are handled through [`REQUIREMENT_GAPS_AND_ASSUMPTIONS.md`](REQUIREMENT_GAPS_AND_ASSUMPTIONS.md): safe MVP default now, reconcile in Phase 2.10.

Known demonstration defects are negative evidence and must not be reproduced: contradictory balances, incorrect credit utilisation, phantom/duplicated vehicles, inconsistent invoice references, allocated TT funds shown as available, documents disconnected from generated invoices, browser-selected identity/roles and unsupported claims about security or external integrations.

## Requirement coverage

| Requirement | Approved intent | Evidence classification | Primary task(s) | Incremental mock capability | Acceptance evidence |
|---|---|---|---|---|---|
| CUST-01 | Protected customer access | Requirement; AutoPulse/Keycloak production boundary confirmed | D02-P01-G001, T001–T003; P09-T002; P12-T001/T005 | Mock session, recovery/MFA presentation and compatible token claims | Invalid/expired sessions cannot reach customer routes |
| CUST-02 | Customer sees only own records | Requirement | Every data phase; P09-T002 | Token-derived ownership on every customer domain | Cross-customer/IDOR matrix passes |
| CUST-03 | Password recovery | Requirement; AutoPulse/Keycloak ownership confirmed | D02-P01-G001, T002; P12-T001/T005 (see CUST-29) | Mock recovery presentation/command | Recovery boundary matches Keycloak replacement adapter |
| CUST-04 | Overview vehicles, balance, alerts | Requirement; compiled evidence provisional | D02-P02-G001, T001–T002; P10 | Derived dashboard aggregate | Linked-record MVP baseline reconciles; final finance mapping reviewed in P10 |
| CUST-05 | Tier and discount | Requirement | D02-P02-T001–T002; P03-T001–T002 | Tier projection and approved price presentation | RULE-06 examples and audience projection pass |
| CUST-06 | Credit limit/utilisation | Requirement; known POC defect | D02-P02-G001, T001–T002 | Server-derived credit aggregate | Worked 24% example and reconciliation pass |
| CUST-07 | Light/dark appearance | Requirement; default-theme MVP plus optional alternate theme | D02-P01-T003; P09-T003; optional P11 | No API; carchief default, ocean deferred to P11 | Default theme passes MVP acceptance; both-theme parity is P11-only |
| CUST-08 | Manual refresh | Requirement; compiled evidence provisional | D02-P02-T001–T002 | Aggregate freshness/reset | Refresh invalidates and refetches authoritative data |
| CUST-09 | Browse/search stock in account | Requirement | D02-P03-T001–T003 | Customer inventory projection | Shared search/detail packages are reused |
| CUST-10 | Reserved/with PI/invoiced groups | Requirement; compiled evidence provisional | D02-P04-T001–T003 | Transaction vehicle projection | Counts are unique and match records |
| CUST-11 | Five approved shipping stages | Requirement plus BA projections | D02-P04-T001–T003; P07-T001–T004 | Status history/shipment projection | Approved mapping/order and exceptions pass |
| CUST-12 | Deposit owed | Requirement | D02-P04-T001/T003 | Server-computed approved deposit | RULE-07 worked example passes |
| CUST-13 | No duplicate/phantom vehicles | Requirement; known POC defect | D02-P04-T001–T003; P09-T002 | Canonical transaction identity | Unique-count and cross-view tests pass |
| CUST-14 | Invoice totals/paid/outstanding | Requirement | D02-P05-T001–T003; P06-T004 | Customer invoice projection | Values reconcile across all pages |
| CUST-15 | Print/download invoices | Requirement; delivery mechanism uncertain | D02-P05-T001–T003 | Authorized print/download metadata | Allowed, unavailable and denied states pass |
| CUST-16 | One outstanding balance | Requirement; known POC defect | D02-P02, P05 and P06; P09-T002 | One server-authoritative balance projection | Cross-page RULE-01 test passes |
| CUST-17 | Payment journal | Requirement | D02-P06-T001/T002/T004/T005 | Payment list/detail/status and deterministic notification outbox | Correct references, amounts, dates and states shown |
| CUST-18 | Submit payment and proof | Requirement; safe Mock-MVP policy confirmed | D02-P06-G001, T001/T003/T004/T005 | Idempotent TT create/PDF-JPG-PNG metadata/simulated scan/resubmit | Validation, privacy, retry and duplicate tests pass |
| CUST-19 | Allocated payment unavailable | Requirement; known POC defect | D02-P06-T001/T002/T004/T005; P09-T002 | Allocation/remaining-balance projection | Double allocation and availability tests pass |
| CUST-20 | Ten-category Secure Vault | Requirement; repository policy is non-blocking | D02-P07-G001, T001/T003/T004/T005; P10 | Authorized document metadata/access and `visibleToCustomer` projection | MVP labels/visibility pass; final repository policy is reconciled in P10 |
| CUST-21 | Generated document appears when approved | Requirement plus BA release gate | D02-P05-T001/T003; P07-T001/T003/T004 | Release-gated document visibility | No visibility before approval; appears after approved upload |
| CUST-22 | Notifications/read state | Requirement | D02-P08-T001–T002 | Notification list/read/mark-all | Linked state and counts remain consistent |
| CUST-23 | Edit approved contact details | Requirement | D02-P08-T003/T004 | Profile read/update | Company/phone/address persist and reset |
| CUST-24 | Name/email fixed | Requirement | D02-P01, P08-T001/T003 | Fixed-field policy | Direct and API edits are rejected |
| CUST-25 | Change password | Requirement; identity decision | D02-P01-G001/T002; P08-T003; superseded by CUST-28 in P12-T001/T006 | Mock-owned change-password command replaces the handoff-only presentation | No frontend password storage; the old password stops working after a change |
| CUST-26 | Customer self-registration | Requirement added 15 August 2026 | D02-P12-T001–T003 | `POST /api/v1/auth/register`, `customer_accounts` store, `GET /api/v1/config/countries` | Name with initials, country, dial-code-aware mobile, email, password and confirmation create a usable account; duplicate email is rejected |
| CUST-27 | Credential sign-in to the Customer application | Requirement added 15 August 2026 | D02-P12-T001/T002/T005 | `POST /api/v1/auth/login` returning a scoped `CustomerBuyer` session | Only Mock-API-verified credentials sign in; unknown email and wrong password return one identical response |
| CUST-28 | In-session password change | Requirement added 15 August 2026 | D02-P12-T001/T002/T006 | `POST /api/v1/auth/change-password` requiring the current password | The password changes from `/profile` and the old password stops working |
| CUST-29 | Password recovery without a live mail provider | Requirement added 15 August 2026; D02-ASM-007 | D02-P12-T001/T002/T005 | `POST /api/v1/auth/password-reset` + `/confirm` and a non-production reset outbox | Neutral response for any email, single-use expiring token, and a 403 from the outbox under `NODE_ENV=production` |
| CUST-30 | No demo identity path remains | Requirement added 15 August 2026 | D02-P12-T001/T004/T005/T006/T007 | `POST /api/v1/auth/demo-session` removed | No demo endpoint, panel, badge, label or storage key remains under `apps` or `packages` |

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

## Phase 2.9 disposition

The existing requirement-to-task rows above establish traceability. This section records the current acceptance disposition without treating compiled HTML as production evidence or claiming business approval that has not been recorded.

| Disposition | Meaning in this phase |
|---|---|
| `DELIVERED` | Implemented and evidenced in the Customer Application MVP, with server-authoritative boundaries where applicable. |
| `DEFERRED` | Deliberately outside the MVP boundary or dependent on a later production/assumption decision; the current UI remains honest about the limitation. |
| `REJECTED` | Compiled/POC behavior explicitly rejected because it conflicts with approved requirements, security or data-integrity rules. |
| `OPEN` | Requires named business or production-owner confirmation; it remains provisional and is not presented as confirmed behavior. |

| Requirement | Current disposition | Evidence / boundary |
|---|---|---|
| CUST-01 | DELIVERED | Mock protected session, expiry and recovery presentation; production identity remains AutoPulse/Keycloak under D02-ASM-003. |
| CUST-02 | DELIVERED | Customer scope is derived server-side and covered by customer isolation/IDOR tests; final security acceptance continues in P09-T002. |
| CUST-03 | DELIVERED / DEFERRED | Demo recovery presentation is delivered; production recovery/MFA remains the identity-provider handoff. |
| CUST-04 | DELIVERED / OPEN | Server-derived dashboard MVP is delivered; final finance definitions remain D02-ASM-001 and require Phase 2.10 confirmation. |
| CUST-05 | DELIVERED | Server-projected tier and customer price behavior is covered by Phase 2.2/2.3 evidence. |
| CUST-06 | DELIVERED / OPEN | Server-derived credit utilization MVP is delivered; final finance formula/status mapping remains D02-ASM-001. |
| CUST-07 | DELIVERED / DEFERRED | Default `carchief` theme is delivered; alternate-theme work is optional Phase 2.11. |
| CUST-08 | DELIVERED | Refresh invalidates/refetches authoritative query data in the implemented Customer flows. |
| CUST-09 | DELIVERED | Customer inventory/search/detail flow uses the shared typed service and feature boundary. |
| CUST-10 | DELIVERED | Transaction vehicle groupings use canonical server projections and deterministic fixtures. |
| CUST-11 | DELIVERED | Approved customer-safe shipment stages and exceptions are projected server-side. |
| CUST-12 | DELIVERED | Deposit is server-calculated under RULE-07 and evidenced by Phase 2.4 tests. |
| CUST-13 | DELIVERED | Duplicate/phantom vehicle behavior is prohibited and covered by canonical identity tests. |
| CUST-14 | DELIVERED | Invoice totals, paid and outstanding projections are linked and reconciled. |
| CUST-15 | DELIVERED / DEFERRED | MVP print/download projection is delivered where authorized; final storage/delivery policy remains outside this delivery. |
| CUST-16 | DELIVERED / OPEN | One server-authoritative balance projection is delivered; final finance confirmation remains D02-ASM-001. |
| CUST-17 | DELIVERED | Payment journal/status projections and deterministic notification outbox evidence are delivered. |
| CUST-18 | DELIVERED | Mock-MVP payment submission accepts only the approved metadata/proof boundary and validates retries/idempotency. |
| CUST-19 | DELIVERED | Allocated funds are excluded from available balance by server projection and tests. |
| CUST-20 | DELIVERED / DEFERRED | Authorized ten-category metadata/access MVP is delivered; final repository, retention and scanning policy remains D02-ASM-002. |
| CUST-21 | DELIVERED | Finance-approved release plus `visibleToCustomer` gates customer document visibility. |
| CUST-22 | DELIVERED | Customer-scoped notification filtering, linked navigation, read state and reset behavior are delivered. |
| CUST-23 | DELIVERED | Company, phone and delivery address update through the typed profile service with validation/conflict handling. |
| CUST-24 | DELIVERED | Name/email are fixed server-derived identity fields and are not editable. |
| CUST-25 | DELIVERED / DEFERRED | Honest identity-provider password handoff is delivered; no password storage or production identity implementation is claimed. |

## Compiled-only and negative-evidence disposition

The Customer compiled artifact was used for discovery only. The following behaviors are explicitly rejected or deferred and are not acceptance claims for the target application:

| Compiled/POC observation | Disposition | Target treatment |
|---|---|---|
| Browser-selected identity, forced role and auto-authenticated privileged views | REJECTED | Target uses protected mock sessions, server permissions and customer-derived scope. |
| Firebase/Firestore/localStorage-only persistence and shared-origin records | REJECTED | Target uses HTTP Mock API operations, deterministic reset and server-side customer scope. |
| Contradictory balances, duplicate vehicles and allocated funds shown as available | REJECTED | Target uses server-authoritative linked projections and reconciliation tests. |
| Empty/disconnected customer documents | REJECTED | Target uses approval/release/visibility gates and honest unavailable states. |
| Production password storage, live email/bank/carrier/ERP actions | DEFERRED | AutoPulse/Keycloak and future adapters own those capabilities; the MVP labels the boundary honestly. |
| Push, background sync, camera capture and install analytics | DEFERRED | Excluded by DEC-PWA-ENHANCEMENTS unless separately approved. |

## Business sign-off and Delivery 03 prerequisites

- Business sign-off status: `OPEN`. No named approver or dated sign-off artifact was supplied for the compiled-only Customer behavior or the BA customer projections, so this matrix records them as provisional rather than confirmed.
- Phase 2.10 must review D02-ASM-001 through D02-ASM-004, confirm or adjust finance/document/identity boundaries, and rerun the complete Customer journey after any approved change.
- Delivery 03 prerequisites: preserve the typed OpenAPI/generated-client boundary; replace Mock API session/profile/payment/document adapters with approved production contracts; retain server-side customer isolation; obtain approved identity-provider, finance, repository/document and external-integration contracts before enabling production behavior.
