/**
 * Account entry, stand-in demo session and reservation sign-in guidance
 * tests (D01-P06-T003, PUB-22, PUB-23, PUB-27, DEC-PUB-AUTH-BOUNDARY).
 *
 * Covers, per the task's required states:
 * - anonymous — `DemoSignInPanel`/`ReservationSignInGuidance` sign-in entry
 * - demo signed-in — `SessionStatusPanel` identity summary, account-gated
 *   Live Auction entry (present only when configured)
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
 * Never asserts that a production account was created or that an external
 * Live Auction sign-in/bid occurred — RULE-10.
 */
import { describe, it, expect, vi } from 'vitest';
import { HttpClient } from '@carchief/api-client';
import { SessionService, ConfigService } from '@carchief/api-client';
import type { JwtClaims } from '@carchief/domain';
import {
  resolveReturnTarget,
  extractVehicleSlug,
  readStoredSession,
  writeStoredSession,
  clearStoredSession,
} from '../features/account-entry/session-storage.js';
import { DemoSignInPanel } from '../features/account-entry/components/DemoSignInPanel.js';
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
  // coverage for `AuthService` lives in `packages/api-client/src/__tests__`;
  // this suite keeps only the still-present `getCurrentSession` contract.
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
   DemoSignInPanel rendering (anonymous / expired)
   -------------------------------------------------------------------------- */
describe('DemoSignInPanel rendering', () => {
  it('renders the anonymous sign-in entry point with an explicit demo-mode label', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(
      React.createElement(DemoSignInPanel, { variant: 'anonymous', onSignIn: vi.fn(), isSigningIn: false, error: null })
    );
    expect(html).toContain('Sign in or create an account');
    expect(html).toContain('Demo Mode');
    expect(html).toContain('Continue with Demo Customer Account');
  });

  it('renders honest expired-session re-authentication guidance', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(
      React.createElement(DemoSignInPanel, { variant: 'expired', onSignIn: vi.fn(), isSigningIn: false, error: null })
    );
    expect(html).toContain('demo session has expired');
  });

  it('renders an accessible, recoverable error state', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(
      React.createElement(DemoSignInPanel, {
        variant: 'anonymous',
        onSignIn: vi.fn(),
        isSigningIn: false,
        error: 'We could not start a demo session. Please check your connection and try again.',
      })
    );
    expect(html).toContain('role="alert"');
    expect(html).toContain('We could not start a demo session');
  });

  it('disables the sign-in control while a session mint is in flight', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(
      React.createElement(DemoSignInPanel, { variant: 'anonymous', onSignIn: vi.fn(), isSigningIn: true, error: null })
    );
    expect(html).toContain('disabled=""');
    expect(html).toContain('Starting demo session');
  });
});

/* --------------------------------------------------------------------------
   SessionStatusPanel rendering (demo signed-in + Live Auction gate)
   -------------------------------------------------------------------------- */
describe('SessionStatusPanel rendering', () => {
  it('renders the demo identity summary and never claims a production account', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(
      React.createElement(SessionStatusPanel, { claims: claimsFixture, onSignOut: vi.fn() })
    );
    expect(html).toContain('user@carchief.com');
    expect(html).toContain('CustomerBuyer');
    expect(html).toContain('Demo Mode');
    expect(html).toContain('Sign out');
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
  });

  it('renders honest expired-session guidance distinct from the first-visit copy', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(
      React.createElement(ReservationSignInGuidance, { status: 'expired', signInHref: '/account' })
    );
    expect(html).toContain('Sign in again to reserve this vehicle');
  });

  it('confirms an active demo session without claiming reservation creation itself is implemented here', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(
      React.createElement(ReservationSignInGuidance, { status: 'active', signInHref: '/account' })
    );
    expect(html.toLowerCase()).toContain('signed in');
    expect(html.toLowerCase()).not.toContain('reservation confirmed');
    expect(html.toLowerCase()).not.toContain('reserved successfully');
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
