# D01-P02 — Phase 1.2 Home and showroom summary

## Outcome and supervisor demonstration

The original Phase 1.2 implementation tasks are complete. Phase acceptance has been extended with the late Playwright MCP infrastructure gate `INF-P00-T006` and corrective UI task `D01-P02-T003`; the phase PR review remains blocked until both are complete. The public website features a responsive home/showroom experience with market-aware vehicle collections (Latest Arrivals 5-day window, Premium Stock teaser, Clearance/Discounted stock, and ordered Browse Stock), 5-step sourcing process, client testimonials, FAQ previews, and WhatsApp contact intent.

Supervisor demo:

1. Start `npx pnpm --filter @carchief/public-web dev`.
2. Open `http://localhost:3000` and verify the home hero, market selector, Latest Arrivals, Premium teaser, 5-step sourcing process, testimonials, FAQ, and footer.
3. Switch market context (e.g. Uganda, Kenya, Tanzania) and observe market-aware stock collections update.
4. Verify Premium Stock banner & navigation menu link to `/inventory?category=premium` and WhatsApp contact link is present.

## Completed tasks and delivered behavior

Completed original tasks: `D01-P02-T001` and `D01-P02-T002`.

Remaining gates, in order:

1. `INF-P00-T006` — verify the active AI client's Playwright MCP tools.
2. `D01-P02-T003` — inspect and correct the Home/Showroom under both themes and all responsive sizes, then run automated Playwright Test.
3. `D01-P02-CODE_REVIEW` — manual PR/tech-lead approval gate.

- `D01-P02-T001`: Added OpenAPI vehicle query parameters, extended `VehicleSummary` public fields, updated `@carchief/domain`, extended `@carchief/api-client` `VehicleService`, implemented mock API collection projections (5-day Latest Arrivals, Premium teaser limit <= 10, Clearance/Discounted, location ordering, public field projection), and created reusable card/collection primitives in `@carchief/vehicle-search`.
- `D01-P02-T002`: Built public home showroom experience in `apps/public-web/src/features/home` and `apps/public-web/src/app/page.tsx`, integrated market controls, promotions countdown, buying process preview, testimonials, FAQ, Premium Stock banner & navigation, and added automated integration tests.

## Contracts and incremental mock capabilities

Phase 1.2 extended `/api/v1/vehicles` GET query parameters (`collection`, `market`, `category`, `limit`) and VehicleSummary public schema (`category`, `locationStatus`, `createdAt`, `images`, `featured`, `stockType`, `destinationPort`, `discountPercent`). Public field projection enforces stripping sensitive or internal fields (`internalNotes`, `staffOwnerId`). Legacy "New" tag is excluded.

## Automated test evidence

The results below are historical evidence from T001/T002. They do not satisfy the newly added Playwright MCP gate.

- `node tasks/scripts/taskctl.mjs validate` — passed for the task set available when T001/T002 completed. The current expanded task system validates 96 tasks separately.
- `npx pnpm api:generate` — generated `packages/api-client/src/generated/schema.d.ts`.
- `npx pnpm --filter @carchief/public-web test -- home` — passed.
- `npx pnpm test:contract` — passed (7 contract tests in `packages/api-client`).
- `npx pnpm lint` — passed across 14 workspace projects.
- `npx pnpm typecheck` — passed across 14 workspace projects.
- `npx pnpm -r build` — all workspace builds passed cleanly.
- `git diff -- POC` — empty.

## Decisions and approved deviations

- Market context is controlled via explicit parameter selection rather than browser IP lookup.
- Premium teaser returns up to 10 vehicles with honest empty/fewer results states.
- Browse stock ordering prioritizes In Port -> In Transit -> In Japan locations, then J stock -> CRFO stock.

## Known risks and deferred scope

- IP-based auto geo-detection is deferred to future backend service integration.
- Full inventory search/filter UI beyond category projections is owned by Phase 1.3.

## Next-phase prerequisites

- Complete `INF-P00-T006` and commit its task records manually.
- Complete `D01-P02-T003`, including MCP and automated browser PASS evidence, then commit the reviewed corrections manually.
- Human owner creates PR from `feat_delivery01_phase_02` into `delivery_01_public_website`.
- Tech lead completes manual review and approves `D01-P02-CODE_REVIEW`.
- Human owner merges PR and synchronizes `delivery_01_public_website`.
- Create `feat_delivery01_phase_03` from updated `delivery_01_public_website`.

## Acceptance

- UAT owner/date: Pending recorded supervisor demonstration
- AI phase review: Pending the new MCP and corrective UI gates
- Independent technical reviewer/date: Pending tech-lead PR review
- Phase branch: `feat_delivery01_phase_02`
- Pull request into delivery branch: Required
- Delivery-branch merge status/date: Not eligible until `D01-P02-CODE_REVIEW` is approved
- Blockers: `INF-P00-T006` and `D01-P02-T003` must complete before phase PR review
