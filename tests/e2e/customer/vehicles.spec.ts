import { test, expect, type Page } from '@playwright/test';
import { CUSTOMER_APP_BASE_URL } from './customerAppBase.js';

/** Signs in through the Mock API demo-session endpoint and waits for the shell. */
const FIXTURE_EMAIL = 'demo.customer@carchief.com';
const FIXTURE_PASSWORD = 'CarChief#Fixture2026';

/** Signs in with the seeded fixture credential (D02-P12-T001), the removed
 * demo-session endpoint's replacement (D02-P12-T007 reopen of D02-P12-T005's
 * customer-app e2e migration — this file's helper still targeted the deleted
 * `Request Demo Session` button). */
async function signIn(page: Page): Promise<void> {
  await page.goto(CUSTOMER_APP_BASE_URL);
  await page.getByTestId('cust-login-email').fill(FIXTURE_EMAIL);
  await page.getByTestId('cust-login-password').fill(FIXTURE_PASSWORD);
  await page.getByTestId('cust-login-submit').click();
  await expect(page.getByRole('heading', { name: 'Customer Portal' })).toBeVisible();
}

test.describe('Customer Fleet & Vehicle Detail E2E (D02-P04-T003)', () => {
  test('navigates to My Vehicles, checks status groupings and filters by search query', async ({ page }) => {
    await signIn(page);

    const isDesktop = (page.viewportSize()?.width ?? 0) >= 1024;
    if (!isDesktop) {
      await page.getByTestId('cust-mobile-toggle').click();
    }
    const nav = page.locator(isDesktop ? '.cc-cust-shell-nav--desktop' : '.cc-cust-shell-nav--mobile');

    // Click My Vehicles link
    await nav.getByRole('link', { name: /My Vehicles/ }).click();

    // Verify fleet page is rendered
    await expect(page.getByTestId('customer-fleet-page')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'My Vehicles' })).toBeVisible();
    await expect(page.getByTestId('fleet-tabs')).toBeVisible();

    // Verify all status tabs are visible
    await expect(page.getByTestId('tab-all')).toBeVisible();
    await expect(page.getByTestId('tab-under-negotiation')).toBeVisible();
    await expect(page.getByTestId('tab-pi-issued')).toBeVisible();
    await expect(page.getByTestId('tab-confirmed')).toBeVisible();
    await expect(page.getByTestId('tab-in-transit')).toBeVisible();
    await expect(page.getByTestId('tab-delivered')).toBeVisible();

    // Verify search input
    const searchInput = page.getByTestId('fleet-search-input');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('HiAce');

    // Verify filtered card is visible
    await expect(page.getByText('2020 Toyota HiAce Van')).toBeVisible();

    // Clear search
    await page.getByTestId('fleet-search-clear').click();
    await expect(searchInput).toHaveValue('');
  });

  test('switches status tabs and verifies category scoping (RULE-08)', async ({ page }) => {
    await signIn(page);

    const isDesktop = (page.viewportSize()?.width ?? 0) >= 1024;
    if (!isDesktop) {
      await page.getByTestId('cust-mobile-toggle').click();
    }
    const nav = page.locator(isDesktop ? '.cc-cust-shell-nav--desktop' : '.cc-cust-shell-nav--mobile');
    await nav.getByRole('link', { name: /My Vehicles/ }).click();

    await expect(page.getByTestId('customer-fleet-page')).toBeVisible();

    // Switch to In Transit tab
    await page.getByTestId('tab-in-transit').click();
    await expect(page.getByTestId('tab-in-transit')).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByText('2020 Toyota HiAce Van')).toBeVisible();

    // Switch to Delivered tab
    await page.getByTestId('tab-delivered').click();
    await expect(page.getByTestId('tab-delivered')).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByText('2022 Nissan X-Trail')).toBeVisible();

    // Switch back to All
    await page.getByTestId('tab-all').click();
    await expect(page.getByTestId('tab-all')).toHaveAttribute('aria-selected', 'true');
  });

  test('opens vehicle detail page, verifies specs, 50% deposit (RULE-07), timeline, tracking and documents', async ({ page }) => {
    await signIn(page);

    const isDesktop = (page.viewportSize()?.width ?? 0) >= 1024;
    if (!isDesktop) {
      await page.getByTestId('cust-mobile-toggle').click();
    }
    const nav = page.locator(isDesktop ? '.cc-cust-shell-nav--desktop' : '.cc-cust-shell-nav--mobile');
    await nav.getByRole('link', { name: /My Vehicles/ }).click();

    await expect(page.getByTestId('customer-fleet-page')).toBeVisible();

    // Click on View Details for Corolla Axio
    const detailBtn = page.getByRole('button', { name: /View details for 2021 Toyota Corolla Axio/ });
    await detailBtn.click();

    // Verify detail page elements
    await expect(page.getByTestId('customer-fleet-detail-page')).toBeVisible();
    await expect(page.getByRole('heading', { name: '2021 Toyota Corolla Axio' })).toBeVisible();
    await expect(page.getByText('Chassis: NZE141-1234567')).toBeVisible();
    await expect(page.locator('.cc-cust-fleet-badge--confirmed')).toBeVisible();

    // Verify specifications section
    await expect(page.getByText('Vehicle Specifications')).toBeVisible();

    // Verify transaction milestones timeline
    await expect(page.getByText('Transaction Milestones')).toBeVisible();
    await expect(page.getByText('48-hour reservation hold placed')).toBeVisible();

    // Verify financial and 50% deposit summary
    await expect(page.getByText('Financial & Deposit Summary')).toBeVisible();
    await expect(page.getByText('Required Deposit (50%)')).toBeVisible();

    // Verify shipping & tracking
    await expect(page.getByText('Shipping & Logistics Tracking')).toBeVisible();

    // Verify export clearance documents
    await expect(page.getByText('Export & Clearance Documents')).toBeVisible();

    // Verify back navigation returns to fleet page
    await page.getByTestId('back-to-fleet-btn').click();
    await expect(page.getByTestId('customer-fleet-page')).toBeVisible();
  });
});
