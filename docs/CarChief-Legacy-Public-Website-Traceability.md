# CarChief Legacy Public Website Traceability

**Scope:** Public Website only. No Customer Application or Salesperson Application requirements/tasks are changed by this matrix.  
**Evidence source:** [`CarChief-Legacy-Public-Website-Audit.md`](CarChief-Legacy-Public-Website-Audit.md), captured 2026-08-07.

| Legacy public capability | Evidence level | Existing requirement / delivery coverage | Reconciliation action | Delivery 01 owner | Decision or boundary |
|---|---|---|---|---|---|
| Responsive desktop/mobile home | Source-confirmed by browser capture | Responsive architecture and Phase 1.1/1.2 | Retain; add legacy visual/UAT comparison | P01-T009, P02-T002, P08-T003 | Modern responsive layout, not fixed-column parity |
| Keyword, make/type and quick stock search | Source-confirmed | PUB-03–PUB-08, Phase 1.3 | Retain; include category/query-route mapping | P03-T001–T004 | Local natural-language remains optional/non-AI |
| Arrival, premium, clearance and other stock categories | Source-confirmed navigation | Only partly explicit | Add PUB-25 and category projection fixtures | P02-T001, P03-T001, P03-T003 | Commercial rules and availability come from service |
| Country, currency and language controls | Source-confirmed header | Partly implied by freight/country visibility | Add PUB-26; record behavior as open | P01-T009, P03-T001, P05-T001 | Currency/language semantics, countries and localization owner required |
| Country-specific stock landing routes | Source-confirmed links | BA publication/visibility discussion; not explicit public requirement | Add to PUB-25/PUB-26 | P03-T001–T004, P08-T001 | Country eligibility must be server-authoritative |
| Vehicle direct URL, gallery, specs, Ask for Price, share/print | Source-confirmed | PUB-09–PUB-11, Phase 1.4 | Retain; distinguish price-request from priced vehicle | P04-T001–T003, P06-T001–T002 | Wishlist/compare/PDF needs decision; no legacy document exposure assumed |
| Public auction information | Source-confirmed routes | How-to-buy/FAQ covered, but auction portfolio not explicit | Add PUB-27 | P07-T001, P07-T002, P07-T004 | No auction-site/API integration in MVP |
| Live Auction URL requires login | Source-confirmed browser redirect | PUB-22 broadly covers account entry | Make account-gated behavior explicit | P06-T003, P08-T001 | Confirm whether it launches a CarChief feature or external destination |
| General inquiry with vehicle preference fields | Source-confirmed browser capture | PUB-13–PUB-16 | Retain; expand input intent and anti-abuse boundary | P06-T001–T002 | CAPTCHA/provider choice is open; no real message delivery assumed |
| WhatsApp/email/call CTAs | Source-confirmed | Not explicit | Add PUB-28 | P02-T002, P04-T002, P06-T001–T002 | UI/contact-source intent only unless integration approved |
| Shipping Schedule page | Source-confirmed route, but broken at capture | Not explicit | Add PUB-29, with approved-source gate | P07-T001–T002, P08-T001 | Do not launch schedule without content/data owner |
| Company/services/team/bank/gallery/news/security content | Source-confirmed routes | PUB-17–PUB-21 only partly cover | Add PUB-30 | P07-T001–T002 | Bank/security/news content needs specific owners and approval |
| Privacy/cookie consent | Source-confirmed | PWA/privacy principles only | Add PUB-31 | P01-T009, P07-T002, P08-T002 | Legal approval required; no legacy script reuse |
| Legacy PHP/SEO routes | Source-confirmed route inventory | PUB-24, Phase 1.8 | Expand route-template inventory and regression evidence | P08-T001, P08-T004 | Full historical URL export remains required |
| Stock timeout and shipping PHP error | Source-confirmed browser capture | Error-state principles | Explicitly prohibit copying; add regression cases | P03-T004, P07-T002, P08-T003 | Production must show safe recovery, never server detail |

## Open decisions created by audit

1. Which country, currency and language choices are retained, and what changes actual inventory/pricing rather than display only?
2. Which stock categories are official launch categories, and how do they map to publication, commercial and price-readiness state?
3. Is a price-request vehicle visible when it has no approved public price, and what lead type/routing applies?
4. Is Live Auction a CarChief account feature, an external experience, or an excluded launch route?
5. Which public service/company/team/bank/news/security/shipping pages have approved current content owners?
6. Which WhatsApp/email/call/CAPTCHA providers are approved, if any?
7. Which legacy PHP paths must permanently redirect, and which should retire with a useful public response?
