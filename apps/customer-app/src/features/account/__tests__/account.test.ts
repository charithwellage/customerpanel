import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  isSessionExpired,
  createDemoCustomerSession,
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
      nonProduction: true,
      claims: {
        sub: 'usr_buyer_999',
        role: 'CustomerBuyer' as const,
        permissions: ['read:vehicles'],
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
    };

    const session = createDemoCustomerSession(demoRes);
    expect(session.token).toBe('mock_demo_jwt_token_123');
    expect(session.user.id).toBe('usr_buyer_999');
    expect(session.user.role).toBe('CustomerBuyer');
    expect(session.status).toBe('ACTIVE');
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
    expect(html).toContain('c.sterling@sterlingimports.com');
    expect(html).toContain('Forgot Password?');
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
