import { test, expect } from '@playwright/test';
import { CUSTOMER_APP_BASE_URL } from './customerAppBase.js';

test.describe('Customer PWA and performance acceptance', () => {
  test('serves an installable manifest and safe static-shell service worker', async ({ page, request }) => {
    const manifest = await request.get(`${CUSTOMER_APP_BASE_URL}/manifest.webmanifest`);
    expect(manifest.ok()).toBe(true);
    const manifestBody = await manifest.json() as { start_url: string; display: string; icons: unknown[] };
    expect(manifestBody.start_url).toBe('/dashboard');
    expect(manifestBody.display).toBe('standalone');
    expect(manifestBody.icons).toHaveLength(2);

    await page.goto(CUSTOMER_APP_BASE_URL);
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/manifest.webmanifest');
    await expect.poll(async () => page.evaluate(async () => Boolean(navigator.serviceWorker?.controller || await navigator.serviceWorker?.getRegistration()))).toBe(true);
    const registrations = await page.evaluate(async () => navigator.serviceWorker?.getRegistrations().then((items) => items.map((item) => item.scope)) ?? []);
    expect(registrations.some((scope) => scope.endsWith('/'))).toBe(true);

    const cacheUrls = await page.evaluate(async () => {
      const keys = await caches.keys();
      const requests = await Promise.all(keys.map(async (key) => (await caches.open(key)).keys()));
      return requests.flat().map((request) => request.url);
    });
    expect(cacheUrls.some((url) => /\/api\/v1\/(customer|payments|invoices|documents)/.test(url))).toBe(false);
  });

  test('keeps initial customer shell within the local performance budget', async ({ page }) => {
    await page.goto(CUSTOMER_APP_BASE_URL);
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      return {
        domContentLoaded: navigation?.domContentLoadedEventEnd ?? 0,
        domNodes: document.querySelectorAll('*').length,
        horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      };
    });
    expect(metrics.domContentLoaded).toBeLessThan(3000);
    expect(metrics.domNodes).toBeLessThan(2500);
    expect(metrics.horizontalOverflow).toBe(false);
  });
});
