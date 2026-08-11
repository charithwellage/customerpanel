# Phase 1.7 Context Pack — Public information and content

Read this file first. It carries the requirement text, decisions, code map and conventions the Phase 1.7 tasks need, so `REQUIREMENT.md` and `FRONT_END_ARCHITECTURE.md` only need to be opened for an item this pack marks unresolved.

## 1. Requirements in scope (verbatim from `REQUIREMENT.md`)

**PUB-17** A visitor can read an "About Us" page describing the company.

**PUB-18** A visitor can read a "How to Buy" page explaining the buying process step by step.

**PUB-19** A visitor can read customer testimonials, and can submit their own.

**PUB-20** A visitor can browse a Frequently Asked Questions page, organised into twelve categories.

**PUB-21** A visitor can find CarChief's contact details, including office locations and operating hours.

**PUB-27 — Source-confirmed legacy route family:** A visitor can read approved auction services, calendar, terms, FAQ and buying guidance. Any Live Auction capability is account-gated or an approved external destination; auction-site access, bidding and data integration are not implied.

**PUB-29 — Source-confirmed legacy page; content source open:** A visitor can read an approved shipping-schedule page or a clear unavailable/recovery state. The application must never expose server errors, internal paths or fabricated schedule data.

**PUB-30 — Source-confirmed public content portfolio:** A visitor can read approved public company, services, team, gallery, news, security and bank-information content where management authorizes publication. Each item requires a content owner, approval state and safe public projection; sensitive bank, security or personal details are not published by default.

**PUB-31 — Source-confirmed legacy behaviour; legal content open:** A visitor can access approved privacy/cookie information and make a consent choice where legally required. The new frontend uses an approved consent mechanism and copy; it does not reuse legacy scripts or treat prior acceptance as consent.

**PUB-35 — Confirmed by legacy business requirements; branch meaning open:** Each approved Branch page shall show the selected branch name; branch-specific Latest Arrivals and Recently Discounted collections using the same market/collection rules as the landing page; an introduction; welcome and contact banners; CarChief Team and Meet & Greet sections; and approved contact details. The page must have loading, empty, unavailable-content and no-eligible-stock states. The business must define what a Branch represents, the available branch list, its market/port relationship and the content owner before the route is released.

**RULE-08** Whenever something is saved, edited, or deleted anywhere in the system, that change is reflected immediately and consistently everywhere it is shown. A save or delete must never appear to succeed while quietly not taking effect, and it must never take effect while the screen shows the old information as if nothing happened.

**RULE-09** When there is no data to show, the system shows an honest message saying so. It never fills the gap with a plausible-looking number that was not actually calculated from anything.

**RULE-10** The system never claims a capability it does not actually have. If a message tells the user something is happening automatically, securely, or successfully, that must be true.

## 2. Decisions

| Decision | Status | What Phase 1.7 does |
|---|---|---|
| `DEC-PUB-FAQ-AI` | DEFERRED | FAQ answers stay grounded in approved records. No external AI. An unmatched question returns an honest "no answer" plus contact escalation — never a generated answer. |
| `DEC-PUB-BRANCH-PAGE` | OPEN | Branch meaning, branch list, market/port relationship and content owner are unconfirmed. Build the route and template against approved content services, keep the branch list configuration-driven, and record the open definition as a named constraint. Do not invent a branch list. |
| `DEC-PUB-LEGACY-PARITY` | OPEN | Legacy content/route approval pending. Deliver approved content only; record unapproved legacy pages as constraints rather than copying legacy copy or scripts. |
| `DEC-PUB-PREMIUM-STOCK` | OPEN | WhatsApp remains clearly labelled contact intent. |

Every content item carries a content owner and approval state. Unapproved or pending content is not rendered publicly; it shows the honest unavailable state.

## 3. Code map — what already exists

| Area | Path | Notes |
|---|---|---|
| Mock store | `apps/mock-api/src/store.ts` | Add content, FAQ and testimonial persistence to `DemoStore`, `MemoryStore` and `PostgresStore`. Reset stays deterministic. |
| Mock routes | `apps/mock-api/src/server.ts` | `createMockApiApp(store)` factory; CORS and demo-JWT middleware already in place. |
| Typed client | `packages/api-client/src/services/` | Add a content service beside `vehicles.ts`. Features never import `http.ts` or `generated/**`. |
| Collections reuse | `packages/vehicle-search/src/` | Branch pages reuse the existing collection primitives and market/collection rules. Do not fork them for branches. |
| Shared UI | `packages/ui/src/` | `EmptyState`, `ErrorAlert`, `StatusBadge`, `InputField`, `Button`, `Dialog` already exist. |
| Shell/navigation | `apps/public-web/src/shell/` | `HeaderComponent`, `FooterComponent`, `NavigationDrawer`, `LayoutShell`. New routes join the existing navigation, not a second nav. |
| Existing link target | `apps/public-web/src/app/page.tsx` | The home hero already links to `/how-to-buy`; that route must exist by the end of this phase. |
| Feature slices | `apps/public-web/src/features/<feature>/{components,hooks}` + `<feature>.css` | Existing pattern from Phases 1.2–1.6. |

## 4. Conventions the validation commands depend on

| Artefact | Required path |
|---|---|
| Content mock tests | `apps/mock-api/src/__tests__/content.test.ts` |
| Content page tests | `apps/public-web/src/__tests__/public-content-pages.test.ts` |
| Testimonial tests | `apps/public-web/src/__tests__/testimonials.test.ts` |
| FAQ tests | `apps/public-web/src/__tests__/faq.test.ts` |
| End-to-end spec | `tests/e2e/public-content.spec.ts` |
| Contract tests | `packages/api-client/src/__tests__/contract.test.ts` (extend) |

The nine content routes and the shared `ContentPageTemplate` are listed in `D01-P07-T002`.

## 5. Known pitfalls already paid for in earlier phases

- **Twelve FAQ categories is an exact count** (PUB-20). Assert the count in a test; do not leave it implicit.
- **CORS**: browser-side content and testimonial submissions depend on the existing middleware in `apps/mock-api/src/server.ts`.
- **Playwright strict mode**: repeated content blocks make ambiguous locators very likely on these pages; scope by section role or accessible name.
- **Docker schema drift**: `CREATE TABLE IF NOT EXISTS` does not add columns; recreate the Compose volume after a schema change.
- **`D01-P07-T002` and `D01-P07-T003` share parallel group `P07-B`** and own disjoint paths; they may run concurrently once the group frontier is `IN_PROGRESS`.

## 6. Boundaries

- Approval filtering, moderation state and content visibility are server-authoritative. The browser never decides whether content is publishable.
- Testimonial submissions persist as *pending* with consent recorded; never display an unapproved submission.
- Never render legacy server errors, internal paths or fabricated schedule data (PUB-29).
- Features never import `api-client/generated/**` or `http.ts`; routes never import services directly; `packages/ui` never imports a service. `corepack pnpm test:boundaries` enforces this.
- No app imports `apps/mock-api`, Prisma, Firebase, Firestore or Supabase.
- Do not modify `POC/**`; `git diff -- POC` must stay empty.
