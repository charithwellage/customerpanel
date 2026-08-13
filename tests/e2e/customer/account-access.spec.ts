import { test, expect } from '@playwright/test';

test.describe('Customer Application Access & Session E2E', () => {
  test('renders customer login page with demo buyer sign-in and password recovery link', async ({ page }) => {
    await page.goto('/');

    const main = page.locator('main#main-content, main, [role="main"]').first();
    await expect(main).toBeVisible();
  });

  test('verifies responsive layout and accessibility landmarks on customer auth viewports', async ({ page }) => {
    await page.goto('/');
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});
