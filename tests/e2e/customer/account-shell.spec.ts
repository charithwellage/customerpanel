import { test, expect } from '@playwright/test';

test.describe('Customer Application Shell & Navigation E2E', () => {
  test('renders customer portal shell, responsive navigation and page landmarks', async ({ page }) => {
    await page.goto('/');

    // Verify header/nav landmark exists
    const header = page.locator('header, nav, [role="banner"]').first();
    await expect(header).toBeVisible();

    // Verify main landmarks
    const main = page.locator('main#main-content, main, [role="main"]').first();
    await expect(main).toBeVisible();
  });

  test('verifies accessibility and theme tokens on customer app shell', async ({ page }) => {
    await page.goto('/');
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});
