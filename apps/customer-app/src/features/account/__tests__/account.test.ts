import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  isSessionExpired,
  createDemoCustomerSession,
  deriveCustomerDisplayName,
  AccountStateBanner,
  PasswordRecoveryCard,
  LoginForm,
  AccountGuard,
  CustomerSession,
} from '../index.js';

describe('Customer App Account & Auth Feature Unit Tests', () => {
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

  it('creates structured CustomerSession from DemoSessionResponse claims', () => {
    const demoRes = {
      token: 'mock_demo_jwt_token_123',
      nonProduction: true as const,
      claims: {
        sub: 'usr_buyer_999',
        email: 'buyer999@carchief.com',
        role: 'CustomerBuyer' as const,
        permissions: ['read:vehicles'],
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
    };

    const session = createDemoCustomerSession(demoRes);
    expect(session.token).toBe('mock_demo_jwt_token_123');
    expect(session.user.id).toBe('usr_buyer_999');
    expect(session.user.role).toBe('CustomerBuyer');
    expect(session.user.permissions).toEqual(['read:vehicles']);
    expect(session.expiresAt).toBe(demoRes.claims.exp);
    expect(session.status).toBe('ACTIVE');
  });

  // Regression guard for the fabricated-identity defect (D02-P01-CODE_REVIEW
  // finding 3): the session must reflect the claims the Mock API actually
  // returned, never an invented person or company.
  it('derives identity only from real claims and invents no name or company', () => {
    const demoRes = {
      token: 'mock_demo_jwt_token_456',
      nonProduction: true as const,
      // Exactly what apps/mock-api mints via createDemoJwtToken('CustomerBuyer').
      claims: {
        sub: 'user-123',
        email: 'user@carchief.com',
        role: 'CustomerBuyer' as const,
        permissions: ['read:public', 'create:inquiry', 'create:reservation'],
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
    };

    const session = createDemoCustomerSession(demoRes);
    expect(session.user.id).toBe('user-123');
    expect(session.user.email).toBe('user@carchief.com');
    expect(session.user.name).toBe('user');
    expect(session.user.company).toBeUndefined();
    expect(JSON.stringify(session)).not.toMatch(/sterling/i);
  });

  it('falls back to a generic label when the token carries no email', () => {
    expect(deriveCustomerDisplayName(undefined)).toBe('Demo Customer');
    expect(deriveCustomerDisplayName('')).toBe('Demo Customer');
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

  it('renders PasswordRecoveryCard with AutoPulse/Keycloak identity boundary notice', () => {
    const html = renderToStaticMarkup(React.createElement(PasswordRecoveryCard));
    expect(html).toContain('KEYCLOAK IDENTITY BOUNDARY');
    expect(html).toContain('DEC-CUST-IDENTITY-RECOVERY');
    expect(html).toContain('Contact Identity Operations');
  });

  it('renders LoginForm with work email, password, and sign in button', () => {
    const html = renderToStaticMarkup(
      React.createElement(LoginForm, { onLoginSuccess: () => {}, onRequestRecovery: () => {} })
    );
    expect(html).toContain('Sign In to CarChief');
    expect(html).toContain('Work Email Address');
    expect(html).toContain('data-testid="cust-login-email"');
    expect(html).toContain('data-testid="cust-login-password"');
    expect(html).toContain('Forgot Password?');
  });

  // Regression guard for D02-P01-CODE_REVIEW finding 3: the form must not ship
  // pre-filled credentials that make it look like someone is already signed in.
  it('starts LoginForm with empty credentials and no fabricated identity', () => {
    const html = renderToStaticMarkup(
      React.createElement(LoginForm, { onLoginSuccess: () => {}, onRequestRecovery: () => {} })
    );

    expect(html).not.toMatch(/sterling/i);
    // The dot-filled "already typed" password placeholder value.
    expect(html).not.toContain('•');
    expect(html).toContain('value=""');
    // The example address lives in a placeholder attribute, never in a value.
    expect(html).toContain('placeholder="you@example.com"');
  });

  // The demo-session endpoint ignores the credential fields, so marking them
  // `required` would be browser-only validation with no server counterpart
  // (prohibited by TASK_EXECUTION_PROTOCOL.md §7) and would also block the
  // only sign-in path this build has.
  it('does not enforce credential fields the mock never validates', () => {
    const html = renderToStaticMarkup(
      React.createElement(LoginForm, { onLoginSuccess: () => {}, onRequestRecovery: () => {} })
    );

    expect(html).not.toMatch(/<input[^>]*\srequired/);
    expect(html).toContain('are not verified and are not transmitted');
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
});
