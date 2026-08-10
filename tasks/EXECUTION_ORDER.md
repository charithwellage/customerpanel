# CarChief Task Execution Order

Scope: Phase 0 plus Delivery 01 Public Website only. The immutable delivery sequence is infrastructure → phases 1.1 through 1.8. Customer and Salesperson tasks are intentionally absent; complete public SEO is included in Phase 1.8.

Execution is sequential by default. A normal implementation task uses `self_ai` review: implementation → AI review/fixes → tests → `COMPLETE`. Each phase ends with one `phase_manual` code-review task. That task reviews only its phase branch PR against `delivery_01_public_website`; a tech lead performs the only required manual code review before the PR can merge.

Task agents never run `git commit`, `git push`, create pull requests, merge, rewrite history or self-approve. The human owner performs those Git operations manually.

## Branch sequence

Phase 0 is branch-neutral. Every Delivery 01 phase uses `feat_delivery01_phase_NN`, created from the current `delivery_01_public_website` branch. After every normal phase task is COMPLETE, the human owner commits the phase work and creates or updates a PR targeting `delivery_01_public_website`. The matching phase code-review task records AI review, awaits tech-lead approval, and becomes COMPLETE before the human merges the PR.

## Phase review gates

| Phase | Phase branch | Task files | Lane sequence | Manual PR gate |
|---|---|---|---|---|
| Infrastructure | Branch-neutral | [INF-P00-T001](infra_check/INF-P00-T001.md), [INF-P00-T002](infra_check/INF-P00-T002.md), [INF-P00-T003](infra_check/INF-P00-T003.md), [INF-P00-T004](infra_check/INF-P00-T004.md), [INF-P00-T005](infra_check/INF-P00-T005.md) | INF-A → INF-B → INF-C | None |
| Phase 1.1 — Shared foundation and public shell | `feat_delivery01_phase_01` | [D01-P01-T001](delivery_01/phase_01/D01-P01-T001.md), [D01-P01-T002](delivery_01/phase_01/D01-P01-T002.md), [D01-P01-T003](delivery_01/phase_01/D01-P01-T003.md), [D01-P01-T004](delivery_01/phase_01/D01-P01-T004.md), [D01-P01-T005](delivery_01/phase_01/D01-P01-T005.md), [D01-P01-T006](delivery_01/phase_01/D01-P01-T006.md), [D01-P01-T007](delivery_01/phase_01/D01-P01-T007.md), [D01-P01-T008](delivery_01/phase_01/D01-P01-T008.md), [D01-P01-T009](delivery_01/phase_01/D01-P01-T009.md), [D01-P01-T010](delivery_01/phase_01/D01-P01-T010.md), [D01-P01-T011](delivery_01/phase_01/D01-P01-T011.md), [D01-P01-T012](delivery_01/phase_01/D01-P01-T012.md), [D01-P01-CODE_REVIEW](delivery_01/phase_01/D01-P01-CODE_REVIEW.md) | P01-A → P01-B → P01-C → P01-D → P01-E → P01-F → P01-G → P01-H → P01-I → P01-REVIEW | D01-P01-CODE_REVIEW is the tech-lead PR gate |
| Phase 1.2 — Home and showroom | `feat_delivery01_phase_02` | [D01-P02-T001](delivery_01/phase_02/D01-P02-T001.md), [D01-P02-T002](delivery_01/phase_02/D01-P02-T002.md), [D01-P02-CODE_REVIEW](delivery_01/phase_02/D01-P02-CODE_REVIEW.md) | P02-A → P02-B → P02-REVIEW | D01-P02-CODE_REVIEW is the tech-lead PR gate |
| Phase 1.3 — Inventory and search | `feat_delivery01_phase_03` | [D01-P03-T001](delivery_01/phase_03/D01-P03-T001.md), [D01-P03-T002](delivery_01/phase_03/D01-P03-T002.md), [D01-P03-T003](delivery_01/phase_03/D01-P03-T003.md), [D01-P03-T004](delivery_01/phase_03/D01-P03-T004.md), [D01-P03-CODE_REVIEW](delivery_01/phase_03/D01-P03-CODE_REVIEW.md) | P03-A → P03-B → P03-C → P03-REVIEW | D01-P03-CODE_REVIEW is the tech-lead PR gate |
| Phase 1.4 — Vehicle details | `feat_delivery01_phase_04` | [D01-P04-T001](delivery_01/phase_04/D01-P04-T001.md), [D01-P04-T002](delivery_01/phase_04/D01-P04-T002.md), [D01-P04-T003](delivery_01/phase_04/D01-P04-T003.md), [D01-P04-CODE_REVIEW](delivery_01/phase_04/D01-P04-CODE_REVIEW.md) | P04-A → P04-B → P04-C → P04-REVIEW | D01-P04-CODE_REVIEW is the tech-lead PR gate |
| Phase 1.5 — Freight estimate and quotation enquiry | `feat_delivery01_phase_05` | [D01-P05-G001](delivery_01/phase_05/D01-P05-G001.md), [D01-P05-T001](delivery_01/phase_05/D01-P05-T001.md), [D01-P05-T002](delivery_01/phase_05/D01-P05-T002.md), [D01-P05-T003](delivery_01/phase_05/D01-P05-T003.md), [D01-P05-T004](delivery_01/phase_05/D01-P05-T004.md), [D01-P05-CODE_REVIEW](delivery_01/phase_05/D01-P05-CODE_REVIEW.md) | P05-GATE → P05-A → P05-B → P05-C → P05-D → P05-REVIEW | D01-P05-CODE_REVIEW is the tech-lead PR gate |
| Phase 1.6 — Enquiry, account and reservation entry | `feat_delivery01_phase_06` | [D01-P06-T001](delivery_01/phase_06/D01-P06-T001.md), [D01-P06-T002](delivery_01/phase_06/D01-P06-T002.md), [D01-P06-T003](delivery_01/phase_06/D01-P06-T003.md), [D01-P06-T004](delivery_01/phase_06/D01-P06-T004.md), [D01-P06-T005](delivery_01/phase_06/D01-P06-T005.md), [D01-P06-CODE_REVIEW](delivery_01/phase_06/D01-P06-CODE_REVIEW.md) | P06-A → P06-B → P06-C → P06-D → P06-REVIEW | D01-P06-CODE_REVIEW is the tech-lead PR gate |
| Phase 1.7 — Public information and content | `feat_delivery01_phase_07` | [D01-P07-T001](delivery_01/phase_07/D01-P07-T001.md), [D01-P07-T002](delivery_01/phase_07/D01-P07-T002.md), [D01-P07-T003](delivery_01/phase_07/D01-P07-T003.md), [D01-P07-T004](delivery_01/phase_07/D01-P07-T004.md), [D01-P07-CODE_REVIEW](delivery_01/phase_07/D01-P07-CODE_REVIEW.md) | P07-A → P07-B → P07-C → P07-REVIEW | D01-P07-CODE_REVIEW is the tech-lead PR gate |
| Phase 1.8 — Public SEO, acceptance and release readiness | `feat_delivery01_phase_08` | [D01-P08-T001](delivery_01/phase_08/D01-P08-T001.md), [D01-P08-T002](delivery_01/phase_08/D01-P08-T002.md), [D01-P08-T003](delivery_01/phase_08/D01-P08-T003.md), [D01-P08-T004](delivery_01/phase_08/D01-P08-T004.md), [D01-P08-CODE_REVIEW](delivery_01/phase_08/D01-P08-CODE_REVIEW.md) | P08-A → P08-B → P08-REVIEW | D01-P08-CODE_REVIEW is the tech-lead PR gate |

## Verification and review policy

Every `self_ai` task must use [CODE_REVIEW_RULES.md](CODE_REVIEW_RULES.md) before tests, fix in-scope findings, record PASS in its execution log, then run feature tests plus `corepack pnpm lint`, `corepack pnpm typecheck` and `corepack pnpm -r build`. It uses `taskctl complete`; no manual task-level PR review occurs.

Each `phase_manual` task reviews `delivery_01_public_website...feat_delivery01_phase_NN`, runs the phase-specific checklist in its own file, records its AI report, then uses `submit`. A tech lead manually reviews the phase PR and uses `approve`. If the review finds a blocking defect, reopen the responsible normal task, correct it, self-review/test it again, and rerun the phase review.

The Docker gates remain the existing phase acceptance tasks: `D01-P01-T010`, `D01-P01-T012`, `D01-P02-T002`, `D01-P03-T004`, `D01-P04-T003`, `D01-P05-T004`, `D01-P06-T005`, `D01-P07-T004` and `D01-P08-T004`. They rebuild/start the target Compose stack, run container Playwright checks, record manual smoke evidence, verify local Swagger where applicable, and shut down cleanly.

## Capacity baseline

The existing implementation work remains **29.25 delivery days** before allowance. Eight 0.25-day phase PR review gates add **2 delivery days**, producing **31.25 delivery days** before the existing 0.5-day correction allowance, or a **31.75-working-day Public Website baseline**. Phase 0 remains a separate 1.25-day readiness capacity.

## Complete ordered inventory

| Order | ID | Outcome | Dependencies | Parallel group | Review mode | Estimate |
|---:|---|---|---|---|---|---:|
| 1 | [INF-P00-T001](infra_check/INF-P00-T001.md) | Verify governing documents, evidence inventory, repository integrity and source boundaries | None | INF-A | phase0 | 0.25 day |
| 2 | [INF-P00-T002](infra_check/INF-P00-T002.md) | Verify developer tooling, ports and capacity | None | INF-A | phase0 | 0.25 day |
| 3 | [INF-P00-T003](infra_check/INF-P00-T003.md) | Verify compiled POC routes, reset and screenshots read-only | INF-P00-T001, INF-P00-T002 | INF-B | phase0 | 0.25 day |
| 4 | [INF-P00-T004](infra_check/INF-P00-T004.md) | Verify target-workspace readiness, secrets and architecture prerequisites | INF-P00-T001, INF-P00-T002 | INF-B | phase0 | 0.25 day |
| 5 | [INF-P00-T005](infra_check/INF-P00-T005.md) | Produce Phase 0 readiness result | INF-P00-T003, INF-P00-T004 | INF-C | phase0 | 0.25 day |
| 6 | [D01-P01-T001](delivery_01/phase_01/D01-P01-T001.md) | Bootstrap the pnpm workspace, runtime pins and application/package skeletons | INF-P00-T005 | P01-A | self_ai | 0.75 day |
| 7 | [D01-P01-T002](delivery_01/phase_01/D01-P01-T002.md) | Add strict TypeScript, quality and boundary guardrails | D01-P01-T001 | P01-B | self_ai | 0.75 day |
| 8 | [D01-P01-T003](delivery_01/phase_01/D01-P01-T003.md) | Establish automated testing foundations | D01-P01-T001 | P01-B | self_ai | 0.75 day |
| 9 | [D01-P01-T004](delivery_01/phase_01/D01-P01-T004.md) | Establish OpenAPI, generated client and HTTP boundary | D01-P01-T002, D01-P01-T003 | P01-C | self_ai | 0.75 day |
| 10 | [D01-P01-T005](delivery_01/phase_01/D01-P01-T005.md) | Build mock API, PostgreSQL foundation and deterministic reset | D01-P01-T003, D01-P01-T004 | P01-D | self_ai | 1.25 days |
| 11 | [D01-P01-T006](delivery_01/phase_01/D01-P01-T006.md) | Add stand-in JWT identities, roles and enforcement | D01-P01-T005 | P01-E | self_ai | 0.75 day |
| 12 | [D01-P01-T007](delivery_01/phase_01/D01-P01-T007.md) | Build semantic theme and runtime theme infrastructure | D01-P01-T001 | P01-B | self_ai | 0.5 day |
| 13 | [D01-P01-T008](delivery_01/phase_01/D01-P01-T008.md) | Build shared controls and application feedback primitives | D01-P01-T002, D01-P01-T003, D01-P01-T007 | P01-C | self_ai | 0.75 day |
| 14 | [D01-P01-T009](delivery_01/phase_01/D01-P01-T009.md) | Build the Next.js public shell and navigation | D01-P01-T006, D01-P01-T008 | P01-F | self_ai | 1 day |
| 15 | [D01-P01-T010](delivery_01/phase_01/D01-P01-T010.md) | Complete containers, CI guardrails and Phase 1.1 acceptance | D01-P01-T009 | P01-G | self_ai | 1.25 days |
| 16 | [D01-P01-T011](delivery_01/phase_01/D01-P01-T011.md) | Align shared theme with the Unified POC Brand | D01-P01-T010 | P01-H | self_ai | 1 day |
| 17 | [D01-P01-T012](delivery_01/phase_01/D01-P01-T012.md) | Add alternate theme injection and developer guide | D01-P01-T011 | P01-I | self_ai | 0.75 day |
| 18 | [D01-P01-CODE_REVIEW](delivery_01/phase_01/D01-P01-CODE_REVIEW.md) | Phase 1.1 PR code review and tech-lead approval | D01-P01-T012 | P01-REVIEW | phase_manual | 0.25 day |
| 19 | [D01-P02-T001](delivery_01/phase_02/D01-P02-T001.md) | Add featured vehicle services and reusable vehicle collections | D01-P01-CODE_REVIEW | P02-A | self_ai | 0.75 day |
| 20 | [D01-P02-T002](delivery_01/phase_02/D01-P02-T002.md) | Build and accept the home/showroom experience | D01-P02-T001 | P02-B | self_ai | 1 day |
| 21 | [D01-P02-CODE_REVIEW](delivery_01/phase_02/D01-P02-CODE_REVIEW.md) | Phase 1.2 PR code review and tech-lead approval | D01-P02-T002 | P02-REVIEW | phase_manual | 0.25 day |
| 22 | [D01-P03-T001](delivery_01/phase_03/D01-P03-T001.md) | Add vehicle query, dynamic filters, sorting and pagination | D01-P02-CODE_REVIEW | P03-A | self_ai | 1.5 days |
| 23 | [D01-P03-T002](delivery_01/phase_03/D01-P03-T002.md) | Build search orchestration, URL state and natural parsing | D01-P03-T001 | P03-B | self_ai | 0.75 day |
| 24 | [D01-P03-T003](delivery_01/phase_03/D01-P03-T003.md) | Build inventory filters and result presentations | D01-P03-T001 | P03-B | self_ai | 0.5 day |
| 25 | [D01-P03-T004](delivery_01/phase_03/D01-P03-T004.md) | Integrate and accept inventory search | D01-P03-T002, D01-P03-T003 | P03-C | self_ai | 0.75 day |
| 26 | [D01-P03-CODE_REVIEW](delivery_01/phase_03/D01-P03-CODE_REVIEW.md) | Phase 1.3 PR code review and tech-lead approval | D01-P03-T004 | P03-REVIEW | phase_manual | 0.25 day |
| 27 | [D01-P04-T001](delivery_01/phase_04/D01-P04-T001.md) | Add vehicle detail and public media service behavior | D01-P03-CODE_REVIEW | P04-A | self_ai | 0.75 day |
| 28 | [D01-P04-T002](delivery_01/phase_04/D01-P04-T002.md) | Build vehicle detail page and gallery | D01-P04-T001 | P04-B | self_ai | 1 day |
| 29 | [D01-P04-T003](delivery_01/phase_04/D01-P04-T003.md) | Add sharing, printing, metadata and detail acceptance | D01-P04-T002 | P04-C | self_ai | 0.5 day |
| 30 | [D01-P04-CODE_REVIEW](delivery_01/phase_04/D01-P04-CODE_REVIEW.md) | Phase 1.4 PR code review and tech-lead approval | D01-P04-T003 | P04-REVIEW | phase_manual | 0.25 day |
| 31 | [D01-P05-G001](delivery_01/phase_05/D01-P05-G001.md) | Approve freight and city-delivery calculation decisions | D01-P04-CODE_REVIEW | P05-GATE | self_ai | 0.25 day |
| 32 | [D01-P05-T001](delivery_01/phase_05/D01-P05-T001.md) | Add destinations, rates and freight estimate services | D01-P05-G001 | P05-A | self_ai | 0.5 day |
| 33 | [D01-P05-T002](delivery_01/phase_05/D01-P05-T002.md) | Implement approved freight calculations | D01-P05-T001 | P05-B | self_ai | 0.5 day |
| 34 | [D01-P05-T003](delivery_01/phase_05/D01-P05-T003.md) | Build freight estimate selection and explanation UI | D01-P05-T002 | P05-C | self_ai | 0.5 day |
| 35 | [D01-P05-T004](delivery_01/phase_05/D01-P05-T004.md) | Add freight quotation enquiry and accept the phase | D01-P05-T003 | P05-D | self_ai | 0.25 day |
| 36 | [D01-P05-CODE_REVIEW](delivery_01/phase_05/D01-P05-CODE_REVIEW.md) | Phase 1.5 PR code review and tech-lead approval | D01-P05-T004 | P05-REVIEW | phase_manual | 0.25 day |
| 37 | [D01-P06-T001](delivery_01/phase_06/D01-P06-T001.md) | Add lead and enquiry contracts with persistent mock behavior | D01-P05-CODE_REVIEW | P06-A | self_ai | 0.5 day |
| 38 | [D01-P06-T002](delivery_01/phase_06/D01-P06-T002.md) | Build accessible contact and vehicle enquiry forms | D01-P06-T001 | P06-B | self_ai | 0.5 day |
| 39 | [D01-P06-T003](delivery_01/phase_06/D01-P06-T003.md) | Build account entry and unauthenticated reservation guidance | D01-P06-T001 | P06-B | self_ai | 0.25 day |
| 40 | [D01-P06-T004](delivery_01/phase_06/D01-P06-T004.md) | Add transactional reservation eligibility and hold behavior | D01-P06-T001 | P06-C | self_ai | 0.25 day |
| 41 | [D01-P06-T005](delivery_01/phase_06/D01-P06-T005.md) | Build reservation UI and accept enquiry/reservation journeys | D01-P06-T002, D01-P06-T003, D01-P06-T004 | P06-D | self_ai | 0.25 day |
| 42 | [D01-P06-CODE_REVIEW](delivery_01/phase_06/D01-P06-CODE_REVIEW.md) | Phase 1.6 PR code review and tech-lead approval | D01-P06-T005 | P06-REVIEW | phase_manual | 0.25 day |
| 43 | [D01-P07-T001](delivery_01/phase_07/D01-P07-T001.md) | Add public content, FAQ and testimonial services | D01-P06-CODE_REVIEW | P07-A | self_ai | 0.75 day |
| 44 | [D01-P07-T002](delivery_01/phase_07/D01-P07-T002.md) | Build About, How to Buy and Contact information pages | D01-P07-T001 | P07-B | self_ai | 1.75 days |
| 45 | [D01-P07-T003](delivery_01/phase_07/D01-P07-T003.md) | Build testimonial display and moderated submission | D01-P07-T001 | P07-B | self_ai | 0.25 day |
| 46 | [D01-P07-T004](delivery_01/phase_07/D01-P07-T004.md) | Build FAQ browsing/search and accept public content | D01-P07-T002, D01-P07-T003 | P07-C | self_ai | 0.5 day |
| 47 | [D01-P07-CODE_REVIEW](delivery_01/phase_07/D01-P07-CODE_REVIEW.md) | Phase 1.7 PR code review and tech-lead approval | D01-P07-T004 | P07-REVIEW | phase_manual | 0.25 day |
| 48 | [D01-P08-T001](delivery_01/phase_08/D01-P08-T001.md) | Complete public SEO policy and visitor regression | D01-P07-CODE_REVIEW | P08-A | self_ai | 1 day |
| 49 | [D01-P08-T002](delivery_01/phase_08/D01-P08-T002.md) | Complete data projection, privacy and production-safety checks | D01-P07-T004 | P08-A | self_ai | 0.75 day |
| 50 | [D01-P08-T003](delivery_01/phase_08/D01-P08-T003.md) | Complete accessibility, browser and performance acceptance | D01-P07-T004 | P08-A | self_ai | 1.25 days |
| 51 | [D01-P08-T004](delivery_01/phase_08/D01-P08-T004.md) | Produce Public Website UAT and Delivery 1 handoff | D01-P08-T001, D01-P08-T002, D01-P08-T003 | P08-B | self_ai | 1.5 days |
| 52 | [D01-P08-CODE_REVIEW](delivery_01/phase_08/D01-P08-CODE_REVIEW.md) | Phase 1.8 PR code review and tech-lead approval | D01-P08-T004 | P08-REVIEW | phase_manual | 0.25 day |

## Merge and continuation protocol

1. A normal task becomes COMPLETE only after its AI review and tests pass.
2. After all normal tasks in a phase are COMPLETE, the human owner manually commits phase work and creates/updates the PR to `delivery_01_public_website`.
3. The phase code-review task performs AI review of that exact branch comparison and moves to IN_REVIEW.
4. The tech lead manually reviews the PR and approves the phase code-review task.
5. The human owner merges the approved PR. Only then may the next phase begin from the synchronized delivery branch.

## BA workflow follow-on order

After the workflow decisions in `tasks/DECISION_REGISTER.md` are resolved, execute the supplemental tasks in this order:

1. `WF-T001` — workflow contract and status vocabulary.
2. `WF-T006` and `WF-T007` may run in parallel after `WF-T001` because import/publication fixtures and external-boundary records have separate ownership.
3. `WF-T003` and `WF-T004` may run in parallel after `WF-T001` where negotiation/PI and finance paths have non-overlapping files.
4. `WF-T002` starts after `WF-T001` and the Customer foundation; it consumes the approved projections from the workflow contract.
5. `WF-T005` starts after `WF-T001` and the Salesperson/Customer foundations.
6. `WF-T008` is the final golden-journey gate after all seven preceding tasks are COMPLETE.

These tasks do not authorize live VBMS, NetSuite, auction, bank, email, WhatsApp or ERP integrations. Those require separate management approval and later integration tasks.
