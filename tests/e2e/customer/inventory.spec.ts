import { test, expect, type Page } from '@playwright/test';
import { CUSTOMER_APP_BASE_URL } from './customerAppBase.js';

/** Signs in through the Mock API demo-session endpoint and waits for the shell. */
const FIXTURE_EMAIL = 'prabodha@carchief.com';
const FIXTURE_PASSWORD = 'Password@1234';

/** Signs in with the seeded fixture credential (D02-P12-T001), the removed
 * demo-session endpoint's replacement (D02-P12-T007 reopen of D02-P12-T005's
 * customer-app e2e migration — this file's helper still targeted the deleted
 * `Request Demo Session` button). */
async function signIn(page: Page): Promise<void> {
  await page.goto(CUSTOMER_APP_BASE_URL);
  await page.getByTestId('cust-login-email').fill(FIXTURE_EMAIL);
  await page.getByTestId('cust-login-password').fill(FIXTURE_PASSWORD);
  await page.getByTestId('cust-login-submit').click();
  await expect(page.locator('.cc-cust-shell-layout')).toBeVisible({ timeout: 10000 });
}

test.describe('Customer Inventory & Vehicle Detail E2E (D02-P03-T003)', () => {
  test('navigates to inventory, displays tier status and searches available vehicles', async ({ page }) => {
    await signIn(page);

    const isDesktop = (page.viewportSize()?.width ?? 0) >= 1024;
    if (!isDesktop) {
      await page.getByTestId('cust-mobile-toggle').click();
    }
    const nav = page.locator(isDesktop ? '.cc-cust-shell-nav--desktop' : '.cc-cust-shell-nav--mobile');

    // Click Inventory link
    await nav.getByRole('link', { name: /Inventory/ }).click();

    // Verify inventory page is rendered
    await expect(page.getByTestId('customer-inventory-page')).toBeVisible();
    await expect(page.getByRole('region', { name: 'Customer tier pricing status' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'CarChief Inventory Search' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Vehicle search and filters' })).toBeVisible();

    // Verify total count
    await expect(page.getByTestId('inventory-total-count')).toContainText(/Showing \d+ of \d+ Vehicles/);

    // Verify at least one vehicle card is visible
    const vehicleCards = page.locator('.cc-vehicle-card');
    await expect(vehicleCards.first()).toBeVisible();
  });

  test('opens vehicle detail page, places 48h reservation hold, and observes hold status', async ({ page }) => {
    await signIn(page);

    const isDesktop = (page.viewportSize()?.width ?? 0) >= 1024;
    if (!isDesktop) {
      await page.getByTestId('cust-mobile-toggle').click();
    }
    const nav = page.locator(isDesktop ? '.cc-cust-shell-nav--desktop' : '.cc-cust-shell-nav--mobile');
    await nav.getByRole('link', { name: /Inventory/ }).click();

    await expect(page.getByTestId('customer-inventory-page')).toBeVisible();

    // Click the first vehicle card
    const firstCard = page.locator('.cc-vehicle-card').first();
    await firstCard.click();

    // Verify detail page elements
    await expect(page.getByTestId('customer-vehicle-detail-page')).toBeVisible();
    await expect(page.getByTestId('vehicle-pricing-card')).toBeVisible();
    await expect(page.getByTestId('vehicle-reservation-card')).toBeVisible();
    await expect(page.getByText('Vehicle Specifications')).toBeVisible();

    // If eligible for reservation, place hold and verify success banner
    const reserveBtn = page.getByTestId('reserve-vehicle-btn');
    if (await reserveBtn.isVisible()) {
      await reserveBtn.click();
      await expect(page.getByText('You have an active 48-hour reservation hold')).toBeVisible();
    } else {
      // Either already reserved or held
      await expect(page.getByTestId('vehicle-reservation-card')).toBeVisible();
    }

    // Verify back navigation returns to inventory
    await page.getByTestId('back-to-inventory-btn').click();
    await expect(page.getByTestId('customer-inventory-page')).toBeVisible();
  });
});
