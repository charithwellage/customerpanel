---
id: D02-CUSTOMER-APP-AUDIT
status: COMPLETE
owner: Codex
review_agent: Codex
started_at: 2026-08-16T10:05:00Z
completed_at: 2026-08-16T10:28:00Z
baseline_branch: delivery_02_customer_application
baseline_sha: e22c529bb223af67d9fc67a673151dff5020cb3e
---

# Delivery 02 Customer Application audit

## Outcome

The Customer Application was traced against Delivery 02 requirements, exercised on a fresh container runtime, inspected for responsive/theme defects, and audited for dead or duplicated code. Four findings were corrected. No blocking requirement, authorization, privacy, persistence, or accessibility finding remains.

Public Web feature behavior was not audited or changed. Its only source change removes obsolete props passed to the shared `@carchief/vehicle-search` component, and the focused Public Web consumer tests remain green.

## Requirement traceability

| Requirement | Result | Current evidence |
|---|---|---|
| CUST-01 | PASS | Credential guard, expired/invalid-session handling, protected routes and 401 browser coverage. |
| CUST-02 | PASS | Token-derived scope plus fresh-account and two-account IDOR browser/API matrix. |
| CUST-03 | PASS | Neutral recovery flow, expiring single-use token and production-disabled mock outbox; production provider remains an approved assumption. |
| CUST-04 | PASS | Server-derived dashboard vehicles, balance and alert cards. |
| CUST-05 | PASS | Server-projected tier and discounted inventory pricing. |
| CUST-06 | PASS | Server-derived credit limit/utilisation with worked contract coverage. |
| CUST-07 | PASS | `carchief` default and focused `ocean` production-preview parity. |
| CUST-08 | PASS | Query invalidation/refetch and authoritative freshness presentation. |
| CUST-09 | PASS | Complete non-draft inventory, shared search/filter/sort/pagination and customer detail navigation. |
| CUST-10 | PASS | Reserved/PI/invoiced fleet groupings from canonical transaction records. |
| CUST-11 | PASS | Five-stage shipment projection, timeline and exception states. |
| CUST-12 | PASS | Server-authoritative 50% deposit presentation and reconciliation. |
| CUST-13 | PASS | Canonical vehicle IDs and cross-view duplicate/phantom protection. |
| CUST-14 | PASS | Invoice total, paid and outstanding values reconcile. |
| CUST-15 | PASS | Authorized print/download projection and honest unavailable/denied states. |
| CUST-16 | PASS | One server-authoritative outstanding-balance projection across dashboard, invoices and payments. |
| CUST-17 | PASS | Payment list, filtering, detail, status and notification history. |
| CUST-18 | PASS | Idempotent TT submission, metadata-only proof boundary, validation, hold and resubmission. |
| CUST-19 | PASS | Allocated funds and remaining invoice balance are server projected. |
| CUST-20 | PASS | Ten-category customer-visible metadata vault; external storage policy remains explicitly deferred. |
| CUST-21 | PASS | Finance release plus `visibleToCustomer` gates document visibility. |
| CUST-22 | PASS | Customer-scoped notification filtering, read/mark-all state and linked navigation. |
| CUST-23 | PASS | Company, phone and delivery address update with validation/conflict/offline handling. |
| CUST-24 | PASS | Name/email remain immutable in UI and API. |
| CUST-25 | PASS | In-session password change supersedes the earlier handoff-only UI; no browser credential storage. |
| CUST-26 | PASS | Registration validates identity, country, dial code, phone, email and password. |
| CUST-27 | PASS | Mock-API-verified credential sign-in with enumeration-safe failures. |
| CUST-28 | PASS | Current-password verification and old-password invalidation. |
| CUST-29 | PASS | Neutral reset request, expiring single-use token and non-production outbox. |
| CUST-30 | PASS | No demo endpoint, UI entry point, badge or storage key remains. |
| RULE-01 | PASS | Dashboard, invoice and payment balances reconcile from linked records. |
| RULE-04 | PASS | Approved shipping-stage vocabulary and Finance release state are server projected. |
| RULE-05 | PASS | Exclusive 48-hour hold, owner/conflict and expiry coverage pass. |
| RULE-06 | PASS | Tier discount is server projected and displayed consistently. |
| RULE-07 | PASS | 50% deposit worked examples pass. |
| RULE-08 | PASS | Mutable flows persist and deterministic reset restores fixtures. |
| RULE-09 | PASS | Empty/partial/stale states do not invent data. |
| RULE-10 | PASS | Mock, manual and external boundaries are labelled honestly. |
| UI-01–UI-03 | PASS | Semantic themes, accessibility and responsive checks pass at 390×844, 768×1024 and 1440×900 after A-01/A-02. |
| PWA-01–PWA-04 | PASS | Manifest, static-shell caching, update/logout behavior and no offline mutation pass. |

## Assumption disposition

| Assumption | Result | Audit disposition |
|---|---|---|
| D02-ASM-001 | ASSUMPTION | Server-side finance formula remains implemented and internally consistent; Finance confirmation is still required. |
| D02-ASM-002 | ASSUMPTION | Ten-category metadata/release MVP remains valid; final storage, retention and scanning policy is deferred. |
| D02-ASM-003 | ASSUMPTION | Mock identity behavior remains honest; production AutoPulse/Keycloak contract is deferred. |
| D02-ASM-004 | ASSUMPTION | Metadata-only payment proof and deterministic outbox remain the safe Mock boundary. |
| D02-ASM-005 | ASSUMPTION | Shared 12–128 character MVP password policy remains enforced; production policy is deferred. |
| D02-ASM-006 | ASSUMPTION | Registration remains immediately usable without a fabricated verification email. |
| D02-ASM-007 | ASSUMPTION | Recovery uses the non-production outbox; live provider delivery remains deferred. |

## Findings and corrections

| ID | Severity | Finding | Correction and owner | Result |
|---|---|---|---|---|
| A-01 | High | Inventory detail, invoices, fleet, dashboard, documents, shipments, notifications and profile referenced undefined legacy theme aliases and/or literal status palettes, preventing reliable theme switching. | Replaced them with variables emitted by `@carchief/theme`; added a recursive Customer CSS regression that rejects undefined variables and palette literals. Owners: D02-P03-T003, P04-T003, P05-T003, P07-T003, P08-T002/T003 and P11-T002. | RESOLVED |
| A-02 | Medium | The authenticated desktop header overflowed a 1440px viewport by 38px and clipped Sign out. | Made header regions shrink-safe, compacted desktop navigation, retained the drawer through 1279px, and added a 1440px overflow assertion. Owner: D02-P01-T003. | RESOLVED |
| A-03 | Medium | Shipment acceptance first accepted the loading surface, then raced the API under parallel load and timed out even though cards rendered immediately afterward. | Wait for the authoritative shipment response and assert a terminal card/empty/error surface. Stress result: 18/18. Owner: D02-P07-T002. | RESOLVED |
| A-04 | Low | Five Customer symbols, six shared React imports, one event parameter and an entire exported filter primitive were unused; `CustomerTier`, invoice money/date formatting and invoice status mapping were duplicated. | Removed dead symbols/component, consolidated `CustomerTier` in `@carchief/domain`, and introduced shared invoice formatters/status mapping. Owners: D02-P01-T003, P02-T002, P03-T003, P05-T003 and P12-T002. | RESOLVED |

The intentionally unsupported all-at-once parallel command produced 147/159 because `@serial-reset` specs reset process-wide fixtures while unrelated workers ran. The repository test matrix requires two partitions. The supported results are 135/135 parallel-safe and 27/27 reset-tagged serial.

## Fresh runtime evidence

- Runtime profile: B (container).
- Target URL: `http://127.0.0.1:3001`.
- Customer App: `38d9e109e6a34778166ff3b08950ce583982bfba639b1716dc05e5b2e27097d2`, started `2026-08-16T10:23:25.679063299Z`, healthy.
- Mock API: `da26ce9cd3fd83b9e51cbed1622aa7c12d424b8fa4986393726bd2e7a1fc4d76`, started `2026-08-16T10:14:08.416091346Z`, healthy.
- PostgreSQL: `fd83667be1892df48410ab56e9dce9713a25c77e44963106903b6e3ed268714d`, started `2026-08-16T09:53:47.744673712Z`, healthy and accepting connections.
- Customer `/healthz`, Mock `/healthz`, Mock `/openapi.json`, `POST /api/v1/__reset`, and PostgreSQL `pg_isready`: PASS.
- Visual walkthrough: invoices at 1440×900, fleet at 768×1024 and inventory at 390×844; no clipping or horizontal overflow after A-02.

## Validation evidence

- Customer unit/component tests: 97/97 PASS.
- Full Vitest suite: 735/735 PASS across 72 files.
- API-client contracts: 55/55 PASS.
- Security projection: 6/6 PASS; production guard: 3/3 PASS.
- Theme contrast/provider: 43/43 PASS; `ocean` browser parity: 3/3 PASS.
- Customer Playwright: 135/135 parallel-safe plus 27/27 serial-reset = 162/162 PASS across Chromium, mobile-Chromium and tablet-Chromium.
- Shipment parallel stress: 18/18 PASS.
- Strict Customer and affected shared-package unused-symbol checks: PASS.
- Root quality, recursive build, architecture boundaries, task validation and `git diff --check`: PASS.
- `git diff -- POC`: empty.

## AI review

- Reviewed scope: Customer App, Customer-owned browser tests, affected shared domain/vehicle-search packages, and the mechanical Public Web shared consumer.
- Rules checked: requirement traceability, server authorization/IDOR, privacy, financial consistency, semantic themes, accessibility, responsive behavior, PWA safety, dead code and architecture boundaries.
- Remaining blocking findings: None.
- Result: PASS

## Blockers

None.
