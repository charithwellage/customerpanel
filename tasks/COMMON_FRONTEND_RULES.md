# CarChief Common Frontend Rules

This is the mandatory shared frontend convention source for every future Delivery 01 and Delivery 02 task. Read it before changing frontend code. It complements, but does not replace, the task-specific scope, `FRONT_END_ARCHITECTURE.md`, `DEVELOPER_USER_GUIDE.md`, and `CODE_REVIEW_RULES.md`. The task-specific requirement takes precedence if it explicitly differs.

## Architecture and reuse

- Put visual and behavioural reuse in the narrowest correct owner: `packages/ui` for cross-application primitives; a shared feature package for cross-application domain UI; an application feature stylesheet for app-specific composition; and `globals.css` only for true application-wide foundations.
- Consume shared packages. Application code may configure route, audience, permissions, pricing and actions, but must not fork common vehicle search, vehicle detail, cards, forms, dialogs, feedback or theme behaviour.
- UI obtains data through typed feature hooks/services and the generated API client. Never import mock fixtures, database code, Firebase, Firestore or Supabase into a page or component.

## Styles and themes

- Use named semantic CSS classes and semantic tokens from `packages/theme`. Static styles do not belong in JSX/TSX attributes.
- Do not use static `style={{...}}` objects or `style="..."`, literal colour/font/spacing/radius/shadow/animation values, visual fallback palettes, or app-local copies of shared package CSS in TSX.
- A narrow `style` exception is allowed only for a validated runtime-data CSS custom property that cannot be represented by a class or data attribute. It must have no visual fallback value and be documented in the execution log and reviewed under `CODE_REVIEW_RULES.md`.
- Keep the default `carchief` and alternate `ocean` themes markup-compatible. Components consume semantic roles, never a named theme object or palette directly.

## Accessible, responsive UI

- Every visible screen supports phone, tablet and desktop layouts; keyboard operation; visible focus; contrast; reduced motion; and browser zoom.
- Provide loading, empty, error, validation, stale/partial and success states when applicable. Use semantic markup, labels and safe touch targets.
- Do not use fixed DOM IDs in reusable components and do not nest interactive elements.

## Quality and evidence

- Follow `CODE_REVIEW_RULES.md` before tests. Resolve every in-scope finding before completion.
- UI tasks marked `playwright_mcp` must prove the current worktree in both themes and at the required viewports using Playwright MCP and automated Playwright Test. Record runtime provenance, console/network results, findings and both PASS outcomes.
- Add a focused regression test whenever a reusable component or styling rule could be accidentally reintroduced. Record required token additions in the execution log instead of adding local visual literals.
