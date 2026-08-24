# Page-to-API Mapping

This document maps the current frontend pages to the APIs they use. Calls made
through shared loaders, hooks, providers, and API-client services are included.
Customer-app paths below show their effective `/api/v1` endpoint, even where the
shared client supplies that prefix through its base URL.

## Public Website

| Page name | APIs used | API Used For |
|---|---|---|
| Home (`/`) | `GET /api/v1/vehicles?collection=browse`; `GET /api/v1/vehicles?collection=latest_arrivals`; `GET /api/v1/vehicles?collection=premium_teaser`; `GET /api/v1/vehicles?collection=discounted` | Server-side initial vehicle collection and live homepage showroom sections. |
| All stock (`/allstock`) | `GET /api/v1/vehicles` | Paginated vehicle browsing, filtering, sorting, and dynamic facets. |
| Vehicle detail (`/allstock/:slug`) | `GET /api/v1/vehicles/:idOrSlug`; `GET /api/v1/vehicles/:idOrSlug/inquiry-count`; `POST /api/v1/enquiries`; `POST /api/v1/reservations`; `GET /api/v1/customer/wishlist`; `POST /api/v1/customer/wishlist`; `DELETE /api/v1/customer/wishlist/:vehicleSlug` | Vehicle details, inquiry count, authenticated inquiry/reservation actions, and wishlist state/toggles. |
| Clearance stock (`/clearance-stock`) | `GET /api/v1/vehicles?collection=clearance` | Clearance vehicle listing with filters, facets, and pagination. |
| Search showroom (`/search-showroom`) | `GET /api/v1/vehicles` when rendered with live showroom data | Vehicle data used by the showroom search and make/model filtering. |
| About (`/about`) | None | Static company/about content. |
| Services (`/services`) | None | Static services content. |
| Contact (`/contact`) | None | Static contact form/content presentation. |
| FAQ (`/faq`) | `GET /api/v1/content/faq` | FAQ retrieval and FAQ filtering/search. |
| Testimonials (`/testimonials`) | `GET /api/v1/content/testimonials`; `POST /api/v1/content/testimonials` | Published testimonial list and authenticated/validated testimonial submission. |
| Freight calculator (`/freight-calculator`) | `GET /api/v1/freight/destinations`; `GET /api/v1/freight/ports`; `POST /api/v1/freight/estimate` | Destination and port catalogs plus shipping-cost estimation. |
| How to buy (`/how-to-buy`) | `GET /api/v1/bank-accounts` | Bank-transfer instructions and payment account information. |
| Auction (`/auction`) | `GET /api/v1/content/pages/auction-services` | Auction-service page content. |
| Shipping schedule (`/shipping-schedule`) | `GET /api/v1/content/pages/shipping-schedule` | Shipping-schedule page content. |
| Privacy (`/privacy`) | `GET /api/v1/content/pages/privacy-cookie-policy` | Privacy and cookie-policy content. |
| Content page (`/content/:slug`) | `GET /api/v1/content/pages/:slug` | Dynamic public content page retrieval. |
| Branch directory (`/branches`) | `GET /api/v1/content/offices` | Office and branch directory data. |
| Branch detail (`/branches/:branch`) | `GET /api/v1/content/branches/:idOrCode`; `GET /api/v1/vehicles` with the branch collection query | Branch content and branch-specific vehicle collections. |
| Account/login (`/account`) | `GET /api/v1/auth/me`; `GET /api/v1/config/public`; `POST /api/v1/auth/login`; `POST /api/v1/auth/password-reset`; `POST /api/v1/auth/password-reset/confirm` | Session state, public configuration, login, and password recovery. |
| Registration (`/register`) | `GET /api/v1/config/countries`; `POST /api/v1/auth/register` | Country selection and customer-account registration. |
| Auction/reservation sign-in flow | `GET /api/v1/auth/me`; `POST /api/v1/auth/login`; `POST /api/v1/reservations`; `GET /api/v1/reservations/:id` | Authentication guidance and authenticated reservation creation/retrieval. |
| Public enquiry/quote sections | `GET /api/v1/freight/destinations`; `GET /api/v1/freight/ports`; `POST /api/v1/enquiries` | Enquiry form catalogs and authenticated enquiry submission. |

## Customer App

All customer pages are rendered inside the authenticated customer shell. The
shell/session layer uses `GET /api/v1/auth/me` to restore and validate the
customer session; this shared API applies to the authenticated pages below.

| Page name | APIs used | API Used For |
|---|---|---|
| Login | `POST /api/v1/auth/login`; `GET /api/v1/auth/me` | Customer sign-in and session validation. |
| Registration/account recovery states | `POST /api/v1/auth/register`; `POST /api/v1/auth/password-reset`; `POST /api/v1/auth/password-reset/confirm` | Account creation and password recovery where exposed by the account flow. |
| Dashboard / Overview (`/dashboard`) | `GET /api/v1/auth/me`; `GET /api/v1/customer/dashboard`; `GET /api/v1/customer/vehicles`; `GET /api/v1/customer/invoices`; `GET /api/v1/customer/notifications`; `GET /api/v1/customer/inquiries`; `GET /api/v1/customer/profile`; `GET /api/v1/customer/documents`; `GET /api/v1/customer/shipments` | Dashboard KPIs, vehicle counts, invoices, notifications, inquiries, profile, documents, and shipment summaries. |
| Customer inventory (`/inventory`) | `GET /api/v1/customer/profile`; `GET /api/v1/customer/tier-benefits`; `GET /api/v1/vehicles` with customer audience/filter parameters | Customer profile context, database-driven tier discount/reservation benefits, and searchable customer-visible inventory with compliance filtering, pagination, and facets. |
| Customer inventory vehicle detail (`/inventory/:slug`) | `GET /api/v1/customer/profile`; `GET /api/v1/customer/tier-benefits`; `GET /api/v1/vehicles/:idOrSlug`; `GET /api/v1/customer/wishlist`; `POST /api/v1/customer/wishlist`; `DELETE /api/v1/customer/wishlist/:vehicleSlug`; `POST /api/v1/reservations`; `POST /api/v1/enquiries` | Customer profile and tier-benefit context, customer-projected vehicle pricing/detail, wishlist state/toggles, reservation creation subject to tier quota, and price inquiries. |
| My vehicles (`/vehicles`) | `GET /api/v1/customer/vehicles` | Customer fleet list and ownership-scoped vehicle status. |
| My vehicle detail (`/vehicles/:idOrSlug`) | `GET /api/v1/customer/vehicles/:idOrSlug` | Ownership-scoped fleet vehicle detail. |
| Inquiries (`/inquiries`) | `GET /api/v1/customer/inquiries` | Authenticated customer inquiry and quote history. |
| Wishlist (`/wishlist`) | `GET /api/v1/customer/wishlist`; `POST /api/v1/customer/wishlist`; `DELETE /api/v1/customer/wishlist/:vehicleSlug` | Wishlist listing and add/remove operations. |
| Favourites (`/favourites`) | `GET /api/v1/customer/favourites`; `POST /api/v1/customer/favourites`; `DELETE /api/v1/customer/favourites/:id`; `GET /api/v1/customer/favourites/facets` | Saved vehicle searches, saved-search mutations, and favourite-search facets. |
| Statement (`/statement`) | `GET /api/v1/customer/statement`; `GET /api/v1/customer/invoices` | Customer account statement and invoice data used to build the ledger. |
| Documents (`/documents`) | `GET /api/v1/customer/documents`; `GET /api/v1/customer/documents/:id` | Customer document list and document detail retrieval. |
| Invoices (`/invoices`) | `GET /api/v1/customer/invoices`; `GET /api/v1/customer/vehicles` | Invoice list and related customer vehicle information. |
| Invoice detail (`/invoices/:id`) | `GET /api/v1/customer/invoices/:id`; `GET /api/v1/customer/invoices/:id/document` | Invoice details and printable/downloadable invoice document. |
| Payments (`/payments`) | `GET /api/v1/customer/payments`; `GET /api/v1/customer/payments/:id`; `POST /api/v1/customer/payments`; `POST /api/v1/customer/payments/:id/resubmit`; `GET /api/v1/customer/payment-notifications`; `POST /api/v1/finance/customer-payments/:id/notifications`; `GET /api/v1/customer/debit-credit` | Payment list/detail, payment submission and resubmission, payment notifications, and debit/credit/refund history. |
| Shipments (`/shipments`) | `GET /api/v1/customer/shipments`; `GET /api/v1/customer/shipments/:id` | Shipment list and shipment tracking detail. |
| Notifications (`/notifications`) | `GET /api/v1/customer/notifications`; `GET /api/v1/customer/notifications/:id`; `POST /api/v1/customer/notifications/:id/read`; `POST /api/v1/customer/notifications/read-all`; `DELETE /api/v1/customer/notifications/:id` | Notification listing, detail, read-state changes, and deletion. |
| Profile (`/profile`) | `GET /api/v1/customer/profile`; `PUT /api/v1/customer/profile`; `POST /api/v1/auth/change-password`; `GET /api/v1/auth/me` | Customer profile display/update, password change, and refreshed session identity. |
| Shared account guard/session | `GET /api/v1/auth/me` | Restores the authenticated customer session before protected pages render. |

## Notes

- `GET /api/v1/vehicles` is the canonical vehicle collection endpoint; the removed `/api/v1/vehicles/search` endpoint is intentionally not listed.
- Customer API-client services sometimes use paths such as `/customer/vehicles` because the customer app’s `HttpClient` base URL is `/api/v1`; the effective API paths are shown above with the full prefix.
- `None` means the page itself is static and does not currently issue a backend API request.
