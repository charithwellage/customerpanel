# CarChief Legacy Public Website Audit

**Scope:** public production website only (`https://www.carchief.com`)  
**Capture date:** 2026-08-07  
**Method:** Playwright Chromium navigation at desktop and mobile viewports, supplemented by public HTML route/title inspection. This is observed production behaviour, not approval to reproduce legacy defects, copy assets, or implement external integrations.

## Executive finding

The public site is broader than the prior Public Website scope. It contains a stock-led acquisition site with country/currency/language controls, stock categories, public vehicle detail, price-request/quotation and enquiry paths, public auction information, service and company-content pages, shipping schedule, privacy/cookie consent, and account entry. The existing Delivery 01 plan already covers the core visitor journey, but needed explicit coverage for the public page inventory, stock/category/country projection, auction information, public support channels, shipping schedule, and the legacy URL map.

## Evidence and limitations

- Screenshots are stored in [`docs/evidence/legacy-public-site/`](evidence/legacy-public-site/).
- The homepage was captured successfully at desktop and mobile widths. The mobile capture confirms a separate compact composition rather than a simple scaled desktop page.
- Selected public routes were navigated with Playwright. The stock-list route returned a Cloudflare/origin timeout and the shipping-schedule route displayed a server error during the audit. These are recorded as legacy defects, not requirements.
- The public `Live Auction` URL redirected to the member-login page in the unauthenticated browser session. Live-auction access must therefore remain an account-gated/open business rule, not a public launch promise.
- The audit did not submit forms, complete CAPTCHA, sign in, make a reservation, send WhatsApp, or perform any action that would create production data or contact staff.
- Screenshots and route labels provide visual/content evidence only. Company claims, contact details, testimonials, logos, images, partner badges, downloadable files, pricing, stock availability, and third-party links need content-owner approval before reuse.

## Observed global experience

| Area | Observed behaviour | Target handling |
|---|---|---|
| Header | Brand, keyword search, country, currency and language selectors, stock count, phone contact, Register and Login links | Preserve as responsive public-shell capabilities. Country/currency/language semantics and available choices require business confirmation. |
| Primary navigation | Browse Stock, Premium Stock, Clearance Stock, Auction, About Us, How to Buy, Testimonials, FAQ, Inquiry, Services and Contact Us | Retain equivalent information architecture or an approved consolidation; map every legacy route before release. |
| Shared support | WhatsApp, email and request-a-call CTAs appear on public pages | Present safe contact actions and lead-source metadata. Do not claim WhatsApp/email/call integration without an approved provider. |
| Cookie/privacy | Cookie-consent banner and Privacy/Cookie Policy link appear | Deliver consent and privacy policy only after legal/content approval; do not reuse the legacy implementation. |
| Footer | Contact offices, membership badges, country links and deep browse links | Make responsive and data-driven; only approved claims/assets are shown. |

## Page-template inventory

The list groups repeated country, make, type, price, year and vehicle URLs into templates. It is not an instruction to replicate every legacy URL verbatim; Phase 1.8 creates the approved redirect inventory.

| Template / representative legacy route | Observed content or action | Coverage after reconciliation |
|---|---|---|
| `/` | Search tabs (make/type/quick search), latest-arrival cards, promo blocks, testimonials, service/value blocks, country links and support CTAs | Delivery 01 Phases 1.2, 1.3, 1.6 and 1.7 |
| `/stock_list.php` plus category/query variants | Browse stock, arrival/premium/clearance/discount category links and make/type/price/year filters. At capture, this route failed with a timeout. | Phase 1.3; error state is explicitly tested and never copied as normal behaviour. |
| `/list/{make}`, `/type/{type}`, `/stock/{country}`, `make-model.php`, `type-model.php` | Make/type/country landing/query routes found in live navigation | Phase 1.3 URL-backed filters and Phase 1.8 redirects/indexing policy |
| `/{vehicle-id}-japan-used-*.html` | Vehicle status ribbon, images, specifications, “Ask for Price”, country/currency context, wishlist/compare/print/PDF labels, WhatsApp and quote CTAs | Phase 1.4 and Phase 1.6; wishlist/compare/PDF are open decisions, not automatic parity commitments. |
| `/auction/search_auction.php` | Link exposed as Live Auction, but unauthenticated navigation led to member login | Phase 1.7 contains public auction guidance. Account-gated live auction is a decision/legacy-redirect case. |
| `japan_auto_auction.php`, `auction_calender.php`, `auction_terms.php`, `faq_auction.php`, `how_to_buy_from_auction.php` | Auction services, calendar, terms, FAQ and guidance routes | Phase 1.7 approved content/FAQ routes; externally sourced auction data remains out of scope. |
| `how_to_buy.php`, `how_to_buy_from_stock.php` | Buy-from-stock and buy-from-auction guidance, with search/new-arrivals/FAQ/freight/inquiry shortcuts | Phase 1.7 buying guides; no unapproved process claims. |
| `enquiry.php`, `send.php` | General vehicle inquiry form with vehicle preferences, country, contact fields, message and CAPTCHA; email/call CTAs | Phase 1.6. CAPTCHA/anti-abuse provider is an open implementation decision. |
| `faq.php` | Category/accordion FAQ with website/services and ordering/shipment content | Phase 1.7 FAQ; existing twelve-category target remains subject to approved taxonomy. |
| `shipping_schedule.php` | Shipping Schedule page; audit showed a PHP fatal error rather than usable schedule data | Phase 1.7 public schedule content only if an approved source/owner exists; never reproduce error output. |
| `company_profile.php`, `why_us.php`, `services.php`, `our_team.php`, `bank_details.php`, `photo-gallery.php` | Company, services, differentiators, team, bank information and gallery pages | Phase 1.7 content portfolio; publishing sensitive bank details requires finance/security approval. |
| `voice.php`, `news_details.php`, `security_update.php` | Testimonials, latest news and security update pages | Phase 1.7 content and moderation. Security notices/news need an approved publishing owner. |
| `registration.php`, `login.php` | Public registration/member login entry; login capture displayed CAPTCHA | Phase 1.6 public account-entry routing. Production identity and CAPTCHA are excluded from frontend MVP until approved. |
| `privacy.php` | Privacy/Cookie Policy route | Phase 1.7 policy page only with approved legal copy; Phase 1.8 redirect and indexing checks. |

## Verified visual and responsive observations

| Evidence | Observation |
|---|---|
| [`home-desktop-2026-08-07.png`](evidence/legacy-public-site/home-desktop-2026-08-07.png) | Desktop page has dense sidebars, three-column content, search, vehicle cards, testimonials, service cards, country lists and a fixed cookie banner. |
| [`home-mobile-2026-08-07.png`](evidence/legacy-public-site/home-mobile-2026-08-07.png) | Mobile hides/condenses much desktop navigation and shows a compact make/type/quick-search route, cards, content sections and cookie banner. New implementation must preserve capabilities without hiding essential information. |
| [`vehicle-detail-desktop.png`](evidence/legacy-public-site/vehicle-detail-desktop.png) | Public detail route loads directly; shows large vehicle image, price-request state, specification grid, share/compare/print/PDF labels and enquiry/support CTAs. |
| [`live-auction-desktop.png`](evidence/legacy-public-site/live-auction-desktop.png) | Unauthenticated live-auction navigation reaches member login. |
| [`enquiry-desktop.png`](evidence/legacy-public-site/enquiry-desktop.png) | General inquiry includes vehicle preference and visitor details, country, message and CAPTCHA. |
| [`faq-desktop.png`](evidence/legacy-public-site/faq-desktop.png) | FAQ is public, category-led and accordion-like. |
| Playwright navigation record (screenshots deliberately not retained) | The stock-list route returned a timeout/maintenance response and the shipping-schedule route returned an upstream server error. Screenshots containing operational/error details were excluded from repository evidence. |

## Explicit non-parity items

- Do not reproduce server errors, Cloudflare timeout/maintenance screens, internal server paths, browser zoom restrictions, fixed dense sidebars, or insecure client-side/legacy form behaviour.
- Do not treat a WhatsApp, email, phone, PDF, compare, wishlist, CAPTCHA, stock counter, shipping schedule, auction calendar, bank page or partner badge as proof of a working backend or third-party integration.
- Do not reuse production copy, images, reviews, personal/contact-looking information, badges, policy text or pricing without owner approval.
- Do not expose legacy account authentication or CAPTCHA as the target identity/security design.

## Reconciliation result

The corresponding traceability matrix is [`docs/CarChief-Legacy-Public-Website-Traceability.md`](CarChief-Legacy-Public-Website-Traceability.md). It records the source-confirmed audit items, existing scope match, corrections, Delivery 01 task ownership and decisions still needed before implementation.
