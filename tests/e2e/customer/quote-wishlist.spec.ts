import { test, expect, type Page, type APIRequestContext } from '@playwright/test';
import { CUSTOMER_APP_BASE_URL } from './customerAppBase.js';

/**
 * D02-P13-T005 — Get Free Quote and Add to Wishlist on the customer-app
 * vehicle detail page (CUST-31, CUST-33, CUST-36).
 *
 * D02-P13-CODE_REVIEW Finding 1: this task had no dedicated E2E spec and no
 * automated Playwright run was ever executed before the task was marked
 * complete. This spec closes that gap.
 *
 * Registers a fresh, uniquely emailed account per test (the
 * `account-access.spec.ts` / `registration-login.spec.ts` precedent) rather
 * than using the single shared fixture account plus a global
 * `POST /api/v1/__reset`: `__reset` wipes state for every account, so with
 * the three viewport projects running concurrently, one project's reset can
 * wipe another project's just-added wishlist item moments before its own
 * assertion runs. A freshly registered account's `CustomerProfile.phone`
 * defaults to `''`, and `POST /api/v1/enquiries` (which the "Get Free
 * Quote" button calls) requires a non-empty phone, so this file sets the
 * profile's phone via `PUT /api/v1/customer/profile` right after
 * registering — a one-time, real-contract call, not a fixture shortcut.
 */
const REGISTERED_PASSWORD = 'Sup3rSecretPass1';

async function registerFreshCustomerWithPhone(request: APIRequestContext): Promise<string> {
  const email = `cust-quote-wishlist-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  const registerResponse = await request.post(`${CUSTOMER_APP_BASE_URL}/api/v1/auth/register`, {
    data: {
      nameWithInitials: 'J. Quote',
      countryCode: 'KE',
      mobileNumber: '712345678',
      email,
      password: REGISTERED_PASSWORD,
      confirmPassword: REGISTERED_PASSWORD,
    },
  });
  expect(registerResponse.status()).toBe(201);

  const loginResponse = await request.post(`${CUSTOMER_APP_BASE_URL}/api/v1/auth/login`, {
    data: { email, password: REGISTERED_PASSWORD },
  });
  expect(loginResponse.status()).toBe(200);
  const { token } = (await loginResponse.json()) as { token: string };

  const profileResponse = await request.put(`${CUSTOMER_APP_BASE_URL}/api/v1/customer/profile`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { companyName: 'Isolation Test Co', phone: '+254712345678', deliveryAddress: '1 Test Lane, Nairobi' },
  });
  expect(profileResponse.status()).toBe(200);

  return email;
}

async function signIn(page: Page, email: string): Promise<void> {
  await page.goto(CUSTOMER_APP_BASE_URL);
  await page.getByTestId('cust-login-email').fill(email);
  await page.getByTestId('cust-login-password').fill(REGISTERED_PASSWORD);
  await page.getByTestId('cust-login-submit').click();
  // Wait for a real landmark of the authenticated shell, not a heading
  // absent from the rendered markup (see D02-P13-CODE_REVIEW Findings 2/3).
  await page.waitForSelector('.cc-cust-shell-layout', { timeout: 10000 });
}

test.describe('Customer vehicle detail Get Free Quote and Add to Wishlist E2E (D02-P13-T005)', () => {
  test('requests a quote twice with no error, toggles the wishlist and the wishlist state persists across reload', async ({
    page,
    request,
  }) => {
    const email = await registerFreshCustomerWithPhone(request);
    await signIn(page, email);

    const isDesktop = (page.viewportSize()?.width ?? 0) >= 1024;
    if (!isDesktop) {
      await page.getByTestId('cust-mobile-toggle').click();
    }
    const nav = page.locator(isDesktop ? '.cc-cust-shell-nav--desktop' : '.cc-cust-shell-nav--mobile');
    await nav.getByRole('link', { name: /Inventory/ }).click();
    await expect(page.getByTestId('customer-inventory-page')).toBeVisible();

    await page.locator('.cc-vehicle-card').first().click();
    await expect(page.getByTestId('customer-vehicle-detail-page')).toBeVisible();
    await expect(page.getByTestId('customer-actions-card')).toBeVisible();

    // Request a quote — succeeds and remains clickable for a repeat request.
    const quoteButton = page.getByTestId('quote-request-btn');
    await expect(quoteButton).toBeEnabled();
    await quoteButton.click();
    await expect(page.getByText('Quote Requested')).toBeVisible({ timeout: 5000 });

    // A repeat request is never blocked or shown as an error (CUST-31).
    const secondQuoteButton = page.getByTestId('quote-request-btn');
    await expect(secondQuoteButton).toBeEnabled({ timeout: 5000 });
    await secondQuoteButton.click();
    await expect(page.getByText('Quote Requested')).toBeVisible({ timeout: 5000 });

    // Toggle the wishlist on.
    const wishlistButton = page.getByTestId('wishlist-toggle-btn');
    await expect(wishlistButton).toHaveAttribute('aria-label', 'Add to wishlist');
    await wishlistButton.click();
    await expect(page.getByTestId('wishlist-toggle-btn')).toHaveAttribute('aria-label', 'Remove from wishlist', {
      timeout: 5000,
    });

    // Reload and confirm the wishlist state persists.
    await page.reload();
    await expect(page.getByTestId('customer-vehicle-detail-page')).toBeVisible();
    await expect(page.getByTestId('wishlist-toggle-btn')).toHaveAttribute('aria-label', 'Remove from wishlist', {
      timeout: 5000,
    });

    // Toggle the wishlist back off.
    await page.getByTestId('wishlist-toggle-btn').click();
    await expect(page.getByTestId('wishlist-toggle-btn')).toHaveAttribute('aria-label', 'Add to wishlist', {
      timeout: 5000,
    });
  });

  test('both action buttons are keyboard-operable with accessible, state-reflecting names', async ({
    page,
    request,
  }) => {
    const email = await registerFreshCustomerWithPhone(request);
    await signIn(page, email);

    const isDesktop = (page.viewportSize()?.width ?? 0) >= 1024;
    if (!isDesktop) {
      await page.getByTestId('cust-mobile-toggle').click();
    }
    const nav = page.locator(isDesktop ? '.cc-cust-shell-nav--desktop' : '.cc-cust-shell-nav--mobile');
    await nav.getByRole('link', { name: /Inventory/ }).click();
    await page.locator('.cc-vehicle-card').first().click();
    await expect(page.getByTestId('customer-vehicle-detail-page')).toBeVisible();

    const quoteButton = page.getByTestId('quote-request-btn');
    const wishlistButton = page.getByTestId('wishlist-toggle-btn');

    await quoteButton.focus();
    await expect(quoteButton).toBeFocused();
    await expect(quoteButton).toHaveAccessibleName(/Request free quote/);

    await wishlistButton.focus();
    await expect(wishlistButton).toBeFocused();
    await expect(wishlistButton).toHaveAccessibleName(/Add to wishlist/);

    await page.keyboard.press('Enter');
    await expect(wishlistButton).toHaveAccessibleName(/Remove from wishlist/, { timeout: 5000 });
  });
});
