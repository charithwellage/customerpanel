import { test, expect, type Page, type APIRequestContext } from '@playwright/test';
import { CUSTOMER_APP_BASE_URL } from './customerAppBase.js';

/**
 * D02-P13-T006 — My Inquiries page and nav entry (CUST-34, CUST-35).
 *
 * D02-P13-CODE_REVIEW Finding 2: `signIn()` waited on a "Customer Portal"
 * heading absent from the rendered shell (fixed below — the real always-
 * present landmark is `.cc-cust-shell-layout`). Running the suite for real
 * after that fix also surfaced two further pre-existing defects in this
 * file: (1) the quote button's real `data-testid` is `quote-request-btn`
 * (T005), not `request-quote-btn`, so the quote was silently never
 * requested; (2) the success banner text is "Quote Requested", not "Quote
 * requested successfully".
 *
 * Registers a fresh, uniquely emailed account per test (the
 * `account-access.spec.ts` / `registration-login.spec.ts` precedent) rather
 * than using the single shared fixture account plus a global
 * `POST /api/v1/__reset`: `__reset` wipes state for every account, so with
 * the three viewport projects running concurrently, one project's reset can
 * wipe another project's just-created inquiry moments before its own
 * assertion runs. A freshly registered account's `CustomerProfile.phone`
 * defaults to `''`, and `POST /api/v1/enquiries` (which the "Get Free
 * Quote" button calls) requires a non-empty phone, so this file sets the
 * profile's phone via `PUT /api/v1/customer/profile` right after
 * registering — a one-time, real-contract call, not a fixture shortcut.
 */
const REGISTERED_PASSWORD = 'Sup3rSecretPass1';

async function registerFreshCustomerWithPhone(request: APIRequestContext): Promise<string> {
  const email = `cust-inquiries-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  const registerResponse = await request.post(`${CUSTOMER_APP_BASE_URL}/api/v1/auth/register`, {
    data: {
      nameWithInitials: 'J. Inquiries',
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
  await page.waitForSelector('.cc-cust-shell-layout', { timeout: 10000 });
}

async function navigateToInquiries(page: Page): Promise<void> {
  const isDesktop = (page.viewportSize()?.width ?? 0) >= 1024;
  if (!isDesktop) {
    await page.getByTestId('cust-mobile-toggle').click();
  }
  const nav = page.locator(isDesktop ? '.cc-cust-shell-nav--desktop' : '.cc-cust-shell-nav--mobile');
  await nav.getByRole('link', { name: /My Inquiries/ }).click();
}

/** Opens the first inventory vehicle and requests a quote for it. */
async function requestQuoteForFirstVehicle(page: Page): Promise<void> {
  const isDesktop = (page.viewportSize()?.width ?? 0) >= 1024;
  if (!isDesktop) {
    await page.getByTestId('cust-mobile-toggle').click();
  }
  const nav = page.locator(isDesktop ? '.cc-cust-shell-nav--desktop' : '.cc-cust-shell-nav--mobile');
  await nav.getByRole('link', { name: /Inventory/ }).click();
  await expect(page.getByTestId('customer-inventory-page')).toBeVisible();

  await page.locator('.cc-vehicle-card').first().click();
  await expect(page.getByTestId('customer-vehicle-detail-page')).toBeVisible();

  await page.getByTestId('quote-request-btn').click();
  await expect(page.getByText('Quote Requested')).toBeVisible({ timeout: 5000 });
}

test.describe('Customer My Inquiries E2E (D02-P13-T006)', () => {
  test('displays empty state when customer has no inquiries', async ({ page, request }) => {
    const email = await registerFreshCustomerWithPhone(request);
    await signIn(page, email);
    await navigateToInquiries(page);

    await expect(page.getByTestId('customer-inquiries-page')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'My Inquiries' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'No inquiries yet' })).toBeVisible();
    await expect(page.getByText(/Start browsing our inventory/)).toBeVisible();
    await expect(page.getByRole('button', { name: /Browse Inventory/ })).toBeVisible();
  });

  test('navigates to inventory from empty state', async ({ page, request }) => {
    const email = await registerFreshCustomerWithPhone(request);
    await signIn(page, email);
    await navigateToInquiries(page);

    await page.getByRole('button', { name: /Browse Inventory/ }).click();
    await expect(page.getByTestId('customer-inventory-page')).toBeVisible();
  });

  test('displays inquiries list after requesting quote for a vehicle', async ({ page, request }) => {
    const email = await registerFreshCustomerWithPhone(request);
    await signIn(page, email);
    await requestQuoteForFirstVehicle(page);

    await navigateToInquiries(page);
    await expect(page.getByTestId('customer-inquiries-page')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'My Inquiries' })).toBeVisible();

    const inquiryCards = page.locator('[role="article"]');
    await expect(inquiryCards.first()).toBeVisible();

    const firstInquiry = inquiryCards.first();
    await expect(firstInquiry.locator('h3')).toBeVisible();
    await expect(firstInquiry.locator('.inquirer-count-badge')).toBeVisible();
  });

  test('displays inquiry with correct singular/plural inquirer copy', async ({ page, request }) => {
    const email = await registerFreshCustomerWithPhone(request);
    await signIn(page, email);
    await requestQuoteForFirstVehicle(page);
    await navigateToInquiries(page);

    const firstInquiry = page.locator('[role="article"]').first();
    await expect(firstInquiry).toBeVisible();

    const inquirerText = await firstInquiry.locator('.inquiry-inquirer-count').textContent();
    expect(inquirerText).toBeTruthy();
    if (inquirerText?.includes('1 person')) {
      expect(inquirerText).toContain('person is inquiring');
    } else {
      expect(inquirerText).toContain('people are inquiring');
    }
  });

  test('displays inquiry date in correct format', async ({ page, request }) => {
    const email = await registerFreshCustomerWithPhone(request);
    await signIn(page, email);
    await requestQuoteForFirstVehicle(page);
    await navigateToInquiries(page);

    const firstInquiry = page.locator('[role="article"]').first();
    await expect(firstInquiry).toBeVisible();

    const dateText = await firstInquiry.locator('.inquiry-date').textContent();
    expect(dateText).toMatch(/Requested:/);
    expect(dateText).toMatch(/\w{3} \d{1,2}, \d{4}/);
  });

  test('navigates to vehicle details from inquiry row', async ({ page, request }) => {
    const email = await registerFreshCustomerWithPhone(request);
    await signIn(page, email);
    await requestQuoteForFirstVehicle(page);
    await navigateToInquiries(page);

    const firstInquiry = page.locator('[role="article"]').first();
    await expect(firstInquiry).toBeVisible();
    await firstInquiry.getByRole('button', { name: /View Vehicle Details/ }).click();

    await expect(page.getByTestId('customer-vehicle-detail-page')).toBeVisible();
  });

  test('handles loading state gracefully', async ({ page, request }) => {
    const email = await registerFreshCustomerWithPhone(request);
    await signIn(page, email);

    const isDesktop = (page.viewportSize()?.width ?? 0) >= 1024;
    if (!isDesktop) {
      await page.getByTestId('cust-mobile-toggle').click();
    }
    const nav = page.locator(isDesktop ? '.cc-cust-shell-nav--desktop' : '.cc-cust-shell-nav--mobile');
    await nav.getByRole('link', { name: /My Inquiries/ }).click();

    await expect(page.getByRole('heading', { name: 'My Inquiries' })).toBeVisible({ timeout: 10000 });
  });

  test('displays page title and description', async ({ page, request }) => {
    const email = await registerFreshCustomerWithPhone(request);
    await signIn(page, email);
    await navigateToInquiries(page);

    await expect(page.getByRole('heading', { name: 'My Inquiries' })).toBeVisible();
    await expect(page.getByText(/Your quote requests and inquiries/)).toBeVisible();
  });
});
