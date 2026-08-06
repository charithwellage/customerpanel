# CarChief POC — Feature and Journey Gap Report

**Date:** 2026-08-06
**Basis:** browser-runtime validation of the local Docker POC. Evidence tags: **[BROWSER]** runtime, **[HTTP]** pre-flight, **[SOURCE]** read-only repository inspection.
**Companion documents:** `CarChief-POC-Runtime-Validation-Report.md`, `CarChief-POC-Feature-Evidence-Register.md`

> **Coverage.** All six phases (0–6) complete. This list is now reasonably comprehensive for the demonstrated surface, though absence from it still is not proof of correctness — validation exercised the seeded data, not every code path.

---

## G1 — No authentication exists

**Severity: critical · Evidence: [BROWSER] + [SOURCE] · Confidence: certain**

Role is a compile-time constant. Three separate build artifacts hardcode `__CARCHIEF_FORCE_ROLE__` as `Guest` / `Dealer` / `Admin`. Navigating to `/staff/` in a fresh browser grants full Super Admin — no login, no token, no session.

**Gap:** the entire authentication and session layer. Login UI exists (`AdminStaffLogin.tsx`) and is bypassed by the forced-user globals.

**Also:** the source and the shipped bundle contain a hardcoded super-admin email plus a list of legacy fallback passwords which the sign-in path will silently migrate **[SOURCE, App.tsx:742-809]**. Values deliberately not reproduced here. Treat as compromised; rotate before any non-local deployment.

---

## G2 — No backend, and the UI hides that

**Severity: critical · Evidence: [BROWSER] · Confidence: certain**

Zero application network requests across the entire run. Firebase is a dependency and a code path but a local shim at runtime. All state is `localStorage` on one shared origin.

Consequences, all of which follow directly and none of which are speculative:

- No multi-user operation. Two salespeople cannot see the same pipeline.
- No durability. Clearing browser data destroys every record.
- No cross-device continuity. A customer on a phone and the same customer on a laptop are unrelated.
- No audit trail, backup, or recovery.
- No server-side validation or authorization, anywhere, by construction.

**Gap:** the entire persistence and API layer.

---

## G3 — The customer→staff handoff does not work

**Severity: critical · Evidence: [BROWSER] · Confidence: certain**

> **Diagnosis corrected by the store-binding audit.** This gap previously said "the staff table is bound to hardcoded demo data instead of the store." **That was wrong.** The table *is* correctly bound; the cause is the split-brain store division below. See `CarChief-POC-Store-Binding-Audit.md`.

A public enquiry submitted as `ZZTEST-Runtime Validation` persisted correctly to `carchief_mock_db_leads`. The staff Leads console never showed it, displaying the compiled seed rows (`Charith`, `John Smith`) instead.

**Actual cause:** the application has **two stores that never reconcile**.

- **Writes** go through `addDoc`/`updateDoc` → `carchief_mock_db_*`
- **Reads**, in permanently-active fallback mode, go through `fs_cache_*`, falling back to the compiled seed

A binding probe proved the table is fully reactive: writing one record into `fs_cache_leads` immediately replaced the seed rows in the UI. The enquiry is invisible because it was written to a store no reader consults.

**Business impact unchanged:** lead capture → sales follow-up is the core revenue loop, and in the demonstrated system a customer enquiry is silently lost.

**Gap revised:** not per-list rewiring. One fix — writes must invalidate or populate the cache the readers use — repairs leads, inventory, and every other write path simultaneously. This disappears entirely if the POC moves to a real backend.

---

## G3c — Deletes execute against the real store while the UI denies it

**Severity: critical · Evidence: [BROWSER] · Confidence: certain — destructive test, authorised, then restored**

Deleting `vehicle-3` (2023 Tesla Model S Plaid, $94,990) through the staff inventory grid:

| | Before | After |
|---|---|---|
| `carchief_mock_db_vehicles` | 3 records | **2 — record destroyed** |
| `fs_cache_vehicles` | 6 records | 6 — unchanged |
| UI | Tesla shown | **Tesla still shown** |

A confirmation dialog is correctly presented. On confirming, **the deletion succeeds and the UI shows the record as still present.** For ordinary writes the split-brain is invisible-but-harmless; for deletes it is invisible-and-destructive. A user sees the row persist, concludes the delete failed, and may repeat it — while the record is already gone.

A caught error fires on every delete (`Error deleting vehicle images: TypeError: Cannot read properties of undefined (reading 'collection')`) — the same shim gap as the vehicle edit.

---

## G3d — Different screens read different stores and disagree about the same records

**Severity: critical · Evidence: [BROWSER] + [SOURCE] · Confidence: certain**

The application uses **two access patterns simultaneously**:

| Pattern | Used by | Reads |
|---|---|---|
| `firestoreCache.subscribeToCollection` | Dashboard KPIs, charts, leads, inventory | `fs_cache_*` → seed |
| `getDocs(collection(db, …))` | Customer Management, FAQ, both rate seeders | `carchief_mock_db_*` |

Measured in one browser at one moment after a clean reload: `fs_cache_customers` held **2** customers, `carchief_mock_db_customers` held **1**.

So the staff dashboard reports **"ACTIVE CUSTOMERS 2"** while **Customer Management reports "Displaying 1 of 1 Clients"**. **Kenji Tanaka (`CUST-1002`) is permanently invisible to the customer-administration screen** — no error, no warning; the screen simply asserts he doesn't exist.

This is the same root cause as G3, but it establishes the blast radius is wider than the write path: **read paths disagree with each other**, so two screens in the same app show different truths about the same entity.

---

## G4 — Two charts fabricate business metrics when their query returns empty

**Severity: high · Evidence: [BROWSER] + [SOURCE] · Confidence: certain · Scope now bounded**

> **Substantially revised by the store-binding audit.** This gap previously warned that "no figure displayed anywhere should be treated as derived from real data" and called for an open-ended audit. **That audit has been done, and the result is much better than feared.** Almost everything is correctly bound. See `CarChief-POC-Store-Binding-Audit.md`.

The real pattern is not hardcoding — it is a **fallback that substitutes fabricated data when a correct query returns zero rows**:

```js
const result = Object.entries(brandsData).map(([name, value]) => ({ name, value }));
return result.length > 0 ? result : [
  { name: 'Toyota', value: 8 }, { name: 'Mercedes-Benz', value: 4 }, …
];
```

The query is correct — it counts vehicles with `status === 'Sold'`. None exist, so the component invents **18 sold units across brands absent from the catalogue**.

This is more dangerous than hardcoding: it is invisible whenever data exists, and fabricates silently whenever data is empty. A production deployment with no sales yet would display "Toyota — 8 Units" as a business metric.

**Exhaustive scan — only two business-metric instances exist:**

| Location | Fallback | Status |
|---|---|---|
| `StaffDashboard.tsx:543` | Toyota 8 / Mercedes 4 / Porsche 3 / Ford 2 / Land Rover 1 | **Active defect** |
| `StaffDashboard.tsx:560` | Kenya 12 / Tanzania 7 / Uganda 5 / Zambia 4 / Zimbabwe 2 | **Latent** — dormant only because customer countries are populated |

A **third** hardcoded display literal was found in the follow-up sweep — `UserSecurityMatrix.tsx:506` renders `'All 26 Enabled'` for the Admin role while computing correctly for every other role. The real count is **29**. Trivial, but the same class.

The country chart is the same bug currently masked: it renders correctly (Japan — 2 Clients) only because both customers have a `country`. Clear that field and it would invent 30 African clients.

**Verified correctly bound** (recomputed from store and compared): all 9 staff KPI tiles, the country chart, the conversion funnel counts, the leads badge, the leads table, the customer invoice ledger, and the entire public showroom with its filters and sort.

**Gap:** delete both fallbacks and render real empty states. Two edits in one file.

### G4b — Funnel percentages are static bar widths presented as conversion rates

**Severity: medium · Evidence: [SOURCE] + [BROWSER]**

The funnel renders `{count} ({width})` where `width` is hardcoded styling — `100%`, `75%`, `55%`, `35%`. It displays `SOLD DELIVERIES — 0 (35%)`. The counts are correct; the percentages never change and mean nothing. They read as conversion rates.

---

## G5 — Financial data flow is broken around arithmetic that is correct

**Severity: high · Evidence: [BROWSER] · Confidence: certain**

> **Updated after Phase 2.** This gap previously read "financial calculations entirely unverified." They have now been verified, and the result is mixed in an important way.

**What is correct.** `PI-2026-0001` reconciles exactly: FOB 189,900 + freight 2,500 + customs 1,200 + inspection 450 + handling 350 + insurance 800 = **195,200**, matching the stored total. Payment `TXN-908122` allocates exactly 195,200 to `vehicle-1`. The invoice ledger independently agrees. **The arithmetic is sound and the payment chain reconciles.**

**What is broken, in four distinct ways:**

**G5a — Tier discounts are implemented but unexercised.** ⚠️ *Corrected.* Previously stated as "never applied." The PI generator displays *"SOURCING CLIENT NOT IDENTIFIED — to leverage dynamic, week-range customer tier discounts, please choose a registered customer."* Discounts **do** apply, conditional on selecting a registered customer. The seeded `PI-2026-0001` has no customer identified, which is why it billed full list price. The feature exists; the seed doesn't exercise it. Remaining risk is that the seeded demo shows a Platinum customer paying full price.

**G5b — Tax exists but is unset; import duty does not exist.** ⚠️ *Corrected.* Previously stated as "no duty or tax anywhere." The PI cost ledger has a **`Tax Basis: __% ($0)`** field plus Incoterms (`CNF`/`FOB`/`CIF`/`C&F`). So tax is implemented, defaulted to 0, and absent from the stored invoice's `costs` object. There is still **no import-duty line distinct from tax** — for cross-border vehicle export, usually the largest variable in landed cost.

**G5c — Five mutually incompatible statements of what the customer owes.** ⚠️ *Escalated.* Previously recorded as a two-way contradiction; the customer-portal sweep found five:

| Screen | Statement |
|---|---|
| Overview Desk | "PENDING BALANCE **$0.00**" · "fully settled" |
| Billed Invoices | Total $195,200 / Paid $195,200 / **Outstanding $0.00** |
| Sourced Vehicles → INVOICED | Sold $189,900 / Paid **$0.00** / **Bal $189,900** |
| Wire Remittance journal | TT remaining **USD 195,200** — "APPROVED - AVAILABLE" |
| Customer record | `outstandingBalance` **120,000** |

The "Sold $189,900" figure is FOB only, so it disagrees with the $195,200 invoice total as well. For a credit-controlled export business this is the most commercially dangerous cluster of defects in the product.

**G5c (original) — A stored $120,000 outstanding balance displays as $0.00.** The customer record holds `outstandingBalance: 120000` / `creditLimit: 500000`. The portal shows "PENDING BALANCE $0.00", "CREDIT UTILIZATION $0 / $500,000", "Your account is fully settled." The same component reads `creditLimit` correctly and discards `outstandingBalance`, deriving outstanding from invoices instead. **Two competing sources of truth for customer debt, disagreeing by $120,000.** `CUST-1002` shows the same ($45,000 / $300,000). Credit utilisation reads 0% for an account that has drawn 24% — defeating the purpose of a credit limit.

**G5d — Three incompatible invoice numbering schemes.** The PI generator issues `P-24617`; the stored record holds `PI-2026-0001`; the customer ledger renders `PI-pi-1` from the internal key. Three formats for one class of document, and the ledger never shows the issued number. Substantive for a customs/banking reference.

**G5g — Port/country mapping is wrong on a customs-facing document.** The rendered PI prints **"Port of Discharging: Mombasa, Uganda"**. Mombasa is in Kenya; Uganda is landlocked.

**Multi-currency: no longer unverified.** ⚠️ *Corrected.* The PI generator offers **7 trading currencies** (USD, JPY, EUR, UGX, GBP, AUD, CAD) with a conversion-rate field, and Finance holds **6 active exchange rates** correctly bound to their store with internally consistent reciprocals (1/0.0061 ≈ 163.93 ✓; 1/1.08 ≈ 0.925 ✓). What remains untested is end-to-end conversion during TT allocation — the seeded payment is USD→USD. Rate *history* is empty.

---

## G3b — The split-brain blocks the entire quotation journey

**Severity: critical · Evidence: [BROWSER] + [SOURCE] · Confidence: certain — proven by probe**

The most consequential consequence of G3's root cause, found in the follow-up sweep.

`BackendDashboard.tsx:3673` gates the PI action on `v.status === 'Reserved'`. A real reservation writes `Reserved` only to `carchief_mock_db_vehicles`, which no reader consults — so **the "Create Proforma Invoice" button never appears**. The alternative path advertised by the dashboard's "CREATE QUOTE" action tells the user to open a vehicle's details page, and that page is a read-only audit record with no PI control.

**Proven:** setting `vehicle-1.status = 'Reserved'` in `fs_cache_vehicles` and reloading made "Create Proforma Invoice" and "Release Reservation" appear immediately, and the full generator opened and rendered a complete invoice.

**So reserve → quote → invoice → payment is implemented but unreachable.** The POC cannot demonstrate its primary sales journey — not because features are missing, but because of one data-layer defect. This substantially raises the value of fixing G3 and lowers the apparent feature gap.

---

## G5e — The freight engine is empty while invoices bill freight

**Severity: high · Evidence: [BROWSER] · Confidence: certain**

The Freight Calculator maps Country + Port + M3 range → cost per M3. It contains **no mappings for any of the four countries** ("No freight mappings found"). The seeded invoice nonetheless bills $2,500 freight. Freight configuration and freight billing are entirely disconnected — the charge cannot have come from the engine.

**The Inland City Delivery master is equally empty** — "Configured Rates (0)".

**Both seed buttons were pressed under authorisation, and neither can ever work.** Each reported *"…are already populated"* against a collection verified to hold the literal value `[]`. The cause is a guard the mock shim cannot satisfy:

```js
const snap = await getDocs(collection(db, 'freightRates'));
if (!snap.empty) { setError("…already populated."); return; }   // always taken
```

The shim does not implement `QuerySnapshot.empty`, so `!undefined === true` and the function returns before writing. **The seeding path is unreachable on every click, including the first**, and the user is shown a plausible but false message with no console error.

Two further defects sit behind it in the freight seeder: presets use `portName: 'Mombasa'` while the master holds `'Mombasa Port'` (exact-equality match fails), and `countryName` does not exist on port records at all — which would throw a `TypeError` if a name ever matched, and is why every port renders as `"Mombasa Port ()"`. Two of the three preset groups also reference `United States / Los Angeles` and `Japan / Tokyo`, neither of which exists in the master data.

**So R8.3 is unreachable, not merely unconfigured.** Freight and inland-delivery rate calculation cannot be exercised through the UI at all, while invoices continue to bill a hardcoded $2,500 freight charge.

---

## G5f — Staff writes vanish from the UI; for some records they are lost outright

**Severity: critical · Evidence: [BROWSER] · Confidence: certain**

> **Diagnosis corrected by the store-binding audit.** Previously reported as "writes are silently discarded." More precisely: **the write usually succeeds** — into a store the UI never reads.

Two distinct failures, both invisible to the user:

**Records present in the mock store (`vehicle-1` … `vehicle-3`) — write succeeds, never displayed.** Editing `vehicle-1`'s colour to `ZZTEST-PAINT-V1-20260806` persisted correctly to `carchief_mock_db_vehicles`, while `fs_cache_vehicles` — which the UI renders — kept the old value. `handleUpdateVehicle` does call `firestoreCache.invalidate('vehicles')`, but in permanent fallback mode the reload re-reads cache/seed.

**Records absent from it (`vehicle-4` … `vehicle-6`) — write lost entirely.** The mock store is **truncated to 3 of 6 vehicles**. `updateDoc` against a non-existent document writes nothing, anywhere. My first test edited the Range Rover (`vehicle-6`), which is why that value appeared in no store at all.

Every vehicle commit also throws a caught error — `Failed to save uncompressed vehicle images to subcollection: TypeError: Cannot read properties of undefined (reading 'collection')` — the mock shim implements no subcollections. This was the only console error observed in the entire validation.

**On the "nine evicted stores":** the customer and finance caches did disappear after the first commit and were re-seeded automatically on the next customer-portal visit. Given the split-brain mechanism, this is cache eviction and reseeding rather than data destruction — the seed is authoritative and always restores. It is disruptive, not destructive.

Silent failure with a success-shaped UI response remains the worst available failure mode: a salesperson has no signal that their work is invisible.

---

## G6 — "AI Copilot" involves no AI

**Severity: medium (functional) / high (representational) · Evidence: [BROWSER] + [SOURCE] · Confidence: certain**

The AI Copilot search made **zero network requests**. It is `localHeuristicSearch()` — a regex parser over vehicle fields, self-documented as avoiding "unnecessary Gemini/Firestore load" **[SOURCE]**. It is branded "AI Copilot" with a "COPILOT ONLINE" badge.

The optional Gemini proxy at `/api/` genuinely returns 503 **[HTTP]**, but no UI path reaches it — so enabling the Compose `ai` profile would not change public-site behaviour.

Secondary defect: on zero matches it reports **"AI search resolved successfully. Found 0 matching vehicles"** — a success framing for an empty result, inconsistent with the Standard Filters path which renders a proper empty state **[BROWSER]**.

**Gap:** either wire the feature to the Gemini proxy, or rename it to reflect what it is.

---

## G7 — The UI asserts capabilities that do not exist

**Severity: high (reputational/commercial) · Evidence: [BROWSER] · Confidence: certain**

Three claims contradicted by runtime evidence:

| Claim shown to the user | Reality |
|---|---|
| "OfflineCache Quota Limit Reached — entered offline high-fidelity fallback mode… All features remain 100% responsive and functional!" (permanent banner, with "Retry Live Connection") | There is no live connection and never was. A permanent architectural condition presented as temporary degradation. |
| "CarChief utilizes highly secure cloud-replicated server architectures for real-time transaction records and client logs" (footer, "SECURED CLOUD ENVELOPE" badge) | No such architecture is reachable. |
| "SECURE CLIENT SESSION / ACTIVE"; "Role: SUPER ADMIN • Full database control" | No authentication occurred. |

Internally this is harmless set dressing. Shown to a client, investor or auditor without narration, it materially misrepresents system maturity — and it is the **cheapest item in this report to fix**. Removing three strings costs nothing and eliminates the largest non-technical risk in the POC.

---

## G8 — No link graph and no page metadata; the site cannot be indexed

**Severity: medium · Evidence: [BROWSER] · Confidence: certain**

> **Corrected.** This gap previously claimed vehicle detail pages are "unreachable by URL." **That was wrong.** They are fully addressable — `?vehicleId=vehicle-2` cold-loads the correct detail page, because `vehicleId` *is* read on mount. The URL scheme already works.

The real problem is narrower and better-defined:

**G8a — Zero anchor elements on any page.** Navigation is entirely `<button>`. A crawler landing on the homepage has **no links to follow** — the addressable vehicle pages exist but nothing points at them, so they can never be discovered.

**G8b — No per-page metadata.** Measured on a cold-loaded vehicle detail page:

| Signal | Value |
|---|---|
| `<title>` | `CarChief \| Premium Global Automotive Curator` — generic, not per-vehicle |
| meta description | absent |
| canonical | absent |
| Open Graph | none |
| JSON-LD | 0 blocks |
| `<h1>` count | 2 |

So even a directly-fetched vehicle page carries a generic title, no description, no share preview, and no `Vehicle`/`Product` structured data.

**G8c — `?view=` is written but never read.** `__CARCHIEF_FORCE_VIEW__` overrides every `?view=` value on load in every bundle. The view in the address bar cannot restore its own state.

This is materially cheaper to fix than "rebuild routing" — add anchors, add per-page metadata, honour `view`. The addressing foundation is already there.

---

## G9 — Validation is browser-native only

**Severity: medium · Evidence: [BROWSER] · Confidence: high**

The Contact form's rejection of `not-an-email` came from Chrome's own constraint-validation bubble, not application code. No application-level validation was observed on any field: no email-domain check, no phone format, no length limits. There is no server-side validation because there is no server.

Anything HTML5 does not catch is accepted. Not exhaustively tested across all forms (Phases 2/3 not executed).

---

## G10 — Vehicle imagery hot-linked from Unsplash

**Severity: low · Evidence: [BROWSER] · Confidence: certain**

All vehicle photography loads from `images.unsplash.com` rather than from the inventory record. Affects offline-demo reliability, breaks the illusion if Unsplash is unreachable, and warrants a licensing check before any commercial use. There is no image upload/storage path in the demonstrated flow, though `CategorizedImageManager.tsx` exists **[SOURCE]**, untested.

---

## G11 — No data isolation between customers

**Severity: critical · Evidence: [BROWSER] · Confidence: certain**

From within the **customer** bundle, presenting as `CUST-1001`, a one-line console read returned **both** customer records — including `CUST-1002` Kenji Tanaka's company, contact details, assigned salesperson, $300,000 credit limit and $45,000 outstanding balance.

Every customer's browser holds every other customer's commercial and financial data. This is inherent to the architecture, not a filtering oversight: with all state in `localStorage` and no backend, everything the app can display to anyone is present in everyone's browser. **No boundary can be added without introducing a server.**

---

## G13 — Customer portal: phantom vehicle, duplicate nav, unfiled documents

**Severity: high · Evidence: [BROWSER] · Confidence: certain**

**G13a — A phantom vehicle double-counts the fleet.** The store holds **one** customer vehicle; the portal shows **two**. The INVOICED folder renders the real record (`STK-9012`, chassis `4S-CR8V10-00912`, TRANSIT); the WITH PI folder renders one **synthesised from the proforma invoice** — `STK-VEHI`, blank chassis, `PI Ref: PI-STK-vehi`. This is why Overview Desk reports "BOUGHT CARS 2". `PI-STK-vehi` is a **fourth** invoice numbering scheme.

The phantom card also shows **"Deposit (50%): $94,950"** — arithmetically right against FOB, but due on a fully-paid vehicle and computed from FOB rather than the invoice total.

**G13b — Allocated TT funds shown as available.** The Wire Remittance journal reports `TXN-908122` remaining balance **USD 195,200 / "APPROVED - AVAILABLE"** despite the full amount being allocated to `vehicle-1`. The tile above it correctly says $0. On a finance desk whose job is allocating cleared funds, this invites double-allocation. Same row: TT date renders a raw ISO timestamp; bank name renders as `"(USD)"`.

**G13c — Generated documents are never filed.** The Secure Vault defines 10 document categories (Proforma Invoice, Commercial Invoice, Bill of Lading, Inspection/Export Certificate, Insurance, Packing List, Vehicle Photos, Auction Sheet, Other) and is **empty even though `PI-2026-0001` exists**. Document generation and document storage are unconnected.

**G13d — Navigation defects.** "Sourcing Showroom" **exits the portal** to the public site (duplicating the separate "Exit To Showroom" control, without saying so). "Sourced Vehicles" and "Reserved Vehicles" render **identical** views — two sidebar entries, one destination.

**G13e — Another unsupportable claim** (cf. G7). Client Profile states: *"Every session transaction, profile revision, document preview, and telegraphic submission is logged under a secure audit trail… IP mapping & access logs."* There is no server, no audit trail, no IP logging.

---

## G12 — Staff inventory records show broken identifiers

**Severity: low · Evidence: [BROWSER] · Confidence: certain**

Every row in the staff inventory grid renders `ID: vehicle- •` — the numeric suffix is missing (actual ids are `vehicle-1`, `vehicle-2`…). The identifier a salesperson would quote to a customer or use in a search is unusable throughout the grid.

---

## What actually works

Worth stating, because the list above is unbalanced by design and the build quality is genuinely good:

- **Zero console errors** across every page and interaction, in all six phases **[BROWSER]**. The application never throws.
- **The invoice arithmetic is correct** and reconciles across invoice, payment, allocation and ledger **[BROWSER]**. This was the biggest flagged risk and it discharged cleanly.
- **Search, filters and sort are genuinely well built** **[BROWSER]**: filter options are derived from the vehicle store (not hardcoded), sort by price is correct ascending, contradictory filters (Tesla + SUV) compose correctly to zero with a proper empty state, and Reset All restores. This is the strongest-working area found.
- **Vehicle detail pages are properly addressable** by `?vehicleId=` and cold-load correctly **[BROWSER]**.
- The public enquiry **write** path works end-to-end with a sensible record shape — it is only the read side that is disconnected **[BROWSER]**.
- **The shipment data model is credible** — B/L number, vessel, voyage, ETD/ETA, load/discharge ports, container number, timeline **[BROWSER]**. This is real domain modelling.
- **Master data is substantial** — Country/Port/Costing/Shipper/Bank masters, terms presets, tiers, roles, CMS, FAQ **[BROWSER]**.
- **Document generation is genuinely good** **[BROWSER]**. The PI generator is a five-section form with per-field PDF visibility toggles, lead prefill, 12 destination countries, HS code, Container/RoRo, Incoterms, bank and terms presets — and it renders a complete, professional invoice with Email Customer and Print/Save PDF. This is production-shaped work.
- **The permission model is granular and correct** — 29 permissions including 8 master-data field grants; Dealer (8) and Sales (6) counts matched their store exactly **[BROWSER]**.
- **Exchange rates are correctly bound and internally consistent** — 6 active rates with valid reciprocals **[BROWSER]**.
- **The reservation model is complete** — `reservedAt` / `reservedUntil` / 48h duration, computed correctly **[BROWSER]**.
- **The public FAQ fallback is correctly implemented** — queries the store, falls back to defaults only when empty. Unlike the chart fallbacks, this is legitimate **[SOURCE]**.
- The UI is visually complete, coherent and professional across all three portals.
- Role vocabulary is well-defined (Admin / Dealer / Sales / Guest with a permissions structure) — the model is sound, it is only unenforced.
- Feature *surface* is broad **[SOURCE]**: freight calculation, proforma invoicing, exchange-rate master, customer tiers, city delivery, FAQ/CMS management, user security matrix. The scaffolding for a real product exists.

---

## Suggested priority

Ordered by value-per-effort, not severity alone:

| # | Item | Gap | Rationale |
|---|---|---|---|
| 1 | Remove the false capability claims | G7 | Minutes; removes the largest commercial/reputational risk |
| 2 | Delete the two fabricating chart fallbacks | G4 | **Two edits in one file**; stops fabricated business metrics |
| 3 | Remove the static funnel percentages | G4b | Trivial; stops misleading conversion figures |
| 4 | Fix the credit-balance contradiction | G5c | A customer shown "fully settled" while owing $120,000 is the most dangerous single figure in the product |
| 5 | Decide the backend | G2 | The fork in the road — **G3, G5f, G11 and all durability gaps collapse into this one decision** |
| 6 | Implement real authentication | G1 | Blocked on 5; rotate the exposed credentials immediately regardless |
| 7 | Tier discounts, duty/tax, freight-engine wiring | G5a, G5b, G5e | Pricing completeness; the arithmetic engine underneath is already sound |
| 8 | Anchors + page metadata | G8 | Cheaper than previously assumed — addressing already works |

**Revised sequencing note.** The store-binding audit changed this list materially. Items 2 and 3 are now known to be trivial rather than open-ended, and they moved up accordingly. The former item "audit every tile/list/chart" has been **completed and removed** — almost everything is correctly bound.

Most importantly, **the lead-flow fix is no longer a separate item.** G3 and G5f are one bug — the split-brain read/write store division — and it is an artifact of the mock persistence layer, not of the application design. It vanishes on migration to a real backend. That is a strong argument for taking the backend decision (5) before investing in patching the mock layer.
