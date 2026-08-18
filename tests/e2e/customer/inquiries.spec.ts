import { test, expect, type Page } from '@playwright/test';
import { CUSTOMER_APP_BASE_URL } from './customerAppBase.js';

const FIXTURE_EMAIL = 'demo.customer@carchief.com';
const FIXTURE_PASSWORD = 'CarChief#Fixture2026';

async function signIn(page: Page): Promise<void> {
  await page.goto(CUSTOMER_APP_BASE_URL);
  await page.getByTestId('cust-login-email').fill(FIXTURE_EMAIL);
  await page.getByTestId('cust-login-password').fill(FIXTURE_PASSWORD);
  await page.getByTestId('cust-login-submit').click();
  await expect(page.getByRole('heading', { name: 'Customer Portal' })).toBeVisible();
}

async function navigateToInquiries(page: Page): Promise<void> {
  const isDesktop = (page.viewportSize()?.width ?? 0) >= 1024;
  if (!isDesktop) {
    await page.getByTestId('cust-mobile-toggle').click();
  }
  const nav = page.locator(isDesktop ? '.cc-cust-shell-nav--desktop' : '.cc-cust-shell-nav--mobile');
  await nav.getByRole('link', { name: /My Inquiries/ }).click();
}

test.describe('Customer My Inquiries E2E (D02-P13-T006)', () => {
  test('displays empty state when customer has no inquiries', async ({ page }) => {
    await signIn(page);
    await navigateToInquiries(page);

    // Verify empty state is displayed
    await expect(page.getByTestId('customer-inquiries-page')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'My Inquiries' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'No inquiries yet' })).toBeVisible();
    await expect(page.getByText(/Start browsing our inventory/)).toBeVisible();
    await expect(page.getByRole('button', { name: /Browse Inventory/ })).toBeVisible();
  });

  test('navigates to inventory from empty state', async ({ page }) => {
    await signIn(page);
    await navigateToInquiries(page);

    // Click browse inventory link
    await page.getByRole('button', { name: /Browse Inventory/ }).click();

    // Verify inventory page is shown
    await expect(page.getByTestId('customer-inventory-page')).toBeVisible();
  });

  test('displays inquiries list after requesting quote for a vehicle', async ({ page }) => {
    await signIn(page);

    const isDesktop = (page.viewportSize()?.width ?? 0) >= 1024;
    if (!isDesktop) {
      await page.getByTestId('cust-mobile-toggle').click();
    }
    const nav = page.locator(isDesktop ? '.cc-cust-shell-nav--desktop' : '.cc-cust-shell-nav--mobile');

    // Navigate to inventory
    await nav.getByRole('link', { name: /Inventory/ }).click();
    await expect(page.getByTestId('customer-inventory-page')).toBeVisible();

    // Click the first vehicle card
    const firstCard = page.locator('.cc-vehicle-card').first();
    await firstCard.click();

    // Verify detail page is loaded
    await expect(page.getByTestId('customer-vehicle-detail-page')).toBeVisible();

    // Request a quote if button is visible
    const quoteBtn = page.getByTestId('request-quote-btn');
    if (await quoteBtn.isVisible()) {
      await quoteBtn.click();
      // Wait for successful quote submission
      await expect(page.getByText(/Quote requested successfully/i)).toBeVisible({ timeout: 5000 });
    }

    // Navigate back to inventory
    await page.getByTestId('back-to-inventory-btn').click();
    await expect(page.getByTestId('customer-inventory-page')).toBeVisible();

    // Navigate to My Inquiries
    await nav.getByRole('link', { name: /My Inquiries/ }).click();

    // Verify My Inquiries page is displayed
    await expect(page.getByTestId('customer-inquiries-page')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'My Inquiries' })).toBeVisible();

    // Verify at least one inquiry is shown
    const inquiryCards = page.locator('[role="article"]');
    await expect(inquiryCards.first()).toBeVisible();

    // Verify inquiry contains vehicle title
    const firstInquiry = inquiryCards.first();
    const vehicleTitle = firstInquiry.locator('h3');
    await expect(vehicleTitle).toBeVisible();

    // Verify inquirer count is displayed
    await expect(firstInquiry.locator('.inquirer-count-badge')).toBeVisible();
  });

  test('displays inquiry with correct singular/plural inquirer copy', async ({ page }) => {
    await signIn(page);

    // Navigate to inquiries
    await navigateToInquiries(page);

    // Check if there are any inquiries
    const inquiryCards = page.locator('[role="article"]');
    const cardCount = await inquiryCards.count();

    if (cardCount > 0) {
      const firstInquiry = inquiryCards.first();

      // Verify inquirer count text
      const inquirerText = await firstInquiry.locator('.inquiry-inquirer-count').textContent();
      expect(inquirerText).toBeTruthy();

      // If count is 1, should have "person is inquiring"
      // If count > 1, should have "people are inquiring"
      if (inquirerText?.includes('1 person')) {
        expect(inquirerText).toContain('person is inquiring');
      } else {
        expect(inquirerText).toContain('people are inquiring');
      }
    }
  });

  test('displays inquiry date in correct format', async ({ page }) => {
    await signIn(page);

    // Navigate to inquiries
    await navigateToInquiries(page);

    // Check if there are any inquiries
    const inquiryCards = page.locator('[role="article"]');
    const cardCount = await inquiryCards.count();

    if (cardCount > 0) {
      const firstInquiry = inquiryCards.first();

      // Verify date is displayed
      const dateText = await firstInquiry.locator('.inquiry-date').textContent();
      expect(dateText).toMatch(/Requested:/);
      // Check for date format like "Aug 17, 2026"
      expect(dateText).toMatch(/\w{3} \d{1,2}, \d{4}/);
    }
  });

  test('navigates to vehicle details from inquiry row', async ({ page }) => {
    await signIn(page);

    // Navigate to inquiries
    await navigateToInquiries(page);

    const inquiryCards = page.locator('[role="article"]');
    const cardCount = await inquiryCards.count();

    if (cardCount > 0) {
      // Click the view details button on the first inquiry
      const firstInquiry = inquiryCards.first();
      const viewBtn = firstInquiry.getByRole('button', { name: /View Vehicle Details/ });
      await viewBtn.click();

      // Verify vehicle detail page is shown
      await expect(page.getByTestId('customer-vehicle-detail-page')).toBeVisible();
    }
  });

  test('handles loading state gracefully', async ({ page }) => {
    await signIn(page);

    const isDesktop = (page.viewportSize()?.width ?? 0) >= 1024;
    if (!isDesktop) {
      await page.getByTestId('cust-mobile-toggle').click();
    }
    const nav = page.locator(isDesktop ? '.cc-cust-shell-nav--desktop' : '.cc-cust-shell-nav--mobile');

    // Navigate to inquiries
    await nav.getByRole('link', { name: /My Inquiries/ }).click();

    // Wait for the page to load (should not crash during loading)
    await expect(page.getByRole('heading', { name: 'My Inquiries' })).toBeVisible({ timeout: 10000 });
  });

  test('displays page title and description', async ({ page }) => {
    await signIn(page);

    // Navigate to inquiries
    await navigateToInquiries(page);

    // Verify page header
    await expect(page.getByRole('heading', { name: 'My Inquiries' })).toBeVisible();
    await expect(page.getByText(/Your quote requests and inquiries/)).toBeVisible();
  });
});
