# CarChief Code Review Rules

Every Delivery 01 and Delivery 02 implementation task performs this review before its automated tests. The review covers only the task-owned diff and the explicitly named dependencies. A phase review covers only the committed comparison range named in its phase review task.

## Review checklist

1. **Requirements and scope** — The implementation satisfies the assigned requirements and acceptance criteria, does not invent unresolved business rules, and does not change POC source, unrelated modules, API contracts, fixtures or database behavior outside its stated scope.
2. **Architecture and reuse** — Package boundaries, dependency direction, generated API client/service boundaries, shared `packages/ui`, `packages/theme`, feature packages and mock/BFF separation are preserved. Reusable behavior is not copied into an application.
3. **Code quality and SOLID** — TypeScript remains strict; types express the domain; modules have one clear responsibility; dependencies are injected at boundaries where needed; duplication, dead code, hidden side effects and unnecessary abstractions are removed.
4. **React and frontend quality** — Components keep data orchestration outside presentational UI where the architecture requires it; loading, empty, error, validation, responsive, keyboard, focus, browser-zoom and reduced-motion behavior are addressed. Reusable components must not emit fixed DOM `id` values that can collide when rendered more than once; use `useId` or a caller-supplied unique identifier. Do not nest or overlap interactive controls (for example, a clickable card containing a link); select one interaction model or expose separate controls.
5. **Styles, themes and component CSS** — Static visual styling must be implemented through a semantic class name in the owning shared package/application stylesheet, using `packages/theme` CSS variables and `packages/ui` primitives. Do not add JSX/TSX `style={{...}}` objects, literal colours, fallback palettes, fonts, spacing, radii, shadows or animation timings in feature components. A narrowly scoped inline custom property is allowed only when its value is genuinely runtime data (for example a calculated chart position), cannot be represented with a class/data attribute, is validated, contains no visual fallback value, and is documented in the execution log. Shared components own their styles in the shared package; application code imports/consumes them rather than recreating their CSS.
6. **Security and data protection** — No secrets, unsafe HTML/SVG injection, browser-controlled authorization, client-trusted workflow transition, privacy leak, insecure storage or production mock escape is introduced. Authorization, validation, calculation and state-transition responsibilities remain server-authoritative.
7. **API and mock discipline** — UI uses the generated client through the designated service/hook boundary. Mock operations, fixtures, reset, error and conflict scenarios are linked only when the task owns them. No final BFF payload is invented without approved evidence.
8. **Accessibility, PWA and performance** — Semantic markup, labels, contrast, focus, touch targets and responsive layouts are present. PWA changes avoid broad sensitive-data caching and do not enable offline mutations for identity, finance, approval or document flows. Avoid unnecessary client JavaScript, blocking work and unoptimized media.
9. **Tests and maintainability** — Tests prove the new behavior and important failure paths without relying on implementation details. Existing tests remain meaningful. Test names, fixtures and helpers are clear and deterministic. Reusable presentational primitives receive focused tests for repeated rendering/unique accessible references and their permitted interaction model where applicable.
10. **Comments and documentation** — Add concise comments/JSDoc only for exported, non-obvious, algorithmic, financial, security-sensitive, workflow-transition or workaround code. Do not add comments that merely restate self-explanatory code. Update task evidence and user/developer documentation when the task requires it.
11. **Playwright MCP evidence for UI tasks** — A task marked `ui_validation: "playwright_mcp"` identifies the active client, URL, both themes, required phone/tablet/desktop viewports, accessibility/keyboard/focus behavior, console/network result, findings and corrections. Every in-scope finding is fixed and reviewed again. The log contains both `Playwright MCP Result: PASS` and `Automated Playwright Test Result: PASS`; neither layer substitutes for the other.

## Per-task AI review loop

1. Inspect the owned diff and apply every relevant checklist item.
2. For UI changes, inspect the owned diff for `style={{`/`style=` usage and static visual literals; move every violation to the owning semantic stylesheet before continuing.
3. Record findings and fixes in the task execution log under `## AI code review`.
4. Fix every in-scope violation, then repeat the review.
5. For a task marked `playwright_mcp`, start the required local services and run its MCP walkthrough. Fix in-scope findings and repeat this code review after any correction.
6. Only when the final review and MCP result are **PASS** run the task’s automated tests, lint, typecheck and build commands.
7. Record exact MCP and test results, then use `taskctl complete` for a `self_ai` task.

If an issue needs a business decision, another task’s owned path, or a prerequisite change, record it as a blocker rather than guessing or expanding scope.

## Required review record

```text
## AI code review

- Reviewed range/files: <paths or Git range>
- Rules checked: <applicable checklist numbers>
- Findings: None | <finding and severity>
- Fixes applied: None | <concise list>
- Remaining concerns: None | <explicit approved deviation/blocker>
- Result: PASS | FAIL
```

For a phase review, the same record must also identify the PR, the `delivery_01_public_website...feat_delivery01_phase_NN` comparison range, phase-specific checks, and the tech-lead decision.
