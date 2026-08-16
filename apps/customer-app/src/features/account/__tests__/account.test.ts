import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  isSessionExpired,
  createCustomerSessionFromLogin,
  deriveCustomerDisplayName,
  loginCustomer,
  requestCustomerPasswordReset,
  confirmCustomerPasswordReset,
  saveCustomerSession,
  loadCustomerSession,
  clearCustomerSession,
  AccountStateBanner,
  PasswordRecoveryCard,
  LoginForm,
  AccountGuard,
  CustomerSession,
} from '../index.js';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

/** In-memory sessionStorage stand-in for the Node (non-jsdom) test environment. */
function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
    clear: () => store.clear(),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  } as Storage;
}

describe('Customer App Account & Auth Feature Unit Tests', () => {
  let previousWindow: unknown;
  let previousSessionStorage: unknown;

  beforeEach(() => {
    previousWindow = (globalThis as { window?: unknown }).window;
    previousSessionStorage = (globalThis as { sessionStorage?: unknown }).sessionStorage;
    const storage = createMemoryStorage();
    (globalThis as { window?: unknown }).window = { location: { origin: 'https://app.test' } };
    (globalThis as { sessionStorage?: unknown }).sessionStorage = storage;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    (globalThis as { window?: unknown }).window = previousWindow;
    (globalThis as { sessionStorage?: unknown }).sessionStorage = previousSessionStorage;
  });

  it('correctly validates active vs expired session objects', () => {
    const activeSession: CustomerSession = {
      token: 'mock-active-token',
      user: { id: 'cust-1', name: 'Buyer', email: 'buyer@test.com', role: 'CustomerBuyer', permissions: [] },
      expiresAt: Math.floor(Date.now() / 1000) + 3600,
      status: 'ACTIVE',
    };

    const expiredSession: CustomerSession = {
      token: 'mock-expired-token',
      user: { id: 'cust-1', name: 'Buyer', email: 'buyer@test.com', role: 'CustomerBuyer', permissions: [] },
      expiresAt: Math.floor(Date.now() / 1000) - 100,
      status: 'EXPIRED',
    };

    expect(isSessionExpired(activeSession)).toBe(false);
    expect(isSessionExpired(expiredSession)).toBe(true);
  });

  it('creates a structured CustomerSession from a real LoginResponse', () => {
    const loginRes = {
      token: 'mock_login_jwt_token_123',
      claims: {
        sub: 'usr_buyer_999',
        email: 'buyer999@carchief.com',
        role: 'CustomerBuyer' as const,
        permissions: ['read:vehicles'],
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
    };

    const session = createCustomerSessionFromLogin(loginRes);
    expect(session.token).toBe('mock_login_jwt_token_123');
    expect(session.user.id).toBe('usr_buyer_999');
    expect(session.user.role).toBe('CustomerBuyer');
    expect(session.user.permissions).toEqual(['read:vehicles']);
    expect(session.expiresAt).toBe(loginRes.claims.exp);
    expect(session.status).toBe('ACTIVE');
  });

  // Regression guard for the fabricated-identity defect (D02-P01-CODE_REVIEW
  // finding 3): the session must reflect the claims the Mock API actually
  // returned, never an invented person or company.
  it('derives identity only from real claims and invents no name or company', () => {
    const loginRes = {
      token: 'mock_login_jwt_token_456',
      claims: {
        sub: 'cust-123',
        email: 'user@carchief.com',
        role: 'CustomerBuyer' as const,
        permissions: ['read:public', 'create:inquiry', 'create:reservation'],
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
    };

    const session = createCustomerSessionFromLogin(loginRes);
    expect(session.user.id).toBe('cust-123');
    expect(session.user.email).toBe('user@carchief.com');
    expect(session.user.name).toBe('user');
    expect(session.user.company).toBeUndefined();
    expect(JSON.stringify(session)).not.toMatch(/sterling/i);
  });

  it('falls back to a generic label when the token carries no email', () => {
    expect(deriveCustomerDisplayName(undefined)).toBe('Customer');
    expect(deriveCustomerDisplayName('')).toBe('Customer');
    expect(deriveCustomerDisplayName('buyer@example.invalid')).toBe('buyer');
  });

  it('renders AccountStateBanner for EXPIRED and LOCKED states', () => {
    const htmlExpired = renderToStaticMarkup(
      React.createElement(AccountStateBanner, { status: 'EXPIRED' })
    );
    expect(htmlExpired).toContain('Session Expired');
    expect(htmlExpired).toContain('cc-acc-banner--expired');

    const htmlLocked = renderToStaticMarkup(
      React.createElement(AccountStateBanner, { status: 'LOCKED' })
    );
    expect(htmlLocked).toContain('Account Locked');
    expect(htmlLocked).toContain('cc-acc-banner--locked');
  });

  it('renders LoginForm with a real credential form and a Forgot password control', () => {
    const html = renderToStaticMarkup(
      React.createElement(LoginForm, { onLoginSuccess: () => {}, onRequestRecovery: () => {} })
    );
    expect(html).toContain('Sign In to CarChief');
    expect(html).toContain('data-testid="cust-login-email"');
    expect(html).toContain('data-testid="cust-login-password"');
    expect(html).toContain('Forgot password?');
    expect(html).not.toMatch(/are not verified and are not transmitted/i);
    expect(html).not.toMatch(/request demo session/i);
  });

  it('starts LoginForm with an empty password and no fabricated identity', () => {
    const html = renderToStaticMarkup(
      React.createElement(LoginForm, { onLoginSuccess: () => {}, onRequestRecovery: () => {} })
    );

    expect(html).not.toMatch(/sterling/i);
    expect(html).not.toContain('•');
    expect(html).toContain('placeholder="you@example.com"');
  });

  it('marks email and password as required, since the Mock API authoritatively validates both', () => {
    const html = renderToStaticMarkup(
      React.createElement(LoginForm, { onLoginSuccess: () => {}, onRequestRecovery: () => {} })
    );

    expect(html).toMatch(/data-testid="cust-login-email"[^>]*\srequired/);
    expect(html).toMatch(/data-testid="cust-login-password"[^>]*\srequired/);
  });

  it('renders protected child content when session is ACTIVE via AccountGuard', () => {
    const session: CustomerSession = {
      token: 'valid-token',
      user: { id: 'cust-1', name: 'Buyer', email: 'buyer@test.com', role: 'CustomerBuyer', permissions: [] },
      expiresAt: Math.floor(Date.now() / 1000) + 3600,
      status: 'ACTIVE',
    };

    const html = renderToStaticMarkup(
      React.createElement(
        AccountGuard,
        { initialSession: session },
        React.createElement('div', { id: 'protected-portal' }, 'Secret Fleet Details')
      )
    );

    expect(html).toContain('Secret Fleet Details');
    expect(html).not.toContain('Sign In to CarChief');
  });

  it('renders LoginForm instead of protected content when session is null', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        AccountGuard,
        { initialSession: null },
        React.createElement('div', { id: 'protected-portal' }, 'Secret Fleet Details')
      )
    );

    expect(html).toContain('Sign In to CarChief');
    expect(html).not.toContain('Secret Fleet Details');
  });

  it('renders the password-recovery request step, not a Keycloak dead end', () => {
    const html = renderToStaticMarkup(React.createElement(PasswordRecoveryCard));
    expect(html).toContain('Forgot your password?');
    expect(html).toContain('data-testid="cust-recovery-email"');
    expect(html).not.toMatch(/keycloak/i);
    expect(html).not.toContain('mailto:support@carchief.com');
  });

  describe('loginCustomer', () => {
    it('persists the session to sessionStorage on a successful credential login', async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        jsonResponse(200, {
          token: 'real-jwt-token',
          claims: {
            sub: 'cust-77',
            email: 'buyer@carchief.com',
            role: 'CustomerBuyer',
            permissions: ['read:public'],
            exp: Math.floor(Date.now() / 1000) + 3600,
          },
        })
      );
      vi.stubGlobal('fetch', fetchMock);

      const session = await loginCustomer('buyer@carchief.com', 'correct-horse-battery-1', 'https://app.test');

      expect(session.token).toBe('real-jwt-token');
      expect(session.user.email).toBe('buyer@carchief.com');
      expect(loadCustomerSession()?.token).toBe('real-jwt-token');

      const [url, options] = fetchMock.mock.calls[0];
      expect(String(url)).toBe('https://app.test/api/v1/auth/login');
      expect(JSON.parse(String((options as RequestInit).body))).toEqual({
        email: 'buyer@carchief.com',
        password: 'correct-horse-battery-1',
      });
    });

    it('surfaces a 401 as a NormalizedApiError with the Mock API generic message', async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        jsonResponse(401, { statusCode: 401, message: 'Invalid email or password', correlationId: 'corr-401' })
      );
      vi.stubGlobal('fetch', fetchMock);

      await expect(loginCustomer('unknown@carchief.com', 'wrong-password', 'https://app.test')).rejects.toMatchObject({
        statusCode: 401,
        message: 'Invalid email or password',
      });
      expect(loadCustomerSession()).toBeNull();
    });

    it('produces a byte-identical rejection for an unknown email and a wrong password', async () => {
      const unknownEmailBody = { statusCode: 401, message: 'Invalid email or password', correlationId: 'corr-401-a' };
      const wrongPasswordBody = { statusCode: 401, message: 'Invalid email or password', correlationId: 'corr-401-b' };

      vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(jsonResponse(401, unknownEmailBody)));
      let unknownEmailError: unknown;
      try {
        await loginCustomer('nobody@carchief.com', 'whatever12345', 'https://app.test');
      } catch (err) {
        unknownEmailError = err;
      }

      vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(jsonResponse(401, wrongPasswordBody)));
      let wrongPasswordError: unknown;
      try {
        await loginCustomer('real@carchief.com', 'wrongpassword1', 'https://app.test');
      } catch (err) {
        wrongPasswordError = err;
      }

      expect((unknownEmailError as { statusCode: number }).statusCode).toBe(
        (wrongPasswordError as { statusCode: number }).statusCode
      );
      expect((unknownEmailError as { message: string }).message).toBe((wrongPasswordError as { message: string }).message);
    });
  });

  describe('session persistence and clearing', () => {
    it('saves, loads and clears a session through sessionStorage', () => {
      const session: CustomerSession = {
        token: 'tok-1',
        user: { id: 'cust-1', name: 'Buyer', email: 'buyer@test.com', role: 'CustomerBuyer', permissions: [] },
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
        status: 'ACTIVE',
      };

      saveCustomerSession(session);
      expect(loadCustomerSession()?.token).toBe('tok-1');
      expect(sessionStorage.getItem('carchief_customer_token')).toBe('tok-1');

      clearCustomerSession();
      expect(loadCustomerSession()).toBeNull();
      expect(sessionStorage.getItem('carchief_customer_token')).toBeNull();
    });

    it('discards and clears an expired session on load', () => {
      const expiredSession: CustomerSession = {
        token: 'tok-expired',
        user: { id: 'cust-1', name: 'Buyer', email: 'buyer@test.com', role: 'CustomerBuyer', permissions: [] },
        expiresAt: Math.floor(Date.now() / 1000) - 10,
        status: 'ACTIVE',
      };

      saveCustomerSession(expiredSession);
      expect(loadCustomerSession()).toBeNull();
      expect(sessionStorage.getItem('carchief_customer_token')).toBeNull();
    });
  });

  describe('password recovery request/confirm', () => {
    it('always resolves the neutral accepted message for a reset request', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(
          jsonResponse(202, { message: 'If an account exists for that email, a password reset token has been issued to the mock outbox.' })
        )
      );

      const response = await requestCustomerPasswordReset('anyone@carchief.com', 'https://app.test');
      expect(response.message).toMatch(/if an account exists/i);
    });

    it('confirms a reset with the token and new password', async () => {
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { success: true }));
      vi.stubGlobal('fetch', fetchMock);

      const response = await confirmCustomerPasswordReset('reset-token-abc', 'BrandNewPassw0rd', 'BrandNewPassw0rd', 'https://app.test');
      expect(response.success).toBe(true);

      const [url, options] = fetchMock.mock.calls[0];
      expect(String(url)).toBe('https://app.test/api/v1/auth/password-reset/confirm');
      expect(JSON.parse(String((options as RequestInit).body))).toEqual({
        token: 'reset-token-abc',
        newPassword: 'BrandNewPassw0rd',
        confirmNewPassword: 'BrandNewPassw0rd',
      });
    });

    it('surfaces a 400 with a field for an expired or consumed reset token', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(
          jsonResponse(400, { statusCode: 400, message: 'Reset token is invalid or expired', correlationId: 'corr-400', field: 'token' })
        )
      );

      await expect(
        confirmCustomerPasswordReset('bad-token', 'BrandNewPassw0rd', 'BrandNewPassw0rd', 'https://app.test')
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });
});
