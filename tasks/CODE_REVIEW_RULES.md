# CarChief Code Review Rules

Every Delivery 01 and Delivery 02 implementation task performs this review before its automated tests. Read [COMMON_FRONTEND_RULES.md](COMMON_FRONTEND_RULES.md) first; it is the authoritative shared frontend convention source. The review covers only the task-owned diff and the explicitly named dependencies. A phase review covers only the committed comparison range named in its phase review task.

## Review checklist

1. **Requirements and scope** — The implementation satisfies the assigned requirements and acceptance criteria, does not invent unresolved business rules, and does not change POC source, unrelated modules, API contracts, fixtures or database behavior outside its stated scope. For Delivery 02 Phases 2.1–2.9, a documented entry in `delivery_02/REQUIREMENT_GAPS_AND_ASSUMPTIONS.md` is the required treatment for a safe MVP default or skipped isolated capability; it is not itself a review failure.
2. **Architecture and reuse** — Package boundaries, dependency direction, generated API client/service boundaries, shared `packages/ui`, `packages/theme`, feature packages and mock/BFF separation are preserved. Reusable behavior is not copied into an application.
3. **Code quality and SOLID** — TypeScript remains strict; types express the domain; modules have one clear responsibility; dependencies are injected at boundaries where needed; duplication, dead code, hidden side effects and unnecessary abstractions are removed.
4. **React and frontend quality** — Components keep data orchestration outside presentational UI where the architecture requires it; loading, empty, error, validation, responsive, keyboard, focus, browser-zoom and reduced-motion behavior are addressed. Reusable components must not emit fixed DOM `id` values that can collide when rendered more than once; use `useId` or a caller-supplied unique identifier. Do not nest or overlap interactive controls (for example, a clickable card containing a link); select one interaction model or expose separate controls.
5. **Styles, themes and component CSS** — Apply `COMMON_FRONTEND_RULES.md`. Violations of semantic-token use, stylesheet ownership, reusable-package styling, or the static-inline-style rule are review failures unless the documented runtime-data custom-property exception applies.
6. **Security and data protection** — No secrets, unsafe HTML/SVG injection, browser-controlled authorization, client-trusted workflow transition, privacy leak, insecure storage or production mock escape is introduced. Authorization, validation, calculation and state-transition responsibilities remain server-authoritative.
7. **API and mock discipline** — UI uses the generated client through the designated service/hook boundary. Mock operations, fixtures, reset, error and conflict scenarios are linked only when the task owns them. No final BFF payload is invented without approved evidence.
8. **Accessibility, PWA and performance** — Semantic markup, labels, contrast, focus, touch targets and responsive layouts are present. PWA changes avoid broad sensitive-data caching and do not enable offline mutations for identity, finance, approval or document flows. Avoid unnecessary client JavaScript, blocking work and unoptimized media.
9. **Tests and maintainability** — Tests prove the new behavior and important failure paths without relying on implementation details. Existing tests remain meaningful. Test names, fixtures and helpers are clear and deterministic. Reusable presentational primitives receive focused tests for repeated rendering/unique accessible references and their permitted interaction model where applicable.
10. **Comments and documentation** — Add concise comments/JSDoc only for exported, non-obvious, algorithmic, financial, security-sensitive, workflow-transition or workaround code. Do not add comments that merely restate self-explanatory code. Update task evidence and user/developer documentation when the task requires it.
11. **Playwright MCP evidence for UI tasks** — A task marked `ui_validation: "playwright_mcp"` first proves that its browser target was freshly built/recreated from the current worktree; it must never reuse an unknown or earlier task's server/image. The execution log identifies the active client, target URL, runtime provenance, the default `carchief` theme, the required phone/tablet/desktop viewports proved by the automated Playwright projects, accessibility/keyboard/focus behavior, console/network result, findings and corrections. Alternate-theme (`ocean`) parity is reviewed in Phase 1.9, where both themes are required evidence. Every in-scope finding is fixed and reviewed again within the same task. The log contains `Fresh-runtime verification: PASS`, `Service readiness: PASS`, `Playwright MCP Result: PASS` and `Automated Playwright Test Result: PASS`; neither browser layer substitutes for the other.

## Per-task AI review loop

1. Inspect the owned diff and apply every relevant checklist item.
2. For UI changes, inspect the owned diff against `COMMON_FRONTEND_RULES.md`; move every prohibited static visual declaration to the owning semantic stylesheet before continuing.
3. Record findings and fixes in the task execution log under `## AI code review`.
4. Fix every in-scope violation, then repeat the review.
5. For a task marked `playwright_mcp`, build/recreate a runtime from the current worktree before starting its MCP walkthrough. Record the exact command, URL, process/container identity and readiness checks. Do not treat a source-only build or a pre-existing port listener as runtime proof.
6. Run the MCP walkthrough and the matrix-assigned automated Playwright spec against that recorded target URL. Delivery 02 Phases 2.1–2.8 use the focused suite in `delivery_02/D02_TEST_MATRIX.md`; final/reconciliation gates retain full regression. Fix in-scope findings and repeat the code review and fresh-runtime validation after any correction.
7. Only when the final review and MCP result are **PASS** run the task’s named tests and dependency-closure build. Root lint, typecheck and recursive build remain final/reconciliation gates unless the task changes shared tooling/configuration.
8. Record exact MCP and test results, then use `taskctl complete` for a `self_ai` task.

If an issue needs another task’s owned path or a prerequisite change, record it as a blocker rather than guessing or expanding scope. For a Delivery 02 requirement gap in Phases 2.1–2.9, record the safe default or skipped capability in the assumption register and continue; block only if no secure, honest implementation boundary can be preserved.

## Required review record

```text
## AI code review

- Reviewed range/files: <paths or Git range>
- Rules checked: <applicable checklist numbers>
- Findings: None | <numbered list; one line per finding with its severity — never collapse several findings into one entry>
- Fixes applied: None | <concise list>
- Remaining concerns: None | <explicit approved deviation/blocker>
- Result: PASS | FAIL
```

For a phase review, the same record must also identify the PR, the exact delivery-integration-to-phase comparison range named in the task, phase-specific checks, assumption-register disposition where applicable, and the tech-lead decision.

## Phase review: catalogue every finding, then batch the reopens

A phase review does **not** stop at its first defect. It completes the entire checklist, records every finding, and only then reopens the responsible tasks — all of them, in one batch. `taskctl reopen` may be called once per responsible task in the same pass.

Stopping early forces the whole cycle to repeat per defect. Phase 1.7 took seven review passes and six fix passes to surface seven defects that a single thorough pass would have catalogued together.

The phase review log carries a `## Findings` section **on every pass, pass or fail** — a failing pass that records nothing forces the next reviewer to rediscover everything:

```text
## Findings

| # | Severity | File:line | Rule / criterion | Responsible task | Required correction |
|---|---|---|---|---|---|
| 1 | blocking | apps/…/store.ts:912 | RULE-09 | D01-P07-T001 | … |

Full suite result: <passed>/<total> passed across chromium, mobile-chromium, tablet-chromium

Result: PASS | FAIL
```

`taskctl submit` rejects a review log that lacks `## Findings` or an explicit `Result:`. Delivery 02 Phase 2.1–2.8 reviews record `Focused suite result:` from `D02_TEST_MATRIX.md`; final/reconciliation reviews record the `Full suite result:` line.

Sweep each defect class across **every** place it can occur rather than the first place it appears; an invented value duplicated in a fixture and a page-level fallback must be corrected in both, since the live route may read only one.
