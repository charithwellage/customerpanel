# Phase 2.5 — Quotes and Invoices Summary

## Completed Tasks

1. **D02-P05-T001 — Add customer PI and invoice contracts with linked printable fixtures**
   - Added `/api/v1/customer/invoices`, `/api/v1/customer/invoices/{id}`, and `/api/v1/customer/invoices/{id}/document` operations to OpenAPI specification and generated client types.
   - Implemented `calculateInvoiceBalance` and customer invoice domain interfaces (`CustomerInvoiceSummary`, `CustomerInvoiceDetail`, `CustomerInvoiceDocument`, `CustomerInvoiceListResponse`) in `@carchief/domain`.
   - Created typed `CustomerInvoiceService` in `@carchief/api-client`.
   - Implemented server-authoritative projections in `apps/mock-api/src/store.ts` (`MemoryStore` and `PostgresStore`) combining proforma invoices, commercial invoices, TT allocations, vehicles, and documents.
   - Enforced strict customer scope isolation (RULE-04), 72-hour payment deadline projection, 50% deposit rule (RULE-07), and IDOR protection (returning 404).
   - Added 13 mock API contract tests in `apps/mock-api/src/__tests__/customer-invoices.test.ts` and 4 client service contract tests in `packages/api-client/src/__tests__/contract.test.ts`.

2. **D02-P05-T002 — Build customer quote and invoice lists, details and print presentation**
   - Implemented React Query hooks: `useCustomerInvoices`, `useCustomerInvoiceDetail`, and `useCustomerInvoiceDocument`.
   - Built `CustomerInvoicesPage` with KPI summary cards (`Total Invoiced`, `Total Paid`, `Outstanding Balance`), tabs (`All Invoices`, `Proforma Invoices`, `Commercial Invoices`), search, status dropdown filters, and responsive grid.
   - Built `CustomerInvoiceDetailPage` with header, 72-hour payment deadline banner (RULE-07), itemized charges table, payment allocations table, bank wire transfer instructions card, and printable projection modal.
   - Created reusable components: `InvoiceSummaryKpiCards`, `InvoiceCard`, `BankWireInstructionsCard`, `InvoiceLineItemsTable`, `PaymentAllocationsTable`, `PrintableInvoiceModal`.
   - Built `invoices.css` adhering strictly to `COMMON_FRONTEND_RULES.md` using semantic design tokens with 0 static inline style violations and print stylesheet support.
   - Wired routes `/invoices` and `/invoices/:id` into `apps/customer-app/src/app/App.tsx`.
   - Added 11 component/unit tests in `apps/customer-app/src/features/invoices/__tests__/invoices.test.ts`.

3. **D02-P05-T003 — Accept invoice reconciliation, authorization and historical stability**
   - Created Playwright E2E test suite `tests/e2e/customer/invoices.spec.ts` covering invoice listing, KPI cards, PI vs Commercial scoping (RULE-08), search, commercial invoice detail, line items table, allocations table, bank wire card, printable modal projection, and proforma 72h deadline & 50% deposit banner (RULE-07).
   - Recreated and verified containerized runtime stack (`customer-app`, `mock-api`, `postgres`) with Docker Compose.
   - Executed Playwright E2E tests across all 3 viewports (`chromium`, `mobile-chromium`, `tablet-chromium`) with 100% pass rate (12/12 passed).

## Test and Build Verification

- `node tasks/scripts/taskctl.mjs validate` — PASS (119 task/gate files validated)
- `pnpm test:boundaries` — PASS (0 boundary violations)
- `git diff --check` — PASS
- `pnpm --filter @carchief/customer-app... build` — PASS
- `pnpm --filter @carchief/mock-api... build` — PASS
- `pnpm exec vitest run apps/customer-app/src/features/invoices/__tests__/invoices.test.ts apps/mock-api/src/__tests__/customer-invoices.test.ts packages/api-client/src/__tests__/contract.test.ts` — PASS (74/74 unit & contract tests passed)
- `pnpm exec playwright test tests/e2e/customer/invoices.spec.ts --project=chromium --project=mobile-chromium --project=tablet-chromium` — PASS (12/12 E2E tests passed across all 3 viewports)

## Handoff & Next Phase

Phase 2.5 implementation is complete and ready for phase code review `D02-P05-CODE_REVIEW`.
