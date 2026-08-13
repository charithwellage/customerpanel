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
    expect(html).toContain('Keycloak Secured');
  });

  it('renders all required customer navigation items with active route highlighting', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        CustomerShellProvider,
        { initialRoute: '/inventory' },
        React.createElement(CustomerNav)
      )
    );

    expect(html).toContain('Dashboard');
    expect(html).toContain('Inventory');
    expect(html).toContain('My Vehicles');
    expect(html).toContain('Invoices &amp; Ledger');
    expect(html).toContain('Shipments');
    expect(html).toContain('Documents');
    expect(html).toContain('Profile &amp; Account');
    expect(html).toContain('aria-current="page"');
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
    expect(html).toContain('aria-controls="customer-mobile-menu"');
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
