# Phase 1.6 Context Pack — Enquiry, account and reservation entry

Read this file first. It carries the requirement text, decisions, code map and conventions the Phase 1.6 tasks need, so `REQUIREMENT.md` and `FRONT_END_ARCHITECTURE.md` only need to be opened for an item this pack marks unresolved.

## 1. Requirements in scope (verbatim from `REQUIREMENT.md`)

**PUB-13** A visitor can submit an enquiry about a specific vehicle, or a general enquiry, giving their name, email, phone number and a message.

**PUB-14** Before an enquiry is accepted, the system checks that the name, email and phone number are filled in correctly and sensibly — not just left for the visitor's own browser to catch.

**PUB-15** After sending an enquiry, the visitor sees a clear confirmation that it was received.

**PUB-16** An enquiry submitted here must reach the Sales App and appear in a salesperson's list of new leads. *(See RULE-08 — this must never fail silently.)*

**PUB-22** A visitor can begin the process of creating a customer account or signing in, from the Public App.

**PUB-23** If a visitor tries to reserve a vehicle without an account, they are told clearly what they need to do next, rather than the action silently failing.

**PUB-27 — Source-confirmed legacy route family:** A visitor can read approved auction services, calendar, terms, FAQ and buying guidance. Any Live Auction capability is account-gated or an approved external destination; auction-site access, bidding and data integration are not implied.

**PUB-28 — Source-confirmed contact pattern:** A visitor can use approved public contact actions, including vehicle/general enquiry and clearly labelled WhatsApp, email or call intent. The site must not claim a message, call, notification or external hand-off completed unless an approved service confirms it.

**PUB-34 — Confirmed by legacy business requirements:** A visitor can reach a Premium Stock page from both a clearly labelled home-page banner and the Premium Stock navigation item. The page shows a Premium Stock teaser of up to ten eligible vehicles, an honest empty/fewer-results state, a **Browse all Premium Stock** action that opens the full Premium Stock list with the Premium filter applied, a Premium Vehicle enquiry action, and a clearly labelled WhatsApp chat intent. The UI must not claim that a WhatsApp message was delivered unless an approved integration confirms it.

**RULE-05** A reservation holds a vehicle for 48 hours by default, and this period can be changed by an administrator.

**RULE-08** Whenever something is saved, edited, or deleted anywhere in the system, that change is reflected immediately and consistently everywhere it is shown. A save or delete must never appear to succeed while quietly not taking effect, and it must never take effect while the screen shows the old information as if nothing happened.

**RULE-09** When there is no data to show, the system shows an honest message saying so. It never fills the gap with a plausible-looking number that was not actually calculated from anything.

**RULE-10** The system never claims a capability it does not actually have. If a message tells the user something is happening automatically, securely, or successfully, that must be true.

## 2. Decisions

| Decision | Status | What Phase 1.6 does |
|---|---|---|
| `DEC-PUB-AUTH-BOUNDARY` | RESOLVED | Use stand-in JWT demo identities from `packages/domain/src/auth.ts`. Production identity is out of scope. Label demo mode as non-production in the UI. |
| `DEC-WF-TIMER-SEMANTICS` | RESOLVED | The 48-hour timer is the reservation hold: it prevents another customer reserving the vehicle, and expiry returns it to `Now On Sale`. |
| `DEC-PUB-RESERVATION-EXPIRY-ACTION` | OPEN | RULE-05 fixes the 48-hour default, but automatic versus manual release is unconfirmed. **Expose the expiry timestamp; never claim an automatic release happens.** |
| `DEC-PUB-PREMIUM-STOCK` | OPEN | Premium eligibility and WhatsApp behaviour unconfirmed. WhatsApp stays clearly labelled *contact intent*. |
| `DEC-WF-EXTERNAL-BOUNDARIES` | OPEN | Email/WhatsApp/ERP delivery is not implemented. Record notification *intent* only; never state a message was sent (RULE-10). |

## 3. Code map — what already exists

| Area | Path | Notes |
|---|---|---|
| Demo identities | `packages/domain/src/auth.ts` | `parseDemoJwtToken`, `JwtClaims`, `hasPermission` already exist and are wired into `apps/mock-api/src/server.ts`. Reuse them; do not add a second auth path. |
| Auth endpoint | `apps/mock-api/src/server.ts` | `GET /api/v1/auth/me` returns claims or 401. The bearer token is parsed by existing middleware. |
| Token plumbing | `packages/api-client/src/http.ts` | `HttpClient` already accepts `getAuthToken` and sets the `Authorization` header. Do not hand-roll it. |
| Mock store | `apps/mock-api/src/store.ts` | Add lead/enquiry and reservation persistence to the `DemoStore` interface plus both `MemoryStore` and `PostgresStore`. Reset must stay deterministic. |
| Validation schemas | `packages/validation/src/` | Server-side validation is authoritative (PUB-14). Browser-native validation alone is a known POC defect and is not acceptable. |
| Shared form primitives | `packages/ui/src/` | `InputField`, `Button`, `Dialog`, `ErrorAlert`, `EmptyState`, `StatusBadge` exist. Compose these; do not fork them per form. |
| Feature slices | `apps/public-web/src/features/<feature>/{components,hooks}` + `<feature>.css` | Existing pattern from Phases 1.2–1.5. |

## 4. Conventions the validation commands depend on

| Artefact | Required path |
|---|---|
| Enquiry mock tests | `apps/mock-api/src/__tests__/enquiries.test.ts` |
| Reservation mock tests | `apps/mock-api/src/__tests__/reservations.test.ts` |
| Enquiry UI tests | `apps/public-web/src/__tests__/enquiries.test.ts` |
| Account entry tests | `apps/public-web/src/__tests__/account-entry.test.ts` |
| End-to-end spec | `tests/e2e/enquiry-reservation.spec.ts` |
| Contract tests | `packages/api-client/src/__tests__/contract.test.ts` (extend) |

## 5. Known pitfalls already paid for in earlier phases

- **The POC disconnected-lead defect**: the POC wrote leads that were never readable back. `D01-P06-T001` must include an explicit regression proving a submitted enquiry is retrievable through the salesperson-facing service boundary.
- **CORS**: form posts from the browser depend on the existing middleware in `apps/mock-api/src/server.ts`.
- **Playwright strict mode**: a locator matching more than one element fails; prefer `getByRole` with an accessible name.
- **Double submit**: disable the control and guard server-side with an idempotency key — a disabled button alone is not protection.
- **Docker schema drift**: `CREATE TABLE IF NOT EXISTS` does not add columns; recreate the Compose volume after a schema change.

## 6. Boundaries

- Validation that affects integrity, authorization, and every state transition is server-authoritative. The browser never decides eligibility.
- Reservation creation is transactional: concurrent attempts on one vehicle must not both succeed.
- Features never import `api-client/generated/**` or `http.ts`; routes never import services directly; `packages/ui` never imports a service. `corepack pnpm test:boundaries` enforces this.
- No app imports `apps/mock-api`, Prisma, Firebase, Firestore or Supabase.
- Never claim an email, WhatsApp message, notification or staff hand-off occurred.
- Do not modify `POC/**`; `git diff -- POC` must stay empty.
