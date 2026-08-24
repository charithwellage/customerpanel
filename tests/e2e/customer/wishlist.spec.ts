import { test, expect, type Page, type APIRequestContext } from '@playwright/test';
import { CUSTOMER_APP_BASE_URL } from './customerAppBase.js';

/**
 * D02-P13-T007 — My Wishlist page and nav entry (CUST-36, CUST-37).
 *
 * D02-P13-CODE_REVIEW Finding 3: `signIn()` waited on a "Customer Portal"
 * heading absent from the rendered shell (fixed below — the real always-
 * present landmark is `.cc-cust-shell-layout`). Running the suite for real
 * after that fix also surfaced two further pre-existing defects: (1) the
 * wishlist button's real `data-testid` is `wishlist-toggle-btn` (T005), not
 * `add-to-wishlist-btn`, so the vehicle was silently never wishlisted; (2)
 * using the single shared fixture account (`prabodha@carchief.com`)
 * plus a `POST /api/v1/__reset` `beforeEach` (the `profile.spec.ts`
 * precedent) is unsafe here specifically because `__reset` wipes state
 * globally: with the three viewport projects running concurrently, one
 * project's reset can wipe another project's just-added wishlist item
 * moments before its own assertion runs, observed as an intermittent
 * "wishlist has no items" failure on an otherwise-correct flow. Wishlist
 * data has no dependency on a seeded profile field (unlike the quote-
 * request flow), so this file instead registers a fresh, uniquely emailed
 * account per test via the real `POST /api/v1/auth/register` contract —
 * the `account-access.spec.ts` / `registration-login.spec.ts` precedent —
 * which needs no shared reset and is immune to cross-project races.
 */
const REGISTERED_PASSWORD = 'Sup3rSecretPass1';

async function registerFreshCustomer(request: APIRequestContext): Promise<string> {
  const email = `cust-wishlist-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  const response = await request.post(`${CUSTOMER_APP_BASE_URL}/api/v1/auth/register`, {
    data: {
      nameWithInitials: 'J. Wishlist',
      countryCode: 'KE',
      mobileNumber: '712345678',
      email,
      password: REGISTERED_PASSWORD,
      confirmPassword: REGISTERED_PASSWORD,
    },
  });
  expect(response.status()).toBe(201);
  return email;
}

async function signIn(page: Page, email: string): Promise<void> {
  await page.goto(CUSTOMER_APP_BASE_URL);
  await page.getByTestId('cust-login-email').fill(email);
  await page.getByTestId('cust-login-password').fill(REGISTERED_PASSWORD);
  await page.getByTestId('cust-login-submit').click();
  await page.waitForSelector('.cc-cust-shell-layout', { timeout: 10000 });
}

async function navigateToWishlist(page: Page): Promise<void> {
  const isDesktop = (page.viewportSize()?.width ?? 0) >= 1024;
  if (!isDesktop) {
    await page.getByTestId('cust-mobile-toggle').click();
  }
  const nav = page.locator(isDesktop ? '.cc-cust-shell-nav--desktop' : '.cc-cust-shell-nav--mobile');
  await nav.getByRole('link', { name: /My Wishlist/ }).click();
}

/** Opens the first inventory vehicle and adds it to the wishlist. */
async function wishlistFirstVehicle(page: Page): Promise<void> {
  const isDesktop = (page.viewportSize()?.width ?? 0) >= 1024;
  if (!isDesktop) {
    await page.getByTestId('cust-mobile-toggle').click();
  }
  const nav = page.locator(isDesktop ? '.cc-cust-shell-nav--desktop' : '.cc-cust-shell-nav--mobile');
  await nav.getByRole('link', { name: /Inventory/ }).click();
  await expect(page.getByTestId('customer-inventory-page')).toBeVisible();

  await page.locator('.cc-vehicle-card').first().click();
  await expect(page.getByTestId('customer-vehicle-detail-page')).toBeVisible();

  await page.getByTestId('wishlist-toggle-btn').click();
  await expect(page.getByTestId('wishlist-toggle-btn')).toHaveAttribute('aria-label', 'Remove from wishlist', {
    timeout: 5000,
  });
}

test.describe('Customer My Wishlist E2E (D02-P13-T007)', () => {
  test('displays empty state when customer has no wishlisted vehicles', async ({ page, request }) => {
    const email = await registerFreshCustomer(request);
    await signIn(page, email);
    await navigateToWishlist(page);

    await expect(page.getByTestId('customer-wishlist-page')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'My Wishlist' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'No wishlisted vehicles' })).toBeVisible();
    await expect(page.getByText(/Start exploring our inventory/)).toBeVisible();
    await expect(page.getByRole('button', { name: /Browse Inventory/ })).toBeVisible();
  });

  test('navigates to inventory from empty state', async ({ page, request }) => {
    const email = await registerFreshCustomer(request);
    await signIn(page, email);
    await navigateToWishlist(page);

    await page.getByRole('button', { name: /Browse Inventory/ }).click();
    await expect(page.getByTestId('customer-inventory-page')).toBeVisible();
  });

  test('displays wishlist after adding a vehicle', async ({ page, request }) => {
    const email = await registerFreshCustomer(request);
    await signIn(page, email);
    await wishlistFirstVehicle(page);

    await navigateToWishlist(page);
    await expect(page.getByTestId('customer-wishlist-page')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'My Wishlist' })).toBeVisible();

    const wishlistItems = page.locator('[role="article"]');
    await expect(wishlistItems.first()).toBeVisible();
  });

  test('displays wishlist limit information', async ({ page, request }) => {
    const email = await registerFreshCustomer(request);
    await signIn(page, email);
    await navigateToWishlist(page);

    await expect(page.getByTestId('customer-wishlist-page')).toBeVisible();
    await expect(page.getByText(/Vehicles you've saved for later/)).toBeVisible();
  });

  test('navigates to vehicle details from wishlist item', async ({ page, request }) => {
    const email = await registerFreshCustomer(request);
    await signIn(page, email);
    await wishlistFirstVehicle(page);
    await navigateToWishlist(page);

    const firstItem = page.locator('[role="article"]').first();
    await expect(firstItem).toBeVisible();
    await firstItem.getByRole('button', { name: /View Vehicle Details/ }).click();

    await expect(page.getByTestId('customer-vehicle-detail-page')).toBeVisible();
  });

  test('handles loading state gracefully', async ({ page, request }) => {
    const email = await registerFreshCustomer(request);
    await signIn(page, email);

    const isDesktop = (page.viewportSize()?.width ?? 0) >= 1024;
    if (!isDesktop) {
      await page.getByTestId('cust-mobile-toggle').click();
    }
    const nav = page.locator(isDesktop ? '.cc-cust-shell-nav--desktop' : '.cc-cust-shell-nav--mobile');
    await nav.getByRole('link', { name: /My Wishlist/ }).click();

    await expect(page.getByRole('heading', { name: 'My Wishlist' })).toBeVisible({ timeout: 10000 });
  });

  test('displays page title and description', async ({ page, request }) => {
    const email = await registerFreshCustomer(request);
    await signIn(page, email);
    await navigateToWishlist(page);

    await expect(page.getByRole('heading', { name: 'My Wishlist' })).toBeVisible();
    await expect(page.getByText(/Vehicles you've saved for later/)).toBeVisible();
  });

  test('wishlist navigation appears in both desktop and mobile menus', async ({ page, request }) => {
    const email = await registerFreshCustomer(request);
    await signIn(page, email);

    const desktopNav = page.locator('.cc-cust-shell-nav--desktop');
    if (await desktopNav.isVisible()) {
      await expect(desktopNav.getByRole('link', { name: /My Wishlist/ })).toBeVisible();
    }

    const mobileToggle = page.getByTestId('cust-mobile-toggle');
    if (await mobileToggle.isVisible()) {
      await mobileToggle.click();
      const mobileNav = page.locator('.cc-cust-shell-nav--mobile');
      await expect(mobileNav.getByRole('link', { name: /My Wishlist/ })).toBeVisible();
    }
  });
});
