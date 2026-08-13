import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { test, expect, type Page } from '@playwright/test';
import {
  resolveThemeId,
  getThemeDefinition,
  getThemeCssVariables,
  themeRegistry,
} from '../../packages/theme/src/index.js';

/**
 * Phase 1.9 (D01-P09-T001, UI-02, UI-03, RULE-10): proves the alternate
 * `ocean` theme is a pure presentation swap across every delivered public
 * route — same DOM structure, element order, roles, accessible names,
 * headings, link targets and visible text as the default `carchief` theme.
 * It never compares colour values or pixels; that is `packages/theme`'s job
 * (see theme-contrast.test.ts), and a colour-based check here would defeat
 * the point of a presentation-only theme swap.
 *
 * WHY A COMMITTED BASELINE, NOT A LIVE TWO-SERVER DIFF: `NEXT_PUBLIC_THEME_ID`
 * is read once when the Next.js server process starts (see
 * apps/public-web/src/app/layout.tsx and tasks/delivery_01/phase_09/CONTEXT.md
 * §2), so a single running server can only ever serve one theme. Each route's
 * structural fingerprint is therefore captured into
 * tests/e2e/theme-parity.snapshots/<route>__<project>.json the first time it
 * is captured (normally the default `carchief` run) and every later run —
 * same theme or the alternate theme, after restarting the web process —
 * is compared against that committed file. This makes the two required
 * passes order-independent after the baseline exists, and keeps a real
 * failure attributable to the page under test rather than to run order.
 *
 * HOW TO RUN BOTH REQUIRED PASSES (TASK_EXECUTION_PROTOCOL.md §3 Profile A):
 *   1. carchief (default): start the web process with no NEXT_PUBLIC_THEME_ID,
 *      then `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 corepack pnpm exec
 *      playwright test tests/e2e/theme-parity.spec.ts --project=chromium
 *      --project=mobile-chromium --project=tablet-chromium`.
 *   2. ocean: restart the web process with NEXT_PUBLIC_THEME_ID=ocean, then
 *      run the *same* Playwright command with NEXT_PUBLIC_THEME_ID=ocean also
 *      exported in that shell — the "configured theme" assertions below read
 *      that variable from the test process itself, so it must match whatever
 *      the currently-running web process was started with.
 * A parity failure is a finding for the owning feature task, not something
 * this suite or D01-P09-T001 fixes (see tasks/delivery_01/phase_09/D01-P09-T001.md).
 */

// Public routes delivered by Phases 1.2-1.8, enumerated from
// apps/public-web/src/app/**/page.tsx (verified against `next build` output,
// not guessed). Dynamic segments use a real seeded fixture already used
// elsewhere in this suite (tests/e2e/vehicle-detail.spec.ts,
// tests/e2e/public-content.spec.ts) so results reflect real content.
const ROUTES: ReadonlyArray<{ name: string; path: string }> = [
  { name: 'home', path: '/' },
  { name: 'vehicles-search', path: '/vehicles' },
  { name: 'vehicle-detail', path: '/vehicles/2021-toyota-corolla-axio-veh-1' },
  { name: 'freight-calculator', path: '/freight-calculator' },
  { name: 'contact', path: '/contact' },
  { name: 'about', path: '/about' },
  { name: 'services', path: '/services' },
  { name: 'how-to-buy', path: '/how-to-buy' },
  { name: 'auction', path: '/auction' },
  { name: 'branches-index', path: '/branches' },
  { name: 'branch-detail', path: '/branches/harare-hub' },
  { name: 'shipping-schedule', path: '/shipping-schedule' },
  { name: 'privacy', path: '/privacy' },
  { name: 'faq', path: '/faq' },
  { name: 'testimonials', path: '/testimonials' },
  { name: 'content-page', path: '/content/security-bank-info' },
  { name: 'account-entry', path: '/account' },
];

interface StructuralEntry {
  tag: string;
  role: string;
  level?: number;
  name: string;
  href?: string;
}

interface RouteStructure {
  title: string;
  entries: StructuralEntry[];
  text: string;
}

/**
 * Runs inside the browser (page.evaluate). Extracts an ordered, theme-
 * independent fingerprint of the page: headings, landmarks, links, form
 * controls and buttons with their role/level/accessible-name/href, plus the
 * normalized visible body text. Never reads a colour, font or computed
 * style value. The one known live/non-deterministic region on this site —
 * the home page's promotions countdown (aria-label "Promotional campaign
 * countdown") — ticks every second from Date.now(), so its digits are
 * normalized out of the text capture rather than loosening the assertion
 * for the whole page (its static labels and structure are still compared).
 */
function extractRouteStructure(): RouteStructure {
  const countdownRegion = document.querySelector('[aria-label="Promotional campaign countdown"]');
  let bodyText = (document.body as HTMLElement).innerText;
  if (countdownRegion) {
    const liveText = (countdownRegion as HTMLElement).innerText;
    if (liveText) {
      bodyText = bodyText.split(liveText).join('[[countdown]]');
    }
  }
  const text = bodyText.replace(/\s+/g, ' ').trim();

  const STRUCTURAL_SELECTOR =
    'h1, h2, h3, h4, h5, h6, [role], nav, header, footer, main, form, button, a[href], input, select, textarea, table, th, img[alt]';
  const implicitRoleByTag: Record<string, string> = {
    a: 'link',
    button: 'button',
    nav: 'navigation',
    header: 'banner',
    footer: 'contentinfo',
    main: 'main',
    form: 'form',
    table: 'table',
    th: 'columnheader',
    img: 'img',
    input: 'textbox',
    select: 'combobox',
    textarea: 'textbox',
    h1: 'heading',
    h2: 'heading',
    h3: 'heading',
    h4: 'heading',
    h5: 'heading',
    h6: 'heading',
  };
  const landmarkTagsWithoutOwnText = new Set(['nav', 'header', 'footer', 'main', 'form', 'table']);

  const entries: StructuralEntry[] = Array.from(document.body.querySelectorAll(STRUCTURAL_SELECTOR)).map((el) => {
    const tag = el.tagName.toLowerCase();
    const explicitRole = el.getAttribute('role');
    const role = explicitRole || implicitRoleByTag[tag] || tag;

    let level: number | undefined;
    if (role === 'heading') {
      const ariaLevel = el.getAttribute('aria-level');
      level = ariaLevel ? Number(ariaLevel) : Number(tag.replace('h', '')) || undefined;
    }

    const ariaLabel = el.getAttribute('aria-label');
    const ariaLabelledBy = el.getAttribute('aria-labelledby');
    let name: string;
    if (ariaLabel) {
      name = ariaLabel.trim();
    } else if (ariaLabelledBy) {
      name = ariaLabelledBy
        .split(/\s+/)
        .map((id) => document.getElementById(id)?.textContent?.trim() ?? '')
        .filter(Boolean)
        .join(' ');
    } else if (tag === 'img') {
      name = (el.getAttribute('alt') ?? '').trim();
    } else if (tag === 'input' || tag === 'select' || tag === 'textarea') {
      const id = el.getAttribute('id');
      const label = id ? document.querySelector(`label[for="${CSS.escape(id)}"]`) : null;
      name = (label?.textContent?.trim() || el.getAttribute('placeholder') || '').trim();
    } else if (landmarkTagsWithoutOwnText.has(tag) && !explicitRole) {
      // Landmark containers without an explicit role/aria-label: compare
      // presence, order and (below) href/level of their descendants
      // individually rather than a huge duplicated text blob.
      name = '';
    } else {
      name = ((el as HTMLElement).innerText ?? el.textContent ?? '').replace(/\s+/g, ' ').trim();
    }

    const entry: StructuralEntry = { tag, role, name };
    if (level !== undefined) entry.level = level;
    if (tag === 'a') entry.href = el.getAttribute('href') ?? '';
    return entry;
  });

  return { title: document.title, entries, text };
}

const SNAPSHOT_DIR = path.join(process.cwd(), 'tests', 'e2e', 'theme-parity.snapshots');

function snapshotPath(key: string): string {
  return path.join(SNAPSHOT_DIR, `${key}.json`);
}

/**
 * Compares `actual` against the committed baseline for `key`, capturing the
 * baseline on the first-ever run (see file header for why this replaces a
 * live two-server diff). Returns whether this run created the baseline, so
 * the caller can skip asserting against data it just wrote.
 */
function compareAgainstBaseline<T>(key: string, actual: T): { createdBaseline: boolean; expected: T } {
  const file = snapshotPath(key);
  if (!existsSync(file)) {
    mkdirSync(SNAPSHOT_DIR, { recursive: true });
    writeFileSync(file, `${JSON.stringify(actual, null, 2)}\n`, 'utf8');
    return { createdBaseline: true, expected: actual };
  }
  const expected = JSON.parse(readFileSync(file, 'utf8')) as T;
  return { createdBaseline: false, expected };
}

async function gotoAndSettle(page: Page, routePath: string): Promise<void> {
  const response = await page.goto(routePath);
  expect(response?.ok(), `expected ${routePath} to respond with a successful status`).toBeTruthy();
  await page.waitForLoadState('networkidle');
}

test.describe('Ocean theme structural parity across delivered public routes', () => {
  test.beforeEach(async ({ request, baseURL }) => {
    // RULE-08/D01-P09-T001: deterministic reset before every capture so a
    // mutation from an earlier spec (or an earlier test in this file) can
    // never change what a route renders.
    await request.post(`${baseURL}/api/v1/__reset`);
  });

  for (const route of ROUTES) {
    test(`structural parity holds for ${route.name} (${route.path})`, async ({ page }, testInfo) => {
      await gotoAndSettle(page, route.path);
      const actual = await page.evaluate(extractRouteStructure);

      const key = `${route.name}__${testInfo.project.name}`;
      const { createdBaseline, expected } = compareAgainstBaseline(key, actual);

      expect(
        actual,
        createdBaseline
          ? undefined
          : [
              `Theme structural parity failed for route "${route.path}" on project "${testInfo.project.name}".`,
              `Compare against the committed baseline at tests/e2e/theme-parity.snapshots/${key}.json.`,
              'This is a finding against the component/task that owns this route, not this spec (see D01-P09-T001 "Explicitly excluded").',
            ].join(' '),
      ).toEqual(expected);
    });
  }
});

test.describe('Theme configuration correctness', () => {
  test.beforeEach(async ({ request, baseURL }) => {
    await request.post(`${baseURL}/api/v1/__reset`);
  });

  test('resolveThemeId falls back to carchief for a missing or unrecognized configuration', () => {
    // Exercises the exact shared helper the server uses (CONTEXT.md §3);
    // never re-implemented here. Needs no live server, so this covers the
    // fallback case even though only one theme is ever live at a time.
    expect(resolveThemeId(undefined)).toBe('carchief');
    expect(resolveThemeId('')).toBe('carchief');
    expect(resolveThemeId('not-a-real-theme')).toBe('carchief');
    expect(resolveThemeId('OCEAN')).toBe('carchief');
    expect(resolveThemeId('ocean')).toBe('ocean');
  });

  test('carchief and ocean resolve to different token-derived CSS custom properties', () => {
    // Pure static check against the shared registry: guards against a
    // future "ocean" registration that is accidentally a no-op copy of
    // carchief, which would let every structural-only check above pass
    // without ever proving the themes actually differ (D01-P09-T001 scope).
    const carchiefVars = getThemeCssVariables(getThemeDefinition('carchief').tokens);
    const oceanVars = getThemeCssVariables(getThemeDefinition('ocean').tokens);

    expect(Object.keys(oceanVars).sort()).toEqual(Object.keys(carchiefVars).sort());
    expect(oceanVars).not.toEqual(carchiefVars);
    expect(oceanVars['--color-primary']).not.toBe(carchiefVars['--color-primary']);
  });

  test('the running server renders data-theme and body custom properties matching its configured theme', async ({ page }) => {
    // Reads the same env var name the web process was started with; the two
    // must be exported together (see file header "HOW TO RUN BOTH REQUIRED
    // PASSES"). An unset value here correctly expects the carchief fallback.
    const configuredThemeId = resolveThemeId(process.env.NEXT_PUBLIC_THEME_ID);
    const expectedVars = getThemeCssVariables(getThemeDefinition(configuredThemeId).tokens);

    await gotoAndSettle(page, '/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', configuredThemeId);

    const actualPrimary = await page.evaluate(() =>
      window.getComputedStyle(document.body).getPropertyValue('--color-primary').trim(),
    );
    expect(actualPrimary).toBe(expectedVars['--color-primary']);
  });

  test('the theme registry only ever exposes the two approved theme ids', () => {
    expect(Object.keys(themeRegistry).sort()).toEqual(['carchief', 'ocean']);
  });
});
