# CarChief — Requirements Baseline

> **BA workflow reconciliation:** The later business workflow is recorded in [`CarChief-BA-Workflow-Coverage-Matrix.md`](./CarChief-BA-Workflow-Coverage-Matrix.md). This baseline remains demonstration-derived evidence; the BA workflow and `REQUIREMENT.md` WF requirements govern upstream import, publication, negotiation, PI timing, finance exceptions, Ship OK and document release.

**Date:** 2026-08-06
**Purpose:** capture what the POC demonstrably establishes about the intended product, as a starting point for a real requirements set.
**Basis:** browser-runtime validation of the local Docker POC, plus read-only source inspection.

> **How to use this document.** This is a baseline *derived from a demonstration*, not a specification. Every requirement below is tagged with the strength of its evidence:
>
> - **[CONFIRMED]** — observed working at runtime in a browser.
> - **[OBSERVED]** — the UI presents it, but the underlying behaviour was not verified.
> - **[INFERRED]** — exists in source only; never exercised.
>
> - **[DISPROVED]** — verified at runtime **not** to work.
>
> **[OBSERVED]** and **[INFERRED]** items describe *intent*, not proven capability. Given that the POC was found rendering hardcoded data disconnected from its stores in four separate places, intent and behaviour diverge here more than is usual.
>
> **Revision note:** sections 8 and 9 were substantially upgraded after Phases 2–3 were executed. Much of what was previously **[INFERRED]** is now **[CONFIRMED]** or **[DISPROVED]**.

---

## 1. Domain

CarChief is a **cross-border used/premium vehicle export brokerage**. It sources vehicles (primarily from Japan), sells to international buyers, and manages ocean freight, customs documentation and delivery through to the buyer's port and home registration.

Three participant classes, each with a dedicated portal:

| Participant | Portal | POC role constant |
|---|---|---|
| Public visitor / prospective buyer | `/` | `Guest` |
| Customer (buyer, often a trade partner) | `/customer/` | `Dealer` |
| Staff (salesperson, admin) | `/staff/` | `Admin` |

---

## 2. Roles and permissions

**[CONFIRMED]** Four roles are defined, each with `description`, `isSystemRole` and a `permissions` structure:

| Role id | Display name |
|---|---|
| `Admin` | Super Admin |
| `Dealer` | Partner Dealer |
| `Sales` | Sales Representative |
| `Guest` | Showroom Guest |

**R2.1** The system shall support at least these four roles. *(model confirmed; enforcement absent — role is a build-time constant in the POC)*
**R2.2** The system shall authenticate users before granting a role. *(**not demonstrated at all** — no authentication exists)*
**R2.3** Permissions shall be enforced server-side. *(no server exists; `hasStaffErpAccess()` and `permissions.canManageLeads` exist client-side **[INFERRED]**)*

---

## 3. Vehicle inventory

**[CONFIRMED]** Vehicles carry: title, model year, make/model, retail price (USD), availability status, stock number (`STK-…`), chassis number, and imagery.
**[CONFIRMED]** Availability vocabulary observed: `AVAILABLE`, `RESERVED`, `TRANSIT`, plus `SOLD` **[OBSERVED]** via a SoldOutRegistry component.

**R3.1** The system shall maintain a vehicle catalogue with per-unit identity (stock no., chassis no.). **[CONFIRMED]**
**R3.2** Vehicles shall carry a lifecycle status. **[CONFIRMED]**
**R3.3** Vehicles shall support categorised imagery. **[INFERRED]** — `CategorizedImageManager.tsx`; in the POC all images hot-link to Unsplash.
**R3.4** Vehicles shall carry detailed specifications. **[INFERRED]** — `VehicleSpecifications.tsx`, untested.

---

## 4. Public browse and discovery

**R4.1** Visitors shall browse the catalogue without authentication. **[CONFIRMED]**
**R4.2** Visitors shall filter by keyword across vehicle fields, with a clear empty state. **[CONFIRMED]**
**R4.3** Visitors shall filter by structured criteria (price, mileage, colour, transmission, arrival window). **[OBSERVED]** — "Maximize Filters" / "Reset All" present, not exercised.
**R4.4** Natural-language search shall be supported. **[CONFIRMED as regex]** — the POC's "AI Copilot" is a local heuristic parser handling price bounds, body type, colour, transmission and mileage constraints. Whether the requirement is genuine AI or good structured search is **an open product decision**, not a settled requirement.
**R4.5** Vehicle detail pages shall be individually addressable by URL. **[GAP]** — not met; navigation is button-driven with no anchors, making the catalogue non-indexable and non-shareable. Recommended as a requirement precisely because the POC violates it.

---

## 5. Enquiry and lead capture

**[CONFIRMED]** A public enquiry captures: `customerName`, `customerEmail`, `customerPhone`, `message`, `vehicleId`, `vehicleTitle`, `status`, `notes`, `createdAt`, `id`.

**R5.1** Visitors shall submit an enquiry, optionally tied to a specific vehicle. **[CONFIRMED]**
**R5.2** Enquiries shall persist as leads. **[CONFIRMED]** — write path verified.
**R5.3** **Leads shall be visible to staff.** **[GAP — critical]** Verified broken. The staff console does not read the lead store. This is the core revenue loop and it is the highest-priority requirement in this document.
**R5.4** Leads shall carry a status through a defined lifecycle. **[OBSERVED]** — `NEW`, `CONTACTED` seen in the staff UI; full vocabulary not established.
**R5.5** Staff shall record persistent notes against a lead. **[OBSERVED]** — a `notes` field exists on the record.

---

## 6. Sales pipeline

**[OBSERVED]** Five stages, with implied conversion weightings:

| # | Stage | Weighting shown |
|---|---|---|
| 1 | New Leads | 100% |
| 2 | Contacted | 85% |
| 3 | Quotation Issued | 65% |
| 4 | Payment Pending | 45% |
| 5 | Completed (Sold) | 25% |

**R6.1** The system shall track opportunities through these five stages. **[OBSERVED]**
**R6.2** Staff shall filter the pipeline by stage. **[OBSERVED]**
**R6.3** The system shall report conversion funnel metrics. **[OBSERVED]** — *note:* the POC's funnel and brand-distribution charts are not derived from their stores, so the calculation method is unestablished.

---

## 7. Quotation and proforma invoicing

**R7.1** Staff shall issue a Proforma Invoice against a vehicle and consignee. **[OBSERVED]** — `ProformaInvoiceGenerator.tsx`; "PI ISSUED (QUOTS)" KPI present.
**R7.2** PIs shall be tracked as documents with issued/pending status. **[OBSERVED]**
**R7.3** Staff shall apply pricing overrides. **[INFERRED]** — untested.
**R7.4** Commission shall be calculated per sale. **[OBSERVED]** — "COMMISSION EARNED" and a "2.5% CUT" indicator; formula unverified.

> **All of section 7 is unverified.** No invoice was generated during validation.

---

## 8. Pricing, freight and financials

**[INFERRED]** — from component names only; **none of this was exercised**:

| Capability | Component |
|---|---|
| Pricing calculation | `utils/pricing.ts` |
| Freight calculation | `FreightCalculator.tsx` |
| Freight route mapping | `FreightMappingManager.tsx` |
| Exchange rates | `ExchangeRateMaster.tsx` |
| City-level delivery | `CityDeliveryManager.tsx` |
| Customer tiering | `AdminCustomerTiers.tsx` |
| Payment allocation | `VehiclePaymentAllocations.tsx` |

**Confirmed cost structure [CONFIRMED]** — the proforma invoice's `costs` object:

| Line | Example (USD) |
|---|---|
| FOB vehicle price | 189,900 |
| Freight charge | 2,500 |
| Customs clearance | 1,200 |
| Export inspection | 450 |
| Port handling | 350 |
| Insurance | 800 |
| **Grand total** | **195,200** ✓ arithmetic verified |

**R8.1** The system shall compute a landed cost comprising vehicle price, freight, clearance, inspection, handling and insurance. **[CONFIRMED]** — computes correctly.
**R8.1a** The landed cost shall include **import duty and tax**. **[DISPROVED]** — no duty, VAT or GST field exists in any store. For cross-border export this is usually the largest variable component; it must be added.
**R8.2** The system shall support multi-currency with defined conversion and rounding. **[INFERRED]** — USD only throughout; no second currency in the seed, so nothing was exercisable. Formatting is correct `en-US`, 2dp.
**R8.3** Freight shall be calculated per route/port with RoRo and container options. **[DISPROVED — unreachable]** — the Freight Calculator (Country + Port + M³ range → cost/M³) and the Inland City Delivery master both contain **no mappings**, and **their seed functions cannot run**: a guard the mock shim cannot satisfy (`!snapshot.empty` on an unimplemented `.empty`) aborts every attempt with a false *"already populated"* message. Behind that sit a port-name mismatch (`'Mombasa'` vs `'Mombasa Port'`), a missing `countryName` field on ports, and presets referencing countries/ports absent from the master. Meanwhile invoices bill a hardcoded $2,500 freight charge. The data model is right; nothing behind it functions.
**R8.4** Customers shall be tiered with tier-based pricing. **[DISPROVED]** — tiers and discounts are stored (Platinum 15 / Gold 10 / Silver 5 / Standard 0) and displayed as badges, but **never applied**. The Platinum customer was billed full list price.
**R8.5** Customers shall have a credit limit with utilisation tracking. **[PARTIALLY DISPROVED]** — `creditLimit` reads correctly ($500,000). `outstandingBalance` ($120,000) is **orphaned**: the UI shows $0.00 and "fully settled", deriving outstanding from invoices instead. Two competing sources of truth for customer debt.
**R8.6** Each issued invoice shall display its assigned document number. **[DISPROVED]** — record holds `PI-2026-0001`; UI renders `PI-pi-1` from the internal key.

> **Upgraded after Phase 2.** The arithmetic engine is sound and the payment chain reconciles exactly. The gaps are in what feeds it: no tax, unapplied discounts, an unwired freight engine, and an orphaned balance field.

---

## 9. Payments

**R9.1** The system shall record Telegraphic Transfer (TT) remittances against a customer. **[CONFIRMED]** — payment record `TXN-908122`: `paymentId, customerId, invoiceId, amount, currency, paymentDate, method, status, bankReference, allocatedVehicles`. $195,200 USD, T/T Wire Transfer, Approved.
**R9.3a** Payment allocation shall reconcile to the invoice. **[CONFIRMED]** — allocation of 195,200 to `vehicle-1` matches the invoice total exactly.
**R9.2** TT receipts shall be approved by finance before funds are allocatable. **[OBSERVED]** — "FINANCE APPROVED TT REMITTANCE", "Confirmed & Cleared", "ALLOCATE FUNDS".
**R9.3** Approved funds shall be allocatable across vehicles. **[OBSERVED]** — `VehiclePaymentAllocations.tsx`.
**R9.4** Bulk TT logs shall be recordable and viewable per customer. **[OBSERVED]**
**R9.5** The system shall track payment status per vehicle. **[OBSERVED]** — "PENDING PAYMENTS", "DUE BILLS", "PENDING BALANCE".

---

## 10. Logistics and fulfilment

**[OBSERVED]** Shipment states: `RESERVED` → `TRANSIT` → `PORT READY` → delivered, with ETA per unit.

**R10.1** Customers shall track shipment status and ETA per vehicle. **[OBSERVED]**
**R10.2** The system shall support a documented 5-step buyer journey. **[CONFIRMED as content]** — Select & Get Quote → Confirm Order & Invoice → Make Payment & Share → Shipment & Documents → Receive Your Vehicle.
**R10.3** Export documentation shall be generated and shared. **[OBSERVED]** — "Secure Vault" for export files (empty in POC).
**R10.4** Customs clearance records shall be maintained. **[OBSERVED]**

---

## 11. Customer portal

**[CONFIRMED]** present as navigation: Overview Desk, Sourcing Showroom, Sourced Vehicles, Reserved Vehicles, Billed Invoices, Wire Remittance, Secure Vault, Bulletins, Client Profile.

All nine tabs were exercised at runtime. Since the portal has **no source code**, this is the only specification of it in existence.

**R11.1** Customers shall have an identity (`CUST-…`), company, and registry location. **[CONFIRMED]**
**R11.2** Customers shall view their fleet, invoices, payments and documents. **[CONFIRMED, with defects]** — fleet view **double-counts**: the store holds 1 customer vehicle, the portal renders 2 (one synthesised from the proforma invoice, with a mangled stock number `STK-VEHI` and a fourth invoice-number format `PI-STK-vehi`).
**R11.3** Customers shall receive notifications/bulletins. **[CONFIRMED as implemented]** — empty at seed, and the store is genuinely empty, so the screen is **correctly bound**.
**R11.4** Customers shall manage their own profile. **[CONFIRMED]** — company, phone and delivery address editable; email and name read-only; password change available.
**R11.5** Customers shall access export/customs documents in a secure vault. **[DISPROVED as wired]** — ten document categories are defined (Proforma Invoice, Commercial Invoice, Bill of Lading, Inspection/Export Certificate, Insurance, Packing List, Vehicle Photos, Auction Sheet, Other), but the vault is **empty even though `PI-2026-0001` exists**. Document generation and document storage are unconnected.
**R11.6** The portal shall state one consistent account balance. **[DISPROVED]** — **five mutually incompatible statements** across Overview Desk, Billed Invoices, Sourced Vehicles, Wire Remittance and the customer record. See gap G5c.
**R11.7** Allocated funds shall not be shown as available. **[DISPROVED]** — the Wire Remittance journal reports the fully-allocated TT as "APPROVED - AVAILABLE" with its full balance remaining, inviting double-allocation.

---

## 12. Administration

**[OBSERVED]** via Master Controls: customer management, customer tiers, staff/user security matrix, CMS branding, FAQ management, exchange-rate master, freight mapping, city delivery, mid-banners, countdown timers, testimonials.

**R12.1** Super Admins shall manage users and role permissions. **[OBSERVED]** — `UserSecurityMatrix.tsx`.
**R12.2** Site content shall be CMS-managed without a deploy. **[OBSERVED]**
**R12.3** Master data (rates, freight, delivery cities, tiers) shall be admin-maintained. **[OBSERVED]**

---

## 13. Non-functional — where the POC is silent or negative

These are **not** derived from the POC; they are the requirements a real system needs and the POC demonstrably lacks. Listed so they are not lost.

| # | Requirement | POC status |
|---|---|---|
| N1 | Durable server-side persistence | **Absent** — `localStorage` only |
| N2 | Multi-user concurrent access | **Absent** — single browser profile |
| N3 | Cross-device continuity | **Absent** |
| N4 | Authentication and session management | **Absent** |
| N5 | Server-side authorization | **Absent** |
| N6 | Audit trail for financial and status changes | **Absent** |
| N7 | Backup and recovery | **Absent** |
| N8 | Server-side input validation | **Absent** — HTML5 only |
| N9 | Search-engine indexability of inventory | **Absent** — no anchors, no routes |
| N10 | Secret management and credential rotation | **Violated** — credentials hardcoded in source and shipped bundle |
| N11 | Accurate representation of system state in UI | **Violated** — false "cloud-replicated" and "offline fallback" claims |
| N12 | Per-customer data isolation | **Violated** — every customer's browser holds every other customer's financial records |
| N13 | Writes shall persist, or fail visibly | **Violated** — writes land in a store no screen reads; the UI reports success regardless |
| N13a | **Deletes shall be visible, or blocked** | **Violated — safety issue.** Deleting a vehicle destroys the record in the write store while the UI continues to display it. The user reasonably concludes the delete failed and may repeat it |
| N13b | All screens shall read one store | **Violated** — two read patterns (`firestoreCache` vs `getDocs`) resolve to different stores; the dashboard reports 2 customers while Customer Management reports 1, and one customer is permanently invisible to administration |
| N13c | Master data shall be configurable | **Violated** — both rate engines' seed functions are unreachable behind a guard the mock shim cannot satisfy, and report a false "already populated" |
| N14 | Crawlable link graph and per-page metadata | **Absent** — zero anchors; generic title, no description/canonical/OG/JSON-LD |

---

## 14. Open questions for the business

Genuine ambiguities that validation surfaced and cannot resolve:

1. **Is "AI search" a real requirement?** The POC brands a regex as AI. Structured search may serve buyers better and more cheaply. This is a product decision, not a technical one.
2. **What is the actual multi-tenancy model?** `Dealer` as a customer role suggests B2B trade partners, but the customer portal is styled for a single end buyer. Which is the primary market?
3. **Which currencies, and who owns exchange rates?** An `ExchangeRateMaster` implies manual maintenance; the business may require live rates with margin.
4. **What is the source of inventory truth?** Vehicles appear hand-curated. Does this integrate with Japanese auction feeds, or is it manual entry?
5. **Which figures are contractual?** Duty/tax quoted to a buyer carries legal weight. Requires explicit sign-off on calculation ownership and disclaimers.
6. **What is the document retention obligation?** Export/customs paperwork typically carries statutory retention periods by jurisdiction.
