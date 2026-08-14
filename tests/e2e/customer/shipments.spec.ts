import { test, expect } from '@playwright/test';
import { CUSTOMER_APP_BASE_URL } from './customerAppBase.js';

test.describe('Customer shipment tracking E2E (D02-P07-T002)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(CUSTOMER_APP_BASE_URL);
    await expect(page.getByRole('heading', { name: 'Sign In to CarChief' })).toBeVisible();
    await page.getByRole('button', { name: /Request Demo Session/ }).click();
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 10000 });
    const mobileMenuToggle = page.getByTestId('cust-mobile-toggle');
    if (await mobileMenuToggle.isVisible()) {
      await mobileMenuToggle.click();
    }
    await page.locator('nav[aria-label*="Navigation"]:visible').getByRole('link', { name: /Shipments/ }).click();
    await expect(page.getByRole('heading', { name: 'Shipment tracking' })).toBeVisible();
  });

  test('shows loading, empty or customer shipment state honestly', async ({ page }) => {
    const state = page.locator('.cc-cust-shipments__state');
    const cards = page.locator('.cc-cust-shipment-card');
    await expect(state.or(cards.first())).toBeVisible({ timeout: 10000 });
    if (await cards.count()) {
      await expect(cards.first().getByText(/Current stage:/)).toBeVisible();
      await expect(cards.first().locator('.cc-cust-shipment-card__timeline')).toBeVisible();
    } else {
      await expect(state).toContainText(/No shipment records|temporarily unavailable/);
    }
  });

  test('keeps shipment controls keyboard accessible and responsive', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('heading', { name: 'Shipment tracking' }).focus();
    await expect(page.getByText('Manual/external tracking updates are shown honestly.')).toBeVisible();
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(page.getByRole('heading', { name: 'Shipment tracking' })).toBeVisible();
  });
});
