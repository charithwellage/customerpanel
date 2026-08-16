# <Phase 2.12> Summary

## Outcome and supervisor demonstration

Phase 2.12 replaces the Customer application's demo-only stand-in identity with a real, server-enforced self-registration and authentication lifecycle. A visitor registers on the public website (name with initials, country, mobile number with a country-driven dial code, email, password and confirmation), is forwarded to the Customer application to sign in with those credentials, can change their password from the profile page, and can recover a forgotten password through a mock notification outbox. Every demo-mode affordance — the `POST /api/v1/auth/demo-session` endpoint, the public-web "Continue with Demo Customer Account" panel, the Customer app's cosmetic sign-in form, the shell's demo footer badge and placeholder user — has been removed from both applications and the shared packages, confirmed by a repository-wide sweep in this review.

Supervisor demonstration path: open the public website, use **Register** in the header, complete registration, follow the forward link to the Customer application sign-in (email pre-filled), sign in, open **Profile & Account**, change the password, sign out, sign back in with the new password, then use **Forgot password?** to complete a full reset cycle via the non-production outbox and sign in again.

## Completed tasks and delivered behavior

| Task | Delivered behavior |
|---|---|
| `D02-P12-T001` (reopened once) | Mock API `customer_accounts`/`password_reset_outbox` stores (both `MemoryStore` and `PostgresStore`), salted-`scrypt` credential hashing, `register`/`login`/`change-password`/`password-reset`/`password-reset/confirm`/`config/countries`/non-production `auth/__outbox` routes, removal of `demo-session`. Reopened after `D02-P12-T007` found newly registered accounts had no `CustomerProfile` row; fixed by auto-provisioning a blank profile on registration in both stores. |
| `D02-P12-T002` | Shared country/dial-code dataset (`packages/domain`), credential Zod schemas matching the server contract 1:1 (`packages/validation`), `AuthService`/`CountryService` (`packages/api-client`); demo-flavored token helpers renamed to non-demo names. |
| `D02-P12-T003` | public-web header replaces the Customer Portal/Demo Account pill with **Login** (secondary) and **Register** (primary) actions; new `/register` page with all six required fields and country-driven dial code. |
| `D02-P12-T004` | Demo-mode identity removed from public-web (account-entry, reservation flow, `/account` route, legacy renderer); reservation now requires a real session with an honest sign-in prompt. |
| `D02-P12-T005` | Customer application real credential sign-in, generic invalid-credential message (no account enumeration), full forgot-password/reset-confirm flow via the outbox, sign-out wiring, demo shell badge/placeholder removed. |
| `D02-P12-T006` | Customer profile page rebuilt with a working change-password form (wrong-current-password reported on that field, never as session expiry) and an honest account-security section; residual demo copy removed from payments/invoices. |
| `D02-P12-T007` | End-to-end journey, cross-account isolation, Docker container gate with a recreated `carchief-postgres-data` volume, full regression, `api:generate` zero-drift confirmation. |
| `D02-P12-CODE_REVIEW` | This review — full-diff sweep, deterministic gate, full-suite regression on a rebuilt runtime, live MCP confirmatory pass, `## Findings` recorded, **Result: PASS**. |

## Contracts and incremental mock capabilities

Seven new Mock API routes and one non-production diagnostic route (`GET /api/v1/auth/__outbox`); `GET /api/v1/auth/me` added to the OpenAPI document (previously undocumented). `packages/api-client/src/generated/schema.d.ts` regenerated from `openapi/openapi.json` with zero drift confirmed in this review. No live email, SMS, MFA or identity-provider integration is claimed anywhere in the shipped copy — the reset-request response and account-security copy were both verified live via MCP to be honestly hedged.

## Automated test evidence

- Root suite: 733/733 passed.
- `corepack pnpm quality` (lint + typecheck + `test:boundaries`): clean, 0 violations.
- Dependency-closure builds for every touched app/package: all OK.
- `corepack pnpm api:generate` → no diff against the committed generated schema.
- This phase's owned e2e specs (`register.spec.ts` + `customer/registration-login.spec.ts`), isolated: 9/9 passed.
- Full chromium e2e sweep against a freshly rebuilt runtime: 148/154 passed; the 6 remaining failures are pre-existing shared-state/parallel-contention classes (documented in `D02-P12-T004`/`T006`/`T007`'s own execution logs and re-confirmed independently in this review), none attributable to this phase's diff.
- `D02-P12-T007`'s own execution log records the full three-viewport Docker/Postgres container-gate regression.
- Live MCP walkthrough (this review): register → forward with pre-filled email → sign in → profile (the previously-blocked step, now confirmed working end to end) — 0 console errors.

## Decisions and approved deviations

- `D02-ASM-005` (password policy: 12–128 characters, at least one letter and one digit), `D02-ASM-006` (no email verification — accounts are usable immediately, honestly, with no fabricated "email sent" claim), `D02-ASM-007` (password reset via a deterministic mock outbox, neutral response regardless of whether the email exists) — all remain `ASSUMED`, reviewed and confirmed unchanged by every task and by this final review.
- `DEC-CUST-IDENTITY-RECOVERY` is unchanged: AutoPulse/Keycloak still owns production identity; this phase supplies a Keycloak-compatible mock credential path only.
- Two Claude Code sessions independently worked `D02-P12-T007` concurrently for part of its final resume; their evidence was merged append-only rather than one overwriting the other, `taskctl complete` was correctly run only once, and this review independently re-verified the resulting state is coherent (no duplicate/conflicting logic, clean `taskctl validate`, diff matches both lineages' claims).

## Known risks and deferred scope

- No live email/SMS delivery, MFA, CAPTCHA, signed JWTs, refresh-token rotation, or account deletion.
- Two non-blocking process findings recorded in `tasks/execution_logs/D02-P12-CODE_REVIEW.md`: (1) long-lived, heavily-reused local dev processes across a multi-session phase can produce misleading e2e failures against a stale runtime — always rebuild immediately before a review's own browser suite; (2) `freight-enquiry.spec.ts`, `enquiry-reservation.spec.ts` and `customer/payments.spec.ts` contain pre-existing, inherently racy shared-state tests that do not tolerate full `--workers=50%` parallelism — this has now recurred across three tasks and this review, and is worth a dedicated future infra fix rather than continued per-task workarounds.

## Next-phase prerequisites

- A named identity authority/contract for AutoPulse or Keycloak replacing the mock credential path.
- A decision on email verification if the business requires it before first sign-in (currently deliberately absent per `D02-ASM-006`).
- Consider a dedicated infra task to de-flake the shared-fixture e2e races noted above before Delivery 03 adds further parallel load to the same suite.

## Acceptance
- UAT owner/date:
- Independent technical reviewer/date:
- Phase branch: `feat_delivery02_phase_12`
- Pull request into delivery branch: base `delivery_02_customer_application`, comparing `delivery_02_customer_application...feat_delivery02_phase_12`
- Delivery-branch merge status/date:
- Blockers: None
