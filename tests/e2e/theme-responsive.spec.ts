import { test, expect } from '@playwright/test';

test.describe('Unified POC Brand responsive theme', () => {
  test('renders the public shell with semantic theme variables at every viewport', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'carchief');
    await expect(page.locator('h1')).toHaveCSS('font-family', /Space Grotesk|Inter/);
    await expect(page.locator('.primary')).toHaveCSS('background-color', 'rgb(220, 38, 38)');
    await expect(page.locator('input[type="search"]')).toBeVisible();

    const viewport = page.viewportSize();
    expect(viewport?.width).toBeGreaterThanOrEqual(320);
    expect(viewport?.height).toBeGreaterThanOrEqual(568);
    await expect(page.locator('body')).not.toHaveCSS('overflow-x', 'scroll');
  });
});
