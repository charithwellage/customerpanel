import { test, expect } from '@playwright/test';

test.describe('Home and Showroom Experience Phase 1.2 tests', () => {
  test('renders hero, market controls, collections, and buying process preview', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('PREMIUM VEHICLES');
    await expect(page.locator('#market-select')).toBeVisible();
    await expect(page.getByText('Latest Arrivals (In Japan)')).toBeVisible();
    await expect(page.getByText('Premium Stock Teaser')).toBeVisible();
    await expect(page.getByText('CarChief 5-Step Sourcing Process')).toBeVisible();
  });

  test('provides Premium Stock navigation and WhatsApp contact link', async ({ page }) => {
    await page.goto('/');
    const mobileMenu = page.locator('.mobile-menu-toggle');
    if (await mobileMenu.isVisible()) {
      await mobileMenu.click();
    }
    await expect(page.getByRole('link', { name: 'Premium Stock', exact: true })).toBeVisible();
    await expect(page.getByText('💬 Chat with Sales on WhatsApp')).toBeVisible();
  });
});
