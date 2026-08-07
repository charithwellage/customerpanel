# CarChief POC — Runtime Validation Plan (Approved)

**Status:** Approved 2026-08-06. Awaiting execution once Playwright MCP is connected.
**Scope:** Public Website, Customer Application, Salesperson Application, super-admin capabilities reachable via the staff app.
**Approvals on record:**
- Browser tooling: Playwright MCP (session restart required to connect the server declared in `.mcp.json`).
- Source reading: **permitted** — `POC/src` may be read read-only to cross-check runtime findings and surface features not reachable through the UI. Nothing is to be modified.

---

## Pre-flight evidence (captured 2026-08-06, HTTP level, nothing mutated)

| Check | Result |
|---|---|
| `GET /healthz` | 200, body `ok` |
| `GET /` | 200, `text/html`, 2,726,269 B |
| `GET /customer/` | 200, `text/html`, 2,725,789 B |
| `GET /staff/` | 200, `text/html`, 2,727,463 B |
| `GET /__reset/` | 200, 2,110 B — inspected only, **not triggered** |
| Container | `carchief-poc-web-1` (`carchief-poc-web:local`), up, healthy, `127.0.0.1:8080->8080/tcp` |

### Findings that shape the plan

1. **`/__reset/` is purely client-side.** It clears `localStorage`, `sessionStorage`, Cache Storage and service-worker registrations, then redirects to `/?demoReset=1`. No server state is touched — the reset affects only the browser context that visits it.
2. **No application backend exists.** `/rest/v1/`, `/auth/v1/health` and all other paths return the identical 2.7 MB `index.html` via nginx SPA fallback. The bundle carries ~58 `localStorage` references and only 4 `fetch(` call sites. Persistence is browser-local.
3. **The only real server route is `/api/`, and it is down by design.** Returns `503` with `{"error":"Optional AI service is unavailable. Start the Compose ai profile with a valid Gemini API key."}` — an optional Gemini proxy, not core business logic.

Consequence: plan item 8 (frontend API calls) is expected to be largely a **negative finding to confirm**, not an API surface to map.

---

## Phase 0 — Baseline
Fresh browser context. Confirm whether `/`, `/customer/` and `/staff/` are three applications or one client-side router. Capture the initial `localStorage` seed as the demo-data baseline (key names and record counts only — no secrets). Record console errors and the full network waterfall per role. Screenshot each landing state.

## Phase 1 — Public website
Navigate every route reachable from the homepage. Vehicle/inventory browse, detail pages, search, filters, sort, pagination, enquiry and quote-request entry points. Probe empty states (filters matching nothing) and validation (empty submits, malformed email, out-of-range values). Establish what an unidentified visitor can reach.

## Phase 2 — Customer application
Identify the embedded test account and its seeded data. Exercise CRUD on every customer-owned entity found (profile, enquiries, saved vehicles, orders, documents). Walk the primary journey end-to-end — browse → configure → quote → payment → shipping → invoice — recording every calculated figure (subtotal, duty/tax, shipping, discounts, totals, currency handling, rounding) with a screenshot at each computation step. Test validation and error states on each form.

## Phase 3 — Salesperson application
Same treatment for `/staff/`: work queues, lead/enquiry lists, quote creation and editing, pricing overrides, status transitions, document generation. Exercise search, filter, sort and pagination on every list view. Record the complete status-lifecycle vocabulary. Identify any super-admin capability.

## Phase 4 — Handoffs
Create a record as the customer, then verify or disprove that it surfaces to staff, and that a staff-side status change propagates back. Because persistence is browser-local, explicitly test cross-context visibility — whether staff and customer share one storage origin or are effectively isolated. This is a likely gap; evidence it either way.

## Phase 5 — Role and permission boundaries
Attempt to reach `/staff/` routes from a customer context and vice-versa. Test direct-URL access to records not owned by the active account. Record whether boundaries are enforced, cosmetic, or absent.

## Phase 6 — API and network evidence
Capture all outbound requests per journey. Confirm the effect of the `/api/` 503 on any AI-dependent feature. Document inferred request and response shapes for the 4 `fetch(` call sites.

---

## Safety commitments

- All test records prefixed `ZZTEST-` and logged to the evidence register with timestamps.
- No delete executed without showing the exact record and obtaining confirmation first.
- `/__reset/` not triggered without explicit approval.
- No modification to application source, Docker files, Supabase configuration, or business logic.
- No secrets, tokens, passwords or connection strings transcribed into any report — key names and redacted shapes only.
- Local Docker POC only; no production systems or credentials.

## Deliverables

- `docs/CarChief-POC-Runtime-Validation-Report.md`
- `docs/CarChief-POC-Feature-and-Journey-Gap-Report.md`
- `docs/CarChief-Requirements-Baseline.md`
- `docs/CarChief-POC-Feature-Evidence-Register.md`
- Proposed roadmap corrections, stated separately. **`docs/CarChief-Frontend-Implementation-Roadmap.md` is not to be edited.**
