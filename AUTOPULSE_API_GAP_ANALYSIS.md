# AutoPulse API Gap Analysis for CarChief Frontends

**Audience:** AutoPulse backend, portal API, identity, and integration teams  
**Analysis date:** 21 August 2026  
**Purpose:** Identify the AutoPulse contract work required to replace the CarChief Mock API for `apps/public-web` and `apps/customer-app`.

## 1. Executive summary

The current frontends require **30 business capability groups**. The exposed AutoPulse Customer Portal Swagger contains plausible operations for 22 groups, but those operations require contract or behavior changes. Eight groups have no suitable exposed operation.

| Result | Count | Meaning |
|---|---:|---|
| Compatible | 0 | No operation can yet be declared integration-ready because AutoPulse does not document any success response body. |
| Partial Match | 22 | An AutoPulse operation exists for at least part of the capability, but request, response, workflow, security, pagination, or identifier work is required. |
| Missing API | 8 | No suitable operation is exposed in the AutoPulse Customer Portal Swagger. |

The most important findings are:

1. **All 93 AutoPulse portal operations define only an undocumented `200 Success` response.** No success response schema is supplied. Under the agreed comparison rule, every frontend-required response field is therefore missing until AutoPulse returns and documents it.
2. **No error contracts are documented.** The frontends need distinguishable `400`, `401`, `403`, `404`, and `409` responses for validation, authentication, ownership, not-found, duplicate, reservation conflict, optimistic concurrency, and payment workflow states.
3. **The Swagger applies Bearer security globally**, including `/api/portal/public/*` and OTP initiation/verification, because those operations do not override the root security requirement. Public catalog, content, registration/access, and sign-in initiation must be explicitly anonymous where intended.
4. **Vehicle browsing is the closest functional match**, but neither AutoPulse collection endpoint supplies the full combination of advanced filters, collections, facets, and page metadata used by both frontends.
5. **Authentication is a workflow mismatch.** CarChief currently expects email/password plus registration, change-password, and reset operations; AutoPulse exposes phone OTP request/verification only. Either the frontends need an approved identity adapter or AutoPulse must expose an equivalent frontend contract.
6. **Customer finance and logistics are incomplete at portal-contract level.** List operations exist for invoices and shipments, but detail, documents, payment history/submission/resubmission, notification, and customer-scoped status contracts are absent or only represented by deal-specific actions.

### P0 integration blockers

- Document response schemas, required fields, status codes, errors, and anonymous-operation security for the portal Swagger.
- Finalize the identity contract and token claims used by both frontends.
- Complete public/customer vehicle search, vehicle detail, enquiry, and reservation contracts.
- Complete customer ownership-scoped fleet, invoice, payment, shipment, document, profile, and notification contracts.

## 2. Evidence and comparison rules

| Source | Snapshot facts | Use in this analysis |
|---|---|---|
| CarChief `openapi/openapi.json` | `CarChief API Service` v1.0.0; 52 paths, 58 operations, 98 schemas | Mock request/response and error contract. |
| Current frontend source | API-client services, feature hooks, server loaders, and direct `fetch` calls | Authoritative list of APIs and fields actually required by `public-web` and `customer-app`. |
| Attached AutoPulse portal `swagger.json` | `AutoPulse Customer Portal API`; 86 paths, 93 operations, 33 request schemas | Authoritative evidence that an AutoPulse portal operation is exposed. |
| Attached `autopulse_swagger.json` | `AutoPulse API` v1; 637 schemas and zero paths | Supporting evidence that an entity/DTO may exist internally; never treated as proof that an API exists. |

The report excludes health, reset, test outbox, staff lead listing, and finance-administration operations that neither frontend calls. API matching is based on business capability, not path similarity. `Partial Match` means AutoPulse should extend the named operation unless the team determines that a dedicated portal projection is safer. `Missing API` means no suitable operation is exposed in the portal Swagger.

### Schema-only implementation clues

The larger AutoPulse schema catalogue shows that some required data probably already exists internally. These mappings can reduce implementation effort, but they do not remove the need for typed portal response DTOs.

| AutoPulse internal schema | Useful existing fields | Important unresolved mapping |
|---|---|---|
| `AutoPulse.API.Domain.Entities.Vehicle` | ID, stock code, chassis, make/model/year, FOB/tier prices, location/port, mileage, engine, fuel, transmission, drive, steering, color/grades, status/lifecycle, features, country suitability, images/video/inspection sheet, model code, body type, ETD/ETA/ATA, dimensions | No stable public slug; price semantics (`fobPrice` versus frontend `priceUsd`) need approval; engine/mileage types differ; public media visibility, facets, reservation eligibility, and canonical pagination still need portal projections. |
| `AutoPulse.API.Domain.Entities.Reservation` | Client/vehicle/deal IDs, created/expiry dates, status, extension, deposit/payment, cancellation, logistics, documents | Portal create response is undocumented; frontend hold hours/status vocabulary and owner-scoped lookup must be normalized. |
| `AutoPulse.API.Domain.Entities.ClientProfile` | Name, email/phones, company, address/city, preferred port/currency, tier, credit limit, saved vehicle IDs, notification preferences | Portal profile response/update is undocumented; frontend needs a safe subset, delivery address, version, and optimistic concurrency without internal notes/risk/audit leakage. |
| `AutoPulse.API.Domain.Entities.BankAccount` | Bank/account names and number, SWIFT/BIC, currency, branch address, active/default flags | No portal operation exposes a safe public projection; tenant, audit, pending-change, and deletion fields must not be returned. |
| `AutoPulse.API.Application.DTOs.ShippingDocumentDto` | Document type/number, original name, URL/path, size, BL status | Customer visibility and document-release authorization are not represented in the portal contract. |
| Payment DTOs (`CreatePaymentRecordDto`, `PaymentProofUploadRequest`) | Invoice/booking references, amounts, method/reference, proof document/receipt, deposit flag | Customer ownership, idempotency, status/hold/resubmission, allocations, remaining balance, and response/event projections remain missing. |

Priority definitions:

- **P0:** Blocks a core page, sign-in, protected data boundary, or transactional flow.
- **P1:** Required for a complete current page or customer workflow, but can follow the core catalog/session path.
- **P2:** Content or engagement capability that can temporarily show an unavailable state without corrupting a transaction.

## 3. Shared identity and configuration mapping

| Frontend capability/page | Mock API | AutoPulse API candidate | Match status | Request gaps | Response gaps | Required AutoPulse action | Priority |
|---|---|---|---|---|---|---|---|
| Public branding and account entry | `GET /api/v1/config/public` | `GET /api/portal/branding` + `GET /api/portal/storefront-config` | Partial Match + Response Contract Gap | Confirm whether both calls are needed and make them anonymous. | Missing `siteName`, `currency`, `contactPhone`, optional `liveAuctionUrl`. | Return a stable storefront configuration projection, or document a deterministic merge of the two responses. | P1 |
| Session bootstrap for both apps | `GET /api/v1/auth/me` | `GET /api/portal/me` | Authentication/Authorization Gap + Response Contract Gap | Bearer token format, issuer, expiry, and role/permission semantics are undocumented. | Missing `sub`, `email`, `role`, `permissions`, `exp`. | Return stable identity claims and document `401` behavior for missing/expired tokens. | P0 |
| Login | `POST /api/v1/auth/login` | `POST /api/portal/auth/request-otp` + `POST /api/portal/auth/verify-otp` | Authentication/Authorization Gap | Mock sends `email,password`; AutoPulse sends `phone`, then `sessionId,code`. Required fields and attempt/expiry rules are undocumented. | Missing token plus normalized claims response. | Approve OTP as the production UX and expose a two-step typed contract, or provide an adapter matching the existing login contract. Explicitly remove Bearer security from OTP initiation/verification. | P0 |
| Customer registration | `POST /api/v1/auth/register` | `POST /api/portal/public/request-access` | Missing API | Request-access has `name,phone,interest,country`; registration needs `nameWithInitials,countryCode,mobileNumber,email,password,confirmPassword`. | Missing created account ID, customer ID, status, verification state, and timestamps. | Add a real identity/customer registration operation; do not treat a lead/access request as account creation. | P0 |
| Change password | `POST /api/v1/auth/change-password` | None | Missing API | Needs `currentPassword,newPassword,confirmNewPassword` or an approved identity-provider redirect/command. | Missing success/error contract. | Expose the Keycloak/AutoPulse password-change contract used by an authenticated customer. | P1 |
| Password recovery | `POST /api/v1/auth/password-reset`; `POST /api/v1/auth/password-reset/confirm` | None | Missing API | Needs neutral email reset request and token/new-password confirmation, or an approved hosted identity flow. | Missing neutral accepted response, invalid/expired-token errors, and success response. | Expose or document the production identity-provider recovery flow without revealing account existence. | P1 |
| Registration country and dial-code selector | `GET /api/v1/config/countries` | None | Missing API | None. | Missing `items[{isoCode,name,dialCode}]`. | Add an anonymous supported-country catalogue endpoint. | P1 |

## 4. Public Website mapping

| Frontend capability/page | Mock API | AutoPulse API candidate | Match status | Request gaps | Response gaps | Required AutoPulse action | Priority |
|---|---|---|---|---|---|---|---|
| Home collections, All Stock, Clearance, branch stock, and customer inventory browse | `GET /api/v1/vehicles` | `GET /api/portal/public/inventory`; `GET /api/portal/public/catalog`; authenticated alternative `GET /api/portal/stock` | Partial Match + Request/Response Contract Gap | No single endpoint supports advanced filters, named collections, facets, compliance/audience/tier projection, and page navigation. See §7.1. | Missing vehicle items, canonical pagination metadata, and dynamic facets. | Make one canonical portal inventory endpoint support all current browsing modes and return the contract in §8. | P0 |
| Public and customer-projected vehicle detail | `GET /api/v1/vehicles/{idOrSlug}` | `GET /api/portal/public/catalog/{id}`; authenticated alternative `GET /api/portal/stock/{id}` | Partial Match + Response Contract Gap | AutoPulse accepts ID only; frontend routes use stable slug or ID and may send `audience`, `tier`, and `destinationCountry`. | Entire detail projection is undocumented, including media visibility, price state, tier price, and reservation eligibility. | Support ID or canonical slug and return a public-safe/customer-aware detail projection. | P0 |
| Freight calculator and enquiry destination selectors | `GET /api/v1/freight/destinations`; `GET /api/v1/freight/ports`; `POST /api/v1/freight/estimate` | `GET /api/portal/public/freight?dest&method` | Partial Match + Missing APIs | No destination/port catalogues. Existing GET does not accept `destinationCode`, `portCode`, or optional dimensions as the mock does. | Missing destination/port items and estimate outcome/rate context. | Add destination and port catalogues; extend freight estimation or add a typed estimate command. | P1 |
| Authenticated general/vehicle/price enquiry | `POST /api/v1/enquiries` | `POST /api/portal/public/catalog/{id}/inquiry`; deal-shipment alternative `POST /api/portal/my-vehicles/{dealId}/inquiry` | Partial Match + Authentication Gap | AutoPulse requires client-supplied `name,phone,email`; CarChief derives customer identity from the token and sends enquiry context. General enquiries have no catalog ID. | Missing enquiry ID, received time, duplicate flag, status, type/source, customer ownership, and estimate snapshot. | Make identity server-derived, allow general and vehicle enquiries, preserve deduplication, and return the normalized receipt. | P0 |
| Reservation hold and confirmation view | `POST /api/v1/reservations`; `GET /api/v1/reservations/{id}` | `POST /api/portal/reserve`; related `GET /api/portal/reserve-quote` | Partial Match + Missing API | Mock accepts slug; AutoPulse accepts `vehicleId` plus optional payment/customer override fields. Required fields are not declared. | Missing normalized 48-hour hold response and owner-scoped lookup. | Separate reservation creation from optional TT/checkout data, enforce token ownership, return hold metadata, and add `GET /api/portal/reservations/{id}`. | P0 |
| FAQ browser/search | `GET /api/v1/content/faq?category&q` | `GET /api/portal/knowledge?query` | Partial Match + Response Contract Gap | Missing category filter and defined no-match behavior. | Missing categories, ordered FAQ items, total, grounded-no-answer flag, and message. | Extend `knowledge` with FAQ categories and a typed public response, or add a dedicated FAQ endpoint. | P2 |
| Testimonials list and submission | `GET /api/v1/content/testimonials`; `POST /api/v1/content/testimonials` | `GET /api/portal/public/catalog/{id}/reviews`; `POST /api/portal/my-vehicles/{dealId}/review` | Partial Match + Missing APIs | AutoPulse reviews are vehicle/deal scoped; submission has `score,comment`, while the public page needs testimonial metadata and consent. | Missing global approved testimonial list, total, and submission receipt. | Add/expose global approved testimonials plus authenticated submission, or explicitly aggregate approved vehicle reviews into that contract. | P2 |
| Public content pages, auction, shipping schedule, and privacy | `GET /api/v1/content/pages`; `GET /api/v1/content/pages/{slug}` | `GET /api/portal/public/pages`; `GET /api/portal/public/pages/{slug}` | Partial Match + Response Contract Gap | Path behavior is compatible; anonymous security and slug/not-found behavior are undocumented. | Missing `slug,title,summary,body,owner,status,updatedAt`, optional sections/metadata. | Document and return the content-page schema plus `404` and anonymous access. | P1 |
| Office directory and branch pages | `GET /api/v1/content/offices`; `GET /api/v1/content/branches`; `GET /api/v1/content/branches/{id}` | None | Missing API | None. | Missing office and branch content projections. | Add anonymous office/branch list and branch detail endpoints, or include typed branch collections in storefront configuration. | P1 |
| Bank-transfer instructions on How to Buy | `GET /api/v1/bank-accounts` | None; schema-only evidence: `AutoPulse.API.Domain.Entities.BankAccount` | Missing API | None. | Missing active public bank-account projection. | Expose a safe, read-only bank account endpoint that omits internal audit/change fields. | P1 |

## 5. Customer App mapping

| Frontend capability/page | Mock API | AutoPulse API candidate | Match status | Request gaps | Response gaps | Required AutoPulse action | Priority |
|---|---|---|---|---|---|---|---|
| Dashboard / Overview | `GET /api/v1/customer/dashboard` | `GET /api/portal/insights/dashboards` | Partial Match + Response Contract Gap | No customer KPI/dashboard identifier or version is documented. | Missing balances, credit utilisation, vehicle counts, payment/shipment summaries, document counts, and unread count. | Return a stable customer dashboard aggregate; do not require the browser to reconcile finance/logistics records. | P1 |
| My Vehicles list and detail | `GET /api/v1/customer/vehicles`; `GET /api/v1/customer/vehicles/{id}` | `GET /api/portal/my-vehicles`; `GET /api/portal/my-vehicles/{dealId}/documents`; `GET /api/portal/my-vehicles/{dealId}/delivery`; `GET /api/portal/my-vehicles/{dealId}/condition`; `GET /api/portal/my-vehicles/{dealId}/cap`; `GET /api/portal/my-vehicles/{dealId}/door-price` | Partial Match + Missing API | List lacks status/search/page/limit. No single owner-scoped detail operation exists. AutoPulse is deal-ID based; frontend supports vehicle ID/slug. | Missing fleet totals/status counts and complete transaction detail. | Extend list filtering/pagination and add a composed owner-scoped detail projection keyed by a documented canonical identifier. | P0 |
| Customer inquiry history | `GET /api/v1/customer/inquiries` | None; AutoPulse only exposes inquiry submission | Missing API | None. | Missing customer inquiry rows and inquirer counts. | Add an owner-scoped inquiry history endpoint. | P1 |
| Wishlist on vehicle detail and Wishlist page | `GET /api/v1/customer/wishlist`; `POST /api/v1/customer/wishlist`; `DELETE /api/v1/customer/wishlist/{vehicleSlug}` | `POST /api/portal/stock/{id}/save`; `GET /api/portal/stock?savedOnly=true` | Partial Match + Missing API | Save semantics are undocumented; no explicit remove operation; ID/slug mismatch. | Missing wishlist list and deterministic toggle/remove response. | Define add/remove semantics, expose DELETE, and return customer-scoped saved vehicle summaries. | P1 |
| Favourite/saved searches | `GET /api/v1/customer/favourites`; `POST /api/v1/customer/favourites`; `DELETE /api/v1/customer/favourites/{id}`; `GET /api/v1/customer/favourites/facets` | `GET /api/portal/saved-searches`; `POST /api/portal/saved-searches`; `DELETE /api/portal/saved-searches/{id}` | Partial Match + Request/Response Contract Gap | Auto DTO supports only label, free search, make, body type, minimum year, and maximum price. Missing model and other current criteria. No facets endpoint. | Missing normalized search criteria, limit, and available filter facets. | Extend saved-search criteria and add a facets projection derived from inventory. | P1 |
| Account statement | `GET /api/v1/customer/statement?fromDate&toDate` | `GET /api/portal/my-account/statement`; `GET /api/portal/my-account/statement-of-account` | Partial Match + Request/Response Contract Gap | Date range parameters are absent and the difference between the two AutoPulse operations is undocumented. | Missing opening/closing balance, debit/credit totals, and dated entries. | Select one canonical statement endpoint, support date range, and document currency/balance rules. | P1 |
| Debit, credit, and refund history | `GET /api/v1/customer/debit-credit?type&currency&query` | Statement endpoints are the nearest candidate | Partial Match + Request/Response Contract Gap | Missing type/currency/search filters. | Missing record type, reference, stock ID, cash date, amounts/balance, approval date, notes visibility, and aggregate totals. | Extend the canonical statement endpoint or add a typed debit-credit ledger operation. | P1 |
| Documents list and detail | `GET /api/v1/customer/documents`; `GET /api/v1/customer/documents/{id}` | `GET /api/portal/my-vehicles/{dealId}/documents` | Partial Match + Missing APIs | AutoPulse requires a deal ID and has no all-customer list or document-detail operation. | Missing document list/detail schema and visibility/release status. | Add owner-scoped aggregate list and document detail/download metadata; enforce document-release visibility server-side. | P0 |
| Invoice list, detail, and printable document | `GET /api/v1/customer/invoices`; `GET /api/v1/customer/invoices/{id}`; `GET /api/v1/customer/invoices/{id}/document` | `GET /api/portal/invoices` | Partial Match + Missing APIs | Missing type/status/search/page/limit filters and detail/document operations. | Missing list totals, invoice summary/detail, line items, allocations, bank details, and printable document. | Extend list and add owner-scoped invoice detail and printable document operations. | P0 |
| Payments and payment status events | `GET /api/v1/customer/payments`; `POST /api/v1/customer/payments`; `POST /api/v1/customer/payments/{id}/resubmit`; `GET /api/v1/customer/payment-notifications` | `POST /api/portal/my-vehicles/{dealId}/pay-balance`; `POST /api/portal/reservations/{id}/upload-tt`; `POST /api/portal/reservations/{id}/upload-tt-media`; `GET /api/portal/reservations/{id}/payment-status` | Partial Match + Missing APIs | Current AutoPulse actions are deal/reservation checkout commands, not a customer payment ledger. Missing invoice-based create, idempotency, proof metadata, and resubmit contract. | Missing payment list/record, allocations, remaining balance, hold/rejection reason, and status-event history. | Add customer-scoped payment list/create/resubmit/status-event contracts or expose a single equivalent finance projection. | P0 |
| Shipment list and detail | `GET /api/v1/customer/shipments`; `GET /api/v1/customer/shipments/{id}` | `GET /api/portal/shipments`; related `GET /api/portal/my-vehicles/{dealId}/delivery` | Partial Match + Missing API | No shipment-detail identifier contract. | Missing shipment stage, dates, location/freshness, Ship OK, and document release status. | Type the list response and add owner-scoped shipment detail, or document how delivery composes the same projection. | P0 |
| Notifications | `GET /api/v1/customer/notifications`; `POST /api/v1/customer/notifications/{id}/read`; `POST /api/v1/customer/notifications/read-all`; `DELETE /api/v1/customer/notifications/{id}` | None | Missing API | None. | Missing list, unread count, related-resource links, and mutation receipts. | Add customer notification list, mark-read, mark-all-read, and delete operations. | P1 |
| Profile display and update | `GET /api/v1/customer/profile`; `PUT /api/v1/customer/profile` | `GET /api/portal/my-account`; `PUT /api/portal/my-account/preferred-currency` | Partial Match + Missing API | Existing mutation only changes currency. Frontend needs company, phone, delivery address, and expected version. | Missing normalized profile and optimistic-concurrency response. | Return a customer profile projection and add a general owner-scoped update operation with conflict handling. | P0 |

## 6. AutoPulse operations that must be added or exposed

These operations are absent from the exposed portal Swagger. Paths below are recommended names; AutoPulse may use different names if the same capability and contract are provided.

| Required operation/capability | Why it is required | Priority |
|---|---|---|
| Customer registration command | Creates an actual customer/identity; `/public/request-access` is only an access lead. | P0 |
| Change-password command | Required by Customer Profile security flow. | P1 |
| Password-reset request and confirmation | Required by account recovery. | P1 |
| Public supported-country catalogue | Supplies registration country and dial code. | P1 |
| Freight destination and port catalogues | Supplies calculator/enquiry selectors. | P1 |
| Owner-scoped reservation lookup by ID | Required by post-reservation confirmation and refresh. | P0 |
| Global testimonial list and submission | Deal-scoped vehicle reviews do not satisfy the public testimonial page. | P2 |
| Office/branch list and branch detail | Required by branch directory and branch pages. | P1 |
| Safe public bank-account list | Required by How to Buy transfer instructions. | P1 |
| Customer vehicle detail | Required to compose status history, finance, shipment, and document state for one owned vehicle. | P0 |
| Customer inquiry history | Required by the Inquiries page. | P1 |
| Explicit wishlist remove | Required for deterministic removal from both frontends. | P1 |
| Saved-search facets | Required by the Favourites form. | P1 |
| Customer document aggregate list and document detail | Deal-only document listing cannot serve the Documents page or detail retrieval. | P0 |
| Invoice detail and printable document | Required by Invoice Detail and print/download UI. | P0 |
| Customer payment list, create, resubmit, and event history | Required by the Payments page and held/resubmitted workflows. | P0 |
| Shipment detail | Required for owner-scoped shipment status details. | P0 |
| Notification list/read/read-all/delete | Required by notification center and dashboard unread count. | P1 |
| General profile update | Preferred-currency mutation cannot update the profile fields shown by the frontend. | P0 |

## 7. Field-level request and semantic gaps

### 7.1 Vehicle collection query

`GET /api/portal/public/inventory` is the preferred base because it has the broadest public filters. `public/catalog` has `skip/take` but fewer filters; these should be consolidated rather than making the frontend call both.

| Mock/frontend field | AutoPulse field | Compatibility | Safe transformation | Required AutoPulse change |
|---|---|---|---|---|
| `searchQuery` | `search` | Rename only | Yes | Document alias or adapter mapping. |
| `bodyStyle` | `bodyType` | Rename only | Yes | Document canonical vocabulary. |
| `driveTrain` | `driveType` | Rename only | Yes | Document canonical vocabulary. |
| `yearMin/yearMax` | `minYear/maxYear` | Rename only | Yes | None beyond validation/enums. |
| `priceMin/priceMax` | `minPriceUsd/maxPriceUsd` | Rename only | Yes | None beyond validation/currency. |
| `limit` | `take` | Rename only | Yes | Add deterministic maximum/default. |
| `page` | No field; `public/catalog` alone has `skip` | Missing | Derivable only if `skip` is added | Add `skip` or support `page/limit`; return canonical page metadata. |
| `make`, `model`, `fuelType`, `transmission`, `sortBy` | Similar fields | Partial | Yes | Publish allowed values and sort mapping. |
| `collection`, `market`, `category` | None | Missing | No | Add named collection/category behavior used by home and clearance pages. |
| `modelCode`, `vehicleSubType`, `overdrive`, `color`, `exteriorGrade`, `steering` | None | Missing | No | Add filters. |
| `stockCountry`, `stockLocation`, `destinationPort`, `stockType`, `locationStatus` | None | Missing | No | Add stock/logistics filters. |
| `features` | None | Missing | No | Add multi-feature filtering. |
| Engine CC, seats, load, mileage, and discount ranges | None | Missing | No | Add numeric range filters. |
| `audience`, `tier` | None | Missing | No | Derive customer/tier from token where possible and document projection behavior. |
| `destinationCountry`, `complianceOnly` | None | Missing | No | Add destination compliance filtering/projection. |

### 7.2 Authentication and account requests

| Frontend request | AutoPulse request | Gap/action |
|---|---|---|
| Login: `email,password` | OTP request: `phone`; verify: `sessionId,code` | Product-level workflow change. AutoPulse must return the normalized token/claims contract and document OTP expiry, retries, lockout, and errors. |
| Registration: `nameWithInitials,countryCode,mobileNumber,email,password,confirmPassword` | Request access: `name,phone,interest,country` | Not equivalent. Add real registration or an approved hosted identity registration flow. |
| Change password: `currentPassword,newPassword,confirmNewPassword` | None | Add identity-provider command/redirect contract. |
| Reset request: `email`; confirmation: `token,newPassword,confirmNewPassword` | None | Add neutral reset request and token confirmation. |

### 7.3 Enquiry, reservation, saved search, profile, and payment requests

| Capability | Frontend-required request | Current AutoPulse request | Required change |
|---|---|---|---|
| Enquiry | `message,consent`, optional vehicle/destination/port/type/source/preferred-vehicle fields; customer ID from token | Catalog inquiry: `name,phone,email,message` and path ID | Remove client-owned identity, add consent/context, allow general enquiry, and derive ownership from token. |
| Reservation | `vehicleSlug`; customer from token | `vehicleId` plus agency, TT file, declared amount, bank reference, return URL, and customer override fields | Permit a minimal hold request; prohibit customer override for ordinary customer sessions; separate payment/checkout commands. |
| Saved search | Name plus make/model/model code/year/price/mileage/engine/fuel/color/steering/drive/transmission criteria | Label, search, make, body type, minimum year, maximum price | Add all criteria currently editable in the Favourites UI and return them unchanged. |
| Profile update | `companyName,phone,deliveryAddress,expectedVersion` | Preferred currency only | Add a versioned profile update and return `409` on stale version. |
| Payment create | `invoiceId,reference,bankName,currency,amountUsd,paymentDate,remarks,proof,idempotencyKey` | Deal checkout return URL or TT file/amount/reference | Add invoice ownership, proof metadata, idempotency, payment date/bank/currency, and an explicit resubmission command. |

All 33 AutoPulse portal request schemas currently declare no `required` array. AutoPulse must mark required properties and add validation constraints so generated clients do not treat every request field as optional.

## 8. Required success response contracts

Because AutoPulse documents no success response schemas, the fields below are all considered missing. These are the minimum current frontend contracts after previous unused-field cleanup.

| Capability | Frontend-required response fields |
|---|---|
| Public config | `siteName`, `currency`, `contactPhone`, optional `liveAuctionUrl`. |
| Session/login | Token plus claims: `sub`, `email`, `role`, `permissions`, `exp`. Registration additionally needs account/customer IDs, name, country/dial/mobile/email, status, verification state, and timestamps. |
| Countries | `items[{isoCode,name,dialCode}]`. |
| Vehicle collection | `items`, `total`, `page`, `limit`, `totalPages`, `hasNextPage`, `hasPrevPage`, `facets`. Each item needs ID, chassis, make/model/year, status/price state, price/request-price, images, stock/location/category, vehicle specifications, dates, discount, tier price, and reservation eligibility. |
| Vehicle facets | Counts/options for make, model, body style, fuel, transmission, drive train, model code, vehicle/subtype, location, destination port, overdrive, color, exterior grade, steering, stock country/location, and features; ranges for year, price, mileage, engine CC, seats, and load capacity. |
| Vehicle detail | ID, canonical slug, chassis, identity/specification fields, status and price state, discount, category/location/stock/destination, ETD/ETA, dimensions, categorized media and visibility flags, active/on-sale flags, tier pricing, and reservation eligibility. |
| Freight | Destinations/ports: `code,name,country`. Estimate: `outcome,destinationCode,portCode,rateStatus,message`, optional currency/effective dates. |
| Enquiry | `id,receivedAt,status,duplicate,customerId,enquiryType,source`, optional vehicle slug and estimate snapshot. |
| Reservation | `id,vehicleSlug,vehicleId,customerId,customerEmail,status,createdAt,expiresAt,holdHours`. |
| FAQ | `categories`, `items`, `total`, `groundedNoAnswer`, optional message. Items need category, question/answer, slug, order/featured, owner, approval status, and updated time. |
| Testimonials | `items,total`; item ID, author/location, optional avatar/vehicle, rating, content, submission time, status, consent. Submission receipt needs ID, pending status, time, and message. |
| Content/office/branch | Pages: slug/title/summary/body/owner/status/updated time and optional sections/metadata. Offices: identity, location/contact/hours/primary/status. Branches: identity/code/port, banners/introduction, team/contact, meeting info, status. |
| Bank accounts | `id,bankName,accountName,accountNo,currency,type`, optional SWIFT, branch fields, address, and logo. Internal tenant/audit/change fields must not leak. |
| Dashboard | Customer ID/email, credit limit, outstanding balance, utilisation percent, reserved/invoiced/delivered counts, payment and shipment summaries, document availability counts, unread notification count. |
| Customer fleet | List: `items,total,countsByStatus`. Summary/detail: vehicle identity/slug/images/specs, totals/deposit, status/history, reservation/payment deadlines, PI/invoice/shipment references, logistics/ETD/ETA/vessel/BL, commercial balance, and released document references. |
| Customer inquiries | `items` containing vehicle slug/ID/title, requested time, inquirer count, and message/status data used by the inquiry UI. |
| Wishlist/saved searches | Wishlist items with customer/vehicle identity, saved time, and vehicle summary; deterministic `wishlisted` mutation result. Saved searches need ID/customer/name/full criteria/created time, list limit, and filter facets. |
| Statement/debit-credit | Statement customer/date range/opening/debit/credit/closing totals and entries. Debit-credit list needs records plus total debit, credit, and refund amounts. |
| Documents | List `items`; each item needs `id`, optional shipment/vehicle IDs, `type`, availability/release `status`, and creation time. |
| Invoices | List items plus `total,page,limit,totals`. Summary/detail needs invoice and vehicle identity, type/status/currency/dates, total/paid/outstanding/deposit amounts, line items, allocations, bank details, expiry/notes. Printable document needs invoice identity/type/title/HTML/status. |
| Payments | List `items,total`. Payment needs IDs, reference/bank/currency/amount/date/status, allocated and remaining amounts, hold reason, proof metadata, idempotency key, and creation time. Event list needs IDs, payment/invoice/customer IDs, event, and creation time. |
| Shipments | `items`; shipment ID/vehicle ID, stage, shipped/delivered/ETA dates, location/freshness, Ship OK status/reason, document-release status/reason. |
| Notifications | `items,total,unreadCount`; notification ID/customer/title/message/type/read flag/time and optional related resource. Mutations need updated and unread counts or deletion success. |
| Profile | `customerId,name,email,companyName,phone,deliveryAddress,version,updatedAt`. |

## 9. Cross-cutting contract changes

### Security and ownership

- Override root Bearer security with `security: []` for approved anonymous operations: public catalog/detail/content/config/freight/countries, OTP request/verify, registration/access, and any public testimonial reads.
- Derive customer identity from the validated token for enquiries, reservations, profile, wishlist, saved searches, fleet, invoices, payments, shipments, documents, and notifications. Do not accept a browser-supplied customer ID for ordinary customer operations.
- Return `403` for cross-customer resources and prevent IDOR across vehicle deals, reservations, invoices, payments, shipments, and documents.
- Publish the token issuer/audience, expiry behavior, role names, and permissions consumed by CarChief.

### Pagination, filtering, and identifiers

- Choose one portal convention and document it consistently. CarChief can adapt `page/limit` to `skip/take`, but AutoPulse must return `total` and enough metadata to derive current/next/previous pages.
- Return dynamic facets from the same filtered inventory domain; do not hard-code filter options in the frontend.
- Publish canonical IDs and stable slugs. Where AutoPulse uses `dealId`, also return vehicle ID and slug so list-to-detail navigation and ownership checks are deterministic.
- Define enum values and transitions for vehicle, reservation, invoice, payment, shipment, document release, notification, and enquiry statuses.

### Validation and errors

- Add required fields, limits, formats, enums, nullability, and examples to request and response schemas.
- Use a common error body containing at least `statusCode`, `message`, and optional `field`, `reason`, and correlation ID.
- Document relevant `400`, `401`, `403`, `404`, and `409` responses on every operation rather than only `200`.
- Support idempotency for payment creation and deterministic duplicate/conflict behavior for enquiries, reservations, wishlist, and saved searches.

## 10. Recommended AutoPulse delivery sequence

1. **Contract foundation:** Correct Swagger security, required request fields, response schemas, errors, identifiers, and pagination conventions.
2. **Public and identity P0:** Session/login decision, registration, canonical vehicle collection/detail, authenticated enquiry, and reservation create/read.
3. **Customer transactional P0:** Profile, fleet detail, invoices/detail/document, payments/resubmission/events, shipments/detail, and document visibility.
4. **Customer engagement P1:** Dashboard, wishlist, saved searches/facets, inquiry history, statements/debit-credit, and notifications.
5. **Public content P1/P2:** Countries, freight catalogues, offices/branches, bank accounts, FAQ, testimonials, and final public-page schemas.
6. **Integration verification:** Generate an AutoPulse client from the revised Swagger, run contract fixtures for both frontend applications, and verify customer isolation and status/error scenarios against a non-production AutoPulse environment.

## 11. Acceptance checklist for the revised AutoPulse contract

- Every P0/P1 operation above is present in the portal Swagger or has an explicitly approved identity-provider contract.
- Every success response references a schema; no frontend operation remains `200 Success` with an unspecified body.
- Required request fields and validation constraints are declared.
- Anonymous endpoints explicitly override global Bearer security.
- Customer-owned resources are token-scoped and have documented `401/403/404` behavior.
- Vehicle list and detail support all fields used by both frontends, including facets and pagination.
- Finance/logistics responses expose authoritative balances and statuses; the browser does not calculate or infer them.
- The generated AutoPulse client can represent every response without `any` or undocumented dictionaries.
- Contract tests cover success, validation, unauthenticated, forbidden, not-found, duplicate/conflict, stale-version, and payment-resubmission scenarios.

## 12. Limitations

- Findings reflect the two attached Swagger snapshots and repository state on the analysis date.
- The larger AutoPulse file proves that useful entities such as Vehicle, Reservation, ClientProfile, ShippingDocument, payment DTOs, and BankAccount exist in code, but its empty `paths` object means it does not prove those entities are exposed to the Customer Portal.
- Runtime behavior was not invoked. An endpoint marked missing may exist privately, but it must be exposed and documented in the portal Swagger before the frontend can integrate safely.
- Per the agreed policy, undocumented AutoPulse response fields are treated as missing rather than assumed to exist at runtime.
