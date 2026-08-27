import { test, expect } from '@playwright/test';

test.describe('Public Web Globalization & i18n Language Switcher (D02-P14-T006)', () => {
  test('renders language switcher and changes language across viewports', async ({ page }) => {
    await page.goto('/');

    const isMobile = (page.viewportSize()?.width ?? 1280) <= 768;

    if (isMobile) {
      const mobileToggle = page.locator('.mobile-menu-toggle');
      await expect(mobileToggle).toBeVisible();
      await mobileToggle.click();

      const mobileSwitcher = page.locator('#mobile-language-switcher');
      await expect(mobileSwitcher).toBeVisible();

      // Switch to Spanish
      await mobileSwitcher.selectOption('es');
      await expect(page.locator('html')).toHaveAttribute('lang', 'es');
      await expect(page.locator('.mobile-nav-links-list')).toContainText('Inicio');

      // Switch to Japanese
      await mobileSwitcher.selectOption('ja');
      await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
      await expect(page.locator('.mobile-nav-links-list')).toContainText('ホーム');

      // Switch back to English
      await mobileSwitcher.selectOption('en');
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
      await expect(page.locator('.mobile-nav-links-list')).toContainText('Home');
    } else {
      const desktopSwitcher = page.locator('#desktop-language-switcher');
      await expect(desktopSwitcher).toBeVisible();

      // Default is English
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
      await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');

      // Switch to Japanese
      await desktopSwitcher.selectOption('ja');
      await expect(page.locator('html')).toHaveAttribute('lang', 'ja');

      // Verify localized nav items
      await expect(page.locator('.desktop-nav')).toContainText('ホーム');
      await expect(page.locator('.desktop-nav')).toContainText('在庫車両一覧');

      // Verify localStorage persistence
      const savedLang = await page.evaluate(() => localStorage.getItem('carchief_lang'));
      expect(savedLang).toBe('ja');

      // Verify googtrans cookie
      const cookies = await page.context().cookies();
      const googtransCookie = cookies.find((c) => c.name === 'googtrans');
      expect(googtransCookie?.value).toContain('/en/ja');

      // Reload page and check persistence
      await page.reload();
      await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
      await expect(page.locator('.desktop-nav')).toContainText('ホーム');

      // Switch to Arabic (RTL)
      await desktopSwitcher.selectOption('ar');
      await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
      await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

      // Switch back to English
      await desktopSwitcher.selectOption('en');
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
      await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    }
  });
});
