# CarChief Task Execution Order

Scope: Phase 0 plus Delivery 01 Public Website only. The immutable delivery sequence is infrastructure → phases 1.1 through 1.8. Customer and Salesperson tasks are intentionally absent; complete public SEO is included in Phase 1.8.

The BA workflow reconciliation backlog is tracked separately under `tasks/workflow/`. It becomes eligible only after the listed decision gates are resolved and the Customer/Salesperson application task sets are generated from the approved workflow contract.

## Branch sequence

After the task system and Phase 0 records are committed on `planning`, create `delivery/01-public` from `planning` once. Phase 0 itself is branch-neutral. Public phases use `feat_delivery01_phase_01` through `feat_delivery01_phase_08`. Each phase starts from `delivery/01-public` only after the previous phase PR is merged and `git pull --ff-only origin delivery/01-public` succeeds. Parallel child branches start from the phase branch and merge back only after independent approval.

Before any task or Git branch command, run:

```bash
git status --porcelain=v1 --untracked-files=all
```

Any output is a blocker. Ask the user to commit the changes first, report `No implementation started`, and do not create/switch branches or update task state.

## Phase and parallel-lane overview

| Phase | Phase branch | Task files | Lane sequence |
|---|---|---|---|
| Infrastructure | Branch-neutral | [INF-P00-T001](infra_check/INF-P00-T001.md), [INF-P00-T002](infra_check/INF-P00-T002.md), [INF-P00-T003](infra_check/INF-P00-T003.md), [INF-P00-T004](infra_check/INF-P00-T004.md), [INF-P00-T005](infra_check/INF-P00-T005.md) | INF-A → INF-B → INF-C |
| 1.1 — Shared foundation and public shell | `feat_delivery01_phase_01` | [D01-P01-T001](delivery_01/phase_01/D01-P01-T001.md), [D01-P01-T002](delivery_01/phase_01/D01-P01-T002.md), [D01-P01-T003](delivery_01/phase_01/D01-P01-T003.md), [D01-P01-T004](delivery_01/phase_01/D01-P01-T004.md), [D01-P01-T005](delivery_01/phase_01/D01-P01-T005.md), [D01-P01-T006](delivery_01/phase_01/D01-P01-T006.md), [D01-P01-T007](delivery_01/phase_01/D01-P01-T007.md), [D01-P01-T008](delivery_01/phase_01/D01-P01-T008.md), [D01-P01-T009](delivery_01/phase_01/D01-P01-T009.md), [D01-P01-T010](delivery_01/phase_01/D01-P01-T010.md) | P01-A → P01-B → P01-C → P01-D → P01-E → P01-F → P01-G |
| 1.2 — Home and showroom | `feat_delivery01_phase_02` | [D01-P02-T001](delivery_01/phase_02/D01-P02-T001.md), [D01-P02-T002](delivery_01/phase_02/D01-P02-T002.md) | P02-A → P02-B |
| 1.3 — Inventory and search | `feat_delivery01_phase_03` | [D01-P03-T001](delivery_01/phase_03/D01-P03-T001.md), [D01-P03-T002](delivery_01/phase_03/D01-P03-T002.md), [D01-P03-T003](delivery_01/phase_03/D01-P03-T003.md), [D01-P03-T004](delivery_01/phase_03/D01-P03-T004.md) | P03-A → P03-B → P03-C |
| 1.4 — Vehicle details | `feat_delivery01_phase_04` | [D01-P04-T001](delivery_01/phase_04/D01-P04-T001.md), [D01-P04-T002](delivery_01/phase_04/D01-P04-T002.md), [D01-P04-T003](delivery_01/phase_04/D01-P04-T003.md) | P04-A → P04-B → P04-C |
| 1.5 — Freight estimate and quotation enquiry | `feat_delivery01_phase_05` | [D01-P05-G001](delivery_01/phase_05/D01-P05-G001.md), [D01-P05-T001](delivery_01/phase_05/D01-P05-T001.md), [D01-P05-T002](delivery_01/phase_05/D01-P05-T002.md), [D01-P05-T003](delivery_01/phase_05/D01-P05-T003.md), [D01-P05-T004](delivery_01/phase_05/D01-P05-T004.md) | P05-GATE → P05-A → P05-B → P05-C → P05-D |
| 1.6 — Enquiry, account and reservation entry | `feat_delivery01_phase_06` | [D01-P06-T001](delivery_01/phase_06/D01-P06-T001.md), [D01-P06-T002](delivery_01/phase_06/D01-P06-T002.md), [D01-P06-T003](delivery_01/phase_06/D01-P06-T003.md), [D01-P06-T004](delivery_01/phase_06/D01-P06-T004.md), [D01-P06-T005](delivery_01/phase_06/D01-P06-T005.md) | P06-A → P06-B → P06-C → P06-D |
| 1.7 — Public information and content | `feat_delivery01_phase_07` | [D01-P07-T001](delivery_01/phase_07/D01-P07-T001.md), [D01-P07-T002](delivery_01/phase_07/D01-P07-T002.md), [D01-P07-T003](delivery_01/phase_07/D01-P07-T003.md), [D01-P07-T004](delivery_01/phase_07/D01-P07-T004.md) | P07-A → P07-B → P07-C |
| 1.8 — Public SEO, acceptance and release readiness | `feat_delivery01_phase_08` | [D01-P08-T001](delivery_01/phase_08/D01-P08-T001.md), [D01-P08-T002](delivery_01/phase_08/D01-P08-T002.md), [D01-P08-T003](delivery_01/phase_08/D01-P08-T003.md), [D01-P08-T004](delivery_01/phase_08/D01-P08-T004.md) | P08-A → P08-B |

Parallel group labels that match may run together only when their dependencies are COMPLETE and developers confirm non-overlapping owned paths. A later group never starts merely because an earlier task is IN_REVIEW.

## Verification policy

Every implementation task runs its feature-specific unit, integration, contract and UI tests, followed by `corepack pnpm lint`, `corepack pnpm typecheck` and `corepack pnpm -r build`. The execution log must record the exact commands, results and any compiler/build errors.

The required Docker gates are `D01-P01-T010` and the final acceptance task of each phase (`D01-P02-T002`, `D01-P03-T004`, `D01-P04-T003`, `D01-P05-T004`, `D01-P06-T005`, `D01-P07-T004`, `D01-P08-T004`). Each gate rebuilds and starts the target Compose stack, runs container-targeted Playwright tests, completes its manual supervisor UI smoke scenario, records evidence, and shuts the stack down. Small component tasks do not redeploy Docker individually; their phase gate catches integration and runtime issues.

The target commands use `docker/docker-compose.yml` with `docker/docker-compose.dev.yml` from `FRONT_END_ARCHITECTURE.md`. They are separate from the existing compiled-POC `docker-compose.poc.yml` and do not replace it.

## Capacity baseline

The implementation tasks total **23 delivery days** before allowance: Phase 1.1 8.5 days, Phase 1.2 1 day, Phase 1.3 2.5 days, Phase 1.4 2 days, Phase 1.5 2 days, Phase 1.6 1.5 days, Phase 1.7 1 day and Phase 1.8 4.5 days. The **3-day Public Website correction/SEO allowance** preserves the implementation plan's **26-working-day Public Website baseline**. Phase 0 is a separate 1.25-day readiness capacity and may be parallelized as shown.

## Complete ordered inventory

| Order | ID | Outcome | Dependencies | Parallel group | Estimate |
|---:|---|---|---|---|---:|
| 1 | [INF-P00-T001](infra_check/INF-P00-T001.md) | Verify governing documents, evidence inventory, repository integrity and source boundaries | None | INF-A | 0.25 day |
| 2 | [INF-P00-T002](infra_check/INF-P00-T002.md) | Verify developer tooling, ports and capacity | None | INF-A | 0.25 day |
| 3 | [INF-P00-T003](infra_check/INF-P00-T003.md) | Verify compiled POC routes, reset and screenshots read-only | INF-P00-T001, INF-P00-T002 | INF-B | 0.25 day |
| 4 | [INF-P00-T004](infra_check/INF-P00-T004.md) | Verify target-workspace readiness, secrets and architecture prerequisites | INF-P00-T001, INF-P00-T002 | INF-B | 0.25 day |
| 5 | [INF-P00-T005](infra_check/INF-P00-T005.md) | Produce Phase 0 readiness result | INF-P00-T003, INF-P00-T004 | INF-C | 0.25 day |
| 6 | [D01-P01-T001](delivery_01/phase_01/D01-P01-T001.md) | Bootstrap the pnpm workspace, runtime pins and application/package skeletons | INF-P00-T005 | P01-A | 0.75 day |
| 7 | [D01-P01-T002](delivery_01/phase_01/D01-P01-T002.md) | Add strict TypeScript, quality and boundary guardrails | D01-P01-T001 | P01-B | 0.75 day |
| 8 | [D01-P01-T003](delivery_01/phase_01/D01-P01-T003.md) | Establish automated testing foundations | D01-P01-T001 | P01-B | 0.75 day |
| 9 | [D01-P01-T004](delivery_01/phase_01/D01-P01-T004.md) | Establish OpenAPI, generated client and HTTP boundary | D01-P01-T002, D01-P01-T003, D01-P01-T007 | P01-C | 0.75 day |
| 10 | [D01-P01-T005](delivery_01/phase_01/D01-P01-T005.md) | Build mock API, PostgreSQL foundation and deterministic reset | D01-P01-T003, D01-P01-T004 | P01-D | 1.25 days |
| 11 | [D01-P01-T006](delivery_01/phase_01/D01-P01-T006.md) | Add stand-in JWT identities, roles and enforcement | D01-P01-T005 | P01-E | 0.75 day |
| 12 | [D01-P01-T007](delivery_01/phase_01/D01-P01-T007.md) | Build semantic theme and runtime theme infrastructure | D01-P01-T001 | P01-B | 0.5 day |
| 13 | [D01-P01-T008](delivery_01/phase_01/D01-P01-T008.md) | Build shared controls and application feedback primitives | D01-P01-T002, D01-P01-T003, D01-P01-T007 | P01-C | 0.75 day |
| 14 | [D01-P01-T009](delivery_01/phase_01/D01-P01-T009.md) | Build the Next.js public shell and navigation | D01-P01-T006, D01-P01-T008 | P01-F | 1 day |
| 15 | [D01-P01-T010](delivery_01/phase_01/D01-P01-T010.md) | Complete containers, CI guardrails and Phase 1.1 acceptance | D01-P01-T009 | P01-G | 1.25 days |
| 16 | [D01-P02-T001](delivery_01/phase_02/D01-P02-T001.md) | Add featured vehicle services and reusable vehicle collections | D01-P01-T010 | P02-A | 0.5 day |
| 17 | [D01-P02-T002](delivery_01/phase_02/D01-P02-T002.md) | Build and accept the home/showroom experience | D01-P02-T001 | P02-B | 0.5 day |
| 18 | [D01-P03-T001](delivery_01/phase_03/D01-P03-T001.md) | Add vehicle query, dynamic filters, sorting and pagination | D01-P02-T002 | P03-A | 0.75 day |
| 19 | [D01-P03-T002](delivery_01/phase_03/D01-P03-T002.md) | Build search orchestration, URL state and natural parsing | D01-P03-T001 | P03-B | 0.75 day |
| 20 | [D01-P03-T003](delivery_01/phase_03/D01-P03-T003.md) | Build inventory filters and result presentations | D01-P03-T001 | P03-B | 0.5 day |
| 21 | [D01-P03-T004](delivery_01/phase_03/D01-P03-T004.md) | Integrate and accept inventory search | D01-P03-T002, D01-P03-T003 | P03-C | 0.5 day |
| 22 | [D01-P04-T001](delivery_01/phase_04/D01-P04-T001.md) | Add vehicle detail and public media service behavior | D01-P03-T004 | P04-A | 0.75 day |
| 23 | [D01-P04-T002](delivery_01/phase_04/D01-P04-T002.md) | Build vehicle detail page and gallery | D01-P04-T001 | P04-B | 0.75 day |
| 24 | [D01-P04-T003](delivery_01/phase_04/D01-P04-T003.md) | Add sharing, printing, metadata and detail acceptance | D01-P04-T002 | P04-C | 0.5 day |
| 25 | [D01-P05-G001](delivery_01/phase_05/D01-P05-G001.md) | Approve freight and city-delivery calculation decisions | D01-P04-T003 | P05-GATE | 0.25 day |
| 26 | [D01-P05-T001](delivery_01/phase_05/D01-P05-T001.md) | Add destinations, rates and freight estimate services | D01-P05-G001 | P05-A | 0.5 day |
| 27 | [D01-P05-T002](delivery_01/phase_05/D01-P05-T002.md) | Implement approved freight calculations | D01-P05-T001 | P05-B | 0.5 day |
| 28 | [D01-P05-T003](delivery_01/phase_05/D01-P05-T003.md) | Build freight estimate selection and explanation UI | D01-P05-T002 | P05-C | 0.5 day |
| 29 | [D01-P05-T004](delivery_01/phase_05/D01-P05-T004.md) | Add freight quotation enquiry and accept the phase | D01-P05-T003 | P05-D | 0.25 day |
| 30 | [D01-P06-T001](delivery_01/phase_06/D01-P06-T001.md) | Add lead and enquiry contracts with persistent mock behavior | D01-P05-T004 | P06-A | 0.5 day |
| 31 | [D01-P06-T002](delivery_01/phase_06/D01-P06-T002.md) | Build accessible contact and vehicle enquiry forms | D01-P06-T001 | P06-B | 0.25 day |
| 32 | [D01-P06-T003](delivery_01/phase_06/D01-P06-T003.md) | Build account entry and unauthenticated reservation guidance | D01-P06-T001 | P06-B | 0.25 day |
| 33 | [D01-P06-T004](delivery_01/phase_06/D01-P06-T004.md) | Add transactional reservation eligibility and hold behavior | D01-P06-T001 | P06-C | 0.25 day |
| 34 | [D01-P06-T005](delivery_01/phase_06/D01-P06-T005.md) | Build reservation UI and accept enquiry/reservation journeys | D01-P06-T002, D01-P06-T003, D01-P06-T004 | P06-D | 0.25 day |
| 35 | [D01-P07-T001](delivery_01/phase_07/D01-P07-T001.md) | Add public content, FAQ and testimonial services | D01-P06-T005 | P07-A | 0.25 day |
| 36 | [D01-P07-T002](delivery_01/phase_07/D01-P07-T002.md) | Build About, How to Buy and Contact information pages | D01-P07-T001 | P07-B | 0.25 day |
| 37 | [D01-P07-T003](delivery_01/phase_07/D01-P07-T003.md) | Build testimonial display and moderated submission | D01-P07-T001 | P07-B | 0.25 day |
| 38 | [D01-P07-T004](delivery_01/phase_07/D01-P07-T004.md) | Build FAQ browsing/search and accept public content | D01-P07-T002, D01-P07-T003 | P07-C | 0.25 day |
| 39 | [D01-P08-T001](delivery_01/phase_08/D01-P08-T001.md) | Complete public SEO policy and visitor regression | D01-P07-T004 | P08-A | 1 day |
| 40 | [D01-P08-T002](delivery_01/phase_08/D01-P08-T002.md) | Complete data projection, privacy and production-safety checks | D01-P07-T004 | P08-A | 0.75 day |
| 41 | [D01-P08-T003](delivery_01/phase_08/D01-P08-T003.md) | Complete accessibility, browser and performance acceptance | D01-P07-T004 | P08-A | 1.25 days |
| 42 | [D01-P08-T004](delivery_01/phase_08/D01-P08-T004.md) | Produce Public Website UAT and Delivery 1 handoff | D01-P08-T001, D01-P08-T002, D01-P08-T003 | P08-B | 1.5 days |

## Merge and continuation protocol

1. Complete and independently approve child tasks.
2. Merge approved child branches into the matching `feat_delivery01_phase_NN` branch only when authorized.
3. Regenerate `TASK_EXECUTION_TRACKER.md`, run phase-wide quality commands, and complete the final acceptance task and phase summary.
4. Commit all remaining phase changes and verify the phase branch is clean.
5. Push the phase branch and create a PR targeting `delivery/01-public` when remote operations are authorized. Do not merge it automatically.
6. After the PR is merged, run `git switch delivery/01-public` and `git pull --ff-only origin delivery/01-public`.
7. Verify the working tree is clean, then create `feat_delivery01_phase_<next-NN>` from the updated delivery branch.

If a dependency, decision or baseline fails, record `BLOCKED` and **No implementation started**. Do not work around the graph by copying unfinished code.

## BA workflow follow-on order

After the workflow decisions in `tasks/DECISION_REGISTER.md` are resolved, execute the supplemental tasks in this order:

1. `WF-T001` — workflow contract and status vocabulary.
2. `WF-T006` and `WF-T007` may run in parallel after `WF-T001` because import/publication fixtures and external-boundary records have separate ownership.
3. `WF-T003` and `WF-T004` may run in parallel after `WF-T001` where negotiation/PI and finance paths have non-overlapping files.
4. `WF-T002` starts after `WF-T001` and the Customer foundation; it consumes the approved projections from the workflow contract.
5. `WF-T005` starts after `WF-T001` and the Salesperson/Customer foundations.
6. `WF-T008` is the final golden-journey gate after all seven preceding tasks are COMPLETE.

These tasks do not authorize live VBMS, NetSuite, auction, bank, email, WhatsApp or ERP integrations. Those require separate management approval and later integration tasks.
