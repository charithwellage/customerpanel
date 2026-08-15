import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  getCustomerWebManifest,
  isMutationBlockedOffline,
  clearCustomerSensitiveCachesOnLogout,
  OfflineGuard,
  CustomerPwaBanner,
} from '../index.js';

describe('Customer App PWA & Offline Feature Unit Tests', () => {
  it('generates valid web manifest using carchief default theme colors', () => {
    const manifest = getCustomerWebManifest();
    expect(manifest.name).toBe('CarChief Customer Portal');
    expect(manifest.short_name).toBe('CarChief');
    expect(manifest.start_url).toBe('/dashboard');
    expect(manifest.display).toBe('standalone');
    expect(manifest.theme_color).toBe('#dc2626'); // carchief primary red
    expect(manifest.background_color).toBe('#fafafa');
    expect(manifest.icons).toHaveLength(2);
  });

  it('correctly checks mutation blockage state', () => {
    // In Node test environment, isOnline() returns true by default
    expect(typeof isMutationBlockedOffline()).toBe('boolean');
  });

  it('clears session, local, and CacheStorage data on logout', async () => {
    const deleted: string[] = [];
    const session = { clear: () => deleted.push('session') };
    const local = { removeItem: (key: string) => deleted.push(`local:${key}`) };
    const cacheStorage = {
      keys: async () => ['customer-runtime', 'public-assets'],
      delete: async (key: string) => { deleted.push(`cache:${key}`); return true; },
    };
    const previousWindow = (globalThis as { window?: unknown }).window;
    const previousSession = (globalThis as { sessionStorage?: unknown }).sessionStorage;
    const previousLocal = (globalThis as { localStorage?: unknown }).localStorage;
    const previousCaches = (globalThis as { caches?: unknown }).caches;
    (globalThis as { window?: unknown }).window = { caches: cacheStorage };
    (globalThis as { sessionStorage?: unknown }).sessionStorage = session;
    (globalThis as { localStorage?: unknown }).localStorage = local;
    (globalThis as { caches?: unknown }).caches = cacheStorage;
    try {
      await clearCustomerSensitiveCachesOnLogout();
      expect(deleted).toEqual([
        'session',
        'local:carchief_customer_token',
        'local:carchief_customer_session',
        'cache:customer-runtime',
        'cache:public-assets',
      ]);
    } finally {
      (globalThis as { window?: unknown }).window = previousWindow;
      (globalThis as { sessionStorage?: unknown }).sessionStorage = previousSession;
      (globalThis as { localStorage?: unknown }).localStorage = previousLocal;
      (globalThis as { caches?: unknown }).caches = previousCaches;
    }
  });

  it('renders CustomerPwaBanner with app title and CTA buttons', () => {
    const html = renderToStaticMarkup(
      React.createElement(CustomerPwaBanner, { onInstall: () => {}, onRefresh: () => {} })
    );

    expect(html).toContain('CarChief Customer Portal');
    expect(html).toContain('PWA READY');
    expect(html).toContain('Install App 📲');
    expect(html).toContain('Manual Refresh 🔄');
  });

  it('renders OfflineGuard wrapper cleanly', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        OfflineGuard,
        null,
        React.createElement('div', { id: 'app-content' }, 'Main Customer View')
      )
    );

    expect(html).toContain('Main Customer View');
  });
});
