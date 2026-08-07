# CarChief POC — Feature Evidence Register

**Environment:** local Docker POC, `carchief-poc-web-1` (`carchief-poc-web:local`), `127.0.0.1:8080`, healthy.
**Browser:** Playwright MCP driving Chromium 152.0.7977.8 (Chrome for Testing, bundled build).
**Execution window opened:** 2026-08-06.

## Evidence-type legend

Every row below is tagged with how the fact was established. These are **not** interchangeable.

| Tag | Meaning |
|---|---|
| **[BROWSER]** | Observed at runtime in a real Chromium page — DOM, console, network waterfall, or live `localStorage` read. |
| **[HTTP]** | Observed via HTTP request only (pre-flight, 2026-08-06). No rendering, no JS execution. |
| **[SOURCE]** | Read from `POC/src`, `POC/build`, or `docker/` read-only. Static claim; not proof of runtime behaviour. |

Where a **[SOURCE]** claim was later confirmed in the browser, both tags appear and the row says so explicitly.

## Mutations performed

**None to date.** No record created, edited or deleted. No `ZZTEST-` records exist yet. `/__reset/` has **not** been triggered.

Environment changes made outside the application (permitted — not app source, Docker, or business logic):
- Installed Playwright's bundled Chromium (no admin rights used).
- Added `--browser chromium` to the `playwright` server args in `.mcp.json`, with prior approval.

---

## Phase 0 — Baseline

### E0.1 — The three URLs are three separate build artifacts, not one client-side router

**Tags:** [SOURCE] → confirmed [BROWSER]

The plan asked whether `/`, `/customer/` and `/staff/` are three applications or one router. Neither, exactly: they are **three separately pre-built HTML bundles compiled from one codebase**, each with a different role baked in at build time.

`docker/poc/Dockerfile` (lines 11–13) copies three distinct files:

| Served path | Build artifact | Size |
|---|---|---|
| `/index.html` | `POC/build/carchief_website.html` | 2,726,269 B |
| `/customer/index.html` | `POC/build/carchief_customer_backend.html` | 2,725,789 B |
| `/staff/index.html` | `POC/build/carchief_staff_backend.html` | 2,727,463 B |

Each bundle hardcodes three globals **[SOURCE]**:

| Bundle | `__CARCHIEF_FORCE_VIEW__` | `__CARCHIEF_FORCE_ROLE__` | `__CARCHIEF_FORCE_USER__` |
|---|---|---|---|
| `carchief_website.html` | `'showroom'` | `'Guest'` | `null` |
| `carchief_customer_backend.html` | `'customer'` | `'Dealer'` | object |
| `carchief_staff_backend.html` | `'backend'` | `'Admin'` | object |

**Confirmed [BROWSER]** — live evaluation on `http://127.0.0.1:8080/staff/?view=backend` returned `forceView: "backend"`, `forceRole: "Admin"`, `__CARCHIEF_FORCE_USER__` with fields `uid`, `email`, `displayName`.

**Consequence:** the active role is a **compile-time constant**, not the result of any authentication. This is the single most important structural finding of Phase 0 and it governs Phases 4 and 5.

### E0.2 — The `?view=` URL parameter is decorative. The forced view always wins on load.

**Tags:** [BROWSER] + [SOURCE]

> **Correction.** An earlier revision of this row attributed the behaviour below to the auth listener at `App.tsx:713-726` demoting `backend` → `showroom`, and concluded that only the staff view was unreachable. Further testing showed that explanation was wrong and too narrow. The corrected mechanism follows; the observations themselves were accurate.

| Navigated to | Landed at | Rendered |
|---|---|---|
| `/` | `/?view=showroom` | Public showroom |
| `/customer/` | `/customer/?view=customer` | Customer portal |
| `/staff/` | `/staff/?view=backend` | Staff ERP console |
| `/?view=backend` | `/?view=showroom` | Showroom — **overridden** |
| `/?view=all-stock` | `/?view=showroom` | Showroom — **overridden** |
| `/?view=faq` | `/?view=showroom` | Showroom — **overridden** |

The built bundle contains **[SOURCE, `carchief_website.html`]**:

```js
if (window.__CARCHIEF_FORCE_VIEW__) return window.__CARCHIEF_FORCE_VIEW__
```

This short-circuits the view initialiser **unconditionally**, ahead of the query-param check at `App.tsx:252-268`. So on page load, **every** `?view=` value is discarded in **every** bundle — not just `backend`, and not just in the public build. `all-stock` and `faq` are ordinary public views with no auth involvement, and both were overridden.

Two consequences, both firmer than the earlier reading:

1. The `?view=` parameter visible in the address bar is **written but never read**. `App.tsx:270-278` syncs it via `history.replaceState` after every view change; nothing consumes it on load. It is a display artifact.
2. In-app navigation still works normally — the forced view applies only at mount, after which `setCurrentView` operates freely. Clicking "Contact" correctly moved to `?view=contact` **[BROWSER]**.

This reinforces E1.1: not only are there no anchors, the URL that *is* produced cannot restore its own state. Pasting any CarChief URL into a fresh tab returns the bundle's default view regardless of what the URL says.

### E0.3 — Firestore is not live. Persistence is browser-local.

**Tags:** [BROWSER] — this was the priority check, and it settles a genuine ambiguity

The pre-flight **[HTTP]** conclusion was "no application backend exists." Read-only source inspection appeared to contradict it: `POC/package.json` depends on `firebase@^12.15.0`, and `App.tsx` contains `handleFirestoreError`, `onAuthStateChanged`, `signInWithEmailAndPassword`, `setDoc`, `doc(db, 'users', …)` **[SOURCE]**.

The browser waterfall resolves it. Full network capture on the public landing page — **17 requests total, all static**:

- `127.0.0.1:8080` — document, `manifest.webmanifest`, `favicon.svg`, `input_file_0.png`
- `fonts.googleapis.com` / `fonts.gstatic.com` — 4 font requests
- `images.unsplash.com` — 9 vehicle images

**Zero requests to `firestore.googleapis.com`, `identitytoolkit.googleapis.com`, or any Firebase endpoint.** Non-static request count: **0**.

The Firebase imports resolve to a local shim, not the real SDK. Persistence is `localStorage` on a single origin. The pre-flight conclusion stands; the source dependency is dead weight.

### E0.4 — All three roles share one storage origin

**Tags:** [BROWSER]

All three URLs are served from origin `http://127.0.0.1:8080`, therefore one `localStorage` partition. Demonstrated by key growth across a single browser context:

- After visiting `/` only: **7 keys**
- After additionally visiting `/customer/` and `/staff/`: **19 keys**

Keys observed (names only — no values transcribed):

```
carchief_mock_db_users          carchief_security_roles
carchief_mock_db_version_v8     admin_account_initialized_v2
force_auto_logout_charithoutdesk_v2
fs_quota_exceeded               fs_cache_settings
fs_cache_vehicles               fs_cache_customers
fs_cache_customerVehicles       fs_cache_customerInvoices
fs_cache_customerPayments       fs_cache_customerDocuments
fs_cache_customerNotifications  fs_cache_customerTiers
fs_cache_proformaInvoices       backend_active_tab
backend_finance_subtab          customer_portal_tab
```

The `carchief_mock_db_*` naming is the application's own word for its store. The `fs_cache_*` prefix is a Firestore-cache emulation written to `localStorage`.

Seeded baseline: `carchief_mock_db_users` = array of **1** record (fields `uid`, `name`, `email`, `role`, `createdAt`, `id`; role `Admin`). `carchief_security_roles` = array of **4** records.

### E0.5 — Role vocabulary

**Tags:** [BROWSER] — read live from `carchief_security_roles`

| Role id | Display name | System role |
|---|---|---|
| `Admin` | Super Admin | yes |
| `Dealer` | Partner Dealer | yes |
| `Sales` | Sales Representative | yes |
| `Guest` | Showroom Guest | yes |

Each carries `description`, `isSystemRole`, `permissions`.

### E0.6 — Both privileged portals auto-authenticate with no credential challenge

**Tags:** [BROWSER] — screenshots on file

Navigating directly to `/staff/` in a **fresh context with no login step** rendered the full ERP console, header reading **"Super Admin Staff / SUPER ADMIN"**, with Inventory, Leads, Finance and Master Controls tabs, live KPI tiles, customer follow-ups and a $195,200 approved TT remittance panel.

Navigating directly to `/customer/` rendered the client portal as **"WELCOME BACK, CHARITH"** — `CUST-1001`, "PLATINUM CLUB" tier, badge "SECURE CLIENT SESSION / ACTIVE", $500,000 credit limit.

No login form was presented in either case. Console confirms the mechanism:

```
Auto-logged out active user sessions per user request.
Super Admin auto-creation successful on mount.
```

Evidence: `docs/evidence/phase0/phase0-staff-landing.png`, `phase0-customer-landing.png`, `phase0-public-landing.png`.

### E0.7 — Console is clean; the "offline" banner is cosmetic

**Tags:** [BROWSER]

Across all three landings: **0 errors**, 2 warnings — both benign and environmental:
1. `<meta name="apple-mobile-web-app-capable">` deprecated.
2. Manifest icon `input_file_0.png` is not a valid image.

Informational logs: `OfflineCache Loop Detection and Audit Engine Initialized`, `Service Worker registered successfully`, plus the two auth lines in E0.6.

A persistent red banner sits atop the customer and staff portals: *"OfflineCache Quota Limit Reached — The system has automatically entered offline high-fidelity fallback mode. All features remain 100% responsive and functional!"* with a "Retry Live Connection" action. Given E0.3, there is **no live connection to fall back from**. `localStorage` key `fs_quota_exceeded` is `true` at seed. The banner presents a permanent architectural condition as a temporary degradation.

Related: the public site footer claims *"CarChief utilizes highly secure cloud-replicated server architectures for real-time transaction records and client logs"* under a "SECURED CLOUD ENVELOPE" badge **[BROWSER]**. No such architecture is reachable at runtime.

### E0.8 — Seeded demo data visible at baseline

**Tags:** [BROWSER] — read from rendered dashboards, no interaction

Public showroom: 6 vehicle cards (Range Rover Sport SV $180,300; Mercedes-AMG GT 63 S E-Performance $198,000; Porsche 911 GT3 RS $274,500; BMW M4 Competition xDrive $89,500; Tesla Model S Plaid $94,990; Audi R8 Coupe V10 Performance $189,900).

Staff console KPIs: 5 available vehicles, 0 reserved, 1 PI issued, 0 pending payments, 0 sold this month, $0.0K monthly sales, target 25 units, 0% achievement, 1 open quotation, 2 active customers, 2 pending followups, $0 commission. Leads: Charith (contacted), John Smith (new, score 65). Brands: Toyota 8, Mercedes-Benz 4, Porsche 3, Ford 2, Land Rover 1. Customer base: Japan, 2 clients.

Customer portal: 2 bought cars, 1 in transit, 0 port ready, 0 due bills, $0.00 pending balance. Two Audi R8 entries (one RESERVED / ETA TBD, one TRANSIT / ETA 2026-09-02).

> Note a data inconsistency visible without any interaction: the staff "Sales Distribution by Brand" chart totals 18 units across Toyota/Mercedes/Porsche/Ford/Land Rover, but the inventory KPI reports 5 available vehicles and the showroom lists 6 — and none of the 6 are Toyota or Ford. The chart is not derived from the vehicle store.

---

## Phase 1 — Public website ✅ complete

### E1.1 — Navigation uses buttons, not links; no deep-linkable routes

**Tags:** [BROWSER]

Every navigation control on the public site is a `<button>` — zero anchor elements in the nav, footer, or vehicle grid. Views change via `setCurrentView` state with a `history.replaceState` URL sync **[SOURCE, App.tsx:270-278]**. Views reachable: `showroom`, `all-stock`, `how-to-buy`, `about`, `testimonials`, `faq`, `contact`, plus `freight`, `customer`, `admin-login`.

Practical effect: no route is shareable or bookmarkable in the normal sense, nothing is crawlable by search engines, and browser Back does not traverse view history.

### E1.2 — Keyword search and empty state work correctly

**Tags:** [BROWSER]

Typing `ZZTEST-NOMATCH-QQQ` into the showroom keyword box filtered the 6-card grid to zero and rendered a dedicated empty-state panel. No console error. Evidence: `docs/evidence/phase1/phase1-search-empty-state.png`.

### E1.3 — Form validation is browser-native only, not application-level

**Tags:** [BROWSER]

On the Contact enquiry form:

| Attempt | Result |
|---|---|
| Submit fully empty | Blocked. No application message; native `required` handling only. |
| Email `not-an-email` | Blocked by **Chrome's own bubble**: *"Please include an '@' in the email address. 'not-an-email' is missing an '@'."* |
| Valid submission | Accepted, persisted. |

The malformed-email rejection is the browser's built-in constraint validation, not CarChief logic — the styling is Chrome's, not the application's. Evidence: `docs/evidence/phase1/phase1-contact-malformed-email.png`.

No application-level validation was observed on any field: no email-domain check, no phone-format check, no length limits, no server-side validation (there is no server).

### E1.4 — Structured filters, sort and empty state all work correctly

**Tags:** [BROWSER]

"Maximize Filters" on All Stock exposes controls that are genuinely **derived from the vehicle store**, not hardcoded — the Make list (`Land Rover, BMW, Mercedes-Benz, Tesla, Porsche, Audi`) and Model list exactly match the 6 catalogue vehicles.

Controls present: Make, Model, Vehicle Type (SUVs/Coupes/Sedans), Year From/To, a price slider, Fuel type (Petrol/Electric/Hybrid), and Sort.

| Test | Result |
|---|---|
| Sort → "Price: Low to High" | **Correct.** $89,500 → $94,990 → $180,300 → $189,900 → $198,000 → $274,500 |
| Filter Make=`Tesla` + Type=`SUVs` (contradictory — the Tesla is a sedan) | **Correct.** 0 results, with a proper empty state: *"NO SHOWROOM MODELS FOUND — We could not find any active vehicles matching your current custom filter specification. Try resetting selectors or search keywords."* |
| "Reset All" | **Correct.** Restored all 6. |

Filters compose correctly across dimensions. This is the strongest-working area of the application found in this run.

**No pagination exists** on any public list view. With 6 records this is untested at scale and may simply be unimplemented — it cannot be distinguished from "not needed yet."

### E1.5 — Vehicle detail pages ARE deep-linkable; the SEO gap is narrower and different

**Tags:** [BROWSER]

> **Correction.** An earlier revision of this register and of the Gap Report stated that vehicle detail pages are "unreachable by URL." **That was wrong.** The corrected position follows.

Clicking a vehicle card produced the URL `?vehicleId=vehicle-2`. Navigating to that URL **cold, in a fresh page load, correctly rendered the Porsche 911 GT3 RS detail page** — heading "911 GT3 RS", condition assessment, full description.

The `vehicleId` parameter **is** read on mount (`App.tsx:291-299`), unlike `view` (E0.2). So the two query parameters behave oppositely: `view` is written-but-never-read, while `vehicleId` is honoured. Vehicle detail pages are genuinely addressable and shareable.

The SEO problem is therefore **not** addressability. Measured on the cold-loaded detail page:

| Signal | Value |
|---|---|
| `<title>` | `CarChief \| Premium Global Automotive Curator` — **generic, not per-vehicle** |
| `meta[name=description]` | **absent** |
| `link[rel=canonical]` | **absent** |
| Open Graph tags | **none** |
| JSON-LD structured data | **0 blocks** |
| **Anchor elements on the page** | **0** |
| `<h1>` count | **2** (should be 1) |

The real gap is twofold: (1) **zero anchors anywhere**, so a crawler has no link graph to discover the addressable pages through — they exist but nothing points at them; and (2) **no per-page metadata**, so even a directly-fetched vehicle page carries a generic title, no description, no share preview and no `Vehicle`/`Product` structured data.

This is a meaningfully smaller and better-defined problem than "routing must be rebuilt." The URL scheme already works.

---

## Phase 4 — Handoffs

### E4.1 — **A public enquiry persists but never reaches the staff console**

**Tags:** [BROWSER] — the central negative finding of this run

**Mutation performed (first and only write to date):**

| Field | Value |
|---|---|
| Name | `ZZTEST-Runtime Validation` |
| Email | `zztest.runtime@example.invalid` |
| Phone | `+1 555 000 0000` |
| Message | `ZZTEST-2026-08-06 runtime validation enquiry. Safe to delete.` |
| Submitted | 2026-08-06, public Contact form |
| Landed in | `localStorage` key `carchief_mock_db_leads` (key **created** by this submission — it did not exist at baseline) |

Record shape: `id`, `vehicleId`, `vehicleTitle`, `customerName`, `customerEmail`, `customerPhone`, `message`, `status`, `notes`, `createdAt`.

Then, in the **same browser context and same storage origin**, navigating to `/staff/` → Leads:

| Source | Contents |
|---|---|
| `carchief_mock_db_leads` (live read) | **2 records** — `ZZTEST-Runtime Validation`, `Marcus Sterling` |
| Staff "Buyer Communications Registry" UI | **2 rows** — `Charith` (CONTACTED), `John Smith` (NEW) |
| Staff tab badge | **"Leads (1)"** |

Three different answers to "how many leads are there," and **the two name sets do not intersect at all**. The staff Leads table is rendering hardcoded demo data; it is not reading the lead store the public form writes to. The ZZTEST record appears nowhere in the staff DOM (`grep ZZTEST` on the staff page snapshot: 0 hits).

**Conclusion:** the customer→staff handoff does not exist. This is not a storage-isolation problem — storage is shared and the staff bundle *can* read the record. The UI simply is not wired to it. Evidence: `docs/evidence/phase4/phase4-staff-leads-no-zztest.png`.

---

## Phase 6 — API and network evidence (partial)

### E6.1 — The `/api/` 503 is irrelevant; the "AI Copilot" is a local regex

**Tags:** [BROWSER] + [SOURCE]

Ran the AI Copilot suggested query *"Show me all Toyota SUVs under $15,000"* and submitted it. Result banner: **"AI search resolved successfully. Found 0 matching vehicles."**

Network capture across the entire interaction: **0 non-static requests**. `/api/` was never called. The pre-flight **[HTTP]** finding that `/api/` returns 503 (*"Optional AI service is unavailable…"*) is therefore real but inert — no UI path reaches it in the public bundle.

`POC/src/utils/aiSearchLocal.ts` confirms **[SOURCE]**: `localHeuristicSearch()` is a regex parser over vehicle fields, documented in its own header as resolving "in under 2ms, bypasses network latency, and avoids unnecessary Gemini/Firestore load."

Two observations worth carrying forward:
1. The feature is branded "AI Copilot" with a "COPILOT ONLINE" badge, but no model is involved on this path.
2. It reports "**resolved successfully**" when it matched nothing — a zero-result search is presented as a success rather than an empty state, unlike the Standard Filters path (E1.2) which renders a proper empty state.

### E6.2 — Total outbound surface

**Tags:** [BROWSER]

Across all navigation and interaction performed in this run, every outbound request went to exactly three hosts:

| Host | Purpose |
|---|---|
| `127.0.0.1:8080` | Own document, manifest, favicon, service worker |
| `fonts.googleapis.com` / `fonts.gstatic.com` | Web fonts |
| `images.unsplash.com` | All vehicle photography |

No application API call of any kind was observed at any point. Vehicle imagery is hot-linked from Unsplash rather than served from the inventory record.

---

## Phase 2 — Customer application ✅ complete

### E2.0 — Customer portal source does not exist; browser evidence is the only evidence

**Tags:** [SOURCE] + [BROWSER]

`App.tsx:73` imports `CustomerPortalApp from './customer/CustomerPortalApp'`, but **`POC/src/customer/` does not exist**. The customer portal ships only in the compiled bundle.

This confirms the roadmap's stated limitation, and it raises the value of everything in this Phase: for the customer application, **runtime observation is the only means of validation available**. Nothing here could have been found by reading source.

### E2.1 — Customer data model (read live from the seeded stores)

**Tags:** [BROWSER]

| Store | Count | Fields |
|---|---|---|
| `fs_cache_customers` | 2 | `id, uid, customerId, customerName, email, companyName, phone, address, country, tierId, tierName, assignedSalesPersonId, status, creditLimit, outstandingBalance, createdAt` |
| `fs_cache_vehicles` | 6 | `id, make, model, type, year, price, mileage, condition, color, transmission, fuelType, engine, description, images, status, createdAt` |
| `fs_cache_customerVehicles` | 1 | incl. `stockNo, chassisNo, engineNo, bookingStatus, containerNo, blNo, vesselName, voyageNo, etd, eta, portLoading, portDischarge, shipmentStatus, allocationStatus, isOnlineReservation, timeline` |
| `fs_cache_proformaInvoices` | 1 | `invoiceId, customerName, buyer, vehicleDetails, costs, financials, totalAmount, totalPaid, paymentStatus, status, bankDetails` |
| `fs_cache_customerPayments` | 1 | `paymentId, customerId, invoiceId, amount, currency, paymentDate, method, status, bankReference, allocatedVehicles` |
| `fs_cache_customerTiers` | 4 | `id, name, discount, priority, remarks` |
| `fs_cache_customerInvoices` | **0** | — (commercial invoices never seeded) |

The shipment model is genuinely detailed — B/L number, vessel, voyage, ETD/ETA, load/discharge ports. This is a credible domain model, not a mock-up.

### E2.2 — ✅ Proforma invoice arithmetic is **correct**

**Tags:** [BROWSER]

`PI-2026-0001`:

| Line | Amount (USD) |
|---|---|
| FOB price (Audi R8 Coupe V10, chassis `4S-CR8V10-00912`) | 189,900 |
| Freight charge | 2,500 |
| Customs clearance | 1,200 |
| Export inspection | 450 |
| Port handling | 350 |
| Insurance | 800 |
| **Computed total** | **195,200** |
| **Stored `grandTotal` / `totalAmount`** | **195,200** ✓ |

189,900 + 5,300 = 195,200. **The arithmetic is internally consistent.** `totalPaid` 195,200, `paymentStatus` "Fully Paid", `status` "Approved".

Payment `TXN-908122` — 195,200 USD, T/T Wire Transfer, Approved — allocates 195,200 to `vehicle-1`. **Allocation reconciles exactly to the invoice.** The invoice ledger view independently shows Total $195,200.00 / Paid $195,200.00 / Outstanding $0.00 — also consistent.

This is a genuinely positive finding and it narrows the risk flagged earlier: the seeded financial chain reconciles end to end.

### E2.3 — ❌ Tier discount is defined but never applied

**Tags:** [BROWSER]

| Tier | Discount |
|---|---|
| Platinum | **15%** |
| Gold Club | 10% |
| Silver Member | 5% |
| Standard Trade | 0% |

`CUST-1001` (Charith) is `tier-platinum`, displayed in the portal as "PLATINUM CLUB". The invoice uses `fobPrice: 189900` — **the exact unmodified showroom list price** of the R8. A 15% Platinum discount would yield 161,415.

**No discount was applied at any point in the invoice chain.** The tier structure is stored, displayed as a status badge, and ignored by the pricing.

### E2.4 — ❌ No duty or tax line exists anywhere

**Tags:** [BROWSER]

The `costs` object contains freight, customs *clearance*, export inspection, port handling and insurance. There is **no import duty, no VAT/GST, and no tax field** in the PI, the payment record, or any store.

For a cross-border vehicle export business quoting landed cost, duty and tax are typically the largest variable component after the vehicle itself. Requirement R8.1 is not met by the POC in any form.

### E2.5 — ❌ `outstandingBalance` is orphaned; credit utilisation reads $0 against a stored $120,000

**Tags:** [BROWSER]

| Source | Value |
|---|---|
| `fs_cache_customers` → `CUST-1001.outstandingBalance` | **120,000** |
| `fs_cache_customers` → `CUST-1001.creditLimit` | 500,000 |
| Portal UI — "PENDING BALANCE" | **$0.00** |
| Portal UI — "CREDIT UTILIZATION" | **$0 / $500,000** |
| Portal UI — billing summary | *"Your account is fully settled. No pending dues."* |

The **same component reads `creditLimit` correctly ($500,000 ✓) and ignores `outstandingBalance` entirely.** The UI instead derives outstanding from the invoice ledger — where the only invoice is fully paid, giving $0.00.

So there are **two competing sources of truth for what a customer owes**, they disagree by $120,000, and the stored field is silently discarded. `CUST-1002` (Kenji Tanaka) carries the same contradiction: `outstandingBalance` 45,000 against a 300,000 limit.

Consequence: credit utilisation displays 0% for a customer the data says has drawn 24% of their limit — a figure that, in a credit-controlled export business, exists precisely to prevent over-extension. Evidence: `docs/evidence/phase2/phase2-credit-balance-contradiction.png`.

### E2.6 — ❌ The real invoice number is never displayed

**Tags:** [BROWSER]

The PI record holds `invoiceId: "PI-2026-0001"` — a properly formatted document number — and `id: "pi-1"`, the internal key. The customer's invoice ledger renders **`PI-pi-1`**: it prefixes `"PI-"` onto the *internal id* rather than using `invoiceId`.

`PI-2026-0001` appears nowhere in the UI. For a document that functions as a customs and banking reference, displaying a synthesised internal key instead of the issued number is a substantive defect, not cosmetic.

### E2.7 — Currency

**Tags:** [BROWSER]

Every figure observed is USD, with correct `en-US` thousands separators and 2dp formatting. `ExchangeRateMaster.tsx` exists **[SOURCE]** but **no multi-currency behaviour, conversion or rounding was exercisable** — there is no second currency in the seed data and no currency selector in the customer journey. R8.2 remains unverified.

---

## Phase 3 — Salesperson application ✅ complete

### E3.1 — Master data is substantial and real

**Tags:** [BROWSER]

Master Controls exposes: Core Config, CSV Upload, Freight Calculator, City Delivery, Customer Tiers, Customer Management, Roles Control, CMS, FAQ Manager, OfflineCache Audit.

Admin Master Controls holds **Country Master (4)** — Kenya, Tanzania, Jamaica, New Zealand; **Port Master (4)**; **Costing Items Master (3)**; **Shipper Master (2)**; **Bank Master (2)**; **Terms Presets (2)**.

> Domain note: the country master lists export *destinations* (Kenya, Tanzania, Jamaica, NZ), while both seeded customers have `country: "Japan"` and the dashboard reports "CUSTOMER BASE BY COUNTRY: JAPAN — 2 Clients". Japan is the sourcing origin in the public copy. Customer country and destination country appear conflated in the seed data.

### E3.2 — ❌ The freight engine is unconfigured, yet invoices carry freight charges

**Tags:** [BROWSER]

The Freight Calculator maps Country + Port + M3 range → cost per M3. Its table reads: **"No freight mappings found."** No mapping exists for any of the 4 countries. A "Seed Freight Mappings" button is present and was not pressed.

Yet `PI-2026-0001` carries `freightCharge: 2500` (E2.2). **The freight charge on the seeded invoice is not derived from the freight engine** — the engine has no data to derive it from. Freight configuration and freight billing are disconnected.

### E3.3 — ❌ A staff inventory edit was silently discarded

**Tags:** [BROWSER] — controlled mutation, logged below

**Mutation:** on the staff Inventory tab, "Edit specs" → Range Rover Sport SV Edition One → set **Exterior Paint** to `ZZTEST-PAINT-20260806` → clicked **"Commit Specifications"**.

**Result:** the UI accepted the action with **no error and no warning**. The value then appeared **nowhere**:

- `grep ZZTEST-PAINT` across **every** `localStorage` key: **0 hits**
- `fs_cache_vehicles` → Range Rover `color` still `"Firenze Red Metallic"`
- Not present in the rendered DOM

The edit was accepted, confirmed, and lost. Staff inventory editing does not persist.

### E3.4 — ❌ The same commit evicted nine customer and finance stores

**Tags:** [BROWSER]

Immediately after the "Commit Specifications" click, these keys were **gone** from `localStorage`:

```
fs_cache_customers              fs_cache_customerInvoices
fs_cache_proformaInvoices       fs_cache_customerPayments
fs_cache_customerTiers          fs_cache_settings
fs_cache_customerVehicles       fs_cache_customerDocuments
fs_cache_customerNotifications
```

All nine. Simultaneously, two new keys appeared — `carchief_mock_db_vehicles` (**3** records, against 6 in `fs_cache_vehicles`) and `carchief_mock_db_vehicleImages`. `fs_quota_exceeded` remained `true`.

A routine inventory edit destroyed the entire customer, invoice, payment and tier state. This is consistent with the "OfflineCache" quota-eviction mechanism firing on write, but the effect is indiscriminate: unrelated financial records were evicted to make room for a vehicle write that itself did not persist.

**Recovery [BROWSER]:** navigating to `/customer/` **automatically re-seeded** all nine stores — 2 customers, 1 PI, 1 payment restored, portal rendering $195,200 again. **No lasting damage; the environment is intact.**

That recovery is itself a finding: these stores are re-derived from hardcoded seed values on portal mount. It explains E3.3 — user writes cannot survive, because the seed is authoritative and reapplied.

### E3.5 — Vehicle IDs render broken in the staff grid

**Tags:** [BROWSER]

Every inventory row displays `ID: vehicle- • 2024 model • SUV` — the numeric suffix is missing. Actual ids are `vehicle-1`, `vehicle-2`, etc. The identifier a salesperson would quote is unusable throughout the grid.

### E3.6 — Staff capability surface (observed, not exercised)

**Tags:** [BROWSER]

Per-vehicle row actions: Check More Details, **Reserve Vehicle**, Edit specs, **Remove vehicle**. Vehicles carry "Expand All 37 Specifications". Status values seen in the grid: `Available`, `Pending`; condition `New`, `Used`.

**"Remove vehicle" was not clicked**, per the deletion safety commitment. Reserve Vehicle was not exercised — given E3.3, a reservation would very likely not persist either, but that is inference and is not claimed as evidence.

---

## Phase 4 (continued) — staff → customer propagation

### E4.2 — Propagation could not be demonstrated, because staff writes do not persist

**Tags:** [BROWSER]

The staff→customer direction was to be tested by making a staff-side change and observing it in the customer portal. The attempt (E3.3) established that **the staff-side change never persisted in the first place**, so there was nothing to propagate.

The correct conclusion is therefore stronger than "propagation is broken": **the write itself fails**, silently. Combined with E4.1 (customer→staff read path unwired), **neither direction of the handoff functions**, for two different reasons:

| Direction | Write | Read | Net |
|---|---|---|---|
| Customer/public → staff | ✅ persists (`carchief_mock_db_leads`) | ❌ staff UI ignores the store | Broken at read |
| Staff → customer | ❌ silently discarded, and evicts other stores | not reached | Broken at write |

---

## Phase 5 — Role and permission boundaries ✅ complete

### E5.1 — No authentication boundary exists (established in Phase 0)

Role is a build-time constant; `/staff/` yields Super Admin with no challenge (E0.1, E0.6). There is no session to escalate from.

### E5.2 — ❌ No data isolation between customers

**Tags:** [BROWSER] — the material Phase 5 finding

While the browser was on **`/customer/`** — the customer-facing bundle, forced role `Dealer`, presenting as `CUST-1001` — a live read of `fs_cache_customers` returned **both** customer records:

| customerId | Name | Tier | Credit limit | Outstanding |
|---|---|---|---|---|
| CUST-1001 | Charith | Platinum | 500,000 | 120,000 |
| **CUST-1002** | **Kenji Tanaka** | **Gold Club** | **300,000** | **45,000** |

A customer's own browser holds **every other customer's** identity, contact details, company, assigned salesperson, credit limit and outstanding balance. The same applies to all other stores.

This is not a UI filtering oversight that server-side scoping would fix later — it is inherent to the architecture. With all state in `localStorage` and no backend (E0.3), **every record the application can display to anyone is present in every user's browser**, readable from the console in one line. There is no boundary to enforce, and none can be added without introducing a server.

### E7 — Follow-up sweep (2026-08-06, second session)

Completing the previously-pending items. **Several earlier findings are corrected here.**

#### E7.1 — ✅ Complete status vocabularies

**Tags:** [SOURCE `types.ts`] + [BROWSER]

**Vehicle** (`VehicleStatus`, 8 values): `Available` · `Pending` · `Sold` · `Draft` · `Reserved` · `Reserved with PI` · `Invoice Created` · `Invoiced`

**Lead** (5 values), with the business labels the UI shows:

| Value | UI label |
|---|---|
| `New` | New (Needs Call) |
| `Contacted` | Contacted (Emailed) |
| `In Progress` | In Progress (Negotiation) |
| `Sold` | Sold (Closed-Won) |
| `Archived` | Archived (Closed-Lost) |

**TT payment:** `Pending` · `Approved` · `Rejected`. **Shipment:** `RESERVED` → `TRANSIT` → `PORT READY`.

#### E7.2 — ✅ Reservation model works, with expiry

**Tags:** [BROWSER] — mutation performed and reverted

Reserving `vehicle-1` wrote a complete reservation to `carchief_mock_db_vehicles`: `reservedAt`, `reservedUntil`, `reservationDurationHours: 48`, `reservedByName`, `reservedByEmail`, `reservedCustomerName`, `reservedCustomerId`, `customer`, `market`. `reservedUntil` = `reservedAt` + 48h, computed correctly.

Status moved to `Reserved` **in the mock store**, while `fs_cache_vehicles` stayed `Available` — the third independent confirmation of the split-brain (after leads and vehicle edits).

#### E7.3 — ❗ The split-brain blocks the entire quotation flow

**Tags:** [BROWSER] + [SOURCE] — the most consequential finding of this sweep

`BackendDashboard.tsx:3673` gates the PI action on status:

```js
{v.status === 'Reserved' && (
  <button onClick={() => setSelectedPiVehicle(v)} title="Create Proforma Invoice">
```

Because a real reservation writes `Reserved` only to the store the UI never reads, **the "Create Proforma Invoice" button never appears**. The documented path via the dashboard's "CREATE QUOTE" quick action leads to an alert telling the user to open a vehicle's details page — and that page is a read-only audit record with no PI control at all.

**Proof:** setting `vehicle-1.status = 'Reserved'` in `fs_cache_vehicles` and reloading made both **"Create Proforma Invoice"** and **"Release Reservation"** appear immediately.

So the reserve → quote → invoice → payment journey is **implemented but unreachable** in the running POC. This is a consequence of the data-layer defect, not of missing features.

#### E7.4 — ✅ Document generation works, and is substantial

**Tags:** [BROWSER] — evidence: `docs/evidence/phase3/phase3-pi-generator-preview.png`

The PI generator is a five-section form with a live PDF preview:

1. Invoice header, buyer/consignee (12 destination countries), shipper, payment due date and terms
2. Vehicle specs auto-loaded, with per-field "show on PDF" toggles
3. Logistics attributes — HS code, shipment type (Container/RoRo), CFS, drive type, seat capacity
4. **Pricing & freight cost ledger** — FOB, Freight, Insurance, Inspection (EAA / JEVIC), plus 3 selectable cost categories
5. Bank and legal terms, with selectable bank account and terms preset

Preview renders a complete, professional invoice — letterhead, ports, terms, full vehicle table, unit price USD 189,900 — with **EMAIL CUSTOMER** and **PRINT OR SAVE PDF** actions and the status "INVOICE COMPILED PERFECTLY". Neither send action was triggered.

*(Bank account number and SWIFT code are displayed on this form. Not transcribed here, per the safety commitments.)*

#### E7.5 — ⚠️ CORRECTION: tax **does** exist

**Tags:** [BROWSER]

E2.4 and gap G5b stated "no duty or tax anywhere." **That was wrong.** The PI cost ledger includes a **`Tax Basis: __ % ($0)`** field — a percentage-based tax applied to the vehicle total — alongside **G.Total Term: `CNF` / `FOB` / `CIF` / `C&F`** (Incoterms).

The accurate finding is narrower: tax is **implemented but unset** — 0% in the seed, and no `tax` key on the stored PI's `costs` object. There is still no *import duty* line distinct from tax.

#### E7.6 — ⚠️ CORRECTION: tier discounts **are** implemented

**Tags:** [BROWSER]

E2.3 and G5a stated tier discounts are "never applied." **Incomplete.** The PI generator displays:

> **SOURCING CLIENT NOT IDENTIFIED** — To leverage dynamic, week-range customer tier discounts, please choose a registered customer in the Buyer Company Name dropdown under Section 1.

So tier discounts **do** apply, conditional on selecting a registered customer. The seeded `PI-2026-0001` simply has no customer identified, which is why it billed full list price. The feature exists; the seed does not exercise it.

#### E7.7 — ⚠️ CORRECTION: multi-currency **is** implemented

**Tags:** [BROWSER]

R8.2 was previously "blocked — no second currency exists." **Resolved.** The PI generator offers **7 trading currencies** — USD, JPY, EUR, UGX, GBP, AUD, CAD — with a conversion-rate field and a computed FOB.

And the Finance → Exchange Rates master holds **6 active rates**, correctly bound to `fs_cache_exchangeRates` (UI matched store exactly), with **internally consistent reciprocals**:

| Pair | Rate | Reciprocal check |
|---|---|---|
| JPY→USD | 0.0061 | 1/0.0061 = 163.93 ✓ |
| USD→JPY | 163.93 | ✓ |
| EUR→USD | 1.08 | 1/1.08 = 0.9259 ✓ |
| USD→EUR | 0.925 | ✓ |

`fs_cache_exchangeRateHistory` is empty — rate history is unpopulated. Conversion is claimed to apply "automatically during TT allocation"; the seeded payment is USD→USD, so no conversion was exercised end-to-end.

#### E7.8 — ❌ Three incompatible invoice numbering schemes

**Tags:** [BROWSER]

| Context | Number shown |
|---|---|
| PI generator (new invoice) | **`P-24617`** |
| Stored record `invoiceId` | **`PI-2026-0001`** |
| Customer invoice ledger | **`PI-pi-1`** |

Three formats for the same class of document. Extends E2.6.

#### E7.9 — ❌ Port/country data error on the invoice

**Tags:** [BROWSER]

The rendered PI shows **"Port of Discharging: Mombasa, Uganda"**. Mombasa is in **Kenya**; Uganda is landlocked. The port-to-country mapping in the master data is wrong, and it prints onto a customs-facing document.

#### E7.10 — ❌ Both rate engines are empty

**Tags:** [BROWSER]

| Engine | State |
|---|---|
| Freight Calculator (Country + Port + M³ → cost/M³) | **"No freight mappings found"** — 0 rates |
| Inland City Delivery (Port + City + M³ → cost/M³ + transit time) | **"Configured Rates (0)"** |

Both offer "Seed Presets" buttons (Nairobi/Kampala/Kigali for city delivery), not pressed. Ports available: Auckland, Dar es Salaam, Kingston, Mombasa — rendered as `"Auckland Port ()"` with an empty parenthetical, the same missing-field defect class as `ID: vehicle-`.

#### E7.10b — ❌ Both rate engines are **permanently unseedable**: the seed guard is inverted

**Tags:** [BROWSER] + [SOURCE] — attempted under explicit authorisation, 2026-08-06

E7.10 recorded both rate engines as empty. With authorisation, I pressed both seed buttons. **Neither can ever succeed.**

| Engine | Button | Result |
|---|---|---|
| Freight Calculator | "Seed Freight Mappings" | **0 records.** Message: *"Freight mappings are already populated."* |
| Inland City Delivery | "SEED PRESETS (NAIROBI, KAMPALA, KIGALI)" | **0 records.** Message: *"City delivery rates are already populated."* |

Both collections were verified to hold the literal value **`[]`** — genuinely, verifiably empty — at the moment each seeder declared them populated. Re-pressing reproduced it identically.

**Root cause — the mock shim does not implement `QuerySnapshot.empty`.** Both seeders guard with the same idiom:

```js
const existingRatesSnap = await getDocs(collection(db, 'freightRates'));
if (!existingRatesSnap.empty) {
  setError("Freight mappings are already populated.");
  return;                      // ← always taken
}
```

With `.empty` undefined on the shim's snapshot, `!undefined === true`, so the guard fires unconditionally and the function returns before any write. **The seeding path is unreachable on every click, including the first.** No console error is produced; the user sees a plausible-looking message that is factually false.

**A second, independent defect sits behind it** in the freight seeder, which would prevent seeding even if the guard were fixed:

```js
const matchedPort = ports.find(pt =>
  pt.name.toLowerCase() === p.portName.toLowerCase() &&
  pt.countryName.toLowerCase() === p.countryName.toLowerCase());
```

1. **Name mismatch.** Presets use `portName: 'Mombasa'`; the port master holds `name: 'Mombasa Port'`. Exact equality fails. (The city-delivery seeder uses `.includes()` and would match.)
2. **`countryName` does not exist on ports.** The seed defines ports as `{ id, name, countryId }` only — no `countryName`. Had a name matched, `pt.countryName.toLowerCase()` would throw a `TypeError`. This is also why every port renders as `"Mombasa Port ()"` with empty parentheses.
3. **Presets reference absent master data.** Two of the three freight preset groups are for `United States / Los Angeles` and `Japan / Tokyo`; the country master holds only Kenya, Tanzania, Jamaica and New Zealand, and the port master only Mombasa, Dar es Salaam, Kingston and Auckland.

**Consequence:** freight and inland-delivery rate calculation cannot be exercised at all through the UI. Requirement R8.3 is unreachable, not merely unconfigured. Combined with E3.2 — the seeded invoice bills $2,500 freight with no engine behind it — the freight pricing chain is broken end to end.

**Cleanup:** the two empty collections created by the `getDocs` calls (`carchief_mock_db_freightRates`, `carchief_mock_db_cityDeliveryRates`, both `[]`) were removed; storage restored to its prior state.

#### E7.11 — ❌ A third hardcoded display literal

**Tags:** [SOURCE] + [BROWSER]

`UserSecurityMatrix.tsx:506`:

```js
{isRoleAdmin ? 'All 26 Enabled' : `${Object.values(role.permissions||{}).filter(Boolean).length} Permissions Enabled`}
```

The Admin row renders a **hardcoded literal "All 26 Enabled"** while every other role computes correctly. The actual permission count is **29**. Dealer (8) and Sales (6) both matched the store exactly.

The permission model itself is genuinely granular — 29 permissions including 8 master-data field grants (`masterCountry`, `masterPort`, `masterCostItem`, `masterShipper`, `masterBank`, `masterTerms`, `masterRemarks`, `masterBankNotes`).

#### E7.12 — The app's own telemetry confirms the forced fallback

**Tags:** [BROWSER]

The OfflineCache Audit panel reports **"FALLBACK MODE: FORCED ACTIVE"** and "LOOP PROTECTION STATUS: FALLBACK". This is the application stating in its own diagnostics that fallback is *forced*, not triggered by a real quota event — directly contradicting the user-facing banner ("OfflineCache Quota Limit Reached — the system has **automatically** entered offline fallback mode") and reinforcing G7.

All counters read **0** — reads, writes, writes-eliminated, active listeners — with "NO STATS RECORDED YET", despite heavy activity throughout this session. The telemetry itself is non-functional.

#### E7.13 — CMS is logo-only; FAQ manager is empty but correctly implemented

**Tags:** [BROWSER] + [SOURCE]

**CMS** manages only the **header logo** (predefined icon / custom image URL / custom SVG) with a live desktop+mobile preview. It is not a general content CMS — requirement R12.2 is much narrower than the roadmap's "site content shall be CMS-managed" implies.

**FAQ Manager** holds **0 items** across 12 categories, yet the public FAQ page renders 3 questions. Unlike the chart fallbacks, this one is **correctly implemented**: `FAQ.tsx:110-130` queries `collection(db,'faq')` and falls back to `STATIC_FALLBACK_FAQS` only when the collection is empty. Default content for unconfigured copy is reasonable product behaviour, not a defect.

Note it reads via `getDocs(db, 'faq')` — the **mock-DB** path — whereas dashboards read via `firestoreCache`. The application mixes both access patterns, which is the split-brain in finer detail.

#### E7.14 — CSV bulk import estimates missing prices

**Tags:** [BROWSER] — observed, not exercised

Two import modes (Vehicle Sourcing Import, Shipment Details Master Upload) with a dropzone, verification pipeline and import history. Stated behaviour:

> *"Our intelligent importer automatically maps Make, Model, YearMonth, Mileage, Transmission, STK Number, and ReferenceNo. **Blank prices are automatically estimated based on high-end luxury market valuation benchmarks.**"*

Auto-generating sale prices for blank cells is a pricing behaviour worth an explicit business decision. No CSV was uploaded.

### E8 — Customer portal sweep and CRUD testing (2026-08-06, third session)

Performed under explicit authorisation for full CRUD. All destructive actions shown before execution; all reverted except the intentional ZZTEST cleanup.

#### E8.1 — Two access patterns coexist, and screens disagree about the same entity

**Tags:** [BROWSER] + [SOURCE] — the sharpest demonstration of the split-brain yet

Different screens of the same application read **different stores**:

| Access pattern | Used by | Reads |
|---|---|---|
| `firestoreCache.subscribeToCollection(...)` | Staff dashboard KPIs, charts, leads, inventory | `fs_cache_*` → compiled seed |
| `getDocs(collection(db, ...))` | Customer Management, FAQ, both rate seeders | `carchief_mock_db_*` |

Measured in a single browser at a single moment, immediately after a clean reload:

| Store | Customer count |
|---|---|
| `fs_cache_customers` | **2** (Charith `CUST-1001`, Kenji Tanaka `CUST-1002`) |
| `carchief_mock_db_customers` | **1** (`CUST-1001` only) |

Consequently the staff dashboard reports **"ACTIVE CUSTOMERS 2"** and its country chart **"Japan — 2 Clients"**, while **Customer Management reports "Displaying 1 of 1 Clients"** and Kenji Tanaka does not appear at all.

**Kenji Tanaka is permanently invisible to the customer-administration screen** — he exists in the compiled seed and the cache, but was never written to the mock document store, and Customer Management only reads that store. No error, no warning; the screen simply asserts he doesn't exist.

#### E8.2 — ❗ Deletes execute against the real store while the UI shows the record still present

**Tags:** [BROWSER] — destructive test, authorised, target shown first, then restored

**Target shown before execution:** `vehicle-3` — 2023 Tesla Model S Plaid, $94,990, status `Available`.

A confirmation dialog **is** presented (CANCEL / DELETE LISTING) — good practice. On confirming:

| | Before | After |
|---|---|---|
| `carchief_mock_db_vehicles` | `vehicle-1, vehicle-2, vehicle-3` | **`vehicle-1, vehicle-2`** — record destroyed |
| `fs_cache_vehicles` | 6 records | **6 records** — unchanged |
| Staff inventory grid | Tesla shown | **Tesla still shown** |

**The deletion succeeded and the UI denies it happened.** This is the most dangerous expression of the split-brain found: for ordinary writes the divergence is invisible-but-harmless, but for deletes it is invisible-and-destructive. A user sees the row persist, concludes the delete failed, and may click again — while the record is already gone from the write store.

A caught error also fires on every delete, same shim gap as the vehicle edit:

```
Error deleting vehicle images: TypeError: Cannot read properties of undefined (reading 'collection')
```

`vehicle-3` was restored to the mock store from the cache copy; verified `vehicle-1, vehicle-2, vehicle-3` present.

#### E8.3 — ❌ A fifth contradictory statement of what the customer owes

**Tags:** [BROWSER] — evidence: `docs/evidence/phase2/phase2-customer-fleet-contradictions.png`

The Sourced Vehicles → **INVOICED** card renders a "COMMERCIAL BILL" panel reading:

> **Sold: $189,900.00 · Paid: $0.00 · Bal: $189,900.00**

for a vehicle the customer has **fully paid** ($195,200 TT approved and allocated to `vehicle-1`; PI marked "Fully Paid").

The portal now presents **five mutually incompatible answers** to "what does this customer owe?":

| Screen | Statement |
|---|---|
| Overview Desk | "PENDING BALANCE **$0.00**" · "Your account is fully settled" |
| Billed Invoices ledger | Total $195,200 / Paid $195,200 / **Outstanding $0.00** |
| Sourced Vehicles → INVOICED | Sold $189,900 / Paid **$0.00** / **Bal $189,900** |
| Wire Remittance journal | TT remaining balance **USD 195,200** — "APPROVED - AVAILABLE" |
| `fs_cache_customers` record | `outstandingBalance` **120,000** |

Note the "Sold" figure ($189,900) is FOB only — it ignores the $5,300 of costs and so disagrees with the invoice total of $195,200 as well.

#### E8.4 — ❌ Allocated TT funds are reported as fully available

**Tags:** [BROWSER]

The Wire Remittance journal shows `TXN-908122` with **ORIGINAL AMOUNT USD 195,200** and **REMAINING BALANCE USD 195,200**, status **"APPROVED - AVAILABLE"** — despite `allocatedVehicles` recording the entire 195,200 already allocated to `vehicle-1`.

The summary tile directly above it correctly reads "REMAINING BALANCE $0". The journal row contradicts it. In a finance desk whose purpose is allocating cleared funds against vehicles, presenting fully-allocated funds as available invites double-allocation.

Two display defects in the same row: **TT DATE** renders a raw ISO timestamp (`2026-08-06T06:14:07.908Z`) rather than a formatted date, and **BANK & CURRENCY** renders as `"(USD)"` with the bank name missing.

#### E8.5 — ❌ A phantom vehicle double-counts the customer's fleet

**Tags:** [BROWSER]

`fs_cache_customerVehicles` contains exactly **one** record (`cust-veh-1`, `STK-9012`, chassis `4S-CR8V10-00912`, `bookingStatus: Invoiced`, `shipmentStatus: transit`).

The portal presents **two**:

| Folder | Card | Source |
|---|---|---|
| INVOICED (1) | `STK-9012`, chassis `4S-CR8V10-00912`, LOGISTICS: TRANSIT | the real record ✓ |
| WITH PI (1) | **`STK-VEHI`**, **chassis blank**, LOGISTICS: RESERVED, **PI Ref `PI-STK-vehi`** | **synthesised from the proforma invoice** |

The same Audi R8 appears twice. This is why the Overview Desk reports "**BOUGHT CARS 2**" against a store holding one vehicle.

`PI-STK-vehi` is a **fourth** invoice numbering scheme (after `P-24617`, `PI-2026-0001`, `PI-pi-1`), and `STK-VEHI` is a mangled stock number derived from the vehicle id — the same truncation family as `ID: vehicle-`.

The phantom card also computes **"Deposit (50%): $94,950"** — arithmetically correct against FOB $189,900, but shown as due on a vehicle already paid in full, and computed from FOB alone rather than the $195,200 invoice total.

#### E8.6 — Customer portal navigation defects

**Tags:** [BROWSER]

**"Sourcing Showroom" exits the portal.** Clicking it navigates to `?view=showroom` — the public site — discarding the portal chrome entirely. A separate "Exit To Showroom" control already exists in the sidebar footer, so the portal has two controls that leave it and one is not labelled as such.

**"Sourced Vehicles" and "Reserved Vehicles" render identically.** Both produce the same view — the same three folders (RESERVED / WITH PI / INVOICED), same tiles, same content. Two sidebar entries, one destination.

#### E8.7 — Customer portal tab inventory (complete)

**Tags:** [BROWSER]

| Tab | State |
|---|---|
| Overview Desk | Populated; contains the credit-balance contradiction (E2.5) |
| Sourcing Showroom | **Exits the portal** to the public showroom |
| Sourced Vehicles | 3 folders; contains the phantom vehicle (E8.5) |
| Reserved Vehicles | **Duplicate of Sourced Vehicles** |
| Billed Invoices | Populated; internally consistent (E2.2) |
| Wire Remittance | Populated; allocation defect (E8.4) |
| Secure Vault | **Empty** — 10 document categories defined |
| Bulletins | **Empty** — and the store is genuinely empty too, so **correct** ✓ |
| Client Profile | Editable company/phone/address; email and name read-only; password change |

**Secure Vault** defines: Proforma Invoice, Commercial Invoice, Bill of Lading, Inspection Certificate, Export Certificate, Insurance, Packing List, Vehicle Photos, Auction Sheet, Other. It is empty **even though `PI-2026-0001` exists** — generated documents are not filed to the vault. Document generation and document storage are unconnected.

**Client Profile** carries another unsupportable claim (cf. G7): *"Every session transaction, profile revision, document preview, and telegraphic submission is logged under a secure audit trail… IP mapping & access logs…"*. There is no server, no audit trail and no IP logging.

#### E8.8 — ZZTEST cleanup completed

**Tags:** [BROWSER] — the one intentional, non-reverted deletion

Record removed from `carchief_mock_db_leads`, shown in full before deletion:

| Field | Value |
|---|---|
| `id` | `lead-1785990817340` |
| `customerName` | `ZZTEST-Runtime Validation` |
| `customerEmail` | `zztest.runtime@example.invalid` |
| `message` | `ZZTEST-2026-08-06 runtime validation enquiry. Safe to delete.` |
| `createdAt` | `2026-08-06T04:33:37.340Z` |

Remaining leads: `Marcus Sterling`. Verified no `ZZTEST` string remains in any storage key.

### E5.3 — The one boundary that does hold

**Tags:** [BROWSER]

The public bundle cannot be moved to the staff view by URL (E0.2) — but as established, that is because `__CARCHIEF_FORCE_VIEW__` overrides *every* `?view=` value in *every* bundle, not because of an access check. It is a side effect of the build split, and it would disappear the moment the three bundles were merged into one application.
