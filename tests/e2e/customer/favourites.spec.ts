import { test, expect, type Page, type APIRequestContext } from '@playwright/test';
import { CUSTOMER_APP_BASE_URL } from './customerAppBase.js';

/**
 * D02-P13-T007 — Favourites page, nav entry and 25-cap UX (CUST-38 to
 * CUST-40).
 *
 * D02-P13-CODE_REVIEW Finding 3: `signIn()` waited on a "Customer Portal"
 * heading absent from the rendered shell (fixed below — the real always-
 * present landmark is `.cc-cust-shell-layout`). Using the single shared
 * fixture account (`prabodha@carchief.com`) plus a
 * `POST /api/v1/__reset` `beforeEach` (the `profile.spec.ts` precedent) is
 * unsafe here specifically because `__reset` wipes state globally: with the
 * three viewport projects running concurrently, one project's reset can
 * wipe another project's just-created favourite moments before its own
 * assertion runs. Favourites data has no dependency on a seeded profile
 * field, so this file instead registers a fresh, uniquely emailed account
 * per test via the real `POST /api/v1/auth/register` contract — the
 * `account-access.spec.ts` / `registration-login.spec.ts` precedent —
 * which needs no shared reset and is immune to cross-project races.
 */
const REGISTERED_PASSWORD = 'Sup3rSecretPass1';

async function registerFreshCustomer(request: APIRequestContext): Promise<string> {
  const email = `cust-favourites-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  const response = await request.post(`${CUSTOMER_APP_BASE_URL}/api/v1/auth/register`, {
    data: {
      nameWithInitials: 'J. Favourites',
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

async function navigateToFavourites(page: Page): Promise<void> {
  const isDesktop = (page.viewportSize()?.width ?? 0) >= 1024;
  if (!isDesktop) {
    await page.getByTestId('cust-mobile-toggle').click();
  }
  const nav = page.locator(isDesktop ? '.cc-cust-shell-nav--desktop' : '.cc-cust-shell-nav--mobile');
  await nav.getByRole('link', { name: /Favourites/ }).click();
}

test.describe('Customer Favourites E2E (D02-P13-T007)', () => {
  test('displays empty state when customer has no saved searches', async ({ page, request }) => {
    const email = await registerFreshCustomer(request);
    await signIn(page, email);
    await navigateToFavourites(page);

    await expect(page.getByTestId('customer-favourites-page')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Favourites' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'No saved searches yet' })).toBeVisible();
    await expect(page.getByText(/Create a saved search/)).toBeVisible();
    await expect(page.getByRole('button', { name: /Create Your First Search/ })).toBeVisible();
  });

  test('opens and closes form to create new favourite', async ({ page, request }) => {
    const email = await registerFreshCustomer(request);
    await signIn(page, email);
    await navigateToFavourites(page);

    await page.getByRole('button', { name: /Create Your First Search/ }).click();
    await expect(page.getByTestId('favourite-search-form')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Search Name/ })).toBeVisible();
    await expect(page.getByLabel(/Name this search/)).toBeVisible();
    await expect(page.getByLabel(/^Make$/)).toBeVisible();
    await expect(page.getByLabel(/^Model$/)).toBeVisible();

    await page.getByRole('button', { name: /Cancel/ }).click();
    await expect(page.getByTestId('favourite-search-form')).not.toBeVisible();
  });

  test('displays disabled fields with "no data yet" message for model code, engine cc, color, steering', async ({
    page,
    request,
  }) => {
    const email = await registerFreshCustomer(request);
    await signIn(page, email);
    await navigateToFavourites(page);
    await page.getByRole('button', { name: /Create Your First Search/ }).click();
    await expect(page.getByTestId('favourite-search-form')).toBeVisible();

    await expect(page.getByLabel(/Model Code/)).toBeDisabled();
    await expect(page.getByLabel(/Engine CC/)).toBeDisabled();
    await expect(page.getByLabel(/Color/)).toBeDisabled();
    await expect(page.getByLabel(/Steering/)).toBeDisabled();

    await expect(page.getByText(/Model Code data is not yet available/)).toBeVisible();
    await expect(page.getByText(/Engine CC data is not yet available/)).toBeVisible();
    await expect(page.getByText(/Color data is not yet available/)).toBeVisible();
    await expect(page.getByText(/Steering data is not yet available/)).toBeVisible();
  });

  test('form validation requires at least one criteria field', async ({ page, request }) => {
    const email = await registerFreshCustomer(request);
    await signIn(page, email);
    await navigateToFavourites(page);
    await page.getByRole('button', { name: /Create Your First Search/ }).click();
    await expect(page.getByTestId('favourite-search-form')).toBeVisible();

    await page.getByLabel(/Name this search/).fill('Test Search Without Criteria');
    await page.getByRole('button', { name: /Save Search/ }).click();

    await expect(page.getByText(/Please select at least one search criterion/)).toBeVisible();
  });

  test('form validation requires a name', async ({ page, request }) => {
    const email = await registerFreshCustomer(request);
    await signIn(page, email);
    await navigateToFavourites(page);
    await page.getByRole('button', { name: /Create Your First Search/ }).click();
    await expect(page.getByTestId('favourite-search-form')).toBeVisible();

    const makeSelect = page.getByLabel(/^Make$/);
    await makeSelect.selectOption({ index: 1 });
    await page.getByRole('button', { name: /Save Search/ }).click();

    await expect(page.getByText(/Please enter a name for this search/)).toBeVisible();
  });

  test('displays other field options from facets', async ({ page, request }) => {
    const email = await registerFreshCustomer(request);
    await signIn(page, email);
    await navigateToFavourites(page);
    await page.getByRole('button', { name: /Create Your First Search/ }).click();
    await expect(page.getByTestId('favourite-search-form')).toBeVisible();

    const makeSelect = page.getByLabel(/^Make$/);
    const fuelTypeSelect = page.getByLabel(/Fuel Type/);
    await expect(makeSelect).toBeVisible();
    await expect(fuelTypeSelect).toBeVisible();
  });

  test('creates a favourite and displays it with a criteria summary', async ({ page, request }) => {
    const email = await registerFreshCustomer(request);
    await signIn(page, email);
    await navigateToFavourites(page);
    await page.getByRole('button', { name: /Create Your First Search/ }).click();
    await expect(page.getByTestId('favourite-search-form')).toBeVisible();

    await page.getByLabel(/Name this search/).fill('Toyota Search');
    await page.getByLabel(/^Make$/).selectOption({ index: 1 });
    await page.getByRole('button', { name: /Save Search/ }).click();

    await expect(page.getByTestId('favourite-search-form')).not.toBeVisible({ timeout: 5000 });
    const favouriteItems = page.locator('[data-testid^="favourite-item-"]');
    await expect(favouriteItems.first()).toBeVisible();
    await expect(favouriteItems.first().locator('.favourite-name')).toHaveText('Toyota Search');
    await expect(favouriteItems.first().locator('.favourite-criteria')).toBeVisible();
    await expect(favouriteItems.first().locator('.favourite-date')).toBeVisible();
  });

  test('displays favourites limit counter', async ({ page, request }) => {
    const email = await registerFreshCustomer(request);
    await signIn(page, email);
    await navigateToFavourites(page);

    await expect(page.getByTestId('customer-favourites-page')).toBeVisible();
    await expect(page.getByText(/0 of 25 saved searches/)).toBeVisible();
  });

  test('handles loading state gracefully', async ({ page, request }) => {
    const email = await registerFreshCustomer(request);
    await signIn(page, email);

    const isDesktop = (page.viewportSize()?.width ?? 0) >= 1024;
    if (!isDesktop) {
      await page.getByTestId('cust-mobile-toggle').click();
    }
    const nav = page.locator(isDesktop ? '.cc-cust-shell-nav--desktop' : '.cc-cust-shell-nav--mobile');
    await nav.getByRole('link', { name: /Favourites/ }).click();

    await expect(page.getByRole('heading', { name: 'Favourites' })).toBeVisible({ timeout: 10000 });
  });

  test('displays page title and description', async ({ page, request }) => {
    const email = await registerFreshCustomer(request);
    await signIn(page, email);
    await navigateToFavourites(page);

    await expect(page.getByRole('heading', { name: 'Favourites' })).toBeVisible();
    await expect(page.getByText(/Saved search criteria for automated alerts/)).toBeVisible();
  });

  test('favourites navigation appears in both desktop and mobile menus', async ({ page, request }) => {
    const email = await registerFreshCustomer(request);
    await signIn(page, email);

    const desktopNav = page.locator('.cc-cust-shell-nav--desktop');
    if (await desktopNav.isVisible()) {
      await expect(desktopNav.getByRole('link', { name: /Favourites/ })).toBeVisible();
    }

    const mobileToggle = page.getByTestId('cust-mobile-toggle');
    if (await mobileToggle.isVisible()) {
      await mobileToggle.click();
      const mobileNav = page.locator('.cc-cust-shell-nav--mobile');
      await expect(mobileNav.getByRole('link', { name: /Favourites/ })).toBeVisible();
    }
  });

  test('form fields are accessible with keyboard navigation', async ({ page, request }) => {
    const email = await registerFreshCustomer(request);
    await signIn(page, email);
    await navigateToFavourites(page);
    await page.getByRole('button', { name: /Create Your First Search/ }).click();
    await expect(page.getByTestId('favourite-search-form')).toBeVisible();

    const nameInput = page.getByLabel(/Name this search/);
    await nameInput.focus();
    await expect(nameInput).toBeFocused();

    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement?.id || 'unknown');
    expect(focusedElement).toBeTruthy();
    expect(focusedElement).not.toBe('unknown');
  });
});
