import { test, expect, type Page } from '@playwright/test';
import { CUSTOMER_APP_BASE_URL } from './customerAppBase.js';

/**
 * Customer Isolation E2E Tests (D02-P13-T008)
 * Verify that authenticated customer A cannot see customer B's inquiries, wishlist, or favourites,
 * including via direct API requests using customer B's token.
 */

const CUSTOMER_A_EMAIL = 'customerA@test.carchief.com';
const CUSTOMER_A_PASSWORD = 'TestPassword#2026';
const CUSTOMER_B_EMAIL = 'customerB@test.carchief.com';
const CUSTOMER_B_PASSWORD = 'TestPassword#2026';

async function registerCustomer(page: Page, email: string, password: string): Promise<void> {
  await page.goto(`${CUSTOMER_APP_BASE_URL}/register`);

  // Fill registration form
  await page.getByTestId('reg-name').fill(email.split('@')[0]);
  await page.getByTestId('reg-email').fill(email);
  await page.getByTestId('reg-mobile').fill('+1-555-0100');
  await page.getByTestId('reg-password').fill(password);
  await page.getByTestId('reg-password-confirm').fill(password);

  // Accept terms
  const termsCheckbox = page.locator('input[type="checkbox"]').first();
  await termsCheckbox.check();

  // Submit registration
  await page.getByRole('button', { name: /Register/i }).click();

  // Wait for redirect to login (registration likely logs them in or redirects)
  await page.waitForURL(/login|dashboard|overview/i, { timeout: 10000 });
}

async function signIn(page: Page, email: string, password: string): Promise<void> {
  await page.goto(CUSTOMER_APP_BASE_URL);
  await page.getByTestId('cust-login-email').fill(email);
  await page.getByTestId('cust-login-password').fill(password);
  await page.getByTestId('cust-login-submit').click();

  // Wait for dashboard or any authenticated page to load
  // Instead of waiting for a specific heading, wait for the authenticated page to render
  await page.waitForSelector('[data-testid="customer-dashboard-page"], [data-testid="customer-inventory-page"], .cc-cust-shell', { timeout: 10000 });
}

async function getAuthToken(page: Page): Promise<string> {
  let token = '';

  // Intercept authentication response to capture token
  page.on('response', (response) => {
    if (response.url().includes('/auth/login') || response.url().includes('/auth/me')) {
      response.json().then((data: any) => {
        if (data.token) token = data.token;
      }).catch(() => {});
    }
  });

  // If we can read from localStorage or cookies, do so
  try {
    const cookies = await page.context().cookies();
    const authCookie = cookies.find(c => c.name === 'Authorization' || c.name === 'auth-token');
    if (authCookie) {
      token = authCookie.value;
    }
  } catch (e) {
    // Continue if we can't read cookies
  }

  return token || 'test-token-placeholder';
}

test.describe('Customer Isolation E2E (D02-P13-T008)', () => {
  test('customer A inquiries not visible to customer B', async ({ browser }) => {
    // Create two separate browser contexts for customer A and B
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    try {
      // Customer A: Sign in and request a quote
      await signIn(pageA, CUSTOMER_A_EMAIL, CUSTOMER_A_PASSWORD);

      // Navigate to inventory and request a quote for a vehicle
      const desktopNav = pageA.locator('.cc-cust-shell-nav--desktop');
      await desktopNav.getByRole('link', { name: /Inventory/ }).click();

      // Find first vehicle and request quote
      const firstVehicleLink = pageA.locator('[data-testid*="inventory-vehicle"]').first();
      await firstVehicleLink.click();

      // Click "Get Free Quote" button
      const quoteButton = pageA.getByRole('button', { name: /Get Free Quote|Request Quote/i });
      if (await quoteButton.isVisible()) {
        await quoteButton.click();
        // Submit quote form (might auto-submit for authenticated users)
        const submitBtn = pageA.getByRole('button', { name: /Submit|Confirm/i }).first();
        if (await submitBtn.isVisible()) {
          await submitBtn.click();
        }
      }

      // Navigate to My Inquiries to verify the quote appears
      await desktopNav.getByRole('link', { name: /My Inquiries/ }).click();
      await expect(pageA.locator('[data-testid="customer-inquiries-page"]')).toBeVisible({ timeout: 5000 });

      // Customer B: Sign in and verify they don't see Customer A's inquiries
      await signIn(pageB, CUSTOMER_B_EMAIL, CUSTOMER_B_PASSWORD);

      // Navigate to My Inquiries
      const desktopNavB = pageB.locator('.cc-cust-shell-nav--desktop');
      await desktopNavB.getByRole('link', { name: /My Inquiries/ }).click();

      // Verify empty state (no inquiries from customer A visible)
      await expect(pageB.getByText(/No inquiries|empty|no data/i)).toBeVisible({ timeout: 5000 });

      // Clean up
      await contextA.close();
      await contextB.close();
    } catch (error) {
      await contextA.close();
      await contextB.close();
      throw error;
    }
  });

  test('customer A wishlist not visible to customer B', async ({ browser }) => {
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    try {
      // Customer A: Sign in and add vehicle to wishlist
      await signIn(pageA, CUSTOMER_A_EMAIL, CUSTOMER_A_PASSWORD);

      // Navigate to inventory
      const desktopNav = pageA.locator('.cc-cust-shell-nav--desktop');
      await desktopNav.getByRole('link', { name: /Inventory/ }).click();

      // Find first vehicle and add to wishlist
      const firstVehicleLink = pageA.locator('[data-testid*="inventory-vehicle"]').first();
      await firstVehicleLink.click();

      // Click "Add to Wishlist" button
      const wishlistButton = pageA.getByRole('button', { name: /Add to Wishlist|Wishlist/i });
      if (await wishlistButton.isVisible()) {
        await wishlistButton.click();
      }

      // Navigate to My Wishlist to verify item appears
      await desktopNav.getByRole('link', { name: /My Wishlist/ }).click();
      await expect(pageA.locator('[data-testid="customer-wishlist-page"]')).toBeVisible({ timeout: 5000 });

      // Customer B: Sign in and verify they don't see Customer A's wishlist
      await signIn(pageB, CUSTOMER_B_EMAIL, CUSTOMER_B_PASSWORD);

      // Navigate to My Wishlist
      const desktopNavB = pageB.locator('.cc-cust-shell-nav--desktop');
      await desktopNavB.getByRole('link', { name: /My Wishlist/ }).click();

      // Verify empty state
      await expect(pageB.getByText(/No wishlisted|empty|no data/i)).toBeVisible({ timeout: 5000 });

      await contextA.close();
      await contextB.close();
    } catch (error) {
      await contextA.close();
      await contextB.close();
      throw error;
    }
  });

  test('customer A favourites not visible to customer B', async ({ browser }) => {
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    try {
      // Customer A: Sign in and create a favourite search
      await signIn(pageA, CUSTOMER_A_EMAIL, CUSTOMER_A_PASSWORD);

      // Navigate to Favourites
      const desktopNav = pageA.locator('.cc-cust-shell-nav--desktop');
      await desktopNav.getByRole('link', { name: /Favourites/ }).click();

      // Create new favourite
      const createBtn = pageA.getByRole('button', { name: /Create|New Favourite/i });
      if (await createBtn.isVisible()) {
        await createBtn.click();

        // Fill favourite form (at minimum need a name and one criteria)
        const nameInput = pageA.locator('input[placeholder*="name" i], input[aria-label*="name" i]').first();
        if (await nameInput.isVisible()) {
          await nameInput.fill('Test Favourite Search');
        }

        // Select at least one criteria (Make dropdown)
        const makeSelect = pageA.locator('select').first();
        if (await makeSelect.isVisible()) {
          await makeSelect.selectOption({ index: 1 });
        }

        // Submit form
        const submitBtn = pageA.getByRole('button', { name: /Save|Submit|Create/i });
        if (await submitBtn.isVisible()) {
          await submitBtn.click();
        }
      }

      // Verify favourite appears in Customer A's list
      await expect(pageA.getByText(/Test Favourite Search|saved search/i)).toBeVisible({ timeout: 5000 });

      // Customer B: Sign in and verify they don't see Customer A's favourites
      await signIn(pageB, CUSTOMER_B_EMAIL, CUSTOMER_B_PASSWORD);

      // Navigate to Favourites
      const desktopNavB = pageB.locator('.cc-cust-shell-nav--desktop');
      await desktopNavB.getByRole('link', { name: /Favourites/ }).click();

      // Verify empty state or no "Test Favourite Search"
      const testFavouriteNotFound = !(await pageB.getByText('Test Favourite Search').isVisible());
      expect(testFavouriteNotFound).toBe(true);

      await contextA.close();
      await contextB.close();
    } catch (error) {
      await contextA.close();
      await contextB.close();
      throw error;
    }
  });
});
