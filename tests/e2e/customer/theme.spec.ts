import { test, expect } from '@playwright/test';
import { CUSTOMER_APP_BASE_URL } from './customerAppBase.js';

const expectedTheme = process.env.CUSTOMER_THEME_ID === 'ocean' ? 'ocean' : 'carchief';

test.describe('Customer theme configuration and parity', () => {
  test('applies the configured theme while preserving the accessible shell', async ({ page }) => {
    const failedRequests: string[] = [];
    page.on('requestfailed', (request) => failedRequests.push(`${request.method()} ${request.url()}`));

    await page.goto(CUSTOMER_APP_BASE_URL);
    await expect(page.locator('html')).toHaveAttribute('data-theme', expectedTheme);
    await expect(page.getByRole('heading', { name: 'Sign In to CarChief' })).toBeVisible();

    const primary = await page.locator('html').evaluate((element) =>
      window.getComputedStyle(element).getPropertyValue('--color-primary').trim(),
    );
    expect(primary).not.toBe('');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

    await page.getByRole('button', { name: /Request Demo Session/ }).focus();
    await expect(page.getByRole('button', { name: /Request Demo Session/ })).toBeFocused();
    expect(failedRequests).toEqual([]);
  });
});
