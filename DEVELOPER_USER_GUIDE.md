# CarChief Developer User Guide

## Theme and visual system

CarChief applications use the shared `packages/theme` and `packages/ui` packages. The default theme is `carchief`, which carries the approved Unified POC Brand:

- Inter for body text.
- Space Grotesk for display headings and prominent actions.
- JetBrains Mono for technical and status labels.
- Neutral/dark surfaces, red primary actions and accessible light surfaces.

Feature components must use semantic roles from shared UI primitives. Do not add literal colors, fonts, spacing, radii or duplicated app-local theme CSS in a feature.

## Available themes

| Theme ID | Purpose |
|---|---|
| `carchief` | Default Unified POC Brand used for demos and approved production styling. |
| `ocean` | Alternate blue/teal theme used to prove that feature components are theme-independent. |

The theme registry must always fall back to `carchief` when a missing or invalid theme ID is supplied.

## Switching themes locally

Use the application configuration supported by the current app:

```bash
# Public Next.js application
NEXT_PUBLIC_THEME_ID=ocean corepack pnpm --filter @carchief/public-web dev

# Vite-based authenticated application
VITE_THEME_ID=ocean corepack pnpm --filter @carchief/customer-app dev
```

Use the equivalent salesperson-app variable when running that application. If the application provides a local theme selector, it is for development/demo use only. Production theme selection must come from approved deployment configuration.

After changing the value, restart the development server. Do not change feature components or API services to change a theme.

## Adding a new theme

1. Add a typed semantic theme definition to `packages/theme`.
2. Register it in the theme registry.
3. Provide every required token; do not rely on component-specific fallbacks.
4. Run contrast, responsive, reduced-motion and theme-switching tests.
5. Demonstrate one public, customer and salesperson screen with the new theme.
6. Update the architecture documentation and deployment configuration only after review.

Themes are presentation-only. They must not change authorization, API requests, calculations, workflow transitions, PWA cache rules or sensitive-data handling.

## Reusable component rules

Vehicle search, vehicle detail, cards, forms, tables, status badges, dialogs, notifications, loading, empty and error states belong in shared packages when more than one application uses them. App-specific wrappers may configure audience, route, permissions, pricing and actions, but must not fork shared behavior.

## Responsive and accessibility checks

Every screen must be checked at phone, tablet and desktop widths. Verify touch targets, keyboard navigation, visible focus, browser zoom, contrast, reduced motion and narrow/long content. Do not hide required content only at a breakpoint or introduce horizontal scrolling for primary workflows.

## PWA checks

Run the application PWA checks for manifest/icons, installability, offline shell, online/offline state, service-worker update/versioning, logout cache cleanup and stale-cache recovery. Sensitive customer/staff data and financial or approval mutations must remain unavailable offline.

## Tests and validation

From the repository root, run:

```bash
corepack pnpm --filter @carchief/theme test
corepack pnpm --filter @carchief/theme typecheck
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm -r build
node tasks/scripts/taskctl.mjs validate
```

Visible screen work also requires the relevant integration and Playwright tests under both `carchief` and `ocean`. Record screenshots, commands, deviations and blockers in the task execution log.

Never import mock fixtures into a page. Use the generated API client and feature service boundary.
