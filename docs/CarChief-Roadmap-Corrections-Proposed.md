# Proposed Corrections to the Frontend Implementation Roadmap

**Date:** 2026-08-06
**Status:** proposals only — **`docs/CarChief-Frontend-Implementation-Roadmap.md` has not been edited**, per the plan's constraint.
**Basis:** browser-runtime validation, 2026-08-06. See `CarChief-POC-Runtime-Validation-Report.md`.

The roadmap is in good shape. Its structure, delivery order, mock-to-BFF strategy and 21–22-week bottom-up estimate all survive runtime validation intact. The corrections below are targeted, and most **strengthen** the roadmap's existing position rather than contradicting it.

Each is marked by how it bears on the document.

---

## C1 — Add a fourth evidence level: "runtime-verified" ✳️ strengthens

**Section 2, "Evidence levels"**

The roadmap distinguishes *Source-confirmed*, *Compiled-artifact evidence*, *Recommendation* and *Open question*. Runtime validation has now produced a **stronger** category than any of these, and one crucial negative case the current scheme cannot express.

Proposed addition:

| Evidence | Meaning |
|---|---|
| **Runtime-verified** | Observed working in a real browser against the running POC |
| **Runtime-disproved** | Present in source or compiled artifact, but **verified not to work** at runtime |

The second row matters most. "Compiled-artifact evidence" currently covers both *"we saw a screen"* and *"the screen works"* — and Phase 4 proved those can diverge sharply. The staff Leads console is compiled-artifact evidence of lead management, and it is verified **not** to read the lead store.

---

## C2 — Confirmed coverage is sound; the data layer is the problem ✳️ revised, now largely reassuring

**Section 2, "Confirmed application coverage"**

> **Substantially revised.** An earlier version of this correction warned that "the proportion of the listed coverage that is presentation-only is currently unknown" and implied the estimate might be badly understated. **A systematic store-binding audit has since been completed and that concern is largely resolved.** See `CarChief-POC-Store-Binding-Audit.md`.

The audit compared every displayed figure against a recomputation from its store. The result is good for the roadmap:

**Correctly bound:** all nine staff KPI tiles, the customer-base-by-country chart, the conversion funnel counts, the leads badge, the leads table, the customer invoice ledger, and the entire public showroom with filters and sort. The component queries are correct and the bindings are real.

**Only two defective components exist**, both in `StaffDashboard.tsx`, both the same one-line pattern — a fallback that substitutes fabricated data when a correct query returns zero rows:

```js
return result.length > 0 ? result : [ { name: 'Toyota', value: 8 }, … ];
```

So the listed screens are **not shells**. Per-screen effort should not be revised upward on these grounds.

What *is* broken sits underneath, in the compiled data layer: **writes go to `carchief_mock_db_*` while reads are served from `fs_cache_*` or the compiled seed, and nothing reconciles them.** This single mechanism explains the lead-flow failure and the inventory-edit failure together.

Suggested amendment, milder than before: add a note to the coverage table — *"Component-level data binding was audited and found correct, with two exceptions in StaffDashboard.tsx. The mock persistence layer beneath, however, does not reconcile its write and read stores; this is an artifact of the POC's offline shim and does not carry into a real backend."*

**This is good news for the estimate**, and it strengthens Section 11: the feature code is ready to be repointed at a BFF, and the split-brain defect disappears on migration rather than needing to be fixed first.

---

## C3 — The Firebase/Firestore limitation is understated ⚠️ correction

**Section 2, "Important limitations"**

Current wording: *"The available source uses Firebase Authentication and Firestore, not Supabase."*

Runtime evidence: **Firebase is not used at all.** Zero network requests to any Firebase host across the entire session. The imports resolve to a local shim; all persistence is `localStorage`.

Suggested replacement: *"The source imports Firebase Authentication and Firestore, but runtime validation confirmed these resolve to a local shim — no Firebase service is contacted. All POC persistence is browser-local `localStorage`. There is no backend of any kind."*

This is **good news for the roadmap**: it removes any implied Firebase migration burden. There is no data to migrate and no live integration to unpick. It also makes the mock-to-BFF strategy in Section 11 stronger, since the POC is already 100% mock — that section's premise is now runtime-confirmed rather than assumed.

---

## C4 — Authentication is a larger gap than "credential-like bootstrap behavior" ⚠️ correction

**Section 2, "Important limitations"**

Current wording refers to *"Sensitive credential-like bootstrap behavior… must be reviewed/rotated where applicable."* That is accurate but undersells it in two ways:

1. **There is no authentication at all.** Role is a compile-time constant baked into three separate build artifacts (`__CARCHIEF_FORCE_ROLE__` = `Guest`/`Dealer`/`Admin`). Visiting `/staff/` grants Super Admin with no challenge. The POC provides **no** authentication foundation to build on — the login screen is bypassed entirely.
2. **Rotation is not conditional.** A hardcoded super-admin address and legacy fallback passwords are present in the source *and in the shipped bundle*. "Where applicable" should become unconditional: these must be treated as compromised and rotated regardless of how the project proceeds.

---

## C5 — Add lead-flow restoration as an explicit deliverable 🆕 addition

**Section 5 (Public Website) and Section 7 (Salesperson Application)**

Enquiry capture appears under the Public Website; leads under the Salesperson Application. Runtime validation shows the **join between them is the thing that's broken** — the write works, the read doesn't.

Because the boundary falls between two deliveries, the connection risks belonging to neither. Suggested: add an explicit acceptance criterion to Delivery 3 — *"An enquiry submitted on the public site appears in the salesperson leads queue, and a staff status change is reflected in the customer's view."* Section 8's end-to-end journey is the natural place to verify it.

---

## C6 — SEO scope is smaller than first thought, but still needs a decision 💭 judgement

**Section 4 (Delivery order) and Section 9 (Delivery 4)**

> **Revised.** An earlier version of this correction claimed vehicle detail pages are "unreachable by URL" and that Delivery 4 would require replacing the public site's navigation model. **That was wrong** and overstated the work.

Vehicle detail pages **are** addressable — `?vehicleId=vehicle-2` cold-loads correctly. The addressing foundation exists. What is missing is narrower:

1. **Zero anchor elements anywhere** — a crawler has no link graph to reach those pages through. They exist but nothing points at them.
2. **No per-page metadata** — generic `<title>`, no meta description, no canonical, no Open Graph, no JSON-LD, two `<h1>`s per page.
3. **`?view=` is written but never read** — `__CARCHIEF_FORCE_VIEW__` overrides it on load in every bundle.

So Delivery 4 is closer to its original framing than I first suggested: add anchors, add per-page metadata, honour the view parameter. That is real work but not a navigation rewrite.

The sequencing question still stands, more mildly: doing anchors and routing in Delivery 1 means the first demonstrable application has shareable, crawlable URLs, and avoids retrofitting them across every page later. Recommended, but a management call.

---

## C7 — Decide the "AI search" requirement before it is scheduled 💭 open question

**Section 2 and Section 12**

The roadmap correctly lists AI among labels that "do not prove production vendor integration." Runtime validation goes further: the AI Copilot makes **no network call whatsoever**. It is a regex parser (`localHeuristicSearch`) handling price bounds, body type, colour, transmission and mileage. The optional Gemini proxy at `/api/` returns 503 and **no UI path reaches it**.

Worth promoting to a Section 12 management decision: *is genuine AI search a product requirement, or is well-built structured search sufficient?* The POC's regex is a functioning structured search wearing an AI badge. Deciding this before scheduling avoids building a model integration to match a demo that never had one.

---

## C8 — Add UI truthfulness as a release gate 🆕 addition

**Section 9 (Release Readiness) or Section 12 (Risks)**

The POC displays three claims that runtime evidence contradicts: a permanent "OfflineCache Quota Limit Reached — offline fallback mode" banner (there is no live connection), a footer claim of "highly secure cloud-replicated server architectures," and "SECURE CLIENT SESSION / ACTIVE" with no authentication.

For an internal demo this is harmless set dressing. If any of it survives into a client, investor or audit-facing build it becomes a misrepresentation. Suggested release gate: *"No UI element claims a capability the system does not have."*

This is the cheapest item in the entire validation output — removing three strings — and it removes the largest non-technical risk.

---

## What needs no change

Stated so the corrections are not read as a broader challenge to the plan:

- **Delivery order** (Public → Customer → Salesperson → SEO) is sound.
- **The 21–22-week bottom-up estimate** is not contradicted by anything found. C2 and C6 could push it up; C3 removes migration burden and may offset.
- **The mock-to-BFF strategy** (Section 11) is now *runtime-confirmed* rather than assumed — the POC is already entirely mock-backed.
- **Page- and component-level phasing** is the right granularity, and C2 makes it more valuable, since per-screen data wiring cannot be assumed done.
- **The distinction between functional screens and unproven integrations** was the right call and validation vindicates it.

---

## C9 — Delivery 2 has no source to work from, and its estimate should reflect that 🆕 addition

**Section 6 (Delivery 2 — Customer Application)**

The roadmap notes customer portal source is missing. Runtime validation confirms it precisely: `App.tsx:73` imports `./customer/CustomerPortalApp`, and **`POC/src/customer/` does not exist**. The customer portal ships only as a compiled bundle.

Two implications for the estimate:

1. Delivery 2 is a **reimplementation from observed behaviour**, not a port. Every screen must be specified from the running artifact before it can be built. That is meaningfully more expensive per screen than Deliveries 1 and 3, where source exists.
2. Everything now known about the customer portal — including the credit-balance defect in C10 — came from browser observation. **Budget explicit runtime-specification time into Delivery 2**, because source review cannot substitute.

---

## C10 — Add specific financial defects to Delivery 2/3 scope 🆕 addition

**Sections 6, 7 and 12**

Phase 2 verified the financial engine. The arithmetic is **correct** — the seeded invoice reconciles exactly across invoice, payment, allocation and ledger. That is genuinely good news and de-risks the finance estimate.

But four defects sit around it, and each is a discrete scope item rather than a vague risk:

| Defect | Detail |
|---|---|
| Tier discounts never applied | Platinum = 15%; the Platinum customer was billed full list price |
| No duty or tax anywhere | No import duty/VAT/GST field in any store — usually the largest variable in landed cost |
| Orphaned `outstandingBalance` | Stored $120,000; UI shows $0.00 and "fully settled". Credit utilisation reads 0% against a 24% draw |
| Invoice number not displayed | Record holds `PI-2026-0001`; UI renders `PI-pi-1` from the internal key |

Plus, from Delivery 3's side: the **Freight Calculator contains no mappings** while invoices bill freight, and a **staff inventory edit was silently discarded** — accepted with no error, saved nothing, and evicted nine unrelated financial stores.

The credit-balance item is worth surfacing as a Section 12 risk in its own right: a customer shown "fully settled" while owing $120,000 is the most dangerous single figure in the product, and it would be shown in any live demo of the customer portal.

---

## C11 — The data layer is the decision; do not schedule around it 🆕 addition, and the most important

**Sections 11 (mocks → AutoPulse) and 12 (decisions and risks)**

Validation ended with **five independent features failing for one mechanism**, and in every case the feature code itself was correct:

| Feature | Fails because |
|---|---|
| Lead capture → staff queue | write store ≠ read store |
| Inventory editing | write store ≠ read store |
| Vehicle reservation | write store ≠ read store |
| **The entire reserve → quote → invoice journey** | PI button gated on `status === 'Reserved'`, which never becomes visible |
| Customer administration | reads a *different* store than the dashboard; one customer is permanently invisible |
| Freight & city-delivery configuration | seed guard the shim cannot satisfy |

Three distinct expressions, in increasing severity: writes land where reads don't look; **two read paths disagree with each other**; and **deletes execute destructively while the UI denies it**.

Two consequences for the roadmap:

1. **The POC cannot currently demonstrate its own primary sales journey.** Not a feature gap — a data-layer gap standing in front of working functionality. Any demo script that includes "reserve a vehicle and issue a quote" will fail today.
2. **Patching the mock layer is now close to rewriting it.** An earlier revision of this document suggested the split-brain was a contained fix. With reads, writes, deletes and the seeding guard all implicated, that judgement no longer holds.

Recommendation for Section 12: record **"resolve the persistence layer"** as a decision that precedes further frontend investment, rather than a task inside Delivery 3. Everything in the table above disappears on migration to a real backend.

**One exception worth carving out:** the destructive-delete behaviour is a *safety* defect, not a fidelity one. If the POC will be demonstrated or handled by anyone before the backend lands, deletes should be made visible or disabled — independent of the larger decision.

---

## C12 — Delivery 2 has one more hard dependency 🆕 addition

**Section 6 (Delivery 2 — Customer Application)**

Beyond C9's point that the customer portal has no source, the runtime sweep found the portal's **financial display is internally incoherent**: five mutually incompatible statements of what the customer owes, across five screens, in one session.

This is not a rendering bug to be fixed late. It requires a **business decision on which source is authoritative** — the customer record's `outstandingBalance`, or the invoice ledger — before the screens can be specified. That decision blocks acceptance criteria for Delivery 2, and should be raised in Section 12 alongside the other principal decisions.

Also for Delivery 2 scope: the fleet view double-counts vehicles (a phantom record synthesised from the proforma invoice), the Secure Vault is never populated by document generation, and two sidebar entries render the same view.

---

## Caveat on the strength of these corrections

These derive from **complete** validation — all six phases, plus a store-binding audit, a staff-application sweep, and a customer-portal sweep with full CRUD testing, all against the running POC in a real browser.

Confidence is high on the mechanisms, because each was proven by controlled probe rather than inferred: the leads binding by injecting a record, the PI gate by forcing a status, the delete behaviour by executing and measuring both stores, the read-path divergence by comparing two stores in one session.

Three limits remain worth stating:

- **End-to-end currency conversion was never executed.** The machinery is real — 7 trading currencies, 6 correctly-bound exchange rates with consistent reciprocals — but the only seeded payment is USD→USD, so no conversion path runs. Exchange-rate *history* is empty. R8.2 remains partially unverified.
- **Freight and inland-delivery calculation could not be exercised at all**, because the seeders cannot run. R8.3 is unreachable rather than merely unconfigured.
- **Validation exercised the seeded data paths, not every code path.** That said, C2's earlier warning about unknown scope has largely been discharged: the store-binding audit was exhaustive over displayed figures, and found only two fabricating fallbacks plus one trivial literal.
