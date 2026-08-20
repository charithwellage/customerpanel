import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CustomerShell, CustomerNav, CustomerShellProvider, CustomerErrorBoundary } from '../index.js';

describe('Customer App Shell & Navigation Unit Tests', () => {
  it('renders complete customer app shell with header, nav, main container and footer landmarks', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        CustomerShell,
        { initialRoute: '/dashboard', pageTitle: 'Customer Dashboard', pageSubtitle: 'Overview of operations' },
        React.createElement('div', { id: 'test-content' }, 'Dashboard Content')
      )
    );

    expect(html).toContain('CARCHIEF');
    expect(html).toContain('CUSTOMER PORTAL');
    expect(html).toContain('Customer Dashboard');
    expect(html).toContain('Overview of operations');
    expect(html).toContain('Dashboard Content');
    expect(html).toContain('cc-cust-shell-footer');
    expect(html).toContain('Mock API Enabled');
    expect(html).not.toMatch(/demo session/i);
  });

  // Regression guard for D02-P01-CODE_REVIEW finding 4: no surface may claim an
  // active Keycloak integration, because this build has none — the Mock API
  // mints a token signed `demo-signature`.
  it('never claims a live Keycloak integration in the shell chrome', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        CustomerShell,
        { initialRoute: '/dashboard' },
        React.createElement('div', null, 'Content')
      )
    );

    expect(html).not.toContain('Keycloak Secured');
    expect(html).not.toMatch(/Keycloak/i);
  });

  // Regression guard for D02-P12-T005 (CUST-30): no placeholder or demo
  // identity is invented when the shell is rendered without a session — the
  // running application never reaches this state (AccountGuard blocks it),
  // so the nav renders a static, non-interactive "not signed in" indicator.
  it('renders no fabricated placeholder identity when rendered without a session', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        CustomerShellProvider,
        { initialRoute: '/dashboard' },
        React.createElement(CustomerNav)
      )
    );

    expect(html).not.toMatch(/demo customer/i);
    expect(html).not.toMatch(/sterling/i);
    expect(html).toContain('Not signed in');
    expect(html).not.toContain('href="/login"');
  });

  it('renders all required customer navigation items with active route highlighting', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        CustomerShellProvider,
        { initialRoute: '/inventory' },
        React.createElement(CustomerNav)
      )
    );

    // All 5 consolidated group toggles are always visible regardless of route
    expect(html).toContain('Dashboard');           // customer.dashboard → 'Dashboard' (English i18n)
    expect(html).toContain('All Inventory Stock'); // label fallback
    expect(html).toContain('My Vehicles');         // customer.myVehicles → 'My Vehicles'
    expect(html).toContain('Finances');            // label fallback
    expect(html).toContain('Account');             // label fallback

    // Active route is highlighted
    expect(html).toContain('aria-current="page"');
  });

  it('renders My Vehicles sub-items including wishlist and inquiries', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        CustomerShellProvider,
        { initialRoute: '/vehicles' },
        React.createElement(CustomerNav)
      )
    );

    // My Vehicles group is active for /vehicles — sub-items should be rendered
    expect(html).toContain('My Vehicles');        // customer.myVehicles → 'My Vehicles'
    expect(html).toContain('My Wishlist');        // customer.wishlist fallback
    expect(html).toContain('Inquiries &amp; Quotes'); // customer.inquiries fallback
    expect(html).toContain('My Statement');        // customer.statement fallback
    expect(html).toContain('aria-current="page"');
  });

  it('renders Finances sub-items with Wire Remittance and without Purchased Vehicles or Documents', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        CustomerShellProvider,
        { initialRoute: '/payments' },
        React.createElement(CustomerNav)
      )
    );

    expect(html).toContain('Wire Remittance');
    expect(html).not.toContain('Purchased Vehicles');
    expect(html).not.toContain('Secure Vault');
  });

  it('renders mobile menu toggle button with aria-expanded attribute', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        CustomerShellProvider,
        { initialRoute: '/dashboard' },
        React.createElement(CustomerNav)
      )
    );

    expect(html).toContain('cc-cust-shell-mobile-toggle');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toMatch(/aria-controls="[^"]+"/);
  });

  // Regression guard for D02-P01-CODE_REVIEW finding 5: the drawer id must come
  // from useId so two navs in one document cannot collide on aria-controls.
  it('gives each navigation instance a unique mobile-drawer id', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        CustomerShellProvider,
        { initialRoute: '/dashboard' },
        React.createElement(
          React.Fragment,
          null,
          React.createElement(CustomerNav),
          React.createElement(CustomerNav)
        )
      )
    );

    const ids = [...html.matchAll(/aria-controls="([^"]+)"/g)].map((match) => match[1]);
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
    expect(html).not.toContain('customer-mobile-menu');
  });

  // Regression guard for D02-P12-T005: the shell exposes a real sign-out
  // action once a session exists, and never renders one when the caller
  // supplies no `onSignOut` (for example an isolated component test).
  it('renders a sign-out control only when a session and onSignOut are both present', () => {
    const withHandler = renderToStaticMarkup(
      React.createElement(
        CustomerShellProvider,
        {
          initialRoute: '/dashboard',
          initialUser: { id: 'cust-1', name: 'J. Access', email: 'j@example.com', role: 'CUSTOMER' },
          onSignOut: () => {},
        },
        React.createElement(CustomerNav)
      )
    );
    expect(withHandler).toContain('Sign out');

    const withoutHandler = renderToStaticMarkup(
      React.createElement(
        CustomerShellProvider,
        {
          initialRoute: '/dashboard',
          initialUser: { id: 'cust-1', name: 'J. Access', email: 'j@example.com', role: 'CUSTOMER' },
        },
        React.createElement(CustomerNav)
      )
    );
    expect(withoutHandler).not.toContain('Sign out');
  });

  it('renders loading surface when loading prop is true', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        CustomerShell,
        { loading: true },
        React.createElement('div', null, 'Hidden Content')
      )
    );

    expect(html).toContain('Loading portal data');
    expect(html).not.toContain('Hidden Content');
  });

  it('renders error surface when error prop is provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        CustomerShell,
        { error: 'Failed to fetch customer profile' },
        React.createElement('div', null, 'Hidden Content')
      )
    );

    expect(html).toContain('Unable to load section data.');
    expect(html).toContain('Failed to fetch customer profile');
    expect(html).not.toContain('Hidden Content');
  });

  it('renders CustomerErrorBoundary fallback when fallback prop is specified or error state is set', () => {
    const boundary = new CustomerErrorBoundary({ children: React.createElement('div', null, 'Normal Content') });
    boundary.state = { hasError: true, error: new Error('Simulated runtime error') };
    const html = renderToStaticMarkup(boundary.render() as React.ReactElement);

    expect(html).toContain('Portal Surface Error');
    expect(html).toContain('Simulated runtime error');
  });
});
