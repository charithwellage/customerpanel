import { test, expect } from '@playwright/test';

test.describe('Public Website Phase 1.1 browser smoke tests', () => {
  test('loads the real public shell and exposes the mock-backed showroom', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/CarChief/);
    await expect(page.locator('h1')).toContainText('PREMIUM VEHICLES');
    await expect(page.locator('#market-select')).toBeVisible();
    await expect(page.locator('#showroom')).toBeVisible();
  });

  test('serves the public PWA manifest and health endpoint', async ({ page, request }) => {
    await page.goto('/');
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/manifest.webmanifest');
    const health = await request.get('/healthz');
    expect(health.ok()).toBeTruthy();
  });
});
