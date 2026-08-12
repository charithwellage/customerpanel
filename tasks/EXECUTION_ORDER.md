# CarChief Task Execution Order

Scope: Phase 0, Delivery 01 Public Website and Delivery 02 Customer Application. The immutable delivery sequence is infrastructure → Public phases 1.1–1.10 → Customer phases 2.1–2.10. Salesperson tasks remain intentionally absent; complete public SEO is included in Delivery 01.

Execution is sequential by default. A normal implementation task uses `self_ai` review: implementation → AI review/fixes → required MCP inspection/fixes for UI tasks → automated tests → `COMPLETE`. Each phase ends with one `phase_manual` code-review task. That task reviews only its phase branch PR against the matching delivery integration branch; a tech lead performs the only required manual code review before the PR can merge.

Task agents never run `git commit`, `git push`, create pull requests, merge, rewrite history or self-approve. The human owner performs those Git operations manually. The global execution frontier prevents Delivery 02 from starting until `D01-P10-CODE_REVIEW` is `COMPLETE` and the Public delivery is merged. `D01-P09-CODE_REVIEW` remains functional Public acceptance; Phase 1.10 then reconciles the recorded requirement gaps before the Customer delivery begins.

## Branch sequence

Phase 0 is branch-neutral. Every Delivery 01 phase uses `feat_delivery01_phase_NN`, created from the current `delivery_01_public_website` branch. After every normal phase task is COMPLETE, the human owner commits the phase work and creates or updates a PR targeting `delivery_01_public_website`. The matching phase code-review task records AI review, awaits tech-lead approval, and becomes COMPLETE before the human merges the PR.

Delivery 02 uses integration branch `delivery_02_customer_application`, created once by a human from the fully accepted and updated `delivery_01_public_website`. Its phase branches are `feat_delivery02_phase_01` through `feat_delivery02_phase_10`, each created from the latest `delivery_02_customer_application`. Customer tasks work directly on their phase branch and use the same self-AI and phase PR-review lifecycle.

The one-time Delivery 02 branch bootstrap is a human action after Delivery 01 is merged: switch to and fast-forward `delivery_01_public_website`, confirm `git status --porcelain=v1 --untracked-files=all` is empty, then run `git switch -c delivery_02_customer_application`. Do not start `D02-P01-G001` before that branch exists. Requirement gaps are recorded in `delivery_02/REQUIREMENT_GAPS_AND_ASSUMPTIONS.md` and do not block Customer Phases 2.1–2.9.

## Phase review gates

| Phase | Phase branch | Task files | Lane sequence | Manual PR gate |
|---|---|---|---|---|
| Infrastructure | Branch-neutral | [INF-P00-T001](infra_check/INF-P00-T001.md), [INF-P00-T002](infra_check/INF-P00-T002.md), [INF-P00-T003](infra_check/INF-P00-T003.md), [INF-P00-T004](infra_check/INF-P00-T004.md), [INF-P00-T005](infra_check/INF-P00-T005.md), [INF-P00-T006](infra_check/INF-P00-T006.md) | INF-A → INF-B → INF-C, then late MCP gate INF-D after completed Phase 1.2 implementation | None |
| Phase 1.1 — Shared foundation and public shell | `feat_delivery01_phase_01` | [D01-P01-T001](delivery_01/phase_01/D01-P01-T001.md), [D01-P01-T002](delivery_01/phase_01/D01-P01-T002.md), [D01-P01-T003](delivery_01/phase_01/D01-P01-T003.md), [D01-P01-T004](delivery_01/phase_01/D01-P01-T004.md), [D01-P01-T005](delivery_01/phase_01/D01-P01-T005.md), [D01-P01-T006](delivery_01/phase_01/D01-P01-T006.md), [D01-P01-T007](delivery_01/phase_01/D01-P01-T007.md), [D01-P01-T008](delivery_01/phase_01/D01-P01-T008.md), [D01-P01-T009](delivery_01/phase_01/D01-P01-T009.md), [D01-P01-T010](delivery_01/phase_01/D01-P01-T010.md), [D01-P01-T011](delivery_01/phase_01/D01-P01-T011.md), [D01-P01-T012](delivery_01/phase_01/D01-P01-T012.md), [D01-P01-CODE_REVIEW](delivery_01/phase_01/D01-P01-CODE_REVIEW.md) | P01-A → P01-B → P01-C → P01-D → P01-E → P01-F → P01-G → P01-H → P01-I → P01-REVIEW | D01-P01-CODE_REVIEW is the tech-lead PR gate |
| Phase 1.2 — Home and showroom | `feat_delivery01_phase_02` | [D01-P02-T001](delivery_01/phase_02/D01-P02-T001.md), [D01-P02-T002](delivery_01/phase_02/D01-P02-T002.md), [D01-P02-T003](delivery_01/phase_02/D01-P02-T003.md), [D01-P02-T004](delivery_01/phase_02/D01-P02-T004.md), [D01-P02-T005](delivery_01/phase_02/D01-P02-T005.md), [D01-P02-T006](delivery_01/phase_02/D01-P02-T006.md), [D01-P02-CODE_REVIEW](delivery_01/phase_02/D01-P02-CODE_REVIEW.md) | P02-A → P02-B → INF-D → P02-C → P02-D → P02-E → P02-F → P02-REVIEW | D01-P02-CODE_REVIEW is the expanded mixed-PR tech-lead gate |
| Phase 1.3 — Inventory and search | `feat_delivery01_phase_03` | [D01-P03-T001](delivery_01/phase_03/D01-P03-T001.md), [D01-P03-T002](delivery_01/phase_03/D01-P03-T002.md), [D01-P03-T003](delivery_01/phase_03/D01-P03-T003.md), [D01-P03-T004](delivery_01/phase_03/D01-P03-T004.md), [D01-P03-CODE_REVIEW](delivery_01/phase_03/D01-P03-CODE_REVIEW.md) | P03-A → P03-B → P03-C → P03-REVIEW | D01-P03-CODE_REVIEW is the tech-lead PR gate |
| Phase 1.4 — Vehicle details | `feat_delivery01_phase_04` | [D01-P04-T001](delivery_01/phase_04/D01-P04-T001.md), [D01-P04-T002](delivery_01/phase_04/D01-P04-T002.md), [D01-P04-T003](delivery_01/phase_04/D01-P04-T003.md), [D01-P04-CODE_REVIEW](delivery_01/phase_04/D01-P04-CODE_REVIEW.md) | P04-A → P04-B → P04-C → P04-REVIEW | D01-P04-CODE_REVIEW is the tech-lead PR gate |
| Phase 1.5 — Freight estimate and quotation enquiry | `feat_delivery01_phase_05` | [D01-P05-G001](delivery_01/phase_05/D01-P05-G001.md), [D01-P05-T001](delivery_01/phase_05/D01-P05-T001.md), [D01-P05-T002](delivery_01/phase_05/D01-P05-T002.md), [D01-P05-T003](delivery_01/phase_05/D01-P05-T003.md), [D01-P05-T004](delivery_01/phase_05/D01-P05-T004.md), [D01-P05-CODE_REVIEW](delivery_01/phase_05/D01-P05-CODE_REVIEW.md) | P05-GATE → P05-A → P05-B → P05-C → P05-D → P05-REVIEW | D01-P05-CODE_REVIEW is the tech-lead PR gate |
| Phase 1.6 — Enquiry, account and reservation entry | `feat_delivery01_phase_06` | [D01-P06-T001](delivery_01/phase_06/D01-P06-T001.md), [D01-P06-T002](delivery_01/phase_06/D01-P06-T002.md), [D01-P06-T003](delivery_01/phase_06/D01-P06-T003.md), [D01-P06-T004](delivery_01/phase_06/D01-P06-T004.md), [D01-P06-T005](delivery_01/phase_06/D01-P06-T005.md), [D01-P06-CODE_REVIEW](delivery_01/phase_06/D01-P06-CODE_REVIEW.md) | P06-A → P06-B → P06-C → P06-D → P06-REVIEW | D01-P06-CODE_REVIEW is the tech-lead PR gate |
| Phase 1.7 — Public information and content | `feat_delivery01_phase_07` | [D01-P07-T001](delivery_01/phase_07/D01-P07-T001.md), [D01-P07-T002](delivery_01/phase_07/D01-P07-T002.md), [D01-P07-T003](delivery_01/phase_07/D01-P07-T003.md), [D01-P07-T004](delivery_01/phase_07/D01-P07-T004.md), [D01-P07-CODE_REVIEW](delivery_01/phase_07/D01-P07-CODE_REVIEW.md) | P07-A → P07-B → P07-C → P07-REVIEW | D01-P07-CODE_REVIEW is the tech-lead PR gate |
| Phase 1.8 — Public SEO, acceptance and release readiness | `feat_delivery01_phase_08` | [D01-P08-T005](delivery_01/phase_08/D01-P08-T005.md), [D01-P08-T001](delivery_01/phase_08/D01-P08-T001.md), [D01-P08-T002](delivery_01/phase_08/D01-P08-T002.md), [D01-P08-T003](delivery_01/phase_08/D01-P08-T003.md), [D01-P08-T004](delivery_01/phase_08/D01-P08-T004.md), [D01-P08-CODE_REVIEW](delivery_01/phase_08/D01-P08-CODE_REVIEW.md) | P08-PRE → P08-A → P08-B → P08-REVIEW | D01-P08-CODE_REVIEW is the tech-lead PR gate; D01-P08-T005 runs first, restoring a Phase 1.7 regression before the phase's other acceptance sweeps |
| Phase 1.9 — Alternate theme parity | `feat_delivery01_phase_09` | [D01-P09-T001](delivery_01/phase_09/D01-P09-T001.md), [D01-P09-T002](delivery_01/phase_09/D01-P09-T002.md), [D01-P09-CODE_REVIEW](delivery_01/phase_09/D01-P09-CODE_REVIEW.md) | P09-A → P09-B → P09-REVIEW | D01-P09-CODE_REVIEW is the tech-lead PR gate and functional Public acceptance |
| Phase 1.10 — Assumption reconciliation and MVP closure | `feat_delivery01_phase_10` | [D01-P10-T001](delivery_01/phase_10/D01-P10-T001.md), [D01-P10-T002](delivery_01/phase_10/D01-P10-T002.md), [D01-P10-T003](delivery_01/phase_10/D01-P10-T003.md), [D01-P10-CODE_REVIEW](delivery_01/phase_10/D01-P10-CODE_REVIEW.md) | Reconcile → adjust → re-verify → review | D01-P10-CODE_REVIEW is the tech-lead PR gate and the Delivery 02 start gate |
| Phase 2.1 — Customer scope, shell and account access | `feat_delivery02_phase_01` | G001, T001–T003, CODE_REVIEW | Gate → sequential implementation → review | D02-P01-CODE_REVIEW |
| Phase 2.2 — Customer dashboard | `feat_delivery02_phase_02` | G001, T001–T002, CODE_REVIEW | Gate → sequential implementation → review | D02-P02-CODE_REVIEW |
| Phase 2.3 — Customer showroom and vehicle search | `feat_delivery02_phase_03` | T001–T003, CODE_REVIEW | Sequential implementation → review | D02-P03-CODE_REVIEW |
| Phase 2.4 — My Vehicles | `feat_delivery02_phase_04` | T001–T003, CODE_REVIEW | Sequential implementation → review | D02-P04-CODE_REVIEW |
| Phase 2.5 — Quotes and invoices | `feat_delivery02_phase_05` | T001–T003, CODE_REVIEW | Sequential implementation → review | D02-P05-CODE_REVIEW |
| Phase 2.6 — Payments, TT remittance and PI deadline | `feat_delivery02_phase_06` | G001, T001–T004, CODE_REVIEW | Gate → sequential implementation → review | D02-P06-CODE_REVIEW |
| Phase 2.7 — Shipment tracking and secure documents | `feat_delivery02_phase_07` | G001, T001–T004, CODE_REVIEW | Gate → sequential implementation → review | D02-P07-CODE_REVIEW |
| Phase 2.8 — Notifications and profile | `feat_delivery02_phase_08` | T001–T003, CODE_REVIEW | Sequential implementation → review | D02-P08-CODE_REVIEW |
| Phase 2.9 — Customer Application acceptance | `feat_delivery02_phase_09` | T001–T004, CODE_REVIEW | Sequential acceptance → review | D02-P09-CODE_REVIEW |
| Phase 2.10 — Assumption reconciliation and MVP closure | `feat_delivery02_phase_10` | T001–T003, CODE_REVIEW | Reconcile → adjust → final acceptance → review | D02-P10-CODE_REVIEW |

## Verification and review policy

Every `self_ai` task must use [CODE_REVIEW_RULES.md](CODE_REVIEW_RULES.md) before tests, fix in-scope findings, record PASS in its execution log, then run feature tests plus `corepack pnpm lint`, `corepack pnpm typecheck` and `corepack pnpm -r build`. It uses `taskctl complete`; no manual task-level PR review occurs.

Every remaining task marked `ui_validation: "playwright_mcp"` must also run an interactive Playwright MCP walkthrough after its initial AI review, correct in-scope defects, repeat review after corrections, and record MCP plus automated Playwright Test PASS evidence before completion. Playwright MCP is not a substitute for the deterministic automated suite.

Each `phase_manual` task reviews its delivery integration branch against its phase branch, runs the phase-specific checklist, records its AI report, then uses `submit`. A tech lead manually reviews the phase PR and uses `approve`. If review finds a blocking defect, reopen the responsible normal task, correct it, self-review/test it again, and rerun phase review.

The Docker gates remain the existing phase acceptance tasks plus the Phase 1.2 visual remediation validation: `D01-P01-T010`, `D01-P01-T012`, `D01-P02-T002`, `D01-P02-T004`, `D01-P02-T006`, `D01-P03-T004`, `D01-P04-T003`, `D01-P05-T004`, `D01-P06-T005`, `D01-P07-T004` and `D01-P08-T004`. They rebuild/start the target Compose stack, run container Playwright checks, record manual smoke evidence, verify local Swagger where applicable, and shut down cleanly.

Delivery 02 Docker gates are `D02-P01-T003`, `D02-P02-T002`, `D02-P03-T003`, `D02-P04-T003`, `D02-P05-T003`, `D02-P06-T004`, `D02-P07-T004`, `D02-P08-T003`, `D02-P09-T004` and `D02-P10-T003`. They rebuild the customer app, mock API and PostgreSQL stack, verify local Swagger/OpenAPI, run container Playwright and record the phase supervisor smoke scenario.

## Capacity baseline

The corrective Phase 1.2 POC visual-parity task is **1.25 delivery days**, the final UI-validation task is **0.5 delivery day**, the reusable-style remediation is **0.75 delivery day**, the mixed-PR hygiene correction is **0.5 delivery day**, and the late Playwright MCP infrastructure gate is **0.25 delivery day**. Remaining task estimates already include testing and review, so their estimates are unchanged. The recalculated Delivery 01 task inventory totals **34.25 working days**, while infrastructure readiness remains **1.5 days**.

Delivery 02 contains **27.75 delivery days** of gate, implementation, acceptance and phase-review capacity. A 15% review/correction allowance produces approximately **32 working days**, presented as a **6–7 calendar-week baseline** with two experienced engineers coordinating bounded AI work. Requirement ambiguity no longer pauses Phases 2.1–2.9; Phase 2.10 reconciles the recorded MVP assumptions.

## Complete ordered inventory

| Order | ID | Outcome | Dependencies | Parallel group | Review mode | UI validation | Estimate |
|---:|---|---|---|---|---|---|---:|
| 1 | [INF-P00-T001](infra_check/INF-P00-T001.md) | Verify governing documents, evidence inventory, repository integrity and source boundaries | None | INF-A | phase0 | legacy/not-applicable | 0.25 day |
| 2 | [INF-P00-T002](infra_check/INF-P00-T002.md) | Verify developer tooling, ports and capacity | None | INF-A | phase0 | legacy/not-applicable | 0.25 day |
| 3 | [INF-P00-T003](infra_check/INF-P00-T003.md) | Verify compiled POC routes, reset and screenshots read-only | INF-P00-T001, INF-P00-T002 | INF-B | phase0 | legacy/not-applicable | 0.25 day |
| 4 | [INF-P00-T004](infra_check/INF-P00-T004.md) | Verify target-workspace readiness, secrets and architecture prerequisites | INF-P00-T001, INF-P00-T002 | INF-B | phase0 | legacy/not-applicable | 0.25 day |
| 5 | [INF-P00-T005](infra_check/INF-P00-T005.md) | Produce Phase 0 readiness result | INF-P00-T003, INF-P00-T004 | INF-C | phase0 | legacy/not-applicable | 0.25 day |
| 6 | [D01-P01-T001](delivery_01/phase_01/D01-P01-T001.md) | Bootstrap the pnpm workspace, runtime pins and application/package skeletons | INF-P00-T005 | P01-A | self_ai | legacy/not-applicable | 0.75 day |
| 7 | [D01-P01-T002](delivery_01/phase_01/D01-P01-T002.md) | Add strict TypeScript, quality and boundary guardrails | D01-P01-T001 | P01-B | self_ai | legacy/not-applicable | 0.75 day |
| 8 | [D01-P01-T003](delivery_01/phase_01/D01-P01-T003.md) | Establish automated testing foundations | D01-P01-T001 | P01-B | self_ai | legacy/not-applicable | 0.75 day |
| 9 | [D01-P01-T004](delivery_01/phase_01/D01-P01-T004.md) | Establish OpenAPI, generated client and HTTP boundary | D01-P01-T002, D01-P01-T003 | P01-C | self_ai | legacy/not-applicable | 0.75 day |
| 10 | [D01-P01-T005](delivery_01/phase_01/D01-P01-T005.md) | Build mock API, PostgreSQL foundation and deterministic reset | D01-P01-T003, D01-P01-T004 | P01-D | self_ai | legacy/not-applicable | 1.25 days |
| 11 | [D01-P01-T006](delivery_01/phase_01/D01-P01-T006.md) | Add stand-in JWT identities, roles and enforcement | D01-P01-T005 | P01-E | self_ai | legacy/not-applicable | 0.75 day |
| 12 | [D01-P01-T007](delivery_01/phase_01/D01-P01-T007.md) | Build semantic theme and runtime theme infrastructure | D01-P01-T001 | P01-B | self_ai | legacy/not-applicable | 0.5 day |
| 13 | [D01-P01-T008](delivery_01/phase_01/D01-P01-T008.md) | Build shared controls and application feedback primitives | D01-P01-T002, D01-P01-T003, D01-P01-T007 | P01-C | self_ai | legacy/not-applicable | 0.75 day |
| 14 | [D01-P01-T009](delivery_01/phase_01/D01-P01-T009.md) | Build the Next.js public shell and navigation | D01-P01-T006, D01-P01-T008 | P01-F | self_ai | legacy/not-applicable | 1 day |
| 15 | [D01-P01-T010](delivery_01/phase_01/D01-P01-T010.md) | Complete containers, CI guardrails and Phase 1.1 acceptance | D01-P01-T009 | P01-G | self_ai | legacy/not-applicable | 1.25 days |
| 16 | [D01-P01-T011](delivery_01/phase_01/D01-P01-T011.md) | Align shared theme with the Unified POC Brand | D01-P01-T010 | P01-H | self_ai | legacy/not-applicable | 1 day |
| 17 | [D01-P01-T012](delivery_01/phase_01/D01-P01-T012.md) | Add alternate theme injection and developer guide | D01-P01-T011 | P01-I | self_ai | legacy/not-applicable | 0.75 day |
| 18 | [D01-P01-CODE_REVIEW](delivery_01/phase_01/D01-P01-CODE_REVIEW.md) | Phase 1.1 PR code review and tech-lead approval | D01-P01-T012 | P01-REVIEW | phase_manual | legacy/not-applicable | 0.25 day |
| 19 | [D01-P02-T001](delivery_01/phase_02/D01-P02-T001.md) | Add featured vehicle services and reusable vehicle collections | D01-P01-CODE_REVIEW | P02-A | self_ai | legacy/not-applicable | 0.75 day |
| 20 | [D01-P02-T002](delivery_01/phase_02/D01-P02-T002.md) | Build and accept the home/showroom experience | D01-P02-T001 | P02-B | self_ai | legacy/not-applicable | 1 day |
| 21 | [INF-P00-T006](infra_check/INF-P00-T006.md) | Verify and provision Playwright MCP UI-testing tools | D01-P02-T002 | INF-D | self_ai | not_applicable | 0.25 day |
| 22 | [D01-P02-T003](delivery_01/phase_02/D01-P02-T003.md) | Implement exact POC visual parity for the Public Home and Showroom | D01-P02-T002, INF-P00-T006 | P02-C | self_ai | playwright_mcp | 1.25 days |
| 23 | [D01-P02-T004](delivery_01/phase_02/D01-P02-T004.md) | Validate the POC-parity Home and Showroom UI with Playwright MCP | D01-P02-T003 | P02-D | self_ai | playwright_mcp | 0.5 day |
| 24 | [D01-P02-T005](delivery_01/phase_02/D01-P02-T005.md) | Reconcile mixed PR review defects and hygiene | D01-P02-T004 | P02-E | self_ai | not_applicable | 0.5 day |
| 25 | [D01-P02-T006](delivery_01/phase_02/D01-P02-T006.md) | Move Home and Showroom static inline styling to reusable semantic CSS | D01-P02-T005 | P02-F | self_ai | playwright_mcp | 0.75 day |
| 26 | [D01-P02-CODE_REVIEW](delivery_01/phase_02/D01-P02-CODE_REVIEW.md) | Phase 1.2 mixed-PR code review and tech-lead approval | D01-P02-T006 | P02-REVIEW | phase_manual | not_applicable | 0.25 day |
| 27 | [D01-P03-T001](delivery_01/phase_03/D01-P03-T001.md) | Add vehicle query, dynamic filters, sorting and pagination | D01-P02-CODE_REVIEW | P03-A | self_ai | not_applicable | 1.5 days |
| 28 | [D01-P03-T002](delivery_01/phase_03/D01-P03-T002.md) | Build search orchestration, URL state and natural parsing | D01-P03-T001 | P03-B | self_ai | playwright_mcp | 0.75 day |
| 29 | [D01-P03-T003](delivery_01/phase_03/D01-P03-T003.md) | Build inventory filters and result presentations | D01-P03-T001 | P03-B | self_ai | playwright_mcp | 0.5 day |
| 30 | [D01-P03-T004](delivery_01/phase_03/D01-P03-T004.md) | Integrate and accept inventory search | D01-P03-T002, D01-P03-T003 | P03-C | self_ai | playwright_mcp | 0.75 day |
| 31 | [D01-P03-CODE_REVIEW](delivery_01/phase_03/D01-P03-CODE_REVIEW.md) | Phase 1.3 PR code review and tech-lead approval | D01-P03-T004 | P03-REVIEW | phase_manual | not_applicable | 0.25 day |
| 32 | [D01-P04-T001](delivery_01/phase_04/D01-P04-T001.md) | Add vehicle detail and public media service behavior | D01-P03-CODE_REVIEW | P04-A | self_ai | not_applicable | 0.75 day |
| 33 | [D01-P04-T002](delivery_01/phase_04/D01-P04-T002.md) | Build vehicle detail page and gallery | D01-P04-T001 | P04-B | self_ai | playwright_mcp | 1 day |
| 34 | [D01-P04-T003](delivery_01/phase_04/D01-P04-T003.md) | Add sharing, printing, metadata and detail acceptance | D01-P04-T002 | P04-C | self_ai | playwright_mcp | 0.5 day |
| 35 | [D01-P04-CODE_REVIEW](delivery_01/phase_04/D01-P04-CODE_REVIEW.md) | Phase 1.4 PR code review and tech-lead approval | D01-P04-T003 | P04-REVIEW | phase_manual | not_applicable | 0.25 day |
| 36 | [D01-P05-G001](delivery_01/phase_05/D01-P05-G001.md) | Approve freight and city-delivery calculation decisions | D01-P04-CODE_REVIEW | P05-GATE | self_ai | not_applicable | 0.25 day |
| 37 | [D01-P05-T001](delivery_01/phase_05/D01-P05-T001.md) | Add destinations, rates and freight estimate services | D01-P05-G001 | P05-A | self_ai | not_applicable | 0.5 day |
| 38 | [D01-P05-T002](delivery_01/phase_05/D01-P05-T002.md) | Implement approved freight calculations | D01-P05-T001 | P05-B | self_ai | not_applicable | 0.5 day |
| 39 | [D01-P05-T003](delivery_01/phase_05/D01-P05-T003.md) | Build freight estimate selection and explanation UI | D01-P05-T002 | P05-C | self_ai | playwright_mcp | 0.5 day |
| 40 | [D01-P05-T004](delivery_01/phase_05/D01-P05-T004.md) | Add freight quotation enquiry and accept the phase | D01-P05-T003 | P05-D | self_ai | playwright_mcp | 0.25 day |
| 41 | [D01-P05-CODE_REVIEW](delivery_01/phase_05/D01-P05-CODE_REVIEW.md) | Phase 1.5 PR code review and tech-lead approval | D01-P05-T004 | P05-REVIEW | phase_manual | not_applicable | 0.25 day |
| 42 | [D01-P06-T001](delivery_01/phase_06/D01-P06-T001.md) | Add lead and enquiry contracts with persistent mock behavior | D01-P05-CODE_REVIEW | P06-A | self_ai | not_applicable | 0.5 day |
| 43 | [D01-P06-T002](delivery_01/phase_06/D01-P06-T002.md) | Build accessible contact and vehicle enquiry forms | D01-P06-T001 | P06-B | self_ai | playwright_mcp | 0.5 day |
| 44 | [D01-P06-T003](delivery_01/phase_06/D01-P06-T003.md) | Build account entry and unauthenticated reservation guidance | D01-P06-T001 | P06-B | self_ai | playwright_mcp | 0.25 day |
| 45 | [D01-P06-T004](delivery_01/phase_06/D01-P06-T004.md) | Add transactional reservation eligibility and hold behavior | D01-P06-T001 | P06-C | self_ai | not_applicable | 0.25 day |
| 46 | [D01-P06-T005](delivery_01/phase_06/D01-P06-T005.md) | Build reservation UI and accept enquiry/reservation journeys | D01-P06-T002, D01-P06-T003, D01-P06-T004 | P06-D | self_ai | playwright_mcp | 0.25 day |
| 47 | [D01-P06-CODE_REVIEW](delivery_01/phase_06/D01-P06-CODE_REVIEW.md) | Phase 1.6 PR code review and tech-lead approval | D01-P06-T005 | P06-REVIEW | phase_manual | not_applicable | 0.25 day |
| 48 | [D01-P07-T001](delivery_01/phase_07/D01-P07-T001.md) | Add public content, FAQ and testimonial services | D01-P06-CODE_REVIEW | P07-A | self_ai | not_applicable | 0.75 day |
| 49 | [D01-P07-T002](delivery_01/phase_07/D01-P07-T002.md) | Build About, How to Buy and Contact information pages | D01-P07-T001 | P07-B | self_ai | playwright_mcp | 1.75 days |
| 50 | [D01-P07-T003](delivery_01/phase_07/D01-P07-T003.md) | Build testimonial display and moderated submission | D01-P07-T001 | P07-B | self_ai | playwright_mcp | 0.25 day |
| 51 | [D01-P07-T004](delivery_01/phase_07/D01-P07-T004.md) | Build FAQ browsing/search and accept public content | D01-P07-T002, D01-P07-T003 | P07-C | self_ai | playwright_mcp | 0.5 day |
| 52 | [D01-P07-CODE_REVIEW](delivery_01/phase_07/D01-P07-CODE_REVIEW.md) | Phase 1.7 PR code review and tech-lead approval | D01-P07-T004 | P07-REVIEW | phase_manual | not_applicable | 0.25 day |
| 52.5 | [D01-P08-T005](delivery_01/phase_08/D01-P08-T005.md) | Restore the contact/quotation enquiry form removed during Phase 1.7 | D01-P07-CODE_REVIEW | P08-PRE | self_ai | playwright_mcp | 0.5 day |
| 53 | [D01-P08-T001](delivery_01/phase_08/D01-P08-T001.md) | Complete public SEO policy and visitor regression | D01-P07-CODE_REVIEW | P08-A | self_ai | playwright_mcp | 1 day |
| 54 | [D01-P08-T002](delivery_01/phase_08/D01-P08-T002.md) | Complete data projection, privacy and production-safety checks | D01-P07-T004 | P08-A | self_ai | not_applicable | 0.75 day |
| 55 | [D01-P08-T003](delivery_01/phase_08/D01-P08-T003.md) | Complete accessibility, browser and performance acceptance | D01-P07-T004 | P08-A | self_ai | playwright_mcp | 1.25 days |
| 56 | [D01-P08-T004](delivery_01/phase_08/D01-P08-T004.md) | Produce Public Website UAT and Delivery 1 handoff | D01-P08-T001, D01-P08-T002, D01-P08-T003 | P08-B | self_ai | playwright_mcp | 1.5 days |
| 57 | [D01-P08-CODE_REVIEW](delivery_01/phase_08/D01-P08-CODE_REVIEW.md) | Phase 1.8 PR code review and tech-lead approval | D01-P08-T004 | P08-REVIEW | phase_manual | not_applicable | 0.25 day |
| 58 | [D01-P09-T001](delivery_01/phase_09/D01-P09-T001.md) | Add automated ocean theme-parity and contrast suite | D01-P08-CODE_REVIEW | P09-A | self_ai | not_applicable | 0.5 day |
| 59 | [D01-P09-T002](delivery_01/phase_09/D01-P09-T002.md) | Validate the ocean theme with Playwright MCP and fix parity defects | D01-P09-T001 | P09-B | self_ai | playwright_mcp | 0.5 day |
| 60 | [D01-P09-CODE_REVIEW](delivery_01/phase_09/D01-P09-CODE_REVIEW.md) | Phase 1.9 PR code review and tech-lead approval | D01-P09-T002 | P09-REVIEW | phase_manual | not_applicable | 0.25 day |
| 60.1 | [D01-P10-T001](delivery_01/phase_10/D01-P10-T001.md) | Reconcile Delivery 01 requirement gaps and assumption evidence | D01-P09-CODE_REVIEW | D01-P10-SEQUENTIAL | self_ai | not_applicable | 0.5 days |
| 60.2 | [D01-P10-T002](delivery_01/phase_10/D01-P10-T002.md) | Apply approved Delivery 01 assumption adjustments | D01-P10-T001 | D01-P10-SEQUENTIAL | self_ai | playwright_mcp | 1 day |
| 60.3 | [D01-P10-T003](delivery_01/phase_10/D01-P10-T003.md) | Re-verify theme parity and close Delivery 01 MVP acceptance | D01-P10-T002 | D01-P10-SEQUENTIAL | self_ai | playwright_mcp | 0.5 days |
| 60.4 | [D01-P10-CODE_REVIEW](delivery_01/phase_10/D01-P10-CODE_REVIEW.md) | Phase 1.10 PR code review and tech-lead approval | D01-P10-T003 | D01-P10-REVIEW | phase_manual | not_applicable | 0.25 day |
| 61 | [D02-P01-G001](delivery_02/phase_01/D02-P01-G001.md) | Record Customer scope, BA workflow ownership and Keycloak identity baseline | D01-P10-CODE_REVIEW | D02-P01-GATE | self_ai | not_applicable | 0.25 days |
| 62 | [D02-P01-T001](delivery_02/phase_01/D02-P01-T001.md) | Complete the customer application shell and responsive navigation | D02-P01-G001 | D02-P01-SEQUENTIAL | self_ai | playwright_mcp | 0.75 days |
| 63 | [D02-P01-T002](delivery_02/phase_01/D02-P01-T002.md) | Add customer session, account states and protected access | D02-P01-T001 | D02-P01-SEQUENTIAL | self_ai | playwright_mcp | 1 day |
| 64 | [D02-P01-T003](delivery_02/phase_01/D02-P01-T003.md) | Accept customer themes, PWA shell, accessibility and Docker deployment | D02-P01-T002 | D02-P01-SEQUENTIAL | self_ai | playwright_mcp | 0.75 days |
| 65 | [D02-P01-CODE_REVIEW](delivery_02/phase_01/D02-P01-CODE_REVIEW.md) | Phase 2.1 PR code review and tech-lead approval | D02-P01-T003 | D02-P01-REVIEW | phase_manual | not_applicable | 0.25 day |
| 66 | [D02-P02-G001](delivery_02/phase_02/D02-P02-G001.md) | Establish non-blocking customer dashboard KPI baseline | D02-P01-CODE_REVIEW | D02-P02-GATE | self_ai | not_applicable | 0.25 days |
| 67 | [D02-P02-T001](delivery_02/phase_02/D02-P02-T001.md) | Add customer dashboard aggregate contracts and linked mock scenarios | D02-P02-G001 | D02-P02-SEQUENTIAL | self_ai | not_applicable | 0.5 days |
| 68 | [D02-P02-T002](delivery_02/phase_02/D02-P02-T002.md) | Build and accept the customer Overview page | D02-P02-T001 | D02-P02-SEQUENTIAL | self_ai | playwright_mcp | 0.5 days |
| 69 | [D02-P02-CODE_REVIEW](delivery_02/phase_02/D02-P02-CODE_REVIEW.md) | Phase 2.2 PR code review and tech-lead approval | D02-P02-T002 | D02-P02-REVIEW | phase_manual | not_applicable | 0.25 day |
| 70 | [D02-P03-T001](delivery_02/phase_03/D02-P03-T001.md) | Add customer inventory projection, tier pricing and reservation eligibility | D02-P02-CODE_REVIEW | D02-P03-SEQUENTIAL | self_ai | not_applicable | 0.5 days |
| 71 | [D02-P03-T002](delivery_02/phase_03/D02-P03-T002.md) | Integrate shared vehicle search and detail for the customer audience | D02-P03-T001 | D02-P03-SEQUENTIAL | self_ai | playwright_mcp | 0.75 days |
| 72 | [D02-P03-T003](delivery_02/phase_03/D02-P03-T003.md) | Add customer reservation actions and showroom acceptance | D02-P03-T002 | D02-P03-SEQUENTIAL | self_ai | playwright_mcp | 0.75 days |
| 73 | [D02-P03-CODE_REVIEW](delivery_02/phase_03/D02-P03-CODE_REVIEW.md) | Phase 2.3 PR code review and tech-lead approval | D02-P03-T003 | D02-P03-REVIEW | phase_manual | not_applicable | 0.25 day |
| 74 | [D02-P04-T001](delivery_02/phase_04/D02-P04-T001.md) | Add customer vehicle transaction and status projection capabilities | D02-P03-CODE_REVIEW | D02-P04-SEQUENTIAL | self_ai | not_applicable | 0.5 days |
| 75 | [D02-P04-T002](delivery_02/phase_04/D02-P04-T002.md) | Build My Vehicles groupings, counts, search and shipping filters | D02-P04-T001 | D02-P04-SEQUENTIAL | self_ai | playwright_mcp | 0.75 days |
| 76 | [D02-P04-T003](delivery_02/phase_04/D02-P04-T003.md) | Build customer vehicle transaction detail and accept My Vehicles | D02-P04-T002 | D02-P04-SEQUENTIAL | self_ai | playwright_mcp | 0.75 days |
| 77 | [D02-P04-CODE_REVIEW](delivery_02/phase_04/D02-P04-CODE_REVIEW.md) | Phase 2.4 PR code review and tech-lead approval | D02-P04-T003 | D02-P04-REVIEW | phase_manual | not_applicable | 0.25 day |
| 78 | [D02-P05-T001](delivery_02/phase_05/D02-P05-T001.md) | Add customer PI and invoice contracts with linked printable fixtures | D02-P04-CODE_REVIEW | D02-P05-SEQUENTIAL | self_ai | not_applicable | 0.5 days |
| 79 | [D02-P05-T002](delivery_02/phase_05/D02-P05-T002.md) | Build customer quote and invoice lists, details and print presentation | D02-P05-T001 | D02-P05-SEQUENTIAL | self_ai | playwright_mcp | 0.75 days |
| 80 | [D02-P05-T003](delivery_02/phase_05/D02-P05-T003.md) | Accept invoice reconciliation, authorization and historical stability | D02-P05-T002 | D02-P05-SEQUENTIAL | self_ai | playwright_mcp | 0.5 days |
| 81 | [D02-P05-CODE_REVIEW](delivery_02/phase_05/D02-P05-CODE_REVIEW.md) | Phase 2.5 PR code review and tech-lead approval | D02-P05-T003 | D02-P05-REVIEW | phase_manual | not_applicable | 0.25 day |
| 82 | [D02-P06-G001](delivery_02/phase_06/D02-P06-G001.md) | Approve PI deadline, payment proof and customer payment vocabulary | D02-P05-CODE_REVIEW | D02-P06-GATE | self_ai | not_applicable | 0.25 days |
| 83 | [D02-P06-T001](delivery_02/phase_06/D02-P06-T001.md) | Add customer TT journal, creation and proof metadata mock operations | D02-P06-G001 | D02-P06-SEQUENTIAL | self_ai | not_applicable | 0.75 days |
| 84 | [D02-P06-T002](delivery_02/phase_06/D02-P06-T002.md) | Build customer payment journal and status detail | D02-P06-T001 | D02-P06-SEQUENTIAL | self_ai | playwright_mcp | 0.75 days |
| 85 | [D02-P06-T003](delivery_02/phase_06/D02-P06-T003.md) | Build secure TT submission and retry behavior | D02-P06-T002 | D02-P06-SEQUENTIAL | self_ai | playwright_mcp | 0.75 days |
| 86 | [D02-P06-T004](delivery_02/phase_06/D02-P06-T004.md) | Add PI deadline, hold, resubmission and allocation acceptance | D02-P06-T003 | D02-P06-SEQUENTIAL | self_ai | playwright_mcp | 1.25 days |
| 87 | [D02-P06-CODE_REVIEW](delivery_02/phase_06/D02-P06-CODE_REVIEW.md) | Phase 2.6 PR code review and tech-lead approval | D02-P06-T004 | D02-P06-REVIEW | phase_manual | not_applicable | 0.25 day |
| 88 | [D02-P07-G001](delivery_02/phase_07/D02-P07-G001.md) | Approve shipment, Ship OK and customer document policy | D02-P06-CODE_REVIEW | D02-P07-GATE | self_ai | not_applicable | 0.25 days |
| 89 | [D02-P07-T001](delivery_02/phase_07/D02-P07-T001.md) | Add customer shipment timeline and secure-document mock operations | D02-P07-G001 | D02-P07-SEQUENTIAL | self_ai | not_applicable | 0.5 days |
| 90 | [D02-P07-T002](delivery_02/phase_07/D02-P07-T002.md) | Build customer shipment tracking and exception states | D02-P07-T001 | D02-P07-SEQUENTIAL | self_ai | playwright_mcp | 0.75 days |
| 91 | [D02-P07-T003](delivery_02/phase_07/D02-P07-T003.md) | Build the ten-category customer Secure Vault | D02-P07-T002 | D02-P07-SEQUENTIAL | self_ai | playwright_mcp | 1 day |
| 92 | [D02-P07-T004](delivery_02/phase_07/D02-P07-T004.md) | Add Ship OK, document release and shipment/document acceptance | D02-P07-T003 | D02-P07-SEQUENTIAL | self_ai | playwright_mcp | 1.25 days |
| 93 | [D02-P07-CODE_REVIEW](delivery_02/phase_07/D02-P07-CODE_REVIEW.md) | Phase 2.7 PR code review and tech-lead approval | D02-P07-T004 | D02-P07-REVIEW | phase_manual | not_applicable | 0.25 day |
| 94 | [D02-P08-T001](delivery_02/phase_08/D02-P08-T001.md) | Add customer notification and profile mock operations | D02-P07-CODE_REVIEW | D02-P08-SEQUENTIAL | self_ai | not_applicable | 0.5 days |
| 95 | [D02-P08-T002](delivery_02/phase_08/D02-P08-T002.md) | Build customer notifications and linked transaction navigation | D02-P08-T001 | D02-P08-SEQUENTIAL | self_ai | playwright_mcp | 0.5 days |
| 96 | [D02-P08-T003](delivery_02/phase_08/D02-P08-T003.md) | Build customer profile, identity handoff and phase acceptance | D02-P08-T002 | D02-P08-SEQUENTIAL | self_ai | playwright_mcp | 0.75 days |
| 97 | [D02-P08-CODE_REVIEW](delivery_02/phase_08/D02-P08-CODE_REVIEW.md) | Phase 2.8 PR code review and tech-lead approval | D02-P08-T003 | D02-P08-REVIEW | phase_manual | not_applicable | 0.25 day |
| 98 | [D02-P09-T001](delivery_02/phase_09/D02-P09-T001.md) | Complete Customer requirement and compiled-behavior traceability | D02-P08-CODE_REVIEW | D02-P09-SEQUENTIAL | self_ai | not_applicable | 0.5 days |
| 99 | [D02-P09-T002](delivery_02/phase_09/D02-P09-T002.md) | Complete customer security, isolation and offline-safety acceptance | D02-P09-T001 | D02-P09-SEQUENTIAL | self_ai | not_applicable | 0.75 days |
| 100 | [D02-P09-T003](delivery_02/phase_09/D02-P09-T003.md) | Complete responsive, accessibility, theme, PWA and performance acceptance | D02-P09-T002 | D02-P09-SEQUENTIAL | self_ai | playwright_mcp | 1 day |
| 101 | [D02-P09-T004](delivery_02/phase_09/D02-P09-T004.md) | Run Customer Docker UAT and produce Delivery 03 handoff | D02-P09-T003 | D02-P09-SEQUENTIAL | self_ai | playwright_mcp | 1.5 days |
| 102 | [D02-P09-CODE_REVIEW](delivery_02/phase_09/D02-P09-CODE_REVIEW.md) | Phase 2.9 PR code review and tech-lead approval | D02-P09-T004 | D02-P09-REVIEW | phase_manual | not_applicable | 0.25 day |
| 103 | [D02-P10-T001](delivery_02/phase_10/D02-P10-T001.md) | Reconcile Delivery 02 requirement gaps and assumption evidence | D02-P09-CODE_REVIEW | D02-P10-SEQUENTIAL | self_ai | not_applicable | 0.5 days |
| 104 | [D02-P10-T002](delivery_02/phase_10/D02-P10-T002.md) | Apply approved Delivery 02 assumption adjustments | D02-P10-T001 | D02-P10-SEQUENTIAL | self_ai | playwright_mcp | 1 day |
| 105 | [D02-P10-T003](delivery_02/phase_10/D02-P10-T003.md) | Run final Customer assumption, Docker and golden-journey acceptance | D02-P10-T002 | D02-P10-SEQUENTIAL | self_ai | playwright_mcp | 1 day |
| 106 | [D02-P10-CODE_REVIEW](delivery_02/phase_10/D02-P10-CODE_REVIEW.md) | Phase 2.10 PR code review and tech-lead approval | D02-P10-T003 | D02-P10-REVIEW | phase_manual | not_applicable | 0.25 day |

## Merge and continuation protocol

1. A normal task becomes COMPLETE only after its AI review and tests pass.
2. After all normal tasks in a phase are COMPLETE, the human owner manually commits phase work and creates/updates the PR to that delivery's integration branch (`delivery_01_public_website` for Delivery 01; `delivery_02_customer_application` for Delivery 02).
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
