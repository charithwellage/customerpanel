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

    // Focus check on the real sign-in control (D02-P12-T007 reopen of
    // D02-P12-T005's customer-app e2e migration — this file's assertion
    // still targeted the removed `Request Demo Session` button).
    await page.getByTestId('cust-login-submit').focus();
    await expect(page.getByTestId('cust-login-submit')).toBeFocused();
    expect(failedRequests).toEqual([]);
  });
});
