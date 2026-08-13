# Delivery 02 Focused Test Matrix

This matrix is authoritative for normal Delivery 02 task validation. It replaces generic workspace-wide test, lint, typecheck and recursive-build instructions copied into individual tasks. Each task adds tests only for its owned feature and runs its dependency-closure build. The complete regression remains a Phase 2.9/2.10 responsibility.

All Playwright commands run headlessly through `playwright.config.ts`, use `--workers=50%` unless a serial reset tag is named, and target only the listed Customer feature spec. A task that changes a Mock API route also runs its listed Mock API test and generated-client contract test.

| Task group | Focused validation |
|---|---|
| P2.1 gate and shell | `node tasks/scripts/taskctl.mjs validate`; `corepack pnpm --filter @carchief/customer-app... build`; `corepack pnpm exec vitest run apps/customer-app/src/features/shell`; `playwright test tests/e2e/customer/account-shell.spec.ts --project=chromium --project=mobile-chromium --project=tablet-chromium --workers=50%` |
| P2.1 identity/PWA | `corepack pnpm --filter @carchief/mock-api... build`; `corepack pnpm exec vitest run apps/mock-api/src/__tests__/customer-session.test.ts apps/customer-app/src/features/account`; `playwright test tests/e2e/customer/account-access.spec.ts --project=chromium --project=mobile-chromium --project=tablet-chromium --workers=50%`; container smoke only in T003 |
| P2.2 dashboard | `corepack pnpm --filter @carchief/mock-api... build`; `corepack pnpm exec vitest run apps/mock-api/src/__tests__/customer-dashboard.test.ts apps/customer-app/src/features/dashboard`; `corepack pnpm test:contract -- customer-dashboard`; `playwright test tests/e2e/customer/dashboard.spec.ts --project=chromium --project=mobile-chromium --project=tablet-chromium --workers=50%` |
| P2.3–P2.6 commerce | Run only the matching `customer-inventory`, `customer-vehicles`, `customer-invoices`, or `customer-payments` Mock API/client/component tests and `tests/e2e/customer/<feature>.spec.ts` across the three viewport projects. Use `--filter @carchief/mock-api... build` for API work and `--filter @carchief/customer-app... build` for UI-only work. |
| P2.7–P2.8 logistics/account | Run only the matching `customer-shipments`, `customer-documents`, `customer-notifications`, or `customer-profile` Mock API/client/component tests and corresponding Customer Playwright spec. Use serial reset only for a test explicitly tagged `@serial-reset`. |
| P2.1–P2.8 phase review | Review the exact PR diff; verify completed-task evidence; run `git diff --check`, `node tasks/scripts/taskctl.mjs validate`, `corepack pnpm test:boundaries`, and only test targets whose code changed after the recorded task evidence. Record `Focused suite result:`. |
| P2.9/P2.10 final acceptance | Full lint, typecheck, recursive build, security/privacy suite, complete Customer Docker golden journey, full Customer browser regression, and full viewport coverage. |
| P2.11 optional theme | Both `carchief` and `ocean` at phone, tablet and desktop, theme registry/unit tests, Customer theme Playwright suite, then focused Docker smoke. |

## Runtime policy

- Normal UI tasks reuse a known local runtime and record its identity. Recreate Docker only for phase acceptance, schema/reset/runtime changes, or a task that explicitly changes Docker.
- Fresh-runtime evidence remains required for a task marked `ui_validation: playwright_mcp`; a fresh process/container does not require a no-cache image build or a dependency reinstall.
- Never run `corepack pnpm test`, root lint, root typecheck, recursive build, `test:e2e`, or the container Playwright project from a normal feature task unless this matrix explicitly assigns it.

## Parallel safety

- Feature fixtures use their own namespace and unique customer/vehicle/payment IDs.
- Tests that call a shared reset endpoint declare `@serial-reset` and run with one worker; all other named specs remain parallel.
- Do not modify shared route registries, generated-client barrels, Mock API bootstrap, manifests, lockfiles, Docker files, shared theme packages, or shared vehicle packages from a lane task.
