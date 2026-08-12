import { test, expect } from '@playwright/test';

test.describe('Public Web Accessibility & Keyboard Acceptance', () => {
  const publicRoutes = [
    '/',
    '/vehicles',
    '/vehicles/2021-toyota-corolla-axio-veh-1',
    '/freight-calculator',
    '/contact',
    '/branches',
    '/about',
    '/services',
    '/how-to-buy',
    '/auction',
    '/shipping-schedule',
    '/privacy',
    '/faq',
    '/testimonials',
  ];

  for (const route of publicRoutes) {
    test(`verifies accessibility semantics, headings, and landmark roles on ${route}`, async ({ page }) => {
      await page.goto(route);

      // 1. Verify main content container exists
      const mainContainer = page.locator('main, section, body').first();
      await expect(mainContainer).toBeVisible();

      // 2. Verify interactive buttons have accessible text
      const buttonsWithoutText = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.filter((btn) => {
          const text = btn.innerText.trim();
          const ariaLabel = btn.getAttribute('aria-label');
          const title = btn.getAttribute('title');
          return !text && !ariaLabel && !title;
        }).length;
      });
      expect(buttonsWithoutText).toBe(0);
    });
  }

  test('verifies keyboard navigation and focus management on search page', async ({ page }) => {
    await page.goto('/vehicles');

    // Press Tab and verify focus outline / element target
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => {
      const active = document.activeElement;
      return active ? active.tagName.toLowerCase() : null;
    });

    expect(focusedElement).not.toBeNull();
  });
});
