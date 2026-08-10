# CarChief Code Review Rules

Every Delivery 01 implementation task performs this review before its automated tests. The review covers only the task-owned diff and the explicitly named dependencies. A phase review covers only the committed comparison range named in its phase review task.

## Review checklist

1. **Requirements and scope** — The implementation satisfies the assigned requirements and acceptance criteria, does not invent unresolved business rules, and does not change POC source, unrelated modules, API contracts, fixtures or database behavior outside its stated scope.
2. **Architecture and reuse** — Package boundaries, dependency direction, generated API client/service boundaries, shared `packages/ui`, `packages/theme`, feature packages and mock/BFF separation are preserved. Reusable behavior is not copied into an application.
3. **Code quality and SOLID** — TypeScript remains strict; types express the domain; modules have one clear responsibility; dependencies are injected at boundaries where needed; duplication, dead code, hidden side effects and unnecessary abstractions are removed.
4. **React and frontend quality** — Components keep data orchestration outside presentational UI where the architecture requires it; loading, empty, error, validation, responsive, keyboard, focus, browser-zoom and reduced-motion behavior are addressed.
5. **Security and data protection** — No secrets, unsafe HTML/SVG injection, browser-controlled authorization, client-trusted workflow transition, privacy leak, insecure storage or production mock escape is introduced. Authorization, validation, calculation and state-transition responsibilities remain server-authoritative.
6. **API and mock discipline** — UI uses the generated client through the designated service/hook boundary. Mock operations, fixtures, reset, error and conflict scenarios are linked only when the task owns them. No final BFF payload is invented without approved evidence.
7. **Accessibility, PWA and performance** — Semantic markup, labels, contrast, focus, touch targets and responsive layouts are present. PWA changes avoid broad sensitive-data caching and do not enable offline mutations for identity, finance, approval or document flows. Avoid unnecessary client JavaScript, blocking work and unoptimized media.
8. **Tests and maintainability** — Tests prove the new behavior and important failure paths without relying on implementation details. Existing tests remain meaningful. Test names, fixtures and helpers are clear and deterministic.
9. **Comments and documentation** — Add concise comments/JSDoc only for exported, non-obvious, algorithmic, financial, security-sensitive, workflow-transition or workaround code. Do not add comments that merely restate self-explanatory code. Update task evidence and user/developer documentation when the task requires it.

## Per-task AI review loop

1. Inspect the owned diff and apply every relevant checklist item.
2. Record findings and fixes in the task execution log under `## AI code review`.
3. Fix every in-scope violation, then repeat the review.
4. Only when the result is **PASS** run the task’s tests, lint, typecheck and build commands.
5. Record exact test results, then use `taskctl complete` for a `self_ai` task.

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
