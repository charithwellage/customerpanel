import { test, expect } from '@playwright/test';

test.describe('Home and Showroom Experience Phase 1.2 tests', () => {
  test('renders hero, market controls, collections, and buying process preview', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Find your next vehicle');
    await expect(page.locator('#market-select')).toBeVisible();
    await expect(page.getByText('Latest Arrivals (In Japan)')).toBeVisible();
    await expect(page.getByText('Premium Stock Teaser')).toBeVisible();
    await expect(page.getByText('CarChief 5-Step Sourcing Process')).toBeVisible();
  });

  test('provides Premium Stock navigation and WhatsApp contact link', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Premium Stock' })).toBeVisible();
    await expect(page.getByText('💬 Chat with Sales on WhatsApp')).toBeVisible();
  });
});
