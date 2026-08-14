# Phase 2.3 — Customer showroom and vehicle search Summary

## Completed Tasks

1. **D02-P03-T001 — Extend vehicle and reservation endpoints for customer showroom access**
   - Added customer vehicle projection, tier pricing (`calculateTierPricing`, `TIER_DISCOUNTS`), 48-hour transactional hold conflict detection, deterministic expiry, draft/internal field privacy in `@carchief/domain`, `@carchief/api-client`, `openapi/openapi.json`, and `apps/mock-api`.
   - Added 12 contract tests in `apps/mock-api/src/__tests__/customer-inventory.test.ts` verifying customer vehicle projection, tier discount computation (Platinum 15%, Gold 10%, Silver 5%, Standard 0%), 48h reservation creation, hold conflict isolation, and private field scrubbing.

2. **D02-P03-T002 — Integrate shared vehicle search and detail for the customer audience**
   - Reused shared feature packages `packages/vehicle-search` and `packages/vehicle-detail` without forking cards or galleries.
   - Built `apps/customer-app/src/features/inventory` with full stock search, tier status banner, filter bar, detail view, gallery, technical specifications, and live 48-hour reservation workflow.
   - Enhanced `VehicleCardPrimitive` to cleanly render tier discounts, original strike-through prices, request price labels, and reservation status badges (`YOUR HOLD` / `RESERVED`).
   - Integrated routes `/inventory` and `/inventory/:slug` with browser history `popstate` synchronization in `CustomerShellProvider`.

3. **D02-P03-T003 — Add customer reservation actions and showroom acceptance**
   - Implemented offline-blocked mutation protection and price-on-request quotation submission routing.
   - Added containerized verification with Docker Compose (`customer-app`, `mock-api`, `postgres`).
   - Added and executed Playwright E2E test suite `tests/e2e/customer/inventory.spec.ts` covering inventory browsing, tier pricing display, 48-hour reservation holds, and back navigation across chromium, mobile-chromium, and tablet-chromium.

## Test and Build Verification

- `node tasks/scripts/taskctl.mjs validate` — PASS
- `pnpm --filter @carchief/customer-app... build` — PASS
- `pnpm --filter @carchief/mock-api... build` — PASS
- `pnpm exec vitest run apps/customer-app/src/features/ apps/mock-api/src/__tests__/customer-inventory.test.ts` — PASS (43/43 tests passed)
- `pnpm exec playwright test tests/e2e/customer/ --project=chromium --project=mobile-chromium --project=tablet-chromium` — PASS (24/24 E2E tests passed across all 3 viewports)

## Handoff & Next Phase

Phase 2.3 implementation is complete and ready for phase code review `D02-P03-CODE_REVIEW`.
