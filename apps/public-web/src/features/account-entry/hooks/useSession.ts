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
const SESSION_EVENT = 'carchief:session-changed';

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
  signOut: () => void;
}

function deriveStatus(stored: StoredSession | null): { status: SessionStatus; claims: JwtClaims | null; token: string | null } {
  if (!stored) return { status: 'anonymous', claims: null, token: null };
  if (isStoredSessionExpired(stored.claims)) return { status: 'expired', claims: stored.claims, token: null };
  return { status: 'active', claims: stored.claims, token: stored.token };
}

/**
 * Reads/derives the current public-web session (DEC-PUB-AUTH-BOUNDARY,
 * PUB-22, CUST-30): reads the browser-persisted session and derives an
 * honest `anonymous` / `active` / `expired` status from the persisted
 * claims' `exp` — the mock does not itself enforce expiry, so this hook is
 * the session's actual lifetime boundary. Never calls
 * Firebase/Firestore/Supabase and never embeds a forced identity. There is
 * no sign-in capability here: the public website never mints a token; a
 * session only ever arrives already-issued by the real Mock API sign-in
 * flow reached through the Customer application (`DEC-CUST-IDENTITY-RECOVERY`,
 * `resolveCustomerAppUrl`).
 */
export function useSession(_options: UseSessionOptions = {}): UseSessionReturn {
  const [stored, setStored] = useState<StoredSession | null>(null);

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

  const signOut = useCallback(() => {
    if (typeof window === 'undefined') return;
    clearStoredSession((key) => window.localStorage.removeItem(key));
    window.dispatchEvent(new Event(SESSION_EVENT));
  }, []);

  const { status, claims, token } = deriveStatus(stored);

  return { status, claims, token, signOut };
}

// Re-exported so a future same-origin session bridge (none exists yet — no
// code path in this app writes a session) can reuse the exact persistence
// shape/event this hook reads, without duplicating it.
export { writeStoredSession, SESSION_EVENT };
