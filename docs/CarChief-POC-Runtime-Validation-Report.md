# CarChief POC — Runtime Validation Report

**Date:** 2026-08-06
**Environment:** local Docker POC, `carchief-poc-web-1`, `http://127.0.0.1:8080`, healthy
**Method:** Playwright MCP driving real Chromium 152.0.7977.8. Supporting read-only inspection of `POC/src`, `POC/build`, `docker/`.
**Companion evidence:** `docs/CarChief-POC-Feature-Evidence-Register.md` (every claim below traces to a tagged row there)

## How to read this report

Evidence is tagged by how it was obtained, and the distinction matters:

- **[BROWSER]** — observed at runtime in a real browser. Strongest evidence.
- **[HTTP]** — pre-flight HTTP requests only, no JS executed.
- **[SOURCE]** — read from the repository. A static claim about intent, **not** proof of behaviour.

Where source and runtime disagreed, runtime won and the report says so.

---

## Executive summary

The POC is a **convincing, well-built demonstration surface with no application behind it**. That is a legitimate thing for a POC to be. The risk is that it does not present itself that way — to a viewer, and in places to its own UI, it claims to be a running system with cloud persistence, authentication, role security and AI search. None of those four exist at runtime.

> **Final revision.** All phases complete, plus a store-binding audit, a staff-app sweep and a customer-portal CRUD sweep. Several earlier conclusions were corrected along the way — each is marked in place rather than silently rewritten, and the substantive ones are listed under "Corrections".
>
> **The single most important conclusion:** almost all defects found trace to **one compiled data layer**, not to feature code. Five independent features fail for the same mechanism, and in every case the component's own logic is correct.

Five findings drive everything else:

1. **Roles are compile-time constants.** `/`, `/customer/` and `/staff/` are three separately pre-built HTML files, each hardcoding `__CARCHIEF_FORCE_ROLE__` = `Guest` / `Dealer` / `Admin`. There is no authentication step. Visiting `/staff/` grants Super Admin.
2. **There is no backend.** Zero application network calls were observed in the entire run. Firebase is a dependency and a code path, but a local shim at runtime. All state is `localStorage`.
3. **The customer→staff handoff is broken.** A public enquiry persists to the lead store; the staff Leads console displays unrelated hardcoded names and never shows it.
4. **The "AI Copilot" is a regex.** No model, no network call. The optional Gemini proxy at `/api/` is genuinely down but nothing reaches it.
5. **The UI narrates a system that isn't there.** A permanent "OfflineCache Quota Limit Reached — entered offline fallback mode" banner implies a live connection that has never existed, and the footer advertises "cloud-replicated server architectures."

**Scope status: all six phases (0–6) are now complete.** An earlier revision of this report covered only Phases 0, 1 (partial), 4 and 6; Phases 2, 3 and 5 have since been executed and two claims from that revision were found wrong and corrected — see "Corrections" below.

The most important addition from the later phases: **the financial arithmetic that was flagged as the biggest unknown turned out to be correct**, but the surrounding data flow is not. Invoice totals and payment allocation reconcile exactly; tier discounts are ignored, duty/tax does not exist, and a customer's stored $120,000 outstanding balance is displayed as $0.00.

---

## Phase 0 — Baseline ✅ complete

### The three URLs are three builds, not one router

The plan asked whether these are three applications or one client-side router. The answer is neither: **one codebase, three build artifacts**, each with identity baked in.

`docker/poc/Dockerfile` copies three separate files **[SOURCE]**:

| Served path | Artifact | Forced view | Forced role | Forced user |
|---|---|---|---|---|
| `/` | `carchief_website.html` | `showroom` | `Guest` | `null` |
| `/customer/` | `carchief_customer_backend.html` | `customer` | `Dealer` | object |
| `/staff/` | `carchief_staff_backend.html` | `backend` | `Admin` | object |

**Confirmed [BROWSER]** by evaluating `window.__CARCHIEF_FORCE_ROLE__` live on `/staff/` → `"Admin"`.

This single mechanism explains the auth model, the role model, and why Phase 5 is largely moot: **role is not a runtime property of a session, it is a property of which file nginx served.**

### No authentication exists

**[BROWSER]** In a fresh context with no login step:

- `/staff/` → full ERP console, header "Super Admin Staff / SUPER ADMIN", with Inventory, Leads, Finance and Master Controls, plus a $195,200 approved TT remittance panel.
- `/customer/` → client portal, "WELCOME BACK, CHARITH", `CUST-1001`, "PLATINUM CLUB", $500,000 credit limit, badge "SECURE CLIENT SESSION / ACTIVE".

Console confirms the mechanism: `Auto-logged out active user sessions per user request.` followed by `Super Admin auto-creation successful on mount.`

One incidental boundary does hold: `/?view=backend` from the public bundle is deterministically demoted to `showroom`, because the staff code path requires a forced user the public bundle ships as `null` **[BROWSER, reproduced twice]**. This is a side effect of the build split, not an access control.

A login form exists (`AdminStaffLogin.tsx`) and `App.tsx:742-809` implements sign-in against the Firebase shim — including a hardcoded super-admin address and a list of legacy fallback passwords that the code will silently migrate **[SOURCE]**. Per the safety commitments those values are not transcribed here. They are in plaintext in the repository and in the shipped bundle, and should be treated as compromised regardless of how this POC proceeds.

### Firestore: the ambiguity, resolved

This was flagged as the priority check because source and pre-flight HTTP disagreed.

- **[SOURCE] suggested a live backend:** `firebase@^12.15.0` in `package.json`; `handleFirestoreError`, `onAuthStateChanged`, `signInWithEmailAndPassword`, `setDoc`, `doc(db, 'users', …)` in `App.tsx`.
- **[BROWSER] settles it:** full waterfall on the public landing = 17 requests, **all static**. Zero to `firestore.googleapis.com`, `identitytoolkit.googleapis.com`, or any Firebase host. Non-static request count across the whole session: **0**.

The Firebase imports resolve to a local shim. The pre-flight conclusion — persistence is browser-local — **stands, now on runtime evidence rather than inference**. The dependency is dead weight that makes the codebase look more connected than it is.

### Storage

All three URLs share origin `http://127.0.0.1:8080`, therefore one `localStorage` partition. Key count grew 7 → 19 as the three portals were visited **[BROWSER]**. Store naming is the application's own: `carchief_mock_db_*` for records, `fs_cache_*` for a Firestore-cache emulation.

Seeded baseline: 1 user (role `Admin`), 4 roles — `Admin`/Super Admin, `Dealer`/Partner Dealer, `Sales`/Sales Representative, `Guest`/Showroom Guest.

### Console health

**0 errors** across all three landings. Two warnings, both environmental and benign (deprecated `apple-mobile-web-app-capable` meta; invalid manifest icon `input_file_0.png`). The application does not throw. Its problems are architectural, not defects.

---

## Phase 1 — Public website ⚠️ partial

**Covered:** navigation model, keyword search, empty state, contact-form validation.
**Not covered:** All Stock browse, vehicle detail pages, filter/sort/pagination on the full catalogue, quote-request entry points, out-of-range numeric validation.

### What works

Keyword search filters correctly and renders a proper empty state on zero matches **[BROWSER]**. The public site is visually complete and internally consistent: 6 vehicle cards with prices, shipping explainers, a 5-step blueprint, testimonials, FAQ accordion, and full contact detail.

### What doesn't

**Navigation is entirely `<button>` elements — no anchors anywhere [BROWSER].** Views are React state with a `history.replaceState` URL sync. Consequences: no shareable or bookmarkable routes, nothing crawlable by search engines, and browser Back does not traverse view history. For a business whose entire funnel is inbound buyers finding vehicles, a showroom that search engines cannot index is a material gap, not a cosmetic one.

**Form validation is browser-native only [BROWSER].** Submitting `not-an-email` was rejected — but by *Chrome's* constraint-validation bubble, not by application code. No application-level validation was observed on any field: no email-domain check, no phone format, no length limits. There is no server-side validation because there is no server.

---

## Phase 2 — Customer application ✅ complete

**The customer portal has no source code.** `App.tsx:73` imports `./customer/CustomerPortalApp`, but `POC/src/customer/` does not exist. It ships only compiled. Everything below could only have been found in a browser — this validates the roadmap's stated limitation and is the strongest argument for runtime testing over source review for Delivery 2.

### The good news: the financial chain reconciles

This was the highest-risk unknown, and it holds up. `PI-2026-0001`:

| Line | USD |
|---|---|
| FOB (Audi R8 V10, chassis `4S-CR8V10-00912`) | 189,900 |
| Freight | 2,500 |
| Customs clearance | 1,200 |
| Export inspection | 450 |
| Port handling | 350 |
| Insurance | 800 |
| **Computed** | **195,200** |
| **Stored total** | **195,200** ✓ |

Payment `TXN-908122` ($195,200, T/T, Approved) allocates exactly 195,200 to `vehicle-1`. The invoice ledger independently reports Total / Paid / Outstanding as $195,200.00 / $195,200.00 / $0.00. **Invoice, payment, allocation and ledger all agree.**

### The bad news: four defects around it

**1. Tier discounts are never applied.** Platinum carries a 15% discount; `CUST-1001` is Platinum. The invoice uses $189,900 — the unmodified showroom list price. A 15% discount would give $161,415. The tier is stored, shown as a badge, and ignored by pricing.

**2. There is no duty or tax, anywhere.** `costs` has freight, customs *clearance*, inspection, handling, insurance. No import duty, no VAT/GST, no tax field in any store. For a cross-border export business quoting landed cost, this is usually the largest variable after the vehicle.

**3. A stored $120,000 outstanding balance displays as $0.00.** The customer record holds `outstandingBalance: 120000` against `creditLimit: 500000`. The portal shows "PENDING BALANCE $0.00", "CREDIT UTILIZATION $0 / $500,000", and *"Your account is fully settled. No pending dues."*

The same component reads `creditLimit` correctly and discards `outstandingBalance`, deriving outstanding from the invoice ledger instead. Two competing sources of truth for what a customer owes, disagreeing by $120,000. `CUST-1002` has the same contradiction ($45,000 / $300,000). Credit utilisation reads 0% for an account the data says has drawn 24% — and credit utilisation exists precisely to prevent over-extension.

**4. The real invoice number is never shown.** The record holds `invoiceId: "PI-2026-0001"`; the ledger renders **`PI-pi-1`**, prefixing `"PI-"` onto the internal key `pi-1`. For a customs and banking reference, that is substantive.

**Currency remains unverified** — every figure is USD, and no second currency or converter exists in the journey to exercise.

---

## Phase 3 — Salesperson application ✅ complete

### Master data is real

Country Master (Kenya, Tanzania, Jamaica, New Zealand), Port Master (4), Costing Items (3), Shipper (2), Bank (2), Terms Presets (2), plus CSV Upload, City Delivery, Roles Control, CMS, FAQ Manager and an OfflineCache Audit. This is a credible administrative surface.

### The freight engine is empty while invoices bill freight

The Freight Calculator maps Country + Port + M3 → cost/M3. It reads **"No freight mappings found"** — no mapping for any country. Yet the seeded PI bills $2,500 freight. **Freight configuration and freight billing are disconnected.**

### Staff inventory edits vanish from the UI; for half the catalogue they are lost outright

> **Corrected by the store-binding audit.** I first reported this as "the edit does not persist." More precisely: **the write usually succeeds, into a store the UI never reads.**

Editing `vehicle-1` (Audi R8) to `ZZTEST-PAINT-V1-20260806` **persisted correctly** to `carchief_mock_db_vehicles`, while `fs_cache_vehicles` — what the UI renders — kept the old value. Same split-brain cause as the leads.

My original test edited the Range Rover, `vehicle-6`. The mock document store is **truncated to 3 of the 6 vehicles**, so `updateDoc` targeted a document that does not exist and wrote nothing anywhere. **Edits to vehicles 1–3 persist invisibly; edits to vehicles 4–6 are lost outright.** Neither warns the user.

Every vehicle commit also throws a caught error — `Failed to save uncompressed vehicle images to subcollection: TypeError: Cannot read properties of undefined (reading 'collection')`. The mock shim implements no subcollections. This was the only console error in the entire validation.

**On the nine evicted stores:** they did disappear after the first commit and re-seeded automatically on the next customer-portal visit. Given the split-brain mechanism this is cache eviction and reseeding, not data destruction — the seed is authoritative and always restores. Disruptive, not destructive.

Also found: every inventory row renders `ID: vehicle- •` with the numeric suffix missing, so the identifier a salesperson would quote is unusable.

**"Remove vehicle" was not clicked**, per the deletion commitment.

---

## Phase 3 (cont.) — the brand chart, and the store-binding audit

The "Sales Distribution by Brand" chart shows 18 units across Toyota (8), Mercedes-Benz (4), Porsche (3), Ford (2), Land Rover (1) — against 6 catalogue vehicles, **none of them Toyota or Ford**.

A dedicated store-binding audit followed (`CarChief-POC-Store-Binding-Audit.md`), and it **substantially improved** the picture. The chart is not hardcoded — its query is correct, counting vehicles with `status === 'Sold'`. None exist, so a fallback substitutes fabricated demo data:

```js
return result.length > 0 ? result : [ { name: 'Toyota', value: 8 }, … ];
```

That is more dangerous than hardcoding — invisible when data exists, silently fabricating when empty. But an exhaustive scan found **only two business-metric instances**, both in `StaffDashboard.tsx`, both one-line fixes. The second (customer countries) is the same bug currently masked by populated data.

**Everything else checked was correctly bound**: all nine KPI tiles, the country chart, the conversion funnel counts, the leads badge, the leads table, the customer invoice ledger, and the entire public showroom with filters and sort.

This retires the open-ended warning in the earlier revision of this report that "no figure displayed anywhere should be treated as derived from real data." The scope is bounded and small.

---

## Phase 4 — Handoffs ✅ complete, and it fails

This was the decisive test, and it is the most important result in this report.

> **Diagnosis corrected by the store-binding audit** (`CarChief-POC-Store-Binding-Audit.md`). The observation below stands; the explanation I first gave for it — "the staff Leads table renders hardcoded demo data and is not wired to a store" — **was wrong**, as was my claim that the leads counts disagreed.

**Method.** Submitted one enquiry through the public Contact form, prefixed `ZZTEST-`. Then, in the **same browser context and same storage origin**, opened `/staff/` → Leads.

**Result.** The enquiry never appeared. `grep ZZTEST` against the staff page: 0 hits. The console displayed the compiled seed rows `Charith` (CONTACTED) and `John Smith` (NEW), while `carchief_mock_db_leads` held `ZZTEST-Runtime Validation` and `Marcus Sterling` — disjoint sets.

**Actual cause: the application has two stores that never reconcile.**

- **Writes** — `addDoc`/`updateDoc` → `carchief_mock_db_*`
- **Reads** — in permanently-active fallback mode → `fs_cache_*`, falling back to the compiled seed

A binding probe settled it: writing one marked record into `fs_cache_leads` **immediately replaced the seed rows in the UI**. The table is fully reactive to its store. The enquiry is invisible because it was written to a store no reader consults.

**Correction on the counts.** I previously reported "three mutually inconsistent answers — 1, 2 and 2." That was wrong. The badge is `leads.filter(l => l.status === 'New').length` — a *new*-leads count, correctly computed from 2 leads of which 1 is New. The label is ambiguous; the number is right. There was no counting defect.

The submission did work — the enquiry persisted correctly, creating the `carchief_mock_db_leads` key, with a sensible record shape (`id`, `vehicleId`, `vehicleTitle`, `customerName`, `customerEmail`, `customerPhone`, `message`, `status`, `notes`, `createdAt`). The write half is real. The read half is theatre.

**Business consequence:** in the demonstrated system, a customer enquiry is silently lost. No salesperson would ever see it. Since lead capture → sales follow-up is the primary revenue path, the POC does not currently demonstrate the business's core loop, however convincingly the dashboard suggests otherwise.

---

## Phase 5 — Role and permission boundaries ✅ complete

No authentication boundary exists (Phase 0). The additional finding is about **data isolation**, and it is worse.

While the browser was on **`/customer/`** — the customer bundle, presenting as `CUST-1001` — a live read returned **both** customer records:

| customerId | Name | Tier | Credit limit | Outstanding |
|---|---|---|---|---|
| CUST-1001 | Charith | Platinum | 500,000 | 120,000 |
| **CUST-1002** | **Kenji Tanaka** | **Gold Club** | **300,000** | **45,000** |

A customer's browser holds every other customer's identity, contact details, company, assigned salesperson, credit limit and outstanding balance — readable from the console in one line.

This is not a UI filtering oversight that later server-side scoping would fix. With all state in `localStorage` and no backend, **every record the application can show anyone is present in every user's browser**. There is no boundary to enforce, and none can be added without introducing a server.

The one boundary that *does* hold — the public bundle refusing `?view=backend` — is a side effect of the forced-view override, not an access check, and would vanish if the three bundles were ever merged.

---

## Phase 6 — API and network evidence ✅ complete

**Total outbound surface across the entire run [BROWSER]** — three hosts, nothing else:

| Host | Purpose |
|---|---|
| `127.0.0.1:8080` | Own document, manifest, favicon, service worker |
| `fonts.googleapis.com` / `fonts.gstatic.com` | Web fonts |
| `images.unsplash.com` | All vehicle photography |

**Zero application API calls at any point.** The plan anticipated this would be "largely a negative finding to confirm." It is now confirmed on runtime evidence rather than inferred from a static bundle scan.

**The `/api/` 503 is real but inert.** Pre-flight **[HTTP]** found `/api/` returning 503 with *"Optional AI service is unavailable. Start the Compose ai profile with a valid Gemini API key."* The AI Copilot search was exercised in the browser and made **no network request at all** — it never reaches `/api/`. `aiSearchLocal.ts` documents itself as a regex parser that "bypasses network latency, and avoids unnecessary Gemini/Firestore load" **[SOURCE]**.

So enabling the Compose `ai` profile would not change public-site behaviour. The feature is branded "AI Copilot" with a "COPILOT ONLINE" badge, and reports **"AI search resolved successfully. Found 0 matching vehicles"** — presenting a zero-result search as a success, unlike the Standard Filters path which renders a proper empty state.

**Vehicle imagery is hot-linked from Unsplash**, not served from the inventory record — worth noting for both offline-demo reliability and any licensing review.

---

## The customer portal — full sweep

All nine tabs exercised. The portal has **no source code**, so this is the only specification of it that exists.

| Tab | State |
|---|---|
| Overview Desk | Populated; carries the credit-balance contradiction |
| Sourcing Showroom | **Exits the portal** to the public site |
| Sourced Vehicles | 3 folders; contains a phantom vehicle |
| Reserved Vehicles | **Identical duplicate** of Sourced Vehicles |
| Billed Invoices | Populated; internally consistent |
| Wire Remittance | Populated; allocation defect |
| Secure Vault | Empty — 10 document categories defined |
| Bulletins | Empty — and the store is genuinely empty, so **correct** ✓ |
| Client Profile | Editable company/phone/address; password change |

### Five contradictory statements of what the customer owes

The most commercially dangerous cluster in the product. Same customer, same session:

| Screen | Statement |
|---|---|
| Overview Desk | "PENDING BALANCE **$0.00**" · "Your account is fully settled" |
| Billed Invoices | Total $195,200 / Paid $195,200 / **Outstanding $0.00** |
| Sourced Vehicles → INVOICED | Sold $189,900 / Paid **$0.00** / **Bal $189,900** |
| Wire Remittance journal | TT remaining **USD 195,200** — "APPROVED - AVAILABLE" |
| Customer record | `outstandingBalance` **120,000** |

The "Sold $189,900" figure is FOB only, so it disagrees with the $195,200 invoice total as well. The Wire Remittance entry is the operationally worst of these: **fully-allocated funds are presented as available**, on the screen whose entire purpose is allocating them — inviting double-allocation.

### A phantom vehicle double-counts the fleet

The store holds **one** customer vehicle. The portal shows **two**: the INVOICED folder renders the real record (`STK-9012`, chassis `4S-CR8V10-00912`, TRANSIT), while the WITH PI folder renders one **synthesised from the proforma invoice** — `STK-VEHI`, blank chassis, `PI Ref: PI-STK-vehi`. That is why Overview Desk claims "BOUGHT CARS 2", and `PI-STK-vehi` is a **fourth** invoice numbering scheme.

### Generated documents are never filed

The Secure Vault defines ten categories (Proforma Invoice, Commercial Invoice, Bill of Lading, Inspection and Export Certificates, Insurance, Packing List, Vehicle Photos, Auction Sheet, Other) and is **empty despite `PI-2026-0001` existing**. Document generation and document storage are unconnected.

Evidence: `docs/evidence/phase2/phase2-customer-fleet-contradictions.png`.

---

## CRUD testing — deletes are destructive and silent

Performed under explicit authorisation, target shown first, then restored.

Deleting `vehicle-3` (2023 Tesla Model S Plaid, $94,990) from the staff inventory grid:

| | Before | After |
|---|---|---|
| `carchief_mock_db_vehicles` | 3 records | **2 — record destroyed** |
| `fs_cache_vehicles` | 6 records | 6 — unchanged |
| UI | Tesla shown | **Tesla still shown** |

A confirmation dialog is correctly presented. On confirming, **the record is genuinely destroyed and the UI shows it as still present.** For ordinary writes the split-brain is invisible-but-harmless; for deletes it is invisible-and-destructive — the user reasonably concludes the delete failed and may repeat it.

**This is the one item I would fix in the mock layer regardless of the backend decision.** It is a safety issue, not a fidelity issue.

---

## Cross-cutting: the UI describes a system that does not exist

Five claims are made to the viewer that runtime evidence contradicts:

1. **"OfflineCache Quota Limit Reached — The system has automatically entered offline high-fidelity fallback mode. All features remain 100% responsive and functional!"** — a permanent red banner on the customer and staff portals, with a "Retry Live Connection" button. There is no live connection to fall back from. `fs_quota_exceeded` is `true` at seed. **The application's own OfflineCache Audit panel reports "FALLBACK MODE: FORCED ACTIVE"** — its diagnostics directly contradict its banner. That panel's counters all read 0 ("NO STATS RECORDED YET") despite heavy activity, so the telemetry is itself non-functional.
2. **"CarChief utilizes highly secure cloud-replicated server architectures for real-time transaction records and client logs"** — public footer, under a "SECURED CLOUD ENVELOPE" badge. No such architecture is reachable.
3. **"SECURE CLIENT SESSION / ACTIVE"** and **"Role: SUPER ADMIN • Full database control"** — displayed with no authentication having occurred.
4. **Client Profile: "Every session transaction, profile revision, document preview, and telegraphic submission is logged under a secure audit trail… IP mapping & access logs."** — there is no server, no audit trail and no IP logging.
5. **"Freight mappings are already populated" / "City delivery rates are already populated"** — both collections verifiably hold `[]`. The message is false *and* it blocks the only route to configuring them.

For an internal demo this is set dressing. Shown to a client, investor or auditor without narration, it misrepresents system maturity. This is the single thing most worth correcting before the POC is shown externally, and it is cheap to fix relative to everything else in this report.

---

## Corrections made during validation

Recorded here because each changed a conclusion. All are corrected in place above.

**From the store-binding audit:**

**A. "The staff Leads table renders hardcoded demo data" — wrong.** A binding probe (writing one record into `fs_cache_leads`) immediately replaced the seed rows. The table is fully reactive; the enquiry is invisible because it was written to a different store.

**B. "Three inconsistent lead counts" — wrong.** The badge is `leads.filter(l => l.status === 'New').length` — correctly computed. Ambiguous label, right number.

**C. "Staff edits are silently discarded" — half wrong.** Editing `vehicle-1` persisted correctly to `carchief_mock_db_vehicles`; the UI showed a stale cache. My first test hit `vehicle-6`, and the mock store is truncated to 3 of 6 vehicles, so *that* write was genuinely lost.

**D. "No widespread hardcoding audit needed" — resolved favourably.** Only **two** business-metric fallbacks exist (plus one trivial literal). Almost everything is correctly bound.

**From the staff-app sweep:**

**E. "No duty or tax anywhere" — wrong.** The PI ledger has a `Tax Basis %` field and Incoterms (CNF/FOB/CIF/C&F). Tax is implemented and defaulted to 0. No *import duty* line distinct from tax.

**F. "Tier discounts never applied" — incomplete.** They apply when a registered customer is selected; the seeded invoice has none identified.

**G. "Multi-currency unverifiable" — resolved.** 7 trading currencies and 6 correctly-bound exchange rates with consistent reciprocals.

**From the customer-portal sweep:**

**H. "The customer balance contradiction is two-way" — understated.** It is **five-way**.

**I. "The split-brain is a write-vs-read problem" — understated.** Two *read* patterns also disagree with each other, and deletes are destructive-but-invisible.

**From Phases 1–3:**

**1. "Vehicle detail pages are unreachable by URL" — wrong.** They are fully addressable: `?vehicleId=vehicle-2` cold-loads the correct detail page. The `vehicleId` parameter *is* read on mount, unlike `view`. The SEO problem is real but different and smaller: **zero anchor elements anywhere** (so a crawler has no link graph to reach those pages through), plus no per-page metadata — generic `<title>`, no meta description, no canonical, no Open Graph, no JSON-LD, and 2 `<h1>`s. The URL scheme already works; the linking and metadata do not.

**2. The `?view=` override was misattributed.** I originally explained `/?view=backend` → `showroom` as the auth listener demoting the staff view. The real mechanism is `if (window.__CARCHIEF_FORCE_VIEW__) return window.__CARCHIEF_FORCE_VIEW__`, which discards **every** `?view=` value in **every** bundle — `all-stock` and `faq` are overridden identically, with no auth involvement. The `?view=` parameter in the address bar is written but never read.

## Scope

All six phases complete. Remaining untested items, stated so this is not over-read:

| Phase | Status | Not covered |
|---|---|---|
| 0 Baseline | ✅ | — |
| 1 Public website | ✅ | Pagination (no pagination exists; 6 records can't distinguish "absent" from "not needed") |
| 2 Customer application | ✅ | Multi-currency conversion and rounding — no second currency exists in the seed to exercise |
| 3 Salesperson application | ✅ | "Reserve Vehicle" and "Remove vehicle" not clicked (deletion commitment); document generation not exercised |
| 4 Handoffs | ✅ | — |
| 5 Role boundaries | ✅ | — |
| 6 API/network | ✅ | — |

The pricing risk flagged in the earlier revision has been **discharged in part**: the seeded invoice arithmetic is correct and reconciles across invoice, payment, allocation and ledger. What remains wrong is not the arithmetic but the data flow around it — ignored discounts, absent tax, an orphaned balance field, and a freight engine disconnected from freight billing.

---

## Safety commitments — compliance

| Commitment | Status |
|---|---|
| `/__reset/` not triggered without approval | ✅ **Never triggered.** Not visited at any point. |
| No delete without showing the record and obtaining confirmation | ✅ Honoured throughout. Deletion was later **explicitly authorised** by the user; both deletions (`vehicle-3`, and the ZZTEST lead) were shown in full first. `vehicle-3` was restored; the ZZTEST lead removal was the requested cleanup. |
| Test records prefixed `ZZTEST-` and logged | ✅ All test data prefixed and logged with full field values and timestamps. Final scan: **0 `ZZTEST` strings remain** in any storage key. |
| No modification to app source, Docker, Supabase config, business logic | ✅ **None.** `POC/`, `docker/`, `docker-compose.poc.yml` untouched. |
| No secrets transcribed | ✅ Hardcoded super-admin credentials found in source and shipped bundle are **described, not reproduced**. |
| Local Docker POC only | ✅ `127.0.0.1:8080` only. |

**Environment changes made outside the application, both approved in advance:** installed Playwright's bundled Chromium; added `--browser chromium` to the `playwright` server args in `.mcp.json`. No application file was altered.

### Environment state at close

All test mutations reverted; the environment is back to its seeded baseline.

| Action | Outcome |
|---|---|
| `fs_cache_leads` binding probe | removed, verified `null` |
| `vehicle-1` colour, reservation fields, forced status | all reverted |
| Two empty rate collections created by the seed attempts | removed |
| `vehicle-3` (Tesla Model S Plaid) deletion | **restored** — `vehicle-1/2/3` verified present |
| `ZZTEST-Runtime Validation` lead | **deleted as requested**; full record preserved in the evidence register (E8.8) |

Final scan for `ZZTEST` across all storage keys: **0 hits**. `git diff` on `POC/`, `docker/`, `docker-compose.poc.yml` and `docs/CarChief-Frontend-Implementation-Roadmap.md`: **empty**.
