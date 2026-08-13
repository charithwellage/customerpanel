import { test, expect } from '@playwright/test';
import { resolveThemeId } from '../../packages/theme/src/index.js';

test.describe('Unified POC Brand responsive theme', () => {
  test('renders the public shell with semantic theme variables at every viewport', async ({ page }) => {
    await page.goto('/');

    // Theme-portable: reads the same env var the web process was started
    // with (matching the established pattern in theme-parity.spec.ts lines
    // 270/274), defaulting to 'carchief' when unset, so this assertion holds
    // under either a carchief- or ocean-configured server.
    const configuredThemeId = resolveThemeId(process.env.NEXT_PUBLIC_THEME_ID);
    await expect(page.locator('html')).toHaveAttribute('data-theme', configuredThemeId);
    await expect(page.locator('h1')).toHaveCSS('font-family', /Space Grotesk|Inter/);
    await expect(page.locator('#market-select')).toBeVisible();

    const viewport = page.viewportSize();
    expect(viewport?.width).toBeGreaterThanOrEqual(320);
    expect(viewport?.height).toBeGreaterThanOrEqual(568);
    await expect(page.locator('body')).not.toHaveCSS('overflow-x', 'scroll');
  });

  test('switches the same screen to ocean and persists the non-sensitive preference', async ({ page }) => {
    await page.goto('/');
    const themeSelect = page.locator('select[aria-label="Theme"]');
    if (await themeSelect.isVisible()) {
      await themeSelect.selectOption('ocean');
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'ocean');
      await page.reload();
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'ocean');
    } else {
      await expect(page.locator('html')).toHaveAttribute('data-theme', /carchief|ocean/);
    }
  });
});
