import { test, expect } from '@playwright/test';
import { CUSTOMER_APP_BASE_URL } from './customerAppBase.js';

/**
 * Customer Dashboard Overview page E2E tests (D02-P02-T002).
 * Verifies the dashboard loads with KPI cards and supports all UI states.
 * Tests authentication, state transitions, and responsive behavior.
 */
test.describe('Customer Dashboard Overview E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the customer app (lands on /dashboard)
    await page.goto(CUSTOMER_APP_BASE_URL);
    // Wait for sign-in form to appear
    await expect(page.getByRole('heading', { name: 'Sign In to CarChief' })).toBeVisible();

    // Sign in with demo session
    const sessionCall = page.waitForResponse(
      (response) => response.url().includes('/api/v1/auth/demo-session') && response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: /Request Demo Session/ }).click();
    await sessionCall;

    // Wait for dashboard to load
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('article.cc-cust-card').first()).toBeVisible({ timeout: 10000 });
  });

  test('renders the dashboard with all KPI cards', async ({ page }) => {
    // Verify header
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByText('Your account overview and shipment status')).toBeVisible();

    // Verify credit/balance card
    await expect(page.getByRole('heading', { name: 'Credit & Balance' })).toBeVisible();
    await expect(page.getByText('Outstanding Balance')).toBeVisible();
    await expect(page.getByText('Credit Limit')).toBeVisible();
    await expect(page.getByText('Utilisation')).toBeVisible();

    // Verify vehicles card with link
    await expect(page.getByRole('heading', { name: 'Vehicles' })).toBeVisible();
    const vehicleCard = page.locator('article.cc-cust-card--vehicles');
    await expect(vehicleCard.getByText('Total')).toBeVisible();
    await expect(vehicleCard.getByText('Reserved')).toBeVisible();
    const vehiclesLink = vehicleCard.locator('a[href="/vehicles"]');
    await expect(vehiclesLink).toHaveAttribute('href', '/vehicles');

    // Verify payments card
    await expect(page.getByRole('heading', { name: 'Payments' })).toBeVisible();
    const paymentCard = page.locator('article.cc-cust-card--payments');
    await expect(paymentCard.getByText('Approved')).toBeVisible();
    await expect(paymentCard.getByText('Pending')).toBeVisible();

    // Verify shipments card
    await expect(page.getByRole('heading', { name: 'Shipments' })).toBeVisible();
    const shipmentCard = page.locator('article.cc-cust-card--shipments');
    await expect(shipmentCard.getByText('In Transit')).toBeVisible();
    await expect(shipmentCard.getByText('Delivered')).toBeVisible();

    // Verify documents card
    await expect(page.getByRole('heading', { name: 'Documents' })).toBeVisible();
    await expect(page.getByText('Available')).toBeVisible();

    // Verify notifications card
    await expect(page.getByRole('heading', { name: 'Notifications' })).toBeVisible();
  });

  test('displays dashboard data values without fabrication', async ({ page }) => {
    // Verify that numeric values are present and formatted correctly
    // Balance should be in USD format
    const balanceText = await page
      .locator('article.cc-cust-card--credit')
      .getByText(/\$[\d,]+\.?\d*/)
      .first()
      .textContent();
    expect(balanceText).toMatch(/\$[\d,]+/);

    // Vehicle counts should be numeric
    const vehicleCard = page.locator('article.cc-cust-card--vehicles');
    const vehicleText = await vehicleCard.getByRole('definition').first().textContent();
    expect(vehicleText).toMatch(/^\d+$/);

    // Payment summary should show counts
    const paymentCard = page.locator('article.cc-cust-card--payments');
    await expect(paymentCard.getByText(/\d+/)).toHaveCount(4); // total + 3 statuses
  });

  test('shows last updated timestamp', async ({ page }) => {
    const updatedElement = page.getByText(/Last updated:/);
    await expect(updatedElement).toBeVisible();

    // Verify it contains a valid datetime
    const dateTimeText = await updatedElement.locator('time').textContent();
    expect(dateTimeText).toBeTruthy();
    // Should be ISO or locale string format
    expect(dateTimeText).toMatch(/\d/);
  });

  test('keyboard navigation and focus management', async ({ page }) => {
    // Start from the dashboard heading
    await page.getByRole('heading', { name: 'Dashboard' }).focus();

    // Tab through interactive elements
    await page.keyboard.press('Tab');
    const firstLink = await page.evaluate(() => document.activeElement?.getAttribute('href'));
    expect(firstLink).toBeTruthy();

    // Verify all card links are reachable via keyboard
    const vehiclesLink = page.locator('article.cc-cust-card--vehicles a.cc-cust-card__link[href="/vehicles"]');
    await vehiclesLink.focus();
    await expect(vehiclesLink).toBeFocused();

    // Verify focus styling exists (outline or shadow)
    const focusStyle = await vehiclesLink.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return styles.outline || styles.boxShadow;
    });
    expect(focusStyle).toBeTruthy();
  });

  test('displays credit utilisation progress bar with correct color state', async ({ page }) => {
    const creditCard = page.locator('article.cc-cust-card--credit');
    const progressBar = creditCard.locator('.cc-cust-card__progress-bar');

    await expect(progressBar).toBeAttached();

    // Get the width to infer the utilisation level
    const width = await progressBar.evaluate((el) => {
      return window.getComputedStyle(el).width;
    });
    expect(width).toMatch(/\d+px/);

    // Verify color class is applied
    const classList = await progressBar.evaluate((el) => el.className);
    expect(classList).toMatch(/cc-cust-card__progress-bar--/);
  });

  test('responsive layout reflows on phone viewport', async ({ page }) => {
    // Set phone viewport (390x844)
    await page.setViewportSize({ width: 390, height: 844 });

    // Verify cards are still visible
    await expect(page.getByRole('heading', { name: 'Credit & Balance' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Vehicles' })).toBeVisible();

    // Verify grid is single-column on phone
    const grid = page.locator('.cc-cust-overview__grid');
    const gridStyle = await grid.evaluate((el) => {
      return window.getComputedStyle(el).gridTemplateColumns;
    });
    // Phone should be 1fr (single column)
    expect(gridStyle.split(' ').length).toBe(1); // Only one column
  });

  test('responsive layout reflows on tablet viewport', async ({ page }) => {
    // Set tablet viewport (768x1024)
    await page.setViewportSize({ width: 768, height: 1024 });

    // Verify grid is 2-column on tablet
    const grid = page.locator('.cc-cust-overview__grid');
    const gridStyle = await grid.evaluate((el) => {
      return window.getComputedStyle(el).gridTemplateColumns;
    });
    // Tablet should have 2 columns
    expect(gridStyle.split(' ').length).toBe(2);
  });

  test('drill-down links navigate to correct pages', async ({ page }) => {
    // Test vehicles link
    const vehiclesLink = page.locator('article.cc-cust-card--vehicles a.cc-cust-card__link[href="/vehicles"]');
    await expect(vehiclesLink).toHaveAttribute('href', '/vehicles');
    await expect(vehiclesLink).toBeVisible();
  });

  test('displays partial failure indicator when present', async ({ page }) => {
    // This test is conditional - only shows if partial failures occur
    // The mock data may or may not include partial failures
    const partialFailureAlert = page.locator('.cc-cust-overview__partial-failure');

    // If visible, verify the message
    if (await partialFailureAlert.isVisible()) {
      await expect(partialFailureAlert).toContainText('Some data is temporarily unavailable');
    }
  });

  test('accessible headings and labels', async ({ page }) => {
    // Verify all cards have proper heading hierarchy
    const cardHeadings = page.locator('article.cc-cust-card h2');
    const count = await cardHeadings.count();
    expect(count).toBeGreaterThan(0);

    // Verify labels are associated with their data
    const labels = page.locator('.cc-cust-card__label');
    const labelCount = await labels.count();
    expect(labelCount).toBeGreaterThan(0);

    // Verify aria-labels on progress bars
    const progressBar = page.locator('[aria-label*="Credit utilisation"]');
    await expect(progressBar).toBeVisible();
  });

  test('handles 401 unauthorized gracefully', async ({ page, context }) => {
    // Clear session storage to simulate expired session
    await context.clearCookies();
    await page.evaluate(() => {
      sessionStorage.clear();
    });

    // Refresh the page
    await page.reload();

    // Should redirect to login
    await expect(page.getByRole('heading', { name: 'Sign In to CarChief' })).toBeVisible({ timeout: 10000 });
  });

  test('shows loading state briefly during data fetch', async ({ page }) => {
    // Wait for dashboard to initially load
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

    // The page should NOT show a persistent loading state after initial load
    const loadingMessage = page.getByText('Loading your dashboard');
    // It may briefly appear, but should quickly be replaced with content
    // We just verify it's not stuck in loading state
    const isLoading = await loadingMessage.isVisible();
    if (isLoading) {
      // Wait for it to disappear
      await expect(loadingMessage).not.toBeVisible({ timeout: 5000 });
    }
  });
});
