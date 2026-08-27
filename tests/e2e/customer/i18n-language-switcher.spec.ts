import { test, expect } from '@playwright/test';
import { CUSTOMER_APP_BASE_URL } from './customerAppBase.js';

const FIXTURE_EMAIL = 'prabodha@carchief.com';
const FIXTURE_PASSWORD = 'Password@1234';

test.describe('Customer App Globalization & i18n Language Switcher (D02-P14-T006)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(CUSTOMER_APP_BASE_URL);
    await expect(page.getByRole('heading', { name: 'Sign In to CarChief' })).toBeVisible();

    const sessionCall = page.waitForResponse(
      (response) => response.url().includes('/api/v1/auth/login') && response.request().method() === 'POST',
    );
    await page.getByTestId('cust-login-email').fill(FIXTURE_EMAIL);
    await page.getByTestId('cust-login-password').fill(FIXTURE_PASSWORD);
    await page.getByTestId('cust-login-submit').click();
    await sessionCall;

    await expect(page.getByRole('heading', { name: /Welcome/ })).toBeVisible({ timeout: 10000 });
  });

  test('renders language switcher in customer app and updates navigation labels', async ({ page }) => {
    const isMobile = (page.viewportSize()?.width ?? 1280) < 1024;

    if (isMobile) {
      const mobileToggle = page.locator('[data-testid="cust-mobile-toggle"]');
      await expect(mobileToggle).toBeVisible();
      await mobileToggle.click();

      const mobileSwitcher = page.locator('#mobile-cust-language-switcher');
      await expect(mobileSwitcher).toBeVisible();

      // Switch to Spanish
      await mobileSwitcher.selectOption('es');
      await expect(page.locator('html')).toHaveAttribute('lang', 'es');
      await expect(page.locator('.cc-cust-shell-nav--mobile')).toContainText('Panel Principal');

      // Switch to Swahili
      await mobileSwitcher.selectOption('sw');
      await expect(page.locator('html')).toHaveAttribute('lang', 'sw');
      await expect(page.locator('.cc-cust-shell-nav--mobile')).toContainText('Dashibodi');

      // Switch back to English
      await mobileSwitcher.selectOption('en');
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
      await expect(page.locator('.cc-cust-shell-nav--mobile')).toContainText('Dashboard');
    } else {
      const desktopSwitcher = page.locator('#desktop-cust-language-switcher');
      await expect(desktopSwitcher).toBeVisible();

      // Default English navigation label
      await expect(page.locator('.cc-cust-shell-nav--desktop')).toContainText('Dashboard');

      // Switch to Spanish
      await desktopSwitcher.selectOption('es');
      await expect(page.locator('html')).toHaveAttribute('lang', 'es');
      await expect(page.locator('.cc-cust-shell-nav--desktop')).toContainText('Panel Principal');

      // Verify localStorage persistence
      const savedLang = await page.evaluate(() => localStorage.getItem('carchief_lang'));
      expect(savedLang).toBe('es');

      // Switch to Swahili
      await desktopSwitcher.selectOption('sw');
      await expect(page.locator('html')).toHaveAttribute('lang', 'sw');
      await expect(page.locator('.cc-cust-shell-nav--desktop')).toContainText('Dashibodi');

      // Switch back to English
      await desktopSwitcher.selectOption('en');
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
      await expect(page.locator('.cc-cust-shell-nav--desktop')).toContainText('Dashboard');
    }
  });
});
