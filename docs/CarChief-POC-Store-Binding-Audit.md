# CarChief POC — Store-Binding Audit

**Date:** 2026-08-06
**Question:** for every figure the UI displays, is it derived from its store, or fabricated?
**Method:** runtime binding probes in a real browser, cross-checked against `POC/src` and, where source is absent, against the compiled bundles.

> **Headline:** the answer is much better than the earlier reports implied, and the real defect is different from what I first described. **Almost everything is correctly bound.** There is no widespread hardcoding. There are two precise root causes, both of which I had previously mis-diagnosed.

---

## Bounding the source available

Exactly three modules imported by `App.tsx` have no source in the repository:

| Module | Consequence |
|---|---|
| `customer/CustomerPortalApp` | The entire customer portal — compiled evidence only |
| `firebase` | The `db`/`auth` shim — the write path |
| `lib/firestoreCache` | The cache layer — **the read path** |

Every other import resolves to real source. Critically, **both halves of the data layer are compiled-only**, which is why this had to be established by runtime probing rather than reading code — and why earlier source-based reasoning about it was wrong.

---

> **Update (third session).** The audit below was written when the split-brain looked like a *write-vs-read* problem. Subsequent CRUD testing showed it is wider: **two read patterns coexist and disagree with each other**, and **deletes execute destructively while the UI denies it**. See "Root cause A — extended" before acting on this document.

---

## Root cause A — Split-brain: writes and reads use different stores

### The mechanism

Decompiled from `carchief_staff_backend.html`, `subscribeToCollection`:

```js
subscribeToCollection: (n, l, c, i = false, u = "Unknown") => {
  let m = true;
  if (he.isFallbackMode()) {
    const x = he.get(n) || _s(n);   // fs_cache_<n>  ||  compiled seed
    l(x);
    const k = (g) => {
      g.detail && g.detail.colName === n && m && l(he.get(n) || []);
    };
    return window.addEventListener("offlineCache-cache-updated", k), ...
  }
  ...
}
```

`he` is the cache, `_s(n)` is the compiled seed. `isFallbackMode()` is **permanently true** — `fs_quota_exceeded` is `true` at seed and never cleared.

Meanwhile the write path (`App.tsx:1106`, `App.tsx:1029`) is ordinary mock-Firestore:

```js
const colRef = collection(db, 'leads');
await addDoc(colRef, leadObj);          // → carchief_mock_db_leads
```

```js
const docRef = doc(db, 'vehicles', id);
await updateDoc(docRef, lightUpdates);  // → carchief_mock_db_vehicles
```

**So writes land in `carchief_mock_db_*` and reads are served from `fs_cache_*` or the compiled seed. Nothing reconciles the two.**

### Proof 1 — the Leads table *is* correctly bound

I previously reported the staff Leads table as "rendering hardcoded demo data, not wired to the store." **That was wrong.**

Binding probe: wrote one marked record into `fs_cache_leads` and dispatched `offlineCache-cache-updated`.

| | Rendered rows |
|---|---|
| Before | `Charith … CONTACTED`, `John Smith … NEW` |
| After probe | **`ZZTEST-BINDING-PROBE … NEW`** — seed rows gone |

The table is **fully reactive to its store**. It displays seed data only because `fs_cache_leads` does not exist, so the reader falls through to `_s('leads')`. The public enquiry form writes to `carchief_mock_db_leads`, which no reader consults.

*(Probe removed afterwards; `fs_cache_leads` deleted and state verified clean.)*

### Proof 2 — the vehicle edit *did* persist, to the store nobody reads

I previously reported staff inventory edits as "silently discarded." **Also wrong** — more precisely, half wrong, and the half that's right has a different cause.

Editing **`vehicle-1`** (Audi R8, present in the mock store), setting Exterior Paint to `ZZTEST-PAINT-V1-20260806`:

| Store | Value after commit |
|---|---|
| `carchief_mock_db_vehicles` → `vehicle-1.color` | **`ZZTEST-PAINT-V1-20260806`** ← the write **succeeded** |
| `fs_cache_vehicles` → `vehicle-1.color` | `Catalunya Red Metallic` ← stale |
| UI | shows the stale cache value |

The write works. `handleUpdateVehicle` even calls `firestoreCache.invalidate('vehicles')` and `loadVehicles(true)` — but in fallback mode the reload re-reads cache/seed, so the update is never surfaced.

*(Value restored to `Catalunya Red Metallic` afterwards; no residue.)*

### Proof 3 — why the *first* edit vanished entirely

My original test edited the **Range Rover — `vehicle-6`**. The mock document store is **truncated to 3 of 6 vehicles**:

| Store | Contents |
|---|---|
| `carchief_mock_db_vehicles` | `vehicle-1`, `vehicle-2`, `vehicle-3` — **3 records** |
| `fs_cache_vehicles` | `vehicle-1` … `vehicle-6` — **6 records** |

`updateDoc(doc(db,'vehicles','vehicle-6'))` targets a document that does not exist in the mock store, so nothing is written anywhere. **Edits to vehicles 1–3 persist invisibly; edits to vehicles 4–6 are lost outright.** Neither produces a visible change and neither warns the user.

### Also surfaced: a real JS error on every vehicle commit

```
Failed to save uncompressed vehicle images to subcollection:
TypeError: Cannot read properties of undefined (reading 'collection')
```

The mock shim implements no subcollections. Caught and logged, flow continues — the only console error observed in the entire validation.

---

---

## Root cause A — extended: it is not one split, it is three

Later CRUD testing established that the divergence has three distinct expressions, in increasing order of severity.

### A1 — Writes land where reads don't look *(documented above)*

Leads, vehicle edits, reservations. Invisible, but non-destructive.

### A2 — Two read patterns disagree with each other

The application uses **both** access patterns simultaneously, and they resolve to different stores:

| Pattern | Used by | Reads |
|---|---|---|
| `firestoreCache.subscribeToCollection(…)` | Staff dashboard KPIs, charts, leads, inventory | `fs_cache_*` → compiled seed |
| `getDocs(collection(db, …))` | Customer Management, public FAQ, both rate seeders | `carchief_mock_db_*` |

Measured in one browser at one moment, immediately after a clean reload:

| Store | Customers |
|---|---|
| `fs_cache_customers` | **2** — Charith `CUST-1001`, Kenji Tanaka `CUST-1002` |
| `carchief_mock_db_customers` | **1** — `CUST-1001` only |

So the staff dashboard reports **"ACTIVE CUSTOMERS 2"** and its country chart **"Japan — 2 Clients"**, while **Customer Management reports "Displaying 1 of 1 Clients"**.

**Kenji Tanaka is permanently invisible to the customer-administration screen.** He exists in the seed and the cache but was never written to the mock document store, and that screen reads only that store. No error is raised; the screen simply asserts he does not exist.

This matters for the remediation estimate: it is not enough to make writes populate the cache. **The two read paths must be unified**, or screens will continue to disagree with each other even after writes are fixed.

### A3 — Deletes execute destructively while the UI denies it

Authorised destructive test on `vehicle-3` (2023 Tesla Model S Plaid, $94,990), restored afterwards:

| | Before | After |
|---|---|---|
| `carchief_mock_db_vehicles` | `vehicle-1, vehicle-2, vehicle-3` | **`vehicle-1, vehicle-2`** — destroyed |
| `fs_cache_vehicles` | 6 records | 6 — unchanged |
| Staff inventory grid | Tesla shown | **Tesla still shown** |

A confirmation dialog is correctly presented (CANCEL / DELETE LISTING). On confirming, the record is genuinely destroyed and **the UI shows it as still present**.

For ordinary writes the divergence is invisible-but-harmless. For deletes it is **invisible-and-destructive**: the user sees the row persist, reasonably concludes the delete failed, and may repeat it — while the record is already gone from the write store. Any second target selected on the same assumption compounds the loss.

Every delete also raises the same caught shim error as the vehicle edit:

```
Error deleting vehicle images: TypeError: Cannot read properties of undefined (reading 'collection')
```

### A4 — The same gap breaks the rate seeders

Both the Freight Calculator and Inland City Delivery seeders guard with `if (!snapshot.empty) return;`. The shim does not implement `QuerySnapshot.empty`, so `!undefined === true` and **the guard fires unconditionally against a collection verified to hold `[]`**. Both report a false *"already populated"*. The seeding path is unreachable on every click, including the first.

### Summary of A

Five independent features — lead capture, inventory editing, reservations (and therefore the entire quotation flow), customer administration, and rate seeding — fail for this one mechanism. **In every case the feature code is correct.**

---

## Root cause B — Fabricating empty-state fallbacks

The second pattern is narrow, and it is the one genuinely dangerous finding.

`StaffDashboard.tsx:534-548`:

```js
const chartSalesByBrand = useMemo(() => {
  const brandsData = {};
  vehicles.forEach(v => {
    if (v.status === 'Sold') { brandsData[v.make] = (brandsData[v.make]||0)+1; }
  });
  const result = Object.entries(brandsData).map(([name, value]) => ({ name, value }));
  return result.length > 0 ? result : [
    { name: 'Toyota', value: 8 }, { name: 'Mercedes-Benz', value: 4 },
    { name: 'Porsche', value: 3 }, { name: 'Ford', value: 2 },
    { name: 'Land Rover', value: 1 }
  ];
}, [vehicles]);
```

The query is **correct**. No vehicle has `status === 'Sold'`, so it returns empty — and the component substitutes **18 fabricated sold units across brands that do not exist in the catalogue**.

This is worse than hardcoding, because it is invisible when data exists and silently fabricates when data is empty. A production deployment with no sales yet would display "Toyota — 8 Units sold" as a business metric.

### Every instance of the pattern

Exhaustive scan for `X.length > 0 ? X : [...]` across all components and `App.tsx`:

| Location | Fallback | Assessment |
|---|---|---|
| `StaffDashboard.tsx:543` | Toyota 8 / Mercedes 4 / Porsche 3 / Ford 2 / Land Rover 1 | **Defect — fabricated business metric** |
| `StaffDashboard.tsx:560` | Kenya 12 / Tanzania 7 / Uganda 5 / Zambia 4 / Zimbabwe 2 | **Latent defect — dormant only because customer countries are populated** |
| `BackendDashboard.tsx:1454` | placeholder Unsplash image URL | Benign |
| `BackendDashboard.tsx:6421` | placeholder Unsplash image URL | Benign |

**Only two business-metric instances exist.** This bounds a risk that was previously open-ended.

The country chart is the same bug, currently masked: it renders correctly (Japan — 2 Clients) purely because both seeded customers have a `country`. Clear that field and it would invent 30 African clients.

---

## Root cause C — One genuinely orphaned field

`outstandingBalance` occurs **exactly 3 times** in the customer bundle — all three inside seed data definitions. **It is never read.**

Credit utilisation is computed instead from invoice balances (decompiled):

```js
w = i.reduce((A, H) => A + H.balance, 0);   // i = invoices
// rendered as:  "$" + w + " / $" + l.creditLimit
```

So `creditLimit` is read from the customer record (correctly, $500,000), while the amount owed is derived from invoices — where the only invoice is fully paid, giving $0.

Two independent sources of truth for customer debt, disagreeing by $120,000, with the authoritative-looking field silently ignored.

---

## Verified **correctly bound** — no defect

Each checked by comparing the rendered figure against a store-derived recomputation, on a clean page load:

| Component | Store-derived | Displayed | ✓ |
|---|---|---|---|
| Available vehicles KPI | 5 `Available` | 5 | ✓ |
| Reserved vehicles KPI | 0 | 0 | ✓ |
| PI issued KPI | 1 PI | 1 | ✓ |
| Pending payments KPI | 0 unapproved | 0 | ✓ |
| Sold this month KPI | 0 | 0 | ✓ |
| Active customers KPI | 2 | 2 | ✓ |
| Open quotations KPI | 1 | 1 | ✓ |
| **Customer base by country** | Japan → 2 | Japan — 2 Clients | ✓ |
| **Conversion funnel counts** | 2 leads / 1 contacted / 1 PI / 0 sold | 2 / 1 / 1 / 0 | ✓ |
| **Leads badge** | 1 lead with `status==='New'` | LEADS (1) | ✓ |
| **Leads table** | seed (2 rows) | 2 rows, reactive to store | ✓ |
| Customer invoice ledger | $195,200 / $195,200 / $0.00 | identical | ✓ |
| Public showroom, filters, sort | 6 vehicles, options derived from store | correct | ✓ |

**A further correction:** I previously reported the leads area as showing "three different counts — 1, 2 and 2 — that disagree." It does not. The badge is `leads.filter(l => l.status === 'New').length` — a **new**-leads count, correctly computed. The label "LEADS (1)" is ambiguous, but the number is right. There was no counting defect.

---

## One cosmetic issue worth naming

The conversion funnel renders `{count} ({width})`, where `width` is a **hardcoded bar width**, not a computed rate:

```js
{ label: 'Total Inquiries',  count: leads.length,  width: '100%' },
{ label: 'Contacted Leads',  count: …,             width: '75%'  },
{ label: 'Quotations Sent',  count: piIssued,      width: '55%'  },
{ label: 'Sold Deliveries',  count: soldThisMonth, width: '35%'  },
```

So the display reads `CONTACTED LEADS — 1 (75%)` and `SOLD DELIVERIES — 0 (35%)`. A viewer reads those percentages as conversion rates; they are static styling constants and never change. **0 deliveries is presented alongside "35%".** The counts are correct; the percentages are meaningless and should not be shown next to them.

---

## What this changes

**The earlier assessment was too pessimistic and imprecise.** Three corrections matter:

1. **There is no widespread hardcoding.** Prior reports said "the proportion of listed coverage that is presentation-only is currently unknown" and implied a large audit burden. It is now bounded: **two charts**, both in one file, both one-line fixes.
2. **The lead and inventory failures are one bug, not two.** Both are the split-brain read/write store division. Fixing the data layer fixes both, plus every other write in the application.
3. **The components are well written.** The queries are correct. The bindings are correct. The bugs live in the compiled data layer and in two defensive fallbacks — not in the feature code.

### Revised remediation

| # | Fix | Effort | Impact |
|---|---|---|---|
| 1 | Delete both fabricating fallbacks; render a real empty state | Trivial — 2 edits in one file | Stops fabricated business metrics |
| 2 | Remove the static funnel percentages | Trivial | Stops misleading conversion figures |
| 3 | Fix the `'All 26 Enabled'` literal (actual: 29) | Trivial | Cosmetic accuracy |
| 4 | Resolve **five** contradictory statements of customer balance to one authoritative source | Small–moderate; needs a business decision on which source is correct | Fixes the most commercially dangerous defect cluster |
| 5 | Reconcile write and read stores — writes must populate `fs_cache_*` | Moderate, in compiled-only code | Fixes leads, inventory, reservations, and the quotation flow at once |
| 6 | **Unify the two read patterns** (`firestoreCache` vs `getDocs`) | Moderate | Without this, screens keep disagreeing *with each other* even after 5 |
| 7 | Make deletes visible — or block them until reads are unified | **Urgent** | Currently destructive and silent |
| 8 | Fix mock-store truncation (3 of 6 vehicles) and the `.empty` gap | Part of 5 | Stops silent total loss; unblocks rate seeding |

**Items 5–8 disappear entirely if the POC moves to a real backend** — they are artifacts of the mock persistence layer, not of the application design.

**Revised recommendation.** When this audit was first written, item 5 looked like a contained fix worth doing in place. The later findings change that judgement: the defect now spans writes, two mutually-inconsistent read paths, destructive deletes, and the seeding guard — and it blocks the primary sales journey end to end. Patching the mock layer to that depth is close to rewriting it. **The backend decision should come first**, and the mock layer should not be invested in further beyond item 7, which is a safety issue.

---

## Mutations performed

All browser-local. All reverted except the ZZTEST cleanup, which was intentional and requested.

| Action | Store | Outcome |
|---|---|---|
| Wrote `ZZTEST-BINDING-PROBE` lead | `fs_cache_leads` (key created) | ✅ key removed, verified `null` |
| Edited `vehicle-1` colour → `ZZTEST-PAINT-V1-20260806` | `carchief_mock_db_vehicles` | ✅ restored to `Catalunya Red Metallic` |
| Reserved `vehicle-1` (`ZZTEST-RESERVE-20260806`) | `carchief_mock_db_vehicles` | ✅ status and all 10 reservation fields removed |
| Set `vehicle-1.status = 'Reserved'` to prove the PI gate | `fs_cache_vehicles` | ✅ reverted to `Available` |
| Pressed both rate-seed buttons | created `carchief_mock_db_freightRates`, `carchief_mock_db_cityDeliveryRates` (both `[]`) | ✅ both empty keys removed |
| **Deleted `vehicle-3`** (2023 Tesla Model S Plaid, $94,990) | `carchief_mock_db_vehicles` | ✅ restored from cache copy; `vehicle-1/2/3` verified present |
| **Deleted the `ZZTEST-Runtime Validation` lead** | `carchief_mock_db_leads` | ⬛ **intentional cleanup, not reverted** — full record recorded in the evidence register (E8.8) before removal |
| Tagged DOM buttons with `data-zztest-*` | none (in-memory) | ✅ cleared on reload |

Final scan for any `ZZTEST` string across all storage keys: **0 hits**. `/__reset/` was never triggered. No application source, Docker file, compose file, or the roadmap was modified at any point.
