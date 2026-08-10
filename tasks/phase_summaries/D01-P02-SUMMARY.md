# D01-P02 — Phase 1.2 Home and showroom summary

## Outcome and supervisor demonstration

Phase 1.2 implementation and validation tasks (`D01-P02-T001`, `D01-P02-T002`, `D01-P02-T003`, and `D01-P02-T004`) are COMPLETE. Playwright MCP infrastructure gate `INF-P00-T006` and UI validation gates `D01-P02-T003` and `D01-P02-T004` have passed with 100% green evidence across unit tests, lint, typecheck, monorepo build, and Playwright E2E browser tests across all required viewports (`390x844`, `768x1024`, `1440x900`) and themes (`carchief`, `ocean`). `D01-P02-T005` is the remaining corrective hygiene task; it must finish and be committed before the expanded mixed-PR code review begins.

Supervisor demo:

1. Start `npx pnpm --filter @carchief/public-web dev`.
2. Open `http://localhost:3000` and verify the home hero, market selector, Latest Arrivals, Premium teaser, 5-step sourcing process, testimonials, FAQ, and footer.
3. Switch market context (e.g. Uganda, Kenya, Tanzania) and observe market-aware stock collections update.
4. Verify Premium Stock banner & navigation menu link to `/inventory?category=premium` and WhatsApp contact link is present.

## Completed tasks and delivered behavior

- `D01-P02-T001`: Added OpenAPI vehicle query parameters, extended `VehicleSummary` public fields, updated `@carchief/domain`, extended `@carchief/api-client` `VehicleService`, implemented mock API collection projections (5-day Latest Arrivals, Premium teaser limit <= 10, Clearance/Discounted, location ordering, public field projection), and created reusable card/collection primitives in `@carchief/vehicle-search`.
- `D01-P02-T002`: Built public home showroom experience in `apps/public-web/src/features/home` and `apps/public-web/src/app/page.tsx`, integrated market controls, promotions countdown, buying process preview, testimonials, FAQ, Premium Stock banner & navigation, and added automated integration tests.
- `D01-P02-T003`: Aligned default `carchief` Home and Showroom experience with authoritative POC visual design reference `docs/evidence/phase0/phase0-public-landing.png` section-by-section (header, logo, green online status badge, skip link, dark photographic hero with red overlay and gradient accent buttons, 3-column value strip, status badges, and footer protocol line). Preserved `ocean` theme capability without duplicating application logic or introducing hardcoded colors.
- `D01-P02-T004`: Validated containerized Docker stack (`mock-api`, `postgres`, `public-web`) health endpoints and ran Playwright MCP UI walkthrough and automated browser test suite across 3 viewports (`390x844`, `768x1024`, `1440x900`) and both themes (`carchief`, `ocean`) with 100% PASS result.

## Contracts and incremental mock capabilities

Phase 1.2 extended `/api/v1/vehicles` GET query parameters (`collection`, `market`, `category`, `limit`) and VehicleSummary public schema (`category`, `locationStatus`, `createdAt`, `images`, `featured`, `stockType`, `destinationPort`, `discountPercent`). Public field projection enforces stripping sensitive or internal fields (`internalNotes`, `staffOwnerId`). Legacy "New" tag is excluded.

## Automated test evidence

- `node tasks/scripts/taskctl.mjs validate` — superseded by the 98-task mixed-PR task graph; rerun after `D01-P02-T005` is complete.
- `npx pnpm --filter @carchief/public-web test -- home` — passed (12/12 unit tests).
- `npx pnpm exec playwright test` — passed (18/18 E2E browser tests across Chromium, Mobile Chromium, and Tablet Chromium).
- `npx pnpm lint` — passed across 14 workspace projects.
- `npx pnpm typecheck` — passed across 14 workspace projects.
- `npx pnpm -r build` — all workspace package and Next.js static builds passed cleanly.
- `docker compose -f docker-compose.frontend.yml config / up -d / ps / healthz / reset` — passed cleanly.
- `git diff -- POC` — empty.

## Decisions and approved deviations

- Market context is controlled via explicit parameter selection rather than browser IP lookup.
- Premium teaser returns up to 10 vehicles with honest empty/fewer results states.
- Browse stock ordering prioritizes In Port -> In Transit -> In Japan locations, then J stock -> CRFO stock.

## Known risks and deferred scope

- IP-based auto geo-detection is deferred to future backend service integration.
- Full inventory search/filter UI beyond category projections is owned by Phase 1.3.

## Next-phase prerequisites

- Human owner creates PR from `feat_delivery01_phase_02` into `delivery_01_public_website`.
- Complete and commit `D01-P02-T005`, then run the expanded mixed-PR review and obtain tech-lead approval for `D01-P02-CODE_REVIEW`.
- Human owner merges PR and synchronizes `delivery_01_public_website`.
- Create `feat_delivery01_phase_03` from updated `delivery_01_public_website`.

## Acceptance

- UAT owner/date: Recorded supervisor demonstration passed
- AI phase review: pending `D01-P02-T005`; the review covers the full mixed range, including Delivery 02 planning artefacts.
- Independent technical reviewer/date: not started.
- Phase branch: `feat_delivery01_phase_02`
- Pull request into delivery branch: Ready for PR creation
- Delivery-branch merge status/date: Ready for PR review
- Blockers: None
