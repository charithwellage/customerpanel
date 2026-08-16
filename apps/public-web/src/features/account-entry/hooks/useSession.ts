'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { HttpClient, SessionService } from '@carchief/api-client';
import type { JwtClaims } from '@carchief/domain';
import {
  clearStoredSession,
  isStoredSessionExpired,
  readStoredSession,
  writeStoredSession,
  type StoredSession,
} from '../session-storage';

/** Same-tab session-change signal — the browser `storage` event only fires in *other* tabs (RULE-08: a same-tab sign-in/out must update immediately, never appear stale). */
const SESSION_EVENT = 'carchief:demo-session-changed';

function resolveBaseUrl(): string {
  // In the browser this resolves relative to the current origin, so the
  // request goes through the same-origin Next.js proxy
  // (src/app/api/v1/[...path]/route.ts). On the server there is no
  // same-origin proxy, so the mock API is called directly.
  return typeof window !== 'undefined' ? '' : process.env.API_BASE_URL || 'http://127.0.0.1:4000';
}

export type SessionStatus = 'anonymous' | 'active' | 'expired';

export interface UseSessionOptions {
  sessionService?: SessionService;
}

export interface UseSessionReturn {
  status: SessionStatus;
  claims: JwtClaims | null;
  /** The bearer token backing an `active` session, for a caller (e.g. the reservation feature) that needs to authorize its own `HttpClient`. Always `null` outside `active`. */
  token: string | null;
  isSigningIn: boolean;
  signInError: string | null;
  signInDemo: () => Promise<void>;
  signOut: () => void;
}

function deriveStatus(stored: StoredSession | null): { status: SessionStatus; claims: JwtClaims | null; token: string | null } {
  if (!stored) return { status: 'anonymous', claims: null, token: null };
  if (isStoredSessionExpired(stored.claims)) return { status: 'expired', claims: stored.claims, token: null };
  return { status: 'active', claims: stored.claims, token: stored.token };
}

/**
 * Local mirror of the response shape the mock's now-removed no-input demo
 * sign-in endpoint used to return (`@carchief/domain`'s `DemoSessionResponse`
 * and `SessionService.startDemoSession` were both deleted in D02-P12-T002,
 * CUST-30). Kept here only so this hook's existing demo-session call keeps
 * compiling until D02-P12-T004 replaces the whole flow with the real
 * `/register` + Customer sign-in journey — not a shared package type, and
 * not a claim that a demo identity path still exists.
 */
interface DemoSessionResponse {
  token: string;
  claims: JwtClaims;
  nonProduction: true;
}

/**
 * Orchestrates the stand-in demo customer session (DEC-PUB-AUTH-BOUNDARY,
 * PUB-22, D01-P06-T003): reading/writing the browser-persisted session and
 * deriving an honest `anonymous` / `active` / `expired` status from the
 * persisted claims' `exp` — the mock does not itself enforce expiry, so this
 * hook is the session's actual lifetime boundary. Never calls
 * Firebase/Firestore/Supabase and never embeds a forced identity. The
 * demo-session mint call this hook made is D02-P12-T004's removal target
 * (CUST-30) — its underlying Mock API route no longer exists as of
 * D02-P12-T001.
 */
export function useSession(options: UseSessionOptions = {}): UseSessionReturn {
  const service = useMemo(
    () => options.sessionService ?? new SessionService(new HttpClient({ baseUrl: resolveBaseUrl() })),
    [options.sessionService]
  );
  const [stored, setStored] = useState<StoredSession | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    if (typeof window === 'undefined') return;
    setStored(readStoredSession((key) => window.localStorage.getItem(key)));
  }, []);

  useEffect(() => {
    refresh();
    if (typeof window === 'undefined') return undefined;
    const handler = () => refresh();
    window.addEventListener('storage', handler);
    window.addEventListener(SESSION_EVENT, handler);
    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener(SESSION_EVENT, handler);
    };
  }, [refresh]);

  const signInDemo = useCallback(async () => {
    setIsSigningIn(true);
    setSignInError(null);
    try {
      // `SessionService.startDemoSession` was removed (D02-P12-T002,
      // CUST-30); its Mock API route no longer exists either
      // (D02-P12-T001). This call is a compile-preserving stand-in only —
      // D02-P12-T004 replaces this whole method with the real `/register` +
      // Customer sign-in journey.
      const res = await fetch(`${resolveBaseUrl()}/api/v1/auth/demo-session`, { method: 'POST' });
      if (!res.ok) {
        throw new Error(`Failed to start demo session: HTTP ${res.status}`);
      }
      const session = (await res.json()) as DemoSessionResponse;
      if (typeof window !== 'undefined') {
        writeStoredSession((key, value) => window.localStorage.setItem(key, value), {
          token: session.token,
          claims: session.claims,
        });
        // Dispatching synchronously runs every mounted `useSession` instance's
        // own listener (including this one), so no separate `refresh()` call
        // is needed here (RULE-08: every mounted instance updates together).
        window.dispatchEvent(new Event(SESSION_EVENT));
      }
    } catch {
      setSignInError('We could not start a demo session. Please check your connection and try again.');
    } finally {
      setIsSigningIn(false);
    }
  }, [service]);

  const signOut = useCallback(() => {
    if (typeof window === 'undefined') return;
    clearStoredSession((key) => window.localStorage.removeItem(key));
    window.dispatchEvent(new Event(SESSION_EVENT));
  }, []);

  const { status, claims, token } = deriveStatus(stored);

  return { status, claims, token, isSigningIn, signInError, signInDemo, signOut };
}
