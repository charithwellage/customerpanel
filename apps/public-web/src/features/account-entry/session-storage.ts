import type { JwtClaims } from '@carchief/domain';

/**
 * Browser storage helpers for the stand-in demo session (DEC-PUB-AUTH-BOUNDARY,
 * PUB-22, D01-P06-T003). Kept as pure functions taking `Storage`-shaped
 * callbacks (rather than reading `window.localStorage` directly) so they are
 * unit-testable under this repo's `environment: 'node'` Vitest config, with
 * no DOM/jsdom dependency.
 */

export const SESSION_STORAGE_KEY = 'carchief.demoSession.v1';

export interface StoredSession {
  token: string;
  claims: JwtClaims;
}

export function readStoredSession(getItem: (key: string) => string | null): StoredSession | null {
  try {
    const raw = getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredSession> | null;
    if (!parsed || typeof parsed.token !== 'string' || !parsed.claims || typeof parsed.claims.exp !== 'number') {
      return null;
    }
    return { token: parsed.token, claims: parsed.claims };
  } catch {
    // Corrupted/foreign localStorage content is treated as no session, never a crash.
    return null;
  }
}

export function writeStoredSession(setItem: (key: string, value: string) => void, session: StoredSession): void {
  setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredSession(removeItem: (key: string) => void): void {
  removeItem(SESSION_STORAGE_KEY);
}

/**
 * True once `claims.exp` (Unix seconds) has passed `nowSeconds`. Deliberately
 * reimplemented here rather than importing `@carchief/domain`'s
 * `isJwtExpired` at runtime: `@carchief/domain/auth.js` imports `node:buffer`
 * (for `createDemoJwtToken`/`parseDemoJwtToken`) at module scope, which
 * Next.js's client webpack bundle cannot resolve — this module stays a pure,
 * browser-safe leaf so a client component can import it directly. `JwtClaims`
 * is imported with `import type`, which is erased at compile time and never
 * pulls in `auth.js` at runtime.
 */
export function isStoredSessionExpired(claims: Pick<JwtClaims, 'exp'>, nowSeconds: number = Math.floor(Date.now() / 1000)): boolean {
  return claims.exp <= nowSeconds;
}

/**
 * Validates a `returnTo` redirect target before it is ever used for
 * navigation. An unvalidated `returnTo` is a classic open-redirect vector
 * (CODE_REVIEW_RULES #6), so only a single-leading-slash, same-origin
 * relative path is accepted — never a protocol-relative (`//evil.com`),
 * backslash-prefixed, or absolute-URL value. Anything else falls back to
 * `fallback`.
 */
export function resolveReturnTarget(returnTo: string | null | undefined, fallback = '/'): string {
  if (!returnTo) return fallback;
  if (returnTo === '/') return returnTo;
  if (!/^\/[^/\\]/.test(returnTo)) return fallback;
  if (returnTo.includes('://')) return fallback;
  return returnTo;
}

/** Extracts a vehicle slug from a `/vehicles/{slug}` return target, for contextual guidance copy only — never used for authorization. */
export function extractVehicleSlug(returnTarget: string): string | undefined {
  const match = /^\/vehicles\/([^/?#]+)/.exec(returnTarget);
  return match ? decodeURIComponent(match[1]) : undefined;
}
