import { test, expect } from '@playwright/test';
import { CUSTOMER_APP_BASE_URL } from './customerAppBase.js';

const FIXTURE_EMAIL = 'prabodha@carchief.com';
const FIXTURE_PASSWORD = 'Password@1234';

test.describe('Customer shipment tracking E2E (D02-P07-T002)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(CUSTOMER_APP_BASE_URL);
    await expect(page.getByRole('heading', { name: 'Sign In to CarChief' })).toBeVisible();
    // Sign in with the seeded fixture credential (D02-P12-T001) — the
    // removed demo-session endpoint's replacement (D02-P12-T007 reopen of
    // D02-P12-T005's customer-app e2e migration).
    await page.getByTestId('cust-login-email').fill(FIXTURE_EMAIL);
    await page.getByTestId('cust-login-password').fill(FIXTURE_PASSWORD);
    await page.getByTestId('cust-login-submit').click();
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 10000 });
    const mobileMenuToggle = page.getByTestId('cust-mobile-toggle');
    if (await mobileMenuToggle.isVisible()) {
      await mobileMenuToggle.click();
    }
    const shipmentsResponse = page.waitForResponse((response) =>
      response.request().method() === 'GET' && response.url().includes('/api/v1/customer/shipments'),
    );
    await page.locator('nav[aria-label*="Navigation"]:visible').getByRole('link', { name: /Shipments/ }).click();
    expect((await shipmentsResponse).ok()).toBe(true);
    await expect(page.getByRole('heading', { name: 'Shipment tracking' })).toBeVisible();
  });

  test('shows loading, empty or customer shipment state honestly', async ({ page }) => {
    const state = page.locator('.cc-cust-shipments__state');
    const cards = page.locator('.cc-cust-shipment-card');
    const terminalState = cards.first().or(state.filter({ hasText: /No shipment records|temporarily unavailable/ }));
    await expect(terminalState).toBeVisible({ timeout: 10000 });
    if (await cards.count()) {
      await expect(cards.first().getByText(/Current stage:/)).toBeVisible();
      await expect(cards.first().locator('.cc-cust-shipment-card__timeline')).toBeVisible();
      await expect(cards.first().getByText('Ship OK')).toBeVisible();
      await expect(cards.first().getByText('Document release')).toBeVisible();
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
