# CarChief Legacy Public Requirements Reconciliation

**Purpose:** reconcile three supplied legacy-business PDFs with the replacement Public Website requirements and Delivery 01 task plan.

**Reviewed:** 7 August 2026
**Scope:** Public Website only. Customer and Salesperson requirements are unchanged.

## Evidence used

| Source | Pages | What it establishes |
|---|---:|---|
| *Homepage Display as per country IP – Requirements 2 – revised 1.2* | 4 | Country/port-aware stock, ETD/ETA location categories, latest-arrival, Browse Stock, discounted, clearance and fallback rules |
| *Premium Stocks Web Page – Manual* | 3 | Premium page entry points, teaser/list, enquiry and WhatsApp intent |
| *Brach Page – Front End* | 3 | Branch-page structure and branch-specific stock/content collections |

The PDFs are business evidence for the replacement application. They do not authorize copying the legacy layout, branded assets, direct IP lookup, WhatsApp automation, insecure client-side rules or obsolete server behavior.

## Reconciliation result

| Legacy-business requirement | Result in the replacement | Requirement / delivery mapping |
|---|---|---|
| Derive In Japan, In Transit and In Port from ETD and ETA | Added. The API/BFF is authoritative; the browser displays the returned category. | `PUB-32`; D01-P02-T001, D01-P03-T001 |
| Recalculate category after ETD/ETA change | Added as a service transition rule and regression case. | `PUB-32`; D01-P03-T001/T004 |
| Auto-detected country and manual country selection | Added with a manual fallback. A real geo-IP provider, consent and override policy remain decisions. | `PUB-32`; D01-P02-T002, D01-P03-T001 |
| Market/port eligibility, including multiple ports | Added. The API returns the eligible union; the browser does not manufacture eligibility. | `PUB-32`, `PUB-33`; D01-P03-T001/T004 |
| Latest Arrivals: In Japan, created in the previous five days | Added. | `PUB-33`; D01-P02-T001/T002 |
| Browse Stock, Discounted/Best Offers and Clearance collections | Clarified as market-aware collections, with stock category coming from the service. | `PUB-33`; D01-P02-T001/T002, D01-P03-T001/T004 |
| No-stock country fallback | Added: eligible In Japan only; Latest Arrivals still uses the five-day rule. | `PUB-33`; D01-P03-T001/T004 |
| Sidebar/filter values reflect selected-country stock | Added. | `PUB-33`; D01-P03-T001/T003/T004 |
| Remove the legacy “New” tag | Added as an explicit non-requirement. | `PUB-33`; D01-P02-T002 |
| Premium page via home banner and navigation | Added. | `PUB-34`; D01-P02-T002, D01-P03-T004 |
| Premium teaser, full filtered list, enquiry and WhatsApp | Added. The teaser contains up to ten items; WhatsApp remains contact intent unless an approved provider is implemented. | `PUB-34`; D01-P02-T001/T002, D01-P03-T004, D01-P06-T001/T002 |
| Branch-page structure and branch-specific arrival/discount collections | Added. | `PUB-35`; D01-P07-T001/T002 |

## Source requirements that remain decisions

The PDFs use business terms that are not defined sufficiently to encode them safely:

- **J stock** and **CRFO stock**: their definitions and their precedence relative to location ordering are not stated.
- **Branch**: the PDFs do not say whether it means a physical office, country market, sales team, legal company, or another business unit.
- **Automatic country detection**: the PDFs request IP detection but do not name a provider, privacy/legal basis, accuracy threshold, override rule or unavailable-service behavior.
- **Market-to-port mapping**: the PDFs require port-aware results but do not supply the authoritative country/port mapping or exceptions.
- **Premium contact**: the PDFs show WhatsApp chat; this is a contact action, not proof that a message integration exists.

These are tracked in `REQUIREMENT.md` Open Questions 26–29 and `tasks/DECISION_REGISTER.md`.

## Delivery impact

The existing Public Website sequence remains unchanged. The work is added to the existing components rather than creating a new delivery:

| Delivery phase | Added scope |
|---|---|
| 1.2 — Home and showroom | Market-aware latest, discounted, clearance and Premium teaser collections; manual-country control; Premium banner/menu route; no legacy New tag |
| 1.3 — Inventory and search | Server-authoritative ETD/ETA location projection, port eligibility, country selection, fallback, category ordering and accurate filter universe |
| 1.6 — Enquiry | Premium enquiry source/type and honest WhatsApp contact intent |
| 1.7 — Public information and content | Branch content/contacts, Branch landing template and branch-specific collections |
| 1.8 — Acceptance | Desktop/mobile assertions for the approved market, Premium and Branch journeys; legacy-route/metadata decisions |

The new scope adds two delivery days across the existing Public Website phases. It does not add external geo-IP, WhatsApp, ERP, auction or other vendor integration work.

## Required acceptance examples

1. A vehicle with no ETD/ETA, a future ETD, a past ETD/future ETA, and a past ETA is projected as In Japan, In Japan, In Transit and In Port respectively.
2. Changing ETD or ETA changes the next service response after refresh; the browser does not calculate the state itself.
3. A manually selected market with two ports returns only the eligible union of those ports’ stock, while a no-stock market falls back only to the approved In Japan collection.
4. Latest Arrivals excludes an older In Japan vehicle and any vehicle not in the returned In Japan projection.
5. Premium Stock is reachable from both its banner and navigation; the full-list action preserves the Premium filter and the enquiry is recorded as Premium-sourced.
6. A Branch page displays only approved branch content and its own Latest Arrivals/Recently Discounted collections, with honest empty and unavailable states.

## Deliberately not copied

- Dense legacy fixed-column layout, unsupported browser behavior and old visual styling.
- A legacy “New” tag.
- Direct browser IP lookup or an unapproved geo-IP provider.
- A claim that WhatsApp delivery occurred without an approved integration response.
- Any legacy stock record, customer information, image or other content without owner approval.
