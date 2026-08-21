# AutoPulse Public API Gap Analysis

## 1. Executive summary

This report compares the GET APIs currently required by the CarChief Public Website with the anonymous/public GET APIs exposed by AutoPulse. It is based on both the supplied Swagger snapshots and read-only calls to the running AutoPulse environment on **2026-08-21**.

The live responses remove the earlier uncertainty caused by undocumented Swagger success bodies. AutoPulse already exposes useful inventory, catalog, vehicle-detail, storefront, FX, freight, insurance, page-builder, promotion, review, and price-positioning data. However, its current public contract cannot replace the CarChief mock API without extensions and a frontend integration adapter.

| Result | Count | Meaning |
|---|---:|---|
| Compatible | 0 | No current CarChief public GET capability can be switched directly without a contract or frontend change. |
| Partial Match | 4 | Public configuration, vehicle collection, vehicle detail, and public pages have usable AutoPulse equivalents. |
| Missing API | 8 | Countries, bank accounts, freight selector catalogues, FAQ, global testimonials, offices, branches, and reservation lookup have no suitable public AutoPulse GET operation. |
| Runtime-unverified collections | 3 | Page-list items, promotions, and review items were empty in the sampled environment. Their item fields cannot be confirmed from runtime data. This count is informational and is not added to the 12 capability results above. |

### Highest-priority blockers

1. `GET /api/v1/vehicles` has no single AutoPulse equivalent with the required filters, named collections, complete dynamic facets, and page navigation.
2. AutoPulse vehicle list and detail responses omit identifiers, state, media, pricing-state, logistics, and other values used by the existing UI.
3. Freight destinations and ports are not discoverable, so the existing selectors cannot be populated.
4. Office, branch, country, and public bank-account catalogues are absent.
5. AutoPulse pages use a page-builder `layoutJson` contract while the existing frontend expects normalized content fields and sections.

### Recommended ownership rule

- A different field name is a **frontend adapter change**, not an AutoPulse gap, when its meaning and type are equivalent.
- A missing business value, ambiguous unit, missing identifier, missing pagination capability, or server-owned eligibility decision is an **AutoPulse change**.
- Runtime-null fields are treated as existing but affected by a **data-readiness or nullability issue**, not automatically as absent from the contract.

## 2. Public Website side-by-side comparison

| Frontend capability/page | Mock API | AutoPulse GET candidate | Match status | Request/query gaps | AutoPulse attributes observed | Attributes missing from AutoPulse | Frontend mapping changes | Required AutoPulse action | Priority |
|---|---|---|---|---|---|---|---|---|---|
| Site configuration and account/auction entry | `GET /api/v1/config/public` | `GET /api/portal/branding` + `GET /api/portal/storefront-config` + `GET /api/portal/public/fx-rates` | Partial Match | Three calls are required instead of one. | Branding: `name`, `logo`, `strap`; storefront: `flags`, `content`; FX: `baseCurrency`, `rates`, `currencies`. | `contactPhone`, `liveAuctionUrl`. | Map `branding.name -> siteName` and `fx-rates.baseCurrency -> currency`; merge the three responses in the production adapter. | Add `contactPhone` and approved `liveAuctionUrl` to storefront configuration, or expose one typed public configuration response. | P1 |
| Registration country/dial-code selector | `GET /api/v1/config/countries` | None | Missing API | No anonymous country catalogue operation exists. | None. | Entire `items[{isoCode,name,dialCode}]` response. | None until an endpoint exists. | Add an anonymous supported-country and dial-code catalogue. | P1 |
| How-to-buy bank-transfer instructions | `GET /api/v1/bank-accounts` | None. Schema-only evidence exists for `BankAccountDto` and the `BankAccount` entity. | Missing API | No public operation exposes active payment accounts. | No runtime response. The schema catalogue contains bank/account/currency/SWIFT-related fields but does not prove an endpoint exists. | Public response and, relative to the current UI, a reliable branch name. | When an endpoint exists, map `accountNumber -> accountNo` and `swiftBic -> swiftCode`. | Add a safe anonymous projection of active accounts; do not expose tenant, audit, deletion, or pending-change fields. | P1 |
| Home vehicle collections, All Stock, Clearance Stock, search showroom, and branch collections | `GET /api/v1/vehicles` | `GET /api/portal/public/catalog` and `GET /api/portal/public/inventory` | Partial Match | Catalog supports `search`, `make`, `bodyType`, `sort`, `skip`, `take`. Inventory adds model/fuel/transmission/drive/year/price filters but has no `skip`. Both omit named collections, market/category, many advanced filters, destination/compliance controls, audience/tier projection, and complete page navigation. | Catalog: `items`, `total`, `makes`, `bodyTypes`. Inventory: `items`, `total`. Together they expose core identity, price, vehicle specification, stock, and partial facet data. | Canonical pagination metadata; most facets; collection semantics; several card fields; compliance, pricing-state, discount, reservation, media, and logistics values. See section 3.1. | Rename equivalent fields and normalize numeric strings. Choose one AutoPulse endpoint as the canonical source rather than merging two independently paged lists in the browser. | Extend one canonical public inventory endpoint with all required filters, collections, facets, paging, and response fields. | P0 |
| Public vehicle detail | `GET /api/v1/vehicles/{idOrSlug}` | `GET /api/portal/public/catalog/{id}`; supplemental `GET /api/portal/public/catalog/{id}/price-guard` and `/reviews` | Partial Match | AutoPulse accepts an ID only; current public URLs and loader support ID or slug. Audience/tier/destination projection is absent. | `id`, `name`, `make`, `model`, `year`, `mileage`, `bodyType`, `transmission`, `fuel`, `engine`, `color`, `grade`, `location`, `listPrice`, `exterior`, `interior`, `viewers`. | Stable slug or documented ID-only routing; chassis/stock identity; availability and price state; complete media; discount, destination/logistics, dimensions, model metadata, and eligibility values. See section 3.2. | Map `fuel -> fuelType`, `engine -> engineSize`, `listPrice -> priceUsd` only after currency is guaranteed, and `exterior`/`interior` into `media` when their item format is documented. | Return a typed, public-safe detail projection and support a stable route identifier. | P0 |
| Freight destination and port selectors | `GET /api/v1/freight/destinations`; `GET /api/v1/freight/ports` | Nearest operation: `GET /api/portal/public/freight?dest&method` | Missing API | AutoPulse requires a destination before returning freight availability; there is no operation to discover supported destinations or ports. | With a destination, runtime fields were `available`, `dest`, and `message`. Omitting `dest` returned `400` validation details. | Destination `code/name/country` items and port `code/name/country` items. | The adapter can rename `dest` only after selector catalogues and a canonical destination code are defined. | Add destination and destination-scoped port catalogue endpoints. Document freight methods and destination/port code semantics. | P1 |
| FAQ browser and search | `GET /api/v1/content/faq?category&q` | Nearest operation: `GET /api/portal/knowledge?query` | Missing API | The nearest operation returned `401` anonymously and has no category filter. It is therefore not a public FAQ source. | No public success response was observed. | Categories, ordered FAQ items, total, grounded-no-answer state, and message. | `q -> query` would be a safe rename only if AutoPulse makes the operation public and returns grounded FAQ records. | Add a typed anonymous FAQ endpoint, or expose a public mode of `knowledge` with category filtering and the required response. | P2 |
| Public testimonials | `GET /api/v1/content/testimonials` | Nearest operation: `GET /api/portal/public/catalog/{id}/reviews` | Missing API | AutoPulse reviews are vehicle-scoped and require a catalog ID; the testimonials page needs a global approved list. | `count`, `average`, `model`, `items`; sampled `items` was empty. | Global approved testimonial items and their author/location/vehicle/rating/content/date fields. Review-item shape remains runtime-unverified. | `count -> total` is safe only after a global aggregate endpoint exists. Vehicle reviews could be adapted into testimonials if AutoPulse formally defines that product decision and item schema. | Add a global approved testimonial/review feed or a documented aggregate operation. | P2 |
| Auction, shipping schedule, privacy, and dynamic content pages | `GET /api/v1/content/pages`; `GET /api/v1/content/pages/{slug}` | `GET /api/portal/public/pages`; `GET /api/portal/public/pages/{slug}` | Partial Match | Slug lookup is compatible. The list returned no regular page items in the sampled environment. | List: `pages`, `home{slug,title}`. Detail: `slug`, `title`, `layoutJson`, `publishedVersion`. `layoutJson` parsed as a page-builder node tree with component `type`, `props`, and `children`. | `summary`, `owner`, approval/publication `status`, `updatedAt`; normalized `body` and `sections` are not directly returned. | Add a page-builder renderer/adapter that converts supported nodes into the current page model, or update pages to render the AutoPulse layout contract directly. Do not treat `publishedVersion` as a timestamp. | Publish response schemas and either add the missing metadata plus a versioned layout schema or provide a normalized content projection. | P1 |
| Contact and office directory | `GET /api/v1/content/offices` | None | Missing API | No typed anonymous office list exists. | None. | `items[{id,name,city,country,address,phone,email,operatingHours,isPrimary,status}]`, `total`. | None until an endpoint exists. | Add an anonymous office/location catalogue. | P1 |
| Branch directory and branch detail | `GET /api/v1/content/branches`; `GET /api/v1/content/branches/{id}` | None | Missing API | No branch list or branch-detail operation exists. Generic pages are not a safe replacement for typed branch contacts and vehicle collection context. | None. | Branch identity/code, destination port, banners/content, team, meet-and-greet details, contact details, status, and list total. | Once exposed, use an adapter only for naming or layout differences. | Add anonymous branch list and detail APIs, or define a typed branch projection inside storefront configuration. | P1 |
| Reload an authenticated reservation from a public vehicle page | `GET /api/v1/reservations/{id}` | No equivalent. `GET /api/portal/reserve-quote?vehicleId` returned `401` anonymously and represents a quote, not persisted reservation retrieval. | Missing API | Current CarChief lookup is bearer-authenticated and owner-scoped. AutoPulse exposes no matching read-by-reservation-ID operation. | No applicable public success response was called. | Reservation `id`, vehicle identity, owner scope, status, created/expiry times, and hold duration. | The frontend must use AutoPulse bearer-token handling when the operation is added; an ID/slug mapping may also be required. | Add an authenticated, owner-scoped reservation lookup. This endpoint should not be anonymous even though it is invoked from the Public Website. | P1 |

## 3. Attribute-level comparison

### 3.1 Vehicle collection

AutoPulse currently splits useful information between `public/catalog` and `public/inventory`. The following comparison treats both as candidates but does not recommend joining their independently paged results in the browser.

#### Collection envelope and facets

| Frontend-required attribute | AutoPulse attribute | Compatibility | Runtime evidence | Missing from AutoPulse | Frontend adaptation | AutoPulse change required |
|---|---|---|---|---|---|---|
| `items` | `items` | Compatible name and structure concept | Confirmed on catalog and inventory. | No | Normalize each AutoPulse item to the CarChief vehicle summary. | Document the item schema. |
| `total` | `total` | Compatible | Confirmed on both endpoints. | No | None. | Document total as the count after filters and before paging. |
| `page` | Catalog `skip`; no inventory equivalent | Partial | `skip/take` are documented for catalog; inventory documents only `take`. | Yes for inventory | Convert `page` to `skip=(page-1)*limit` for catalog. | Add a consistent page/limit or skip/take contract to the canonical endpoint. |
| `limit` | `take` | Naming difference | Confirmed query parameter. | No | Map `limit -> take`. | Return the effective limit in the response. |
| `totalPages`, `hasNextPage`, `hasPrevPage` | Derivable only when offset/limit/total are reliable | Partial | Not returned. | Yes on inventory; omitted on catalog | The adapter may derive these for catalog. | Return canonical pagination metadata from the chosen endpoint. |
| `facets.makes` | Catalog `makes[{make,count}]` | Naming difference | Confirmed with populated values. | No | Map `make -> name`. | Include in the canonical endpoint. |
| `facets.bodyStyles` / `vehicleTypes` | Catalog `bodyTypes[{bodyType,count}]` | Naming difference | Confirmed with populated values. | No | Map `bodyType -> name`; populate both current aliases while the frontend contract retains both. | Include canonical body-type facets and eliminate duplicate facet semantics in a future contract revision. |
| `facets.models`, `fuelTypes`, `transmissions`, `driveTrains` | None | Missing | Not returned by either endpoint. | Yes | None. | Add dynamic counts based on the active query. |
| Remaining string facets | None | Missing | Model code, subtype, location status, destination port, overdrive, color, grade, steering, stock country/location were not returned as facets. | Yes | None. | Add all facets used by the expanded filter UI. |
| `facets.features` | None | Missing | Not observed. | Yes | None. | Return feature key, label, and count. |
| Range facets | None | Missing | Year/price/mileage/engine/seats/load ranges were not returned. | Yes | None. | Return min/max values calculated from the active result set. |

#### Vehicle list item

| Frontend-required attribute | AutoPulse attribute | Compatibility | Runtime evidence | Missing from AutoPulse | Frontend adaptation | AutoPulse change required |
|---|---|---|---|---|---|---|
| `id` | `id` | Compatible | Confirmed. | No | None. | Document format and stability. |
| `slug` | None | Identifier strategy gap | Not observed. | Conditional | Change public routes to use AutoPulse IDs, or generate a display slug that retains a recoverable ID. | Preferably return/accept a stable canonical slug if SEO URLs must remain stable. |
| `chassisNumber` | Inventory `stockCode` is not proven equivalent | Semantic mismatch | `stockCode` confirmed; chassis number absent. | Yes | Do not rename without AutoPulse confirmation. | Return chassis number if the UI may display it; keep stock code as a separate field. |
| `make`, `model`, `year`, `priceUsd` | Same names | Compatible | Confirmed. | No | None. | Document currency/rounding rules for `priceUsd`. |
| `status` | Inventory `status` | Compatible concept, enum unverified | Confirmed as a string. | No | Map documented AutoPulse states to CarChief states. | Publish the enum and availability meaning. |
| `images` | Catalog `image`; inventory `thumbnail` | Structural difference and data-readiness issue | Both fields existed but were `null` in all sampled items. | Contract field exists; usable media unverified | Convert a non-null image/thumbnail into `images[0]`. | Ensure public stock has usable URLs and document null/fallback behavior. |
| `mileage` | `mileage` string | Type/unit mismatch | Confirmed as formatted text rather than a number. | Numeric value is missing | Parse only if AutoPulse guarantees a locale-independent unit format. | Prefer a numeric mileage plus explicit unit. |
| `bodyStyle` | `bodyType` | Naming difference; runtime nullability issue | Field existed but was `null` in sampled list and detail records. | No contract name gap; data may be incomplete | Map `bodyType -> bodyStyle`. | Define nullability and populate the source data used for facets. |
| `fuelType`, `driveTrain`, `engineCc` | `fuelType`, `driveType`, `engineDisplacement` | Partial | Confirmed on inventory; engine displacement is a string. | Numeric engine value may be missing | Rename drive type and parse engine only after unit rules are documented. | Return numeric engine displacement and unit. |
| `transmission`, `color`, `steering`, `stockLocation` | `transmission`, `color`, `steering`, `location` | Mostly compatible | Confirmed. | No, subject to location semantics | Map `location -> stockLocation` only if AutoPulse confirms meaning. | Document enums/canonical values. |
| `stockCountry` | `origin` | Likely naming difference | Confirmed. | No if `origin` means current stock country | Map after semantic confirmation. | Document ISO code versus display-name format. |
| `exteriorGrade` | `grade` | Likely naming difference | Confirmed. | No if meanings match | Map after semantic confirmation. | Document grade scale and meaning. |
| `modelCode`, `vehicleSubType`, `overdrive`, `seats`, `loadCapacity`, `features` | None | Missing | Not observed. | Yes | None. | Add fields needed by the active filters and cards/details where applicable. |
| `category`, `locationStatus`, `stockType`, `destinationPort` | None | Missing | Not observed. | Yes | None. | Return collection/logistics classifications. |
| `createdAt`, `featured`, `discountPercent`, `requestPrice`, `priceState` | None | Missing | Not observed. | Yes | None. | Add sorting/collection and truthful pricing-state fields. |
| `etd`, `eta` | None | Missing | Not observed. | Yes | None. | Add when shipment timing is displayed or filtered. |
| `compliance` | None | Server-owned decision missing | Not observed. | Yes | Must not be inferred from labels in the browser. | Return destination-country compliance outcome and reasons. |
| `tierPricing`, `reservationEligibility` | None | Server-owned decision missing | Not observed publicly. | Required for authenticated projection, not anonymous cards | The adapter passes through server results only. | Add customer-aware projection or separate authenticated eligibility operations. |

#### Query support

| Requirement | AutoPulse support | Gap/action |
|---|---|---|
| Search, make, model, body style, fuel, transmission, drivetrain, year, price, sort | Split across catalog and inventory | Consolidate in one canonical endpoint. Map `searchQuery -> search`, `bodyStyle -> bodyType`, `driveTrain -> driveType`, min/max names, `sortBy -> sort`. |
| Mileage filtering | Not exposed | Add `mileageMin` and `mileageMax`. |
| Model code, subtype, engine, overdrive, color, grade, steering | Not exposed | Add the currently rendered advanced filters. |
| Stock country/location/type/status and destination port | Not exposed | Add stock/logistics filters. |
| Seats, load capacity, features | Not exposed | Add range and feature filtering. |
| Named collection, category, market, discount | Not exposed | Add deterministic collection semantics used by Home, Clearance, and branch pages. |
| Destination country and compliance-only | Not exposed | Add server-side compliance filtering. |
| Page navigation | Catalog has `skip/take`; inventory has only `take` | Use one consistent, repeatable paging contract with a stable secondary sort. |

### 3.2 Vehicle detail

| Frontend-required attribute | AutoPulse attribute | Compatibility | Runtime evidence | Missing from AutoPulse | Frontend adaptation | AutoPulse change required |
|---|---|---|---|---|---|---|
| `id`, `make`, `model`, `year` | Same names | Compatible | Confirmed. | No | None. | Document response schema. |
| `slug` | None | Identifier gap | Not observed. | Conditional | Move frontend detail routes to ID or use a recoverable display slug. | Return and accept a stable slug if ID-only routes are not acceptable. |
| `chassisNumber` | None | Missing | Not observed in detail. | Yes | None. | Add vehicle/stock identity required by the detail UI. |
| `status` | None | Missing | Not observed in detail. | Yes | Do not infer from list data because it may become stale. | Return current availability/status. |
| `priceUsd` | `listPrice` | Partial | `listPrice` confirmed, but detail did not return currency or `priceUsd`. | USD-normalized price/price currency is ambiguous | Map only after currency semantics are guaranteed. | Return currency and normalized/display price explicitly. |
| `priceState`, `requestPrice`, discount fields | None | Missing | Not observed. | Yes | None. | Return price-on-request and discount state so the UI does not fabricate a price. |
| `bodyStyle`, `fuelType`, `engineSize` | `bodyType`, `fuel`, `engine` | Naming difference | Confirmed; `bodyType` was null. | No except data completeness | Rename fields. | Define formats and populate body type. |
| `transmission`, `color`, `mileage` | Same names | Partial | Confirmed; mileage is text. | Numeric mileage/unit contract | Normalize or display the provided text. | Prefer numeric value plus unit. |
| `driveTrain`, `modelCode`, `versionClass`, `registerYear`, `mfgYear` | None | Missing | Not observed. | Yes | None. | Add fields used by the specification section. |
| `dimensions` | None | Missing | Not observed. | Yes | None. | Return length, width, height, and volume when available. |
| `locationStatus`, `stockType`, `destinationPort`, `etd`, `eta` | `location` only | Partial | A free-form `location` was confirmed. | Remaining logistics fields | Keep location as a display fallback only. | Return typed stock/location/shipping fields. |
| `media` | `exterior`, `interior` | Partial and runtime-unverified item shape | Both arrays were empty in the sample. | Categorized URLs and visibility rules are unverified | Map documented URL items into the existing gallery categories. | Publish media item schema and ensure public URLs are populated. |
| `compliance`, `reservationEligibility` | None | Missing server decisions | Not observed. | Yes where destination/customer context applies | Never calculate authoritative eligibility in the browser. | Add server-derived outcomes or dedicated GET operations. |
| Price comparison | `/price-guard`: `available`, `fob`, `marketAverage`, `deltaPct`, `position`, `verdict`, `sampleSize`, `source` | Additional AutoPulse capability | Confirmed at runtime. | Not required by the current mock detail contract | Add a frontend adapter/component only if this feature is adopted. | Document schema; no CarChief parity change is required. |

### 3.3 Public configuration

| Frontend-required attribute | AutoPulse attribute | Compatibility | Runtime evidence | Missing from AutoPulse | Frontend adaptation | AutoPulse change required |
|---|---|---|---|---|---|---|
| `siteName` | Branding `name` | Naming difference | Confirmed. | No | Rename. | Document branding schema. |
| `currency` | FX `baseCurrency` | Naming/source difference | Confirmed. | No | Merge from FX response. | Confirm that this is the storefront display currency rather than only the FX base. |
| `contactPhone` | None | Missing | Not observed. | Yes | None. | Add public support/contact information. |
| `liveAuctionUrl` | None | Missing optional capability | Not observed. | Yes when live auction entry is enabled | Hide the entry while absent, matching current behavior. | Add only an approved external/internal URL. |

### 3.4 Public content

| Frontend-required attribute | AutoPulse attribute | Compatibility | Runtime evidence | Missing from AutoPulse | Frontend adaptation | AutoPulse change required |
|---|---|---|---|---|---|---|
| Page `slug`, `title` | Same names | Compatible | Confirmed on home detail. | No | None. | Document schema. |
| Page `body`, `sections` | `layoutJson` | Structural difference | Confirmed as a JSON-encoded component tree. | Not necessarily, if all required content is encoded | Implement a versioned block renderer/adapter. | Publish block types, props, nesting rules, versioning, and unsupported-block behavior. |
| Page `summary` | No direct field | Missing | Not observed. | Yes | A hero subheading is not a safe universal summary. | Add explicit SEO/list summary. |
| Page `owner`, `status`, `updatedAt` | `publishedVersion` is not equivalent | Missing | Not observed. | Yes | None. | Return public publication metadata if the frontend contract retains it. |
| Page list items | `pages` | Runtime-unverified | Collection was empty; only `home{slug,title}` was returned. | Unknown | Support the wrapper and home record in the adapter. | Seed/publish representative pages and document list item schema. |
| Testimonial item | Review item unknown | Runtime-unverified and semantic mismatch | Review `items` was empty. | Global testimonial projection is missing | None safely. | Define review item schema and add global aggregation if reviews become testimonials. |

## 4. Missing AutoPulse public GET APIs

| Required capability | Minimum response | Why it is needed |
|---|---|---|
| Supported countries | `items[{isoCode,name,dialCode}]` | Populates registration country and phone-prefix selectors with server-approved values. |
| Public bank accounts | Active safe projections containing ID, bank/account names and number, currency, SWIFT, and branch details | Renders reviewed bank-transfer instructions on How to Buy. |
| Freight destinations | `[{code,name,country}]` | Populates the destination selector before an estimate/enquiry can be formed. |
| Freight ports | `[{code,name,country}]`, preferably filterable by destination | Populates the port selector and provides canonical codes. |
| Public FAQ | Categories, ordered items, total, and grounded no-answer response | Powers FAQ category browsing and keyword search without authentication. |
| Global testimonials/reviews | Approved global items plus total | Powers the testimonials page and homepage preview without choosing a vehicle first. |
| Offices | Office contact/location/hours items plus total | Powers Contact and branch-directory experiences. |
| Branch list and detail | Typed branch content and contacts | Powers branch-specific pages and supplies destination-port context for stock collections. |
| Authenticated reservation lookup | Owner-scoped reservation and hold metadata | Restores a customer's existing hold after a vehicle-page reload. |

Freight destinations and ports are counted as one capability in the executive summary. Branch list/detail and reservation lookup are listed here separately by endpoint implementation need.

## 5. Existing AutoPulse APIs requiring extension

| AutoPulse API | Required extension |
|---|---|
| `GET /api/portal/public/inventory` or `GET /api/portal/public/catalog` | Select one canonical collection operation; add the missing filters, named collections, stable pagination, full facets, normalized vehicle fields, media, pricing state, and server-owned compliance/eligibility where applicable. |
| `GET /api/portal/public/catalog/{id}` | Add current status, stable route identity, explicit currency/USD price, pricing state, stock/chassis identity, complete specifications, logistics, populated typed media, and optional server-derived eligibility. |
| `GET /api/portal/branding` / `storefront-config` | Add contact details and approved auction URL, or expose a single merged public configuration projection. |
| `GET /api/portal/public/freight` | Document destination/method enums and return a typed estimate/rate response when available. This does not replace the missing selector catalogues. |
| `GET /api/portal/public/pages` / `{slug}` | Document list/detail schemas and the page-builder block contract; add summary and publication metadata or provide a normalized projection. |
| `GET /api/portal/public/catalog/{id}/reviews` | Document review item fields and add a global approved feed if reviews are intended to replace testimonials. |
| `GET /api/portal/knowledge` | If used for public FAQ, permit anonymous access, add category filtering, and return typed grounded FAQ results. Otherwise add a separate public FAQ operation. |

## 6. Frontend-only adaptations

These changes are safe in a future AutoPulse integration layer and do not require AutoPulse to duplicate CarChief naming.

| AutoPulse value | CarChief value | Frontend action |
|---|---|---|
| `branding.name` | `siteName` | Rename and merge with storefront/FX configuration. |
| `fx-rates.baseCurrency` | `currency` | Map after AutoPulse confirms storefront-display semantics. |
| `search`, `bodyType`, `driveType`, `minYear`, `maxYear`, `minPriceUsd`, `maxPriceUsd`, `sort`, `take` | Existing CarChief query names | Translate in the API adapter. |
| `skip/take` | `page/limit` | Convert in the adapter only on an endpoint that supports both offset and limit. |
| `makes[].make`, `bodyTypes[].bodyType` | Facet `name` | Rename while retaining `count`. |
| `fuel` | `fuelType` | Rename. |
| `driveType` | `driveTrain` | Rename after enum mapping is documented. |
| `engine` / `engineDisplacement` | `engineSize` / `engineCc` | Preserve text for display; convert to a number only with a guaranteed unit format. |
| `image` / `thumbnail` | `images[0]` | Wrap a non-null URL in an array and retain the frontend fallback for null. |
| `accountNumber`, `swiftBic` | `accountNo`, `swiftCode` | Rename when a public bank-account endpoint is exposed. |
| `layoutJson` | Current content page rendering | Parse through a versioned AutoPulse page-block adapter; do not scatter JSON parsing across page components. |

## 7. Cross-cutting contract gaps

### Authentication and authorization

- AutoPulse's Portal Swagger declares global bearer security, but all sampled `PortalPublic` operations returned `200` without a token.
- `GET /api/portal/knowledge` and `GET /api/portal/reserve-quote` returned `401` without a token. They must not be presented as anonymous replacements.
- The future reservation lookup must enforce customer ownership and return `401`, `403`, and `404` distinctly without leaking another customer's reservation.

### Pagination and filtering

- Catalog supports `skip/take`; inventory exposes only `take`. The frontend needs repeatable navigation through all results.
- A canonical endpoint must define stable sorting, maximum page size, out-of-range behavior, and whether facet counts are calculated before pagination.
- AutoPulse should reject invalid enum/range values with a documented validation response rather than silently ignoring them.

### Identifiers

- AutoPulse public vehicle operations are ID-based; the existing frontend supports stable slugs.
- The integration must choose either ID-based public routes or a backend-provided slug accepted by detail operations. A decorative slug that cannot be resolved after a direct page load is insufficient.
- Destination and port APIs must expose stable codes separate from display labels.

### Numeric values and units

- Runtime vehicle mileage and engine displacement are strings. Parsing localized text in the browser is fragile.
- AutoPulse should prefer numeric values with explicit units and currencies for filtering, sorting, calculations, and accessibility formatting.
- `listPrice` cannot be mapped to `priceUsd` unless the detail response explicitly guarantees USD or returns a currency.

### Errors and nullability

- Runtime not-found responses used RFC-style problem details with `type`, `title`, `status`, and `traceId`.
- Missing required freight input returned problem details with an `errors.dest` collection.
- These useful error shapes are not documented in the supplied Portal Swagger and should be added for `400`, `401`, `403`, `404`, `409`, `429`, and `5xx` as applicable.
- `bodyType`, `image`, and `thumbnail` were present but null in sampled vehicle records. AutoPulse must document nullable fields and the frontend must retain truthful fallbacks.

## 8. Additional AutoPulse public capabilities

The following live GET operations do not replace a currently required mock GET API but may support future product features. They should not be interpreted as CarChief integration gaps.

| AutoPulse API | Runtime-confirmed response |
|---|---|
| `GET /api/portal/public/fx-rates` | Base currency, currency rates, and currency metadata. It can supply the current config currency through an adapter. |
| `GET /api/portal/public/insurance` | Availability, premium, currency, rate percentage, coverage type, and provider. |
| `GET /api/portal/public/deposit-policy` | Advance percentage, tier, and explanatory note. |
| `GET /api/portal/public/catalog/{id}/price-guard` | Availability, FOB, market average, delta percentage, position, verdict, sample size, and source. |
| `GET /api/portal/public/promotions` / `{slug}` | List wrapper was confirmed, but no live promotion item was available; item runtime shape remains unverified. |

## 9. Recommended implementation sequence

1. **P0 — Canonical vehicle browse contract:** extend one public inventory endpoint with complete paging, filters, collections, facets, and card fields.
2. **P0 — Vehicle detail contract:** return typed pricing, state, identity, specification, logistics, and media data with an agreed ID/slug strategy.
3. **P1 — Selector/reference APIs:** add countries, freight destinations/ports, offices, branches, and safe public bank accounts.
4. **P1 — Content contract:** version and document page-builder responses or provide normalized pages; add publication metadata.
5. **P1 — Reservation retrieval:** add the authenticated owner-scoped GET used after a public vehicle-page reload.
6. **P2 — FAQ and testimonials:** expose typed anonymous FAQ search and a global approved testimonial/review feed.
7. **Integration adapter:** implement naming, envelope, pagination, unit, enum, and page-layout transformations in one frontend boundary after AutoPulse contracts are finalized.

## 10. Evidence and limitations

### Sources

- CarChief public routes, loaders, hooks, shared frontend components, API-client services, and domain types in the current repository.
- CarChief mock contract: `openapi/openapi.json`.
- AutoPulse Customer Portal Swagger: `/Users/prabodha/Downloads/swagger.json` (93 operations in the supplied snapshot).
- AutoPulse schema catalogue: `/Users/prabodha/Downloads/autopulse_swagger.json` (schema-only snapshot; it does not prove endpoint availability).
- Runtime base URL: `https://autopulse-api.nexgenuity.com`, sampled with anonymous GET requests only on 2026-08-21.

### Runtime calls made

- Branding, storefront configuration, FX rates, catalog, inventory, insurance, deposit policy, freight, catalog detail, price guard, reviews, promotions, pages, and page detail.
- Negative GET checks for missing catalog/page/promotion identifiers and missing freight destination.
- Anonymous checks of `knowledge` and `reserve-quote`, both of which returned `401`.
- No token was supplied and no POST, PUT, PATCH, or DELETE request was made.

### Limitations

- The Portal Swagger does not document success response schemas, required response fields, or non-`200` responses; runtime evidence is therefore essential but environment-specific.
- Runtime samples show fields that were serialized on the analysis date, not a guaranteed contract. AutoPulse must add those schemas to Swagger before integration.
- The sampled environment contained no regular page-list items, promotions, or review items. Their item-level runtime shapes remain unverified.
- Null vehicle media/body-type values show current data readiness but do not prove those fields are always null.
- Only GET requirements currently used by the Public Website are evaluated. Public mutations such as registration, enquiries, reservations, and testimonial submission require a separate write-contract analysis.
- No customer-authenticated AutoPulse response was inspected, so customer-specific pricing, wishlist, compliance, and reservation projections are evaluated only from the anonymous public contract.

## 11. Acceptance checklist for AutoPulse

- [ ] Every public GET operation has typed Swagger success and error responses.
- [ ] One vehicle collection operation supports the complete agreed query, pagination, and facet contract.
- [ ] Vehicle list/detail values use explicit numeric units and currencies.
- [ ] Vehicle media and body type are populated or explicitly nullable with documented fallbacks.
- [ ] A stable vehicle ID/slug routing strategy is agreed with the frontend team.
- [ ] Country, destination, port, office, branch, and bank-account catalogues are exposed safely.
- [ ] Public content pages have a versioned layout schema or normalized projection.
- [ ] FAQ and global testimonials/reviews are anonymously retrievable.
- [ ] Reservation retrieval is authenticated and owner-scoped.
- [ ] The AutoPulse team provides representative non-empty examples for pages, promotions, reviews, media, and nullable vehicle fields before frontend integration begins.
