# Phase 1.9 Context Pack — Alternate theme (`ocean`) parity

Read this file first. Phase 1.9 exists because per-task UI validation in Phases 1.2–1.8 covers the **default `carchief` theme only**. This phase proves once, across the whole delivered Public Website, that the alternate `ocean` theme is a pure presentation swap.

It runs after `D01-P08-CODE_REVIEW` and before the Delivery 02 start gate, so alternate-theme parity cannot be skipped.

## 1. What "parity" means here

`UI-02` (verbatim from `REQUIREMENT.md`):

**UI-02 — Recommendation approved for planning:** Theme values are defined in the shared theme package. The default `carchief` theme and the alternate `ocean` theme are selected through typed configuration. Feature components use semantic roles and shared UI packages; changing the theme must not require feature-component changes.

**UI-03 — Security and usability rule:** All screens and reusable components must support phone, tablet and desktop widths, touch, keyboard navigation, browser zoom, visible focus, contrast, reduced motion and narrow/long content. App-local forks of shared vehicle search, vehicle detail or presentation components are not permitted when the behavior is shared.

Concretely, for every delivered public route, switching the theme must change **only** token-derived values. It must not change:

- DOM structure, element order, roles, accessible names or labels.
- Content, counts, states or behaviour.
- Which components render, or any conditional branch.

And it must still satisfy contrast and focus-visibility requirements.

## 2. How to run each theme

The theme is resolved server-side in `apps/public-web/src/app/layout.tsx` via `resolveThemeId(process.env.NEXT_PUBLIC_THEME_ID)`, which falls back to `carchief` for a missing or invalid value.

`NEXT_PUBLIC_THEME_ID` is read **at server start**, so the alternate theme needs a restart of the web process, not a rebuild:

```bash
cd apps/public-web && NEXT_PUBLIC_THEME_ID=ocean API_BASE_URL=http://127.0.0.1:4000 corepack pnpm exec next start -p 3000
```

Confirm which theme is being served before capturing evidence:

```bash
curl --fail --silent http://127.0.0.1:3000/ | grep -o 'data-theme="[a-z]*"' | head -1
```

The development-only `ThemeSwitcher` (`apps/public-web/src/theme-switcher.tsx`) applies a theme client-side and persists the non-sensitive theme ID in browser storage. It is **not rendered in production mode**, which is what `next start` runs, so do not rely on it for this phase's evidence.

Full runtime setup is Profile A in [`../../TASK_EXECUTION_PROTOCOL.md`](../../TASK_EXECUTION_PROTOCOL.md) §3.

## 3. Code map

| Area | Path | Notes |
|---|---|---|
| Theme registry | `packages/theme/src/registry.ts` | `resolveThemeId`, `getThemeDefinition`, `getThemeCssVariables`; `ThemeId` is `'carchief' \| 'ocean'`. Unknown values resolve to `carchief`. |
| Tokens | `packages/theme/src/tokens.ts` | `SemanticThemeTokens`. Both themes must define every token; component-specific fallbacks are not allowed. |
| Contrast helpers | `packages/theme/src/contrast.ts` | Reuse for contrast assertions; do not write a second implementation. |
| Existing theme tests | `packages/theme/src/__tests__/theme.test.ts` | Extend rather than duplicate. |
| Existing responsive spec | `tests/e2e/theme-responsive.spec.ts` | Prior art for theme/viewport specs. |
| Theme application | `apps/public-web/src/app/layout.tsx` | Sets `data-theme` on `<html>` and the CSS custom properties on `<body>`. |
| Playwright projects | `playwright.config.ts` | `chromium`, `mobile-chromium` (390×844), `tablet-chromium` (768×1024). |

## 4. Routes to cover

Every public route delivered by Phases 1.2–1.8, including at least: home `/`, inventory search `/vehicles`, vehicle detail `/vehicles/[slug]`, the freight estimate journey, the enquiry and reservation entry points, and the Phase 1.7 content routes (`/about`, `/how-to-buy`, `/contact`, `/services`, `/auction`, `/shipping-schedule`, `/privacy`, `/content/[slug]`, `/branches/[branch]`).

Derive the list from the delivered application, not from this file, and record the exact list covered. A route that exists but is not covered is a finding.

## 5. Conventions the validation commands depend on

| Artefact | Required path |
|---|---|
| Theme parity spec | `tests/e2e/theme-parity.spec.ts` |
| Theme contrast tests | `packages/theme/src/__tests__/theme-contrast.test.ts` |

## 6. Boundaries

- This phase fixes token and stylesheet defects only. A parity failure caused by a component forking behaviour by theme is a **finding against the owning task**: reopen it rather than patching around it here.
- Never introduce a theme-conditional branch in a feature component to make parity pass.
- Themes are presentation-only: they must not change authorization, API requests, calculations, workflow transitions, PWA cache rules or sensitive-data handling.
- Do not modify `POC/**`; `git diff -- POC` must stay empty.
