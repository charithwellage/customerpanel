import type { JwtClaims, DemoSessionResponse } from '@carchief/domain';

export type AccountStatus = 'ACTIVE' | 'INACTIVE' | 'LOCKED' | 'UNAUTHORIZED' | 'EXPIRED';

export interface CustomerSession {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    company?: string;
    role: string;
    permissions: string[];
  };
  expiresAt: number; // Unix timestamp in seconds
  status: AccountStatus;
}

const STORAGE_KEY_TOKEN = 'carchief_customer_token';
const STORAGE_KEY_SESSION = 'carchief_customer_session';

export function saveCustomerSession(session: CustomerSession): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_KEY_TOKEN, session.token);
    sessionStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session));
  } catch {
    // Ignore storage quota or disabled storage error
  }
}

export function loadCustomerSession(): CustomerSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY_SESSION);
    if (!stored) return null;
    const session = JSON.parse(stored) as CustomerSession;
    if (isSessionExpired(session)) {
      clearCustomerSession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function clearCustomerSession(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(STORAGE_KEY_TOKEN);
    sessionStorage.removeItem(STORAGE_KEY_SESSION);
  } catch {
    // Ignore storage errors
  }
}

export function isSessionExpired(session: CustomerSession): boolean {
  const now = Math.floor(Date.now() / 1000);
  return session.expiresAt <= now;
}

/** Fallback label when the token carries no address to derive one from. */
export const DEMO_CUSTOMER_DISPLAY_NAME = 'Demo Customer';

/**
 * Derives a display label from the address the token actually carries.
 *
 * `JwtClaims` has no `name` field, so there is nothing to read: the local part
 * of the verified email is the only honest label available. Inventing a
 * plausible personal name here would reproduce the "forced identities" defect
 * that `tasks/TASK_EXECUTION_PROTOCOL.md` §7 prohibits.
 */
export function deriveCustomerDisplayName(email: string | undefined): string {
  const localPart = email?.split('@')[0]?.trim();
  return localPart ? localPart : DEMO_CUSTOMER_DISPLAY_NAME;
}

/**
 * Builds the session from the claims the Mock API returned. Every field comes
 * from the response; `company` is left undefined because the token carries no
 * organisation and one must not be invented.
 */
export function createDemoCustomerSession(response: DemoSessionResponse): CustomerSession {
  return {
    token: response.token,
    user: {
      id: response.claims.sub,
      name: deriveCustomerDisplayName(response.claims.email),
      email: response.claims.email,
      role: response.claims.role,
      permissions: response.claims.permissions || [],
    },
    expiresAt: response.claims.exp,
    status: 'ACTIVE',
  };
}

export async function requestDemoCustomerSession(baseUrl = ''): Promise<CustomerSession> {
  const url = `${baseUrl}/api/v1/auth/demo-session`;
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' } });

  if (!res.ok) {
    throw new Error(`Failed to mint demo customer session: HTTP ${res.status}`);
  }

  const data = (await res.json()) as DemoSessionResponse;
  const session = createDemoCustomerSession(data);
  saveCustomerSession(session);
  return session;
}

export async function fetchCustomerAccountProfile(token: string, baseUrl = ''): Promise<JwtClaims> {
  const url = `${baseUrl}/api/v1/auth/me`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (res.status === 401) {
    clearCustomerSession();
    throw new Error('UNAUTHORIZED: Customer session has expired or is invalid.');
  }

  if (!res.ok) {
    throw new Error(`Failed to fetch customer profile: HTTP ${res.status}`);
  }

  return (await res.json()) as JwtClaims;
}
