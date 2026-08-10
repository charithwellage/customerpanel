# CarChief Developer User Guide

## Theme and visual system

CarChief applications use the shared `packages/theme` and `packages/ui` packages. The default theme is `carchief`, which carries the approved Unified POC Brand:

- Inter for body text.
- Space Grotesk for display headings and prominent actions.
- JetBrains Mono for technical and status labels.
- Neutral/dark surfaces, red primary actions and accessible light surfaces.

For the Public Website, `docs/evidence/phase0/phase0-public-landing.png` is the visual baseline. The `carchief` theme must preserve its recognizable dark header/hero, red/orange hierarchy, light showroom area, navigation, filters, vehicle cards and status treatments while adapting accessibly to phone, tablet and desktop widths.

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

Use `VITE_THEME_ID=ocean` for the salesperson app as well. The public development build includes a local-only selector; it changes the same screen without changing feature components and persists only the non-sensitive theme ID in browser storage. Production does not render that selector. Production theme selection must come from approved deployment configuration.

The shared registry exports `resolveThemeId`, `getThemeDefinition` and `getThemeCssVariables`. Unknown values always resolve to `carchief`. Application shells pass the selected semantic variables to their root provider; feature components never import a concrete theme.

After changing the value, restart the development server. Do not change feature components or API services to change a theme.

## Checking POC visual parity

1. Start the public application and mock API with the documented Docker or local commands.
2. Open the same route under `carchief` and compare it with `docs/evidence/phase0/phase0-public-landing.png` using Playwright MCP.
3. Check phone `390×844`, tablet `768×1024` and desktop `1440×900`, including navigation collapse, hero hierarchy, calls to action, light showroom transition, filters, cards and badges.
4. Repeat under `ocean`. The colours may change, but markup, layout behavior, content and interactions must remain the same.
5. Record screenshots and any intentional difference required for accessibility, responsiveness or truthful content. Do not copy fixed dimensions, unsafe SVG rendering, disabled browser zoom or fabricated POC behavior.

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

## Playwright MCP setup and UI-validation workflow

Playwright MCP and Playwright Test are complementary:

- **Playwright MCP** lets Codex, Antigravity, Claude Code or another MCP-capable agent interactively navigate the running UI, inspect accessibility snapshots, resize the browser, interact with controls, inspect console/network activity and capture evidence.
- **Playwright Test** is the repeatable automated suite run locally, in Docker and in CI.

The repository pins Playwright MCP in `.mcp.json`; Antigravity also reads the workspace-local `.agents/mcp_config.json`. Do not replace the pinned version with `@latest` during a feature task.

### Initial readiness check

Run `INF-P00-T006` before the first task marked `ui_validation: "playwright_mcp"`. The task verifies Node 22, Corepack/pnpm, Docker, Chromium, the MCP server process and actual browser tools in the active agent session.

Project-local browser installation is permitted:

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm exec playwright install chromium
npx -y @playwright/mcp@0.0.79 --help
```

Changing a developer's user-level AI configuration requires their approval. Never edit these locations silently and never add secrets:

- **Codex:** inspect with `codex mcp list`; after approval add with `codex mcp add playwright npx "-y" "@playwright/mcp@0.0.79" "--browser" "chromium"` when the workspace configuration is not discovered.
- **Antigravity:** use the tracked `.agents/mcp_config.json`; alternatively open **Agent panel → MCP Servers → Manage MCP Servers** and reload the workspace configuration. Its global configuration is under `~/.gemini/config/mcp_config.json`.
- **Claude Code:** inspect with `claude mcp list`; after approval use `claude mcp add playwright -- npx -y @playwright/mcp@0.0.79 --browser chromium` if needed.
- **Other clients:** use the standard `mcpServers.playwright` definition from `.mcp.json` and the client's official MCP setup instructions.

Restart or reload the AI-agent session after adding an MCP server when the tools do not appear immediately. A successful `--help` command proves only that the server package starts; the infrastructure task must also perform an actual browser navigation and accessibility snapshot through MCP.

### UI task validation loop

For a task marked `playwright_mcp`:

1. Complete the implementation and initial AI code review.
2. Build and recreate a **controlled runtime from the current worktree**. Do not point a browser at an already-running server or Docker image unless the task rebuilt/recreated it and can prove its provenance.
3. Record the exact build/recreate command, target URL, process ID or container identity, and start time. Check the web health endpoint; where the task uses backend data, also check Mock API health, `/openapi.json`, reset and clean startup logs.
4. Test `carchief` and `ocean` at `390x844`, `768x1024` and `1440x900` against that exact URL.
5. Exercise the task's acceptance journey and loading, empty, error and success states.
6. Inspect accessibility/keyboard/focus behavior, console messages and failed network requests.
7. Fix every in-scope finding immediately. Rebuild/recreate the controlled runtime, repeat code review and repeat the MCP walkthrough after corrections. If the defect is genuinely owned by an earlier task, reopen that task rather than hiding the failure in phase review.
8. Run the automated Playwright Test suite with `PLAYWRIGHT_BASE_URL` set to the same recorded target URL, then run all task validation commands.
9. Record the client, URL, build/recreate command, runtime identity, readiness results, viewports, themes, console/network result, findings/corrections, `Fresh-runtime verification: PASS`, `Service readiness: PASS`, `Playwright MCP Result: PASS` and `Automated Playwright Test Result: PASS` in the execution log.

If the MCP tools are unavailable, stop and resolve/re-run `INF-P00-T006`. Do not claim that Playwright Test, screenshots from an unrelated browser, or a server process check satisfies the MCP gate.

## Clean rebuild after pulling changes

Use this procedure when a fresh checkout reports missing workspace declarations, stale compiler output, or Docker build errors. Run it from the repository root. It removes generated output only; it must not remove source files, package manifests, lockfiles, Docker files, environment files or task records.

1. Check the branch and protect any work in progress:

   ```bash
   git status --short
   git branch --show-current
   ```

   If the status shows intentional changes under `apps/`, `packages/`, configuration or documentation, commit or stash them before cleanup. Do not run cleanup against work you need to preserve.

2. Remove generated output using `find` so the command is safe in zsh, Bash and shells where unmatched globs are errors:

   ```bash
   find apps packages -type d \( -name dist -o -name .next \) -prune -exec rm -rf {} +
   find apps packages -name tsconfig.tsbuildinfo -type f -delete
   ```

   Confirm that no tracked source or configuration file was removed:

   ```bash
   git status --short
   ```

   If tracked `tsconfig.tsbuildinfo` files appear as deleted or modified, they are generated artifacts currently tracked by this branch. Do not commit those changes without an explicit repository decision; restore them after verification if necessary.

3. Reinstall the locked dependencies:

   ```bash
   corepack pnpm install --frozen-lockfile
   ```

   If this fails with registry/DNS errors, retry with network access. If it reports a lockfile mismatch, stop and resolve the dependency change rather than regenerating the lockfile casually.

4. Build the two requested applications with their workspace dependencies in dependency order:

   ```bash
   corepack pnpm --filter @carchief/mock-api... build
   corepack pnpm --filter @carchief/public-web... build
   ```

   The `...` includes each application’s workspace dependencies, ensuring packages such as `@carchief/domain` emit `dist/*.d.ts` before an application imports them. This is preferred over a plain `pnpm -r build` when validating only these applications.

5. Verify each application directly:

   ```bash
   corepack pnpm --filter @carchief/mock-api typecheck
   corepack pnpm --filter @carchief/public-web typecheck
   corepack pnpm --filter @carchief/mock-api test
   corepack pnpm --filter @carchief/public-web test
   ```

6. Run the repository checks:

   ```bash
   corepack pnpm lint
   corepack pnpm typecheck
   node tasks/scripts/taskctl.mjs validate
   git diff --check
   git diff -- POC
   ```

7. Rebuild and verify Docker when Docker is available:

   ```bash
   docker compose -f docker-compose.frontend.yml down --remove-orphans
   docker compose -f docker-compose.frontend.yml build --no-cache
   docker compose -f docker-compose.frontend.yml up -d
   docker compose -f docker-compose.frontend.yml ps
   curl --fail http://127.0.0.1:3000/healthz
   curl --fail http://127.0.0.1:4000/healthz
   docker compose -f docker-compose.frontend.yml down
   ```

If a failure remains, record the exact command, Node/Corepack/pnpm versions, `docker compose ps` output and relevant logs. Do not disable type checking, change dependency versions, or copy generated output into source directories to hide the failure.

### Mock API database/schema troubleshooting

A frontend container can render while the mock API is failing. Always inspect the API directly after starting Docker:

```bash
docker compose -f docker-compose.frontend.yml logs --no-color mock-api
docker compose -f docker-compose.frontend.yml exec -T postgres pg_isready -U carchief -d carchief_mock
docker compose -f docker-compose.frontend.yml exec -T postgres psql -U carchief -d carchief_mock -c '\d+ public.vehicles'
curl --fail http://127.0.0.1:4000/healthz
curl --fail http://127.0.0.1:4000/openapi.json
curl --fail -X POST http://127.0.0.1:4000/api/v1/__reset
```

Errors such as `column "category" of relation "vehicles" does not exist` mean the running mock code and PostgreSQL schema are out of sync. `CREATE TABLE IF NOT EXISTS` does not add columns to an existing table. First confirm that the current branch's store seed/reset SQL and schema definition both contain the same columns. Then, for disposable local demo data, recreate the named Compose volume and rebuild the image:

```bash
docker compose -f docker-compose.frontend.yml down --remove-orphans
docker volume ls --format '{{.Name}}' | rg 'carchief-postgres-data'
docker volume rm <exact-carchief-postgres-volume-name>
docker compose -f docker-compose.frontend.yml build --no-cache mock-api
docker compose -f docker-compose.frontend.yml up -d
docker compose -f docker-compose.frontend.yml logs --no-color mock-api
```

Do not delete a volume containing data that must be preserved. If a fresh volume still reports a missing column, it is a code/schema migration defect and must be fixed in the responsible task; do not repeatedly reset Docker to hide it. Phase acceptance requires clean startup logs, a matching live schema, successful reset and healthy `/healthz`/`/openapi.json` responses.
