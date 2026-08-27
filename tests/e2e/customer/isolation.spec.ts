import { test, expect, type Page, type APIRequestContext } from '@playwright/test';
import { CUSTOMER_APP_BASE_URL } from './customerAppBase.js';

/**
 * Customer Isolation E2E Tests (D02-P13-T008)
 *
 * Verifies that authenticated customer A cannot see customer B's inquiries,
 * wishlist or favourites, including via a crafted direct request to the
 * three new `/api/v1/customer/*` endpoints using customer B's own token —
 * mirroring the fresh-account-per-test, API-registered isolation pattern
 * established in `registration-login.spec.ts`'s "two freshly registered
 * accounts are isolated from each other" test (D02-P09-T002 precedent).
 *
 * D02-P13-CODE_REVIEW Finding 4: the previous version of this file defined
 * `registerCustomer(page, email, password)` as a UI-driven registration
 * flow targeting `data-testid`s (`reg-name`, `reg-email`, ...) that do not
 * exist anywhere in the codebase, and never called it before `signIn()` —
 * every test timed out because `customerA@test.carchief.com` /
 * `customerB@test.carchief.com` were never registered. This version
 * registers both fixture accounts for real through the real
 * `POST /api/v1/auth/register` HTTP contract before signing in.
 *
 * Test data (the inquiry, wishlist item and favourite belonging to customer
 * A) is created through the real HTTP contract directly, the same way the
 * established `registration-login.spec.ts` isolation test does, rather than
 * by driving the "Get Free Quote" button: a freshly registered account's
 * `CustomerProfile.phone` defaults to `''` (only the seeded fixture account
 * has a non-empty seeded phone), and `POST /api/v1/enquiries` requires a
 * non-empty phone, so driving the UI button here would fail on an unrelated
 * pre-existing data gap outside this task's owned paths. Each test still
 * verifies isolation through the real UI pages, plus a crafted direct
 * request using customer B's own bearer token.
 */
const MOCK_API_BASE_URL = process.env.MOCK_API_BASE_URL ?? 'http://127.0.0.1:4000';
const ISOLATION_PASSWORD = 'IsolationPass#2026';

function uniqueEmail(prefix: string): string {
  return `${prefix}.${Date.now()}.${Math.floor(Math.random() * 100000)}@example.com`;
}

/** Registers a fresh customer account through the real registration contract. */
async function registerCustomer(request: APIRequestContext, email: string, password: string): Promise<void> {
  const response = await request.post(`${MOCK_API_BASE_URL}/api/v1/auth/register`, {
    data: {
      nameWithInitials: 'Isolation Test',
      countryCode: 'KE',
      mobileNumber: '712345678',
      email,
      password,
      confirmPassword: password,
    },
  });
  expect(response.status()).toBe(201);
}

async function loginViaApi(request: APIRequestContext, email: string, password: string): Promise<string> {
  const response = await request.post(`${MOCK_API_BASE_URL}/api/v1/auth/login`, { data: { email, password } });
  expect(response.status()).toBe(200);
  const body = (await response.json()) as { token: string };
  return body.token;
}

async function firstVehicleSlug(request: APIRequestContext): Promise<string> {
  const response = await request.get(`${MOCK_API_BASE_URL}/api/v1/vehicles?limit=1`);
  expect(response.status()).toBe(200);
  const body = (await response.json()) as { items?: Array<{ slug: string }> } | Array<{ slug: string }>;
  const items = Array.isArray(body) ? body : body.items;
  const slug = items?.[0]?.slug;
  expect(slug).toBeTruthy();
  return slug as string;
}

async function signIn(page: Page, email: string, password: string): Promise<void> {
  await page.goto(CUSTOMER_APP_BASE_URL);
  await page.getByTestId('cust-login-email').fill(email);
  await page.getByTestId('cust-login-password').fill(password);
  await page.getByTestId('cust-login-submit').click();
  // Wait for a real landmark of the authenticated shell, not the
  // nonexistent "Customer Portal" heading (D02-P13-CODE_REVIEW Finding
  // 2/3) — and not the `.cc-cust-shell` class, which does not exist either
  // (`.cc-cust-shell-layout` is the real always-present wrapper).
  await page.waitForSelector('.cc-cust-shell-layout', { timeout: 10000 });
}

/**
 * Returns the visible nav locator for the current viewport, opening the
 * mobile drawer first when needed. The previous version of this file
 * always used `.cc-cust-shell-nav--desktop`, which is not visible at the
 * mobile/tablet viewports (`isDesktop` is `width >= 1024`, matching the
 * convention in `inquiries.spec.ts`/`wishlist.spec.ts`/`favourites.spec.ts`)
 * — every mobile-chromium and tablet-chromium run hung waiting on a link
 * inside a hidden nav until the test timeout.
 */
async function openNav(page: Page) {
  const isDesktop = (page.viewportSize()?.width ?? 0) >= 1024;
  if (!isDesktop) {
    await page.getByTestId('cust-mobile-toggle').click();
  }
  return page.locator(isDesktop ? '.cc-cust-shell-nav--desktop' : '.cc-cust-shell-nav--mobile');
}

test.describe('Customer Isolation E2E (D02-P13-T008)', () => {
  test('customer A inquiries not visible to customer B, including via a direct request with B\'s token', async ({
    browser,
    request,
  }) => {
    const emailA = uniqueEmail('isolation-inquiries-a');
    const emailB = uniqueEmail('isolation-inquiries-b');
    await registerCustomer(request, emailA, ISOLATION_PASSWORD);
    await registerCustomer(request, emailB, ISOLATION_PASSWORD);
    const tokenA = await loginViaApi(request, emailA, ISOLATION_PASSWORD);
    const vehicleSlug = await firstVehicleSlug(request);

    // Customer A requests a quote for a vehicle through the real contract.
    const createResponse = await request.post(`${MOCK_API_BASE_URL}/api/v1/enquiries`, {
      headers: { Authorization: `Bearer ${tokenA}` },
      data: {
        name: 'Isolation Test',
        email: emailA,
        phone: '+254712345678',
        message: 'Isolation test quote request',
        consent: true,
        vehicleSlug,
        enquiryType: 'price-request',
        source: 'form',
      },
    });
    expect(createResponse.status()).toBeGreaterThanOrEqual(200);
    expect(createResponse.status()).toBeLessThan(300);

    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    try {
      // Customer A sees the inquiry on My Inquiries.
      await signIn(pageA, emailA, ISOLATION_PASSWORD);
      const navA = await openNav(pageA);
      await navA.getByRole('link', { name: /My Inquiries/ }).click();
      await expect(pageA.getByTestId('customer-inquiries-page')).toBeVisible();
      await expect(pageA.locator('[role="article"]').first()).toBeVisible();

      // Customer B: sign in and confirm an empty My Inquiries page.
      await signIn(pageB, emailB, ISOLATION_PASSWORD);
      const navB = await openNav(pageB);
      await navB.getByRole('link', { name: /My Inquiries/ }).click();
      await expect(pageB.getByRole('heading', { name: 'No inquiries yet' })).toBeVisible();

      // Crafted direct request: B's own token against the inquiries endpoint
      // must never surface A's data.
      const tokenB = await loginViaApi(request, emailB, ISOLATION_PASSWORD);
      const direct = await request.get(`${MOCK_API_BASE_URL}/api/v1/customer/inquiries`, {
        headers: { Authorization: `Bearer ${tokenB}` },
      });
      expect(direct.status()).toBe(200);
      const body = (await direct.json()) as { items: unknown[] };
      expect(body.items).toEqual([]);
    } finally {
      await contextA.close();
      await contextB.close();
    }
  });

  test('customer A wishlist not visible to customer B, including via a direct request with B\'s token', async ({
    browser,
    request,
  }) => {
    const emailA = uniqueEmail('isolation-wishlist-a');
    const emailB = uniqueEmail('isolation-wishlist-b');
    await registerCustomer(request, emailA, ISOLATION_PASSWORD);
    await registerCustomer(request, emailB, ISOLATION_PASSWORD);
    const tokenA = await loginViaApi(request, emailA, ISOLATION_PASSWORD);
    const vehicleSlug = await firstVehicleSlug(request);

    // Customer A wishlists a vehicle through the real contract.
    const addResponse = await request.post(`${MOCK_API_BASE_URL}/api/v1/customer/wishlist`, {
      headers: { Authorization: `Bearer ${tokenA}` },
      data: { vehicleSlug },
    });
    expect(addResponse.status()).toBe(200);

    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    try {
      // Customer A sees the item on My Wishlist.
      await signIn(pageA, emailA, ISOLATION_PASSWORD);
      const navA = await openNav(pageA);
      await navA.getByRole('link', { name: /My Wishlist/ }).click();
      await expect(pageA.getByTestId('customer-wishlist-page')).toBeVisible();
      await expect(pageA.locator('[role="article"]').first()).toBeVisible();

      // Customer B: sign in and confirm an empty My Wishlist page.
      await signIn(pageB, emailB, ISOLATION_PASSWORD);
      const navB = await openNav(pageB);
      await navB.getByRole('link', { name: /My Wishlist/ }).click();
      await expect(pageB.getByRole('heading', { name: 'No wishlisted vehicles' })).toBeVisible();

      // Crafted direct request: B's own token against the wishlist endpoint
      // must never surface A's data.
      const tokenB = await loginViaApi(request, emailB, ISOLATION_PASSWORD);
      const direct = await request.get(`${MOCK_API_BASE_URL}/api/v1/customer/wishlist`, {
        headers: { Authorization: `Bearer ${tokenB}` },
      });
      expect(direct.status()).toBe(200);
      const body = (await direct.json()) as { items: unknown[] };
      expect(body.items).toEqual([]);
    } finally {
      await contextA.close();
      await contextB.close();
    }
  });

  test('customer A favourites not visible to customer B, including via a direct request with B\'s token', async ({
    browser,
    request,
  }) => {
    const emailA = uniqueEmail('isolation-favourites-a');
    const emailB = uniqueEmail('isolation-favourites-b');
    await registerCustomer(request, emailA, ISOLATION_PASSWORD);
    await registerCustomer(request, emailB, ISOLATION_PASSWORD);
    const tokenA = await loginViaApi(request, emailA, ISOLATION_PASSWORD);

    // Customer A creates a favourite through the real contract.
    const createResponse = await request.post(`${MOCK_API_BASE_URL}/api/v1/customer/favourites`, {
      headers: { Authorization: `Bearer ${tokenA}` },
      data: { name: 'Isolation Test Favourite', criteria: { make: 'Toyota' } },
    });
    expect(createResponse.status()).toBe(201);

    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    try {
      await signIn(pageA, emailA, ISOLATION_PASSWORD);
      const navA = await openNav(pageA);
      await navA.getByRole('link', { name: /Favourites/ }).click();
      await expect(pageA.getByTestId('customer-favourites-page')).toBeVisible();
      await expect(pageA.getByText('Isolation Test Favourite')).toBeVisible();

      // Customer B: sign in and confirm an empty Favourites page.
      await signIn(pageB, emailB, ISOLATION_PASSWORD);
      const navB = await openNav(pageB);
      await navB.getByRole('link', { name: /Favourites/ }).click();
      await expect(pageB.getByRole('heading', { name: 'No saved searches yet' })).toBeVisible();
      await expect(pageB.getByText('Isolation Test Favourite')).not.toBeVisible();

      // Crafted direct request: B's own token against the favourites
      // endpoint must never surface A's data.
      const tokenB = await loginViaApi(request, emailB, ISOLATION_PASSWORD);
      const direct = await request.get(`${MOCK_API_BASE_URL}/api/v1/customer/favourites`, {
        headers: { Authorization: `Bearer ${tokenB}` },
      });
      expect(direct.status()).toBe(200);
      const body = (await direct.json()) as { items: unknown[] };
      expect(body.items).toEqual([]);
    } finally {
      await contextA.close();
      await contextB.close();
    }
  });
});
