import type { CustomerTier, JwtClaims } from '@carchief/domain';
import { AuthService, HttpClient, NormalizedApiError } from '@carchief/api-client';
import type { LoginResponse, SuccessResponse, PasswordResetAcceptedResponse } from '@carchief/api-client';

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
    tier?: CustomerTier;
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
export const FALLBACK_CUSTOMER_DISPLAY_NAME = 'Customer';

/**
 * Derives a display label from the address the token actually carries.
 *
 * `SessionClaims` has no `name` field, so there is nothing else to read: the
 * local part of the verified email is the only honest label available.
 * Inventing a plausible personal name here would reproduce the "forced
 * identities" defect that `tasks/TASK_EXECUTION_PROTOCOL.md` §7 prohibits.
 */
export function deriveCustomerDisplayName(email: string | undefined): string {
  const localPart = email?.split('@')[0]?.trim();
  return localPart ? localPart : FALLBACK_CUSTOMER_DISPLAY_NAME;
}

/**
 * Builds the session from the claims the Mock API returned for a real
 * credential sign-in. Every field comes from the response; `company` and
 * `tier` are left undefined because `SessionClaims` carries neither and one
 * must not be invented.
 */
export function createCustomerSessionFromLogin(response: LoginResponse): CustomerSession {
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

/**
 * `AuthService` posts full `/api/v1/auth/...` paths, so it needs an
 * origin-only `HttpClient` base URL — never the `${origin}/api/v1` base the
 * authenticated `/customer/**` services use (see `AuthService`'s own doc
 * comment and this phase's CONTEXT.md §5).
 */
function createAuthService(baseUrl = ''): AuthService {
  const originBaseUrl = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  const httpClient = new HttpClient({ baseUrl: originBaseUrl, timeoutMs: 10000 });
  return new AuthService(httpClient);
}

/**
 * Signs in with real credentials through `AuthService.login`. The Mock API is
 * the sole authority: on success the returned session is persisted to
 * `sessionStorage`; on failure the caller receives the `NormalizedApiError`
 * to render (a single generic message for any invalid-credential outcome).
 */
export async function loginCustomer(email: string, password: string, baseUrl = ''): Promise<CustomerSession> {
  const authService = createAuthService(baseUrl);
  const response = await authService.login({ email, password });
  const session = createCustomerSessionFromLogin(response);
  saveCustomerSession(session);
  return session;
}

/**
 * Requests a password reset. Per D02-ASM-007 the Mock API always returns the
 * same neutral 202 response whether or not the email exists — this function
 * never lets the caller infer account existence from the outcome.
 */
export async function requestCustomerPasswordReset(
  email: string,
  baseUrl = ''
): Promise<PasswordResetAcceptedResponse> {
  const authService = createAuthService(baseUrl);
  return authService.requestPasswordReset({ email });
}

/** Confirms a password reset with the single-use token and a new password. */
export async function confirmCustomerPasswordReset(
  token: string,
  newPassword: string,
  confirmNewPassword: string,
  baseUrl = ''
): Promise<SuccessResponse> {
  const authService = createAuthService(baseUrl);
  return authService.confirmPasswordReset({ token, newPassword, confirmNewPassword });
}

/** Field-level detail the Mock API attaches to a 400 validation failure. */
export interface AccountRequestFieldError {
  statusCode: number;
  message: string;
  field?: string;
}

/** Narrows a caught error into the field/message shape the forms render. */
export function toAccountRequestFieldError(error: unknown): AccountRequestFieldError {
  if (error instanceof NormalizedApiError) {
    const raw = error.rawError;
    const field =
      raw && typeof raw === 'object' && 'field' in raw && typeof (raw as { field?: unknown }).field === 'string'
        ? (raw as { field: string }).field
        : undefined;
    return { statusCode: error.statusCode, message: error.message, field };
  }
  return { statusCode: 0, message: error instanceof Error ? error.message : 'Unable to reach the server' };
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
