# Phase 2.13 Context Pack — Quote requests, My Inquiries, Wishlist and Favourites

Read this file first. It carries the requirement text, decision dispositions, code map and required test paths for Phase 2.13, so you do not need the full requirement and architecture documents to start.

## 0. What this phase is for

A shopper browsing vehicle inventory today has no way to ask for pricing help or to keep track of vehicles they care about:

- The vehicle detail page in `apps/public-web` (`src/features/vehicle-detail/VehicleDetailPage.tsx`) offers a "Request Price" CTA that navigates away to `/contact?vehicle=...&enquiryType=price-request`, and a `<ReservationSection>` that only a signed-in customer can act on. There is no on-page, repeatable "ask for a quote" action.
- `apps/customer-app`'s browsable-inventory detail page (`src/features/inventory/CustomerVehicleDetailPage.tsx`) has no quote action and no way to save a vehicle for later.
- The Mock API's `enquiries` table (`apps/mock-api/src/store.ts`) already models a price-request enquiry type, but every enquiry row is anonymous — there is no link from an enquiry back to the authenticated customer who submitted it, so a customer can never see "the vehicles I asked about" and staff can never see how many distinct people asked about one vehicle.
- Nothing in the product lets a customer bookmark a specific vehicle (a wishlist) or save a reusable search filter (a favourite), even though `packages/vehicle-search`'s facet/URL-state machinery already proves the search-criteria shape exists for one-off searches.

This phase adds four customer-facing capabilities: a repeatable "Get Free Quote" action on both apps' vehicle detail pages, a customer-app "My Inquiries" page showing the customer's own quote requests plus a per-vehicle "N people are inquiring" aggregate, a customer-app "My Wishlist" page for saving specific vehicles, and a customer-app "Favourites" page for saving up to 25 reusable search-criteria profiles built from real, database-backed dropdown values.

## 1. Position in the sequence

Phase 2.13 sits in its own `D02-INQUIRIES-WISHLIST` lane at `execution_order` 115–123. It depends on `D02-P12-CODE_REVIEW` (the most recently merged customer phase) and is unrelated to the optional Phase 2.11 theme work. Its branch `feat_delivery02_phase_13` is cut from the latest merged `delivery_02_customer_application`.

## 2. Requirement text

| ID | Requirement |
|---|---|
| CUST-31 | A shopper viewing a vehicle detail page in public-web or the Customer application sees a "Get Free Quote" action. The same person may request a quote for the same vehicle more than once; a repeat request is never blocked or shown as an error. |
| CUST-32 | In public-web, where the visitor is not necessarily signed in, requesting a quote requires name, email address and mobile number; all three are mandatory before submission. |
| CUST-33 | In the Customer application, where the shopper is already signed in, requesting a quote submits directly using the signed-in customer's own identity; no separate contact form is shown. |
| CUST-34 | The Customer application has a "My Inquiries" navigation item leading to an Inquiries page that lists every vehicle the signed-in customer has requested a quote for. |
| CUST-35 | Each vehicle on the Inquiries page shows how many distinct people in total have requested a quote for that vehicle (for example, "2 people are inquiring"). |
| CUST-36 | The Customer application's vehicle detail page has an "Add to Wishlist" action that saves the vehicle against the signed-in customer. |
| CUST-37 | The Customer application has a "My Wishlist" navigation item leading to a page that lists every vehicle the signed-in customer has wishlisted. |
| CUST-38 | The Customer application has a "Favourites" navigation item leading to a page where the signed-in customer creates a saved search-criteria profile from Make, Model, Model Code, Year From, Year To, Price From, Price To, Min Mileage, Max Mileage, Engine CC, Fuel, Color, Steering, Drivetrain and Transmission, each presented as a dropdown. |
| CUST-39 | Every Favourites dropdown is populated from real, database-backed distinct values, never a hardcoded list. |
| CUST-40 | A signed-in customer may hold at most 25 favourites; the 26th creation attempt is rejected. |

## 3. Tasks

| Task | Purpose | Product code |
|---|---|---|
| `D02-P13-T001` | Extend the `enquiries` domain type, Mock API store and routes to link a quote request to a customer, list a customer's own quote requests, and expose a per-vehicle inquirer-count aggregate | Allowed |
| `D02-P13-T002` | Add the Wishlist and Favourites domain types, Mock API tables/store methods/routes, including the 25-favourite server-side cap and a facets endpoint | Allowed |
| `D02-P13-T003` | Add `packages/validation` schemas and `packages/api-client` services bridging the new contracts to both frontend apps | Allowed |
| `D02-P13-T004` | Add "Get Free Quote" to the public-web vehicle detail page (anonymous, name/email/mobile form) | Allowed |
| `D02-P13-T005` | Add "Get Free Quote" and "Add to Wishlist" to the customer-app vehicle detail page (authenticated, no form) | Allowed |
| `D02-P13-T006` | Build the customer-app "My Inquiries" page and nav entry | Allowed |
| `D02-P13-T007` | Build the customer-app "My Wishlist" and "Favourites" pages, nav entries and 25-cap UX | Allowed |
| `D02-P13-T008` | Cross-feature integration, customer isolation, Docker gate and Phase 2.13 acceptance | Allowed (fixes only) |
| `D02-P13-CODE_REVIEW` | Phase PR review and tech-lead approval | Forbidden |

## 4. Decision dispositions

| Question | Disposition |
|---|---|
| Where does "My Inquiries" live? | Customer-app only. Public-web has no per-customer account area today and none is added for this phase. |
| How are quote requests modeled server-side? | The existing `enquiries` entity is extended, not replaced. A nullable `customer_id` column links a quote request to the customer who submitted it (null for anonymous public-web submissions); `enquiryType: 'price-request'` (already in the vocabulary) is the quote marker. |
| Is Wishlist the same thing as Favourites? | No. Wishlist saves specific vehicles (`customer_id` + `vehicle_id`). Favourites saves reusable search-*criteria* profiles, never tied to one vehicle. They are separate entities with separate tables, routes and pages. |
| Which customer-app page is "the vehicle detail page"? | `apps/customer-app/src/features/inventory/CustomerVehicleDetailPage.tsx` (the browsable-inventory detail view, reached via `/inventory/:slug`) — confirmed to already exist. It is not `features/vehicles/CustomerFleetDetailPage.tsx`, which shows vehicles the customer already owns and is the wrong page for a quote or wishlist action. |
| `D02-ASM-008` | Four of the fourteen requested Favourites fields — Model Code, Engine CC, Color, Steering — have no backing column or seed data in `VehicleRecord`/the `vehicles` table today. All fourteen dropdowns ship in this phase; the four unbacked ones render disabled with an honest "no data yet" state rather than a fabricated option list. Backing schema/seed work is deferred to a later phase. |
| `D02-ASM-009` | The quote-request form shows only name, email and mobile. The shared `EnquiryRequest` contract also requires `message` and `consent`; these are auto-filled with a fixed default message and an implied-by-submission consent value, never shown as extra form fields. |
| `D02-ASM-010` | A Favourite must have at least one non-empty criteria field; an all-empty criteria set (which would match every vehicle) is rejected server-side as a validation error, not silently accepted. |

## 5. Code map

**Mock API** — `apps/mock-api/src/store.ts` (record interfaces → `seedX` arrays → pure projections → `interface DemoStore` → `class MemoryStore` → `class PostgresStore` → `createStore()`), `apps/mock-api/src/server.ts` (all routes registered inline in `createMockApiApp`), `apps/mock-api/src/auth/customer-scope.ts` (`resolveCustomerScope`, reused unchanged from Phase 2.12).

The `enquiries` table already exists in PostgreSQL; T001 adds one column to it. `wishlist_items` and `favourite_searches` are brand-new tables added by T002. `CREATE TABLE IF NOT EXISTS` does not add a column to an existing volume — T001's `customer_id` column on `enquiries` must be a companion `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` statement, exactly as the existing `enquiryType`/`source`/`consent` columns were added in earlier phases; a local `carchief-postgres-data` volume must be recreated to pick it up. T002's two new tables are genuinely new, so a plain `CREATE TABLE IF NOT EXISTS` is sufficient, following the `customer_accounts` precedent from Phase 2.12.

**Contract** — `openapi/openapi.json` is hand-maintained; `corepack pnpm api:generate` regenerates `packages/api-client/src/generated/schema.d.ts`, which is never hand-edited. New/changed paths in this phase: `POST /api/v1/enquiries` (response gains `customerId`), `GET /api/v1/customer/inquiries`, `GET /api/v1/vehicles/{idOrSlug}/inquiry-count`, `GET/POST /api/v1/customer/wishlist`, `DELETE /api/v1/customer/wishlist/:vehicleSlug`, `GET/POST /api/v1/customer/favourites`, `DELETE /api/v1/customer/favourites/:id`, `GET /api/v1/customer/favourites/facets`.

**Shared packages** — `packages/domain/src/index.ts` (`EnquiryRequest`/`EnquiryResponse` extended; new `WishlistItem`, `FavouriteSearch`, `FavouriteSearchCriteria`, `FavouriteSearchFacets`, `VehicleInquiryAggregate` types), `packages/domain/src/auth.ts` (`ROLE_PERMISSIONS.CustomerBuyer` already carries an unused `'create:inquiry'` permission string — reuse it, do not mint a new one), `packages/validation/src/enquiry.ts` (existing name/email/phone pattern to copy for the trimmed quote form), `packages/api-client/src/services/enquiries.ts` and `reservations.ts` (the `constructor(httpClient?)` + `HttpClient.request<T>()` service pattern to copy for the three new services).

**public-web** — `src/features/vehicle-detail/VehicleDetailPage.tsx` (existing CTA bar and `<ReservationSection>` insertion point), `src/features/reservation/**` (the inline, authenticated-aware action-section template to mirror for `src/features/quote-request/**`).

**customer-app** — Vite on port 3001. There is no router: `src/app/App.tsx` is a chain of `if (activeRoute === ...)` returns; `src/features/shell/CustomerShellProvider.tsx` owns the `DEFAULT_NAV_ITEMS` array rendered by `CustomerNav.tsx`; `src/features/registry/featureRegistry.ts` is a uniqueness-validated feature-ownership registry every new feature must register in; `src/features/inventory/CustomerVehicleDetailPage.tsx` is the target vehicle detail page; `src/features/account/AccountGuard.tsx` wraps the whole app, so every customer-app page in this phase may assume an authenticated `CustomerUser` from `useCustomerShell()`; the customer's mandatory `mobile_number` is already on `customer_accounts` and retrievable via `GET /api/v1/customer/profile` — no session-shape change is needed to submit a no-form quote request.

## 6. Required test paths

| Layer | Path |
|---|---|
| Mock API | `apps/mock-api/src/__tests__/enquiries.test.ts` (extended for `customerId`/aggregate), new `apps/mock-api/src/__tests__/customer-inquiries.test.ts`, `wishlist.test.ts`, `favourites.test.ts` |
| Shared packages | `packages/validation/src/__tests__/enquiry.test.ts` (extended), new `wishlist.test.ts`, `favourites.test.ts`; `packages/api-client/src/__tests__/contract.test.ts` |
| public-web | new `apps/public-web/src/features/quote-request/__tests__/quote-request.test.ts` |
| customer-app | new `apps/customer-app/src/features/inquiries/__tests__/inquiries.test.ts`, `features/wishlist/__tests__/wishlist.test.ts`, `features/favourites/__tests__/favourites.test.ts`; extended `features/inventory/__tests__/inventory.test.ts` |
| End to end | new `tests/e2e/customer/inquiries.spec.ts`, `wishlist.spec.ts`, `favourites.spec.ts`; a public-web quote-request e2e assertion added to the existing `tests/e2e/enquiry-reservation.spec.ts` |
| Traceability | `tests/traceability/**` and `apps/customer-app/src/features/registry/featureRegistry.ts` |

Mock API tests boot the real Express app on an ephemeral port: `createMockApiApp(createStore(''))` — the empty string forces `MemoryStore` — then `app.listen(0, '127.0.0.1')` and drive it with `fetch`. Root Vitest runs in the `node` environment, with no jsdom.

## 7. Boundaries

- The Mock API is the only authority for who a quote request, wishlist item or favourite belongs to. `customerId` is always resolved server-side via `resolveCustomerScope(req.user.sub)`; it is never accepted as client input.
- A frontend application or package may not import `mock-api`, prisma, firebase or supabase. Files under `features/` may not import `api-client/generated/schema`. Files under `routes/` may not import `services/`. `packages/ui` may not import a service. `corepack pnpm test:boundaries` enforces this.
- No `NEXT_PUBLIC_*` or `VITE_*` variable may carry a secret, password or token.
- No static `style={{...}}` and no literal colour, font, spacing, radius or shadow value in TSX. Use semantic classes and `packages/theme` tokens.
- Every Favourites dropdown option comes only from `GET /api/v1/customer/favourites/facets`; none may be hardcoded in the frontend.
- Do not modify `POC/**`; `git diff -- POC` must stay empty.
- Agents never commit, push, create PRs, merge, rewrite history or self-approve.
