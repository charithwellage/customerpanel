/**
 * Account entry, session and reservation sign-in guidance tests
 * (D01-P06-T003, D02-P12-T004, PUB-22, PUB-23, PUB-27,
 * DEC-PUB-AUTH-BOUNDARY, CUST-30).
 *
 * Covers, per the task's required states:
 * - anonymous — `AccountAccessPanel`/`ReservationSignInGuidance` sign-in
 *   entry, directing to Register (`/register`) or the Customer application
 *   sign-in, never a demo identity mint
 * - signed-in — `SessionStatusPanel` identity summary, account-gated Live
 *   Auction entry (present only when configured)
 * - expired session — honest re-authentication guidance
 * - return URL — `resolveReturnTarget`'s open-redirect guard and
 *   `extractVehicleSlug`'s vehicle-context extraction
 *
 * This repo's root `vitest.config.ts` runs with `environment: 'node'` (no
 * jsdom), so presentational components are asserted via
 * `renderToStaticMarkup` against explicit props (matching
 * `apps/public-web/src/__tests__/enquiry.test.ts`), and the session-storage
 * module is tested as pure functions taking `Storage`-shaped callbacks
 * rather than touching `window.localStorage` directly.
 *
 * Never asserts that a demo/non-production identity path exists — CUST-30.
 */
import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { HttpClient } from '@carchief/api-client';
import { SessionService, ConfigService } from '@carchief/api-client';
import type { JwtClaims } from '@carchief/domain';
import {
  resolveReturnTarget,
  extractVehicleSlug,
  readStoredSession,
  writeStoredSession,
  clearStoredSession,
  SESSION_STORAGE_KEY,
} from '../features/account-entry/session-storage.js';
import { AccountAccessPanel } from '../features/account-entry/components/AccountAccessPanel.js';
import { SessionStatusPanel } from '../features/account-entry/components/SessionStatusPanel.js';
import { ReservationSignInGuidance } from '../features/account-entry/components/ReservationSignInGuidance.js';

const claimsFixture: JwtClaims = {
  sub: 'user-123',
  email: 'user@carchief.com',
  role: 'CustomerBuyer',
  permissions: ['read:public', 'create:inquiry', 'create:reservation'],
  exp: 9999999999,
};

/* --------------------------------------------------------------------------
   resolveReturnTarget — open-redirect guard (return URL)
   -------------------------------------------------------------------------- */
describe('resolveReturnTarget', () => {
  it('accepts a same-origin relative path', () => {
    expect(resolveReturnTarget('/allstock/2021-toyota-corolla-axio-veh-1')).toBe(
      '/allstock/2021-toyota-corolla-axio-veh-1'
    );
  });

  it('falls back to "/" for null/undefined/empty', () => {
    expect(resolveReturnTarget(null)).toBe('/');
    expect(resolveReturnTarget(undefined)).toBe('/');
    expect(resolveReturnTarget('')).toBe('/');
  });

  it('rejects a protocol-relative target (open-redirect vector)', () => {
    expect(resolveReturnTarget('//evil.example.com')).toBe('/');
  });

  it('rejects a backslash-prefixed target (open-redirect vector some browsers treat as protocol-relative)', () => {
    expect(resolveReturnTarget('/\\evil.example.com')).toBe('/');
  });

  it('rejects an absolute URL, even one starting with a path-like segment', () => {
    expect(resolveReturnTarget('https://evil.example.com/allstock/1')).toBe('/');
  });

  it('rejects a value containing "://" anywhere', () => {
    expect(resolveReturnTarget('/redirect?to=https://evil.example.com')).toBe('/');
  });

  it('honours a custom fallback', () => {
    expect(resolveReturnTarget(undefined, '/allstock')).toBe('/allstock');
  });
});

describe('extractVehicleSlug', () => {
  it('extracts the slug from an /allstock/{slug} return target', () => {
    expect(extractVehicleSlug('/allstock/2021-toyota-corolla-axio-veh-1')).toBe('2021-toyota-corolla-axio-veh-1');
  });

  it('returns undefined for a non-vehicle return target', () => {
    expect(extractVehicleSlug('/account')).toBeUndefined();
    expect(extractVehicleSlug('/')).toBeUndefined();
  });
});

/* --------------------------------------------------------------------------
   session-storage read/write/clear round-trip
   -------------------------------------------------------------------------- */
describe('session-storage read/write/clear', () => {
  it('uses an honest, non-demo storage key', () => {
    expect(SESSION_STORAGE_KEY).toBe('carchief.session.v1');
    expect(SESSION_STORAGE_KEY.toLowerCase()).not.toContain('demo');
  });

  it('round-trips a stored session through a Storage-shaped fake', () => {
    const backing = new Map<string, string>();
    writeStoredSession((key, value) => backing.set(key, value), { token: 'tok-1', claims: claimsFixture });
    const stored = readStoredSession((key) => backing.get(key) ?? null);
    expect(stored?.token).toBe('tok-1');
    expect(stored?.claims.role).toBe('CustomerBuyer');

    clearStoredSession((key) => backing.delete(key));
    expect(readStoredSession((key) => backing.get(key) ?? null)).toBeNull();
  });

  it('treats corrupted/foreign localStorage content as no session rather than throwing', () => {
    expect(readStoredSession(() => 'not json')).toBeNull();
    expect(readStoredSession(() => JSON.stringify({ unrelated: true }))).toBeNull();
    expect(readStoredSession(() => null)).toBeNull();
  });
});

/* --------------------------------------------------------------------------
   SessionService / ConfigService HTTP contract (via fetch mock)
   -------------------------------------------------------------------------- */
describe('SessionService HTTP contract', () => {
  // `startDemoSession` was removed (D02-P12-T002, CUST-30): the Mock API no
  // longer mints a no-input demo session. Real registration/sign-in
  // coverage for `AuthService` lives in `packages/api-client/src/__tests__`
  // and `apps/public-web/src/__tests__/registration.test.ts`; this suite
  // keeps only the still-present `getCurrentSession` contract.
  it('returns null (never throws) from getCurrentSession for the honest anonymous 401 state', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      })
    );
    const service = new SessionService(new HttpClient({ baseUrl: 'http://mock-api.test' }));
    expect(await service.getCurrentSession()).toBeNull();
  });
});

describe('ConfigService — Live Auction gate', () => {
  it('resolves an undefined liveAuctionUrl when no approved destination is configured', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ siteName: 'CarChief', currency: 'USD', contactPhone: '+256 700 000 000' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );
    const service = new ConfigService(new HttpClient({ baseUrl: 'http://mock-api.test' }));
    const config = await service.getPublicConfig();
    expect(config.liveAuctionUrl).toBeUndefined();
  });
});

/* --------------------------------------------------------------------------
   AccountAccessPanel rendering (anonymous / expired) — CUST-30 replacement
   for the removed DemoSignInPanel.
   -------------------------------------------------------------------------- */
describe('AccountAccessPanel rendering', () => {
  const customerAppUrl = 'http://127.0.0.1:3001';

  it('renders the anonymous entry point with real Sign In / Create an Account actions, no demo affordance', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(
      React.createElement(AccountAccessPanel, { variant: 'anonymous', customerAppUrl })
    );
    expect(html).toContain('An account is required');
    expect(html).toContain('Sign In');
    expect(html).toContain('Create an Account');
    expect(html).toContain(customerAppUrl);
    expect(html).toContain('href="/register"');
    expect(html.toLowerCase()).not.toContain('demo account');
    expect(html.toLowerCase()).not.toContain('demo session');
    expect(html.toLowerCase()).not.toContain('non-production identity');
  });

  it('renders honest expired-session re-authentication copy', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(
      React.createElement(AccountAccessPanel, { variant: 'expired', customerAppUrl })
    );
    expect(html).toContain('Your session has expired');
    expect(html.toLowerCase()).not.toContain('demo');
  });

  it('includes contextual vehicle copy when a vehicleLabel is supplied', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(
      React.createElement(AccountAccessPanel, {
        variant: 'anonymous',
        customerAppUrl,
        vehicleLabel: 'the vehicle you were viewing (veh-1)',
      })
    );
    expect(html).toContain('veh-1');
  });
});

/* --------------------------------------------------------------------------
   SessionStatusPanel rendering (signed-in + Live Auction gate)
   -------------------------------------------------------------------------- */
describe('SessionStatusPanel rendering', () => {
  it('renders the identity summary honestly, with no demo/non-production label', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(
      React.createElement(SessionStatusPanel, { claims: claimsFixture, onSignOut: vi.fn() })
    );
    expect(html).toContain('user@carchief.com');
    expect(html).toContain('CustomerBuyer');
    expect(html).toContain('Sign out');
    expect(html.toLowerCase()).not.toContain('demo account');
    expect(html.toLowerCase()).not.toContain('demo session');
    expect(html.toLowerCase()).not.toContain('demo mode');
    expect(html.toLowerCase()).not.toContain('non-production identity');
  });

  it('hides the Live Auction entry when no approved destination is configured', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(
      React.createElement(SessionStatusPanel, { claims: claimsFixture, onSignOut: vi.fn() })
    );
    expect(html).not.toContain('Live Auction');
  });

  it('renders the account-gated Live Auction entry only when an approved destination is configured', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(
      React.createElement(SessionStatusPanel, {
        claims: claimsFixture,
        onSignOut: vi.fn(),
        liveAuctionUrl: 'https://auctions.example.com/live',
      })
    );
    expect(html).toContain('Go to Live Auction');
    expect(html).toContain('https://auctions.example.com/live');
    expect(html).toContain('rel="noopener noreferrer"');
  });
});

/* --------------------------------------------------------------------------
   ReservationSignInGuidance rendering (PUB-23)
   -------------------------------------------------------------------------- */
describe('ReservationSignInGuidance rendering', () => {
  it('tells an anonymous visitor clearly what to do next, without claiming a reservation was made', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(
      React.createElement(ReservationSignInGuidance, {
        status: 'anonymous',
        signInHref: '/account?returnTo=%2Fallstock%2Fveh-1',
        vehicleLabel: 'the vehicle you were viewing (veh-1)',
      })
    );
    expect(html).toContain('Sign in to reserve this vehicle');
    expect(html).toContain('Nothing has been reserved yet');
    expect(html).toContain('/account?returnTo=%2Fallstock%2Fveh-1');
    expect(html.toLowerCase()).not.toContain('demo');
  });

  it('renders honest expired-session guidance distinct from the first-visit copy', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(
      React.createElement(ReservationSignInGuidance, { status: 'expired', signInHref: '/account' })
    );
    expect(html).toContain('Sign in again to reserve this vehicle');
    expect(html.toLowerCase()).not.toContain('demo');
  });

  it('confirms an active session without claiming reservation creation itself is implemented here', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(
      React.createElement(ReservationSignInGuidance, { status: 'active', signInHref: '/account' })
    );
    expect(html.toLowerCase()).toContain('signed in');
    expect(html.toLowerCase()).not.toContain('reservation confirmed');
    expect(html.toLowerCase()).not.toContain('reserved successfully');
    expect(html.toLowerCase()).not.toContain('demo');
  });
});

/* --------------------------------------------------------------------------
   No fixed/duplicate DOM ids (reusable component rule)
   -------------------------------------------------------------------------- */
describe('Account entry DOM id hygiene', () => {
  it('rendering two ReservationSignInGuidance instances on one document produces no duplicate DOM id values', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');

    const html = renderToStaticMarkup(
      React.createElement(
        'div',
        null,
        React.createElement(ReservationSignInGuidance, { status: 'anonymous', signInHref: '/account?returnTo=%2Fallstock%2Fveh-a' }),
        React.createElement(ReservationSignInGuidance, { status: 'anonymous', signInHref: '/account?returnTo=%2Fallstock%2Fveh-b' })
      )
    );

    const idMatches = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
    expect(idMatches.length).toBeGreaterThan(0);
    expect(idMatches.length).toBe(new Set(idMatches).size);
  });
});

/* --------------------------------------------------------------------------
   Header — removed portal trigger, Login + Register actions
   (D02-P12-T003, CUST-26, CUST-27). `usePathname` needs a Next.js router
   context `renderToStaticMarkup` does not provide, so — matching this
   file's other source-level guard tests — the real shipped source is
   scanned rather than rendered, proving the removal/addition directly
   against what ships.
   -------------------------------------------------------------------------- */
describe('HeaderComponent source (Customer Portal removal, Login + Register actions)', () => {
  const headerSource = fs.readFileSync(
    path.resolve(__dirname, '../shell/HeaderComponent.tsx'),
    'utf-8'
  );

  it('no longer references the removed AccountEntryTrigger / demo Customer Portal entry point', () => {
    expect(headerSource).not.toMatch(/AccountEntryTrigger/);
    expect(headerSource).not.toMatch(/CUSTOMER PORTAL/);
    expect(headerSource).not.toMatch(/DEMO ACCOUNT/);
    expect(headerSource).not.toMatch(/customer-portal-btn/);
  });

  it('renders a Login action before a Register action in both the desktop header-actions and the mobile drawer, Login first (industry-standard rightmost-CTA placement)', () => {
    expect(headerSource).toContain('Login');
    expect(headerSource).toContain('Register');
    expect(headerSource).toContain('header-auth-btn--login');
    expect(headerSource).toContain('header-auth-btn--register');
    // Login precedes Register in source order inside the shared action group.
    const loginIndex = headerSource.indexOf('header-auth-btn--login');
    const registerIndex = headerSource.indexOf('header-auth-btn--register');
    expect(loginIndex).toBeGreaterThan(-1);
    expect(registerIndex).toBeGreaterThan(loginIndex);
    // Both `.header-actions` (desktop) and `.mobile-nav-drawer` (mobile) render the same action group.
    expect(headerSource).toContain('<HeaderAuthActions />');
    expect(headerSource).toContain('mobile-header-auth-actions');
  });

  it('Register links to /register and Login is resolved from configuration, never a hard-coded host', () => {
    expect(headerSource).toContain("href=\"/register\"");
    expect(headerSource).toContain('resolveCustomerAppUrl');
    expect(headerSource).not.toMatch(/href=\{`https?:\/\//);
  });
});

/* --------------------------------------------------------------------------
   Site-wide demo-identity guard (CUST-30 acceptance): no shipped public-web
   source file under src/ may claim a demo account, demo session or
   non-production identity anywhere in its rendered/literal text. This scans
   the actual shipped TSX/TS source rather than a rendered subset, so it
   catches anything the component-level tests above did not directly render.
   -------------------------------------------------------------------------- */
describe('Site-wide demo-identity removal (CUST-30)', () => {
  const FORBIDDEN_PHRASES = ['demo account', 'demo session', 'non-production identity'];
  // Test files and this file's own guard-comment prose reference the removed
  // phrases by name to document what was removed; they carry no risk of
  // being rendered to a visitor. Generated/build output is excluded.
  const EXCLUDED_DIR_SEGMENTS = ['__tests__', 'node_modules', '.next', 'dist'];

  function collectSourceFiles(dir: string): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files: string[] = [];
    for (const entry of entries) {
      if (EXCLUDED_DIR_SEGMENTS.includes(entry.name)) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...collectSourceFiles(fullPath));
      } else if (/\.(tsx?|css)$/.test(entry.name)) {
        files.push(fullPath);
      }
    }
    return files;
  }

  it('contains no "demo account", "demo session" or "non-production identity" text anywhere under src/', () => {
    const root = path.resolve(__dirname, '..');
    const files = collectSourceFiles(root);
    const offenders: string[] = [];
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8').toLowerCase();
      for (const phrase of FORBIDDEN_PHRASES) {
        if (content.includes(phrase)) {
          offenders.push(`${path.relative(root, file)} contains "${phrase}"`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
