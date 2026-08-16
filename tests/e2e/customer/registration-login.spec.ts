import { test, expect, type Page, type APIRequestContext } from '@playwright/test';
import { CUSTOMER_APP_BASE_URL } from './customerAppBase.js';

/**
 * D02-P12-T007 — the phase acceptance journey (CUST-26 to CUST-30).
 *
 * Register a brand-new account through the real public-web `/register` page,
 * follow its forward link to the Customer application sign-in with the email
 * pre-filled, sign in, open the profile page (this step was the blocker
 * routed to and fixed by the D02-P12-T001 reopen — a freshly registered
 * account now has a provisioned CustomerProfile), change the password, sign
 * out, sign in with the new password, run the forgot-password cycle via the
 * non-production outbox, and sign in with the reset password. A second
 * registered account then proves full isolation from the seeded fixture
 * account's data across every customer domain.
 */
const MOCK_API_BASE_URL = process.env.MOCK_API_BASE_URL ?? 'http://127.0.0.1:4000';
const FIXTURE_EMAIL = 'demo.customer@carchief.com';
const FIXTURE_PASSWORD = 'CarChief#Fixture2026';

function uniqueEmail(prefix: string): string {
  return `${prefix}.${Date.now()}.${Math.floor(Math.random() * 100000)}@example.com`;
}

async function openMobileMenuIfNeeded(page: Page): Promise<void> {
  const mobileMenu = page.locator('.mobile-menu-toggle');
  if (await mobileMenu.isVisible()) {
    await mobileMenu.click();
  }
}

async function registerViaApi(request: APIRequestContext, email: string, password: string) {
  const response = await request.post(`${MOCK_API_BASE_URL}/api/v1/auth/register`, {
    data: {
      nameWithInitials: 'C. Journey',
      countryCode: 'KE',
      mobileNumber: '712345678',
      email,
      password,
      confirmPassword: password,
    },
  });
  expect(response.status()).toBe(201);
  return (await response.json()) as { customerId: string };
}

async function loginViaApi(request: APIRequestContext, email: string, password: string) {
  const response = await request.post(`${MOCK_API_BASE_URL}/api/v1/auth/login`, { data: { email, password } });
  expect(response.status()).toBe(200);
  return (await response.json()) as { token: string };
}

test.describe('Registration to sign-in acceptance journey', () => {
  // No shared `__reset` here (unlike profile.spec.ts's fixture-account
  // suite): `__reset` clears every registered account process-wide, so
  // calling it per test would wipe another concurrently running project's
  // freshly registered account on the one shared Profile A Mock API
  // instance — the same class of cross-worker fixture contention documented
  // in tasks/execution_logs/D02-P12-T004.md and D02-P12-T006.md. Each test
  // in this file instead registers its own uniquely emailed account (the
  // account-access.spec.ts precedent), which needs no reset to stay
  // independent under full `--workers=50%` parallelism.

  test('registers, signs in, opens profile, changes password, signs out, signs back in, recovers a forgotten password and signs in again', async ({
    page,
    request,
  }) => {
    const email = uniqueEmail('journey');
    const initialPassword = 'Sup3rSecretPass1';
    const changedPassword = 'ChangedPassw0rd2';
    const resetPassword = 'ResetPassw0rd3';

    // 1. Register on public-web.
    await page.goto('/register');
    await page.getByLabel('Name with initials').fill('C. Journey');
    await page.getByLabel('Country').selectOption({ label: 'Kenya' });
    await page.getByLabel('Mobile number').fill('712345678');
    await page.getByLabel('Email address').fill(email);
    await page.getByLabel(/^Password/).fill(initialPassword);
    await page.getByLabel(/^Re-enter password/).fill(initialPassword);

    const [registerResponse] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/v1/auth/register') && res.request().method() === 'POST'),
      page.getByRole('button', { name: 'Create account' }).click(),
    ]);
    expect(registerResponse.status()).toBe(201);
    await expect(page.getByRole('heading', { name: 'Account created' })).toBeVisible();

    const continueLink = page.getByRole('link', { name: 'Continue to sign in' });
    const forwardHref = await continueLink.getAttribute('href');
    expect(forwardHref).toContain(`email=${encodeURIComponent(email)}`);

    // 2. Forward to Customer sign-in with the email pre-filled.
    await page.goto(forwardHref!);
    await expect(page.getByTestId('cust-login-email')).toHaveValue(email);

    // 3. Sign in.
    await page.getByTestId('cust-login-password').fill(initialPassword);
    const firstLogin = page.waitForResponse(
      (res) => res.url().includes('/api/v1/auth/login') && res.request().method() === 'POST',
    );
    await page.getByTestId('cust-login-submit').click();
    expect((await firstLogin).status()).toBe(200);
    await expect(page.getByRole('heading', { name: 'Customer Portal' })).toBeVisible();

    // 4. Open profile (previously blocked: fresh accounts 404'd here before the T001 reopen).
    await page.goto(`${CUSTOMER_APP_BASE_URL}/profile`);
    await expect(page.getByRole('heading', { name: 'Profile & Account' })).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();

    // 5. Change password.
    await page.getByLabel('Current password').fill(initialPassword);
    await page.getByLabel('New password', { exact: true }).fill(changedPassword);
    await page.getByLabel('Re-enter new password').fill(changedPassword);
    const changeCall = page.waitForResponse(
      (res) => res.url().includes('/api/v1/auth/change-password') && res.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Change password' }).click();
    expect((await changeCall).status()).toBe(200);
    await expect(page.getByRole('status')).toContainText('Your password was changed.');

    // 6. Sign out.
    await page.getByRole('button', { name: 'Sign out' }).first().click();
    await expect(page.getByRole('heading', { name: 'Sign In to CarChief' })).toBeVisible();

    // 7. Sign in with the new password.
    await page.getByTestId('cust-login-email').fill(email);
    await page.getByTestId('cust-login-password').fill(changedPassword);
    const secondLogin = page.waitForResponse(
      (res) => res.url().includes('/api/v1/auth/login') && res.request().method() === 'POST',
    );
    await page.getByTestId('cust-login-submit').click();
    expect((await secondLogin).status()).toBe(200);
    await expect(page.getByRole('heading', { name: 'Customer Portal' })).toBeVisible();

    // 8. Sign out again, then forgot password.
    await page.getByRole('button', { name: 'Sign out' }).first().click();
    await page.getByRole('button', { name: 'Forgot password?' }).click();
    await expect(page.getByRole('heading', { name: 'Forgot your password?' })).toBeVisible();
    await page.getByTestId('cust-recovery-email').fill(email);
    const requestCall = page.waitForResponse(
      (res) =>
        res.url().includes('/api/v1/auth/password-reset') &&
        !res.url().includes('/confirm') &&
        res.request().method() === 'POST',
    );
    await page.getByTestId('cust-recovery-request-submit').click();
    expect((await requestCall).status()).toBe(202);

    // 9. Reset via the non-production outbox.
    const outbox = await request.get(`${MOCK_API_BASE_URL}/api/v1/auth/__outbox`);
    const { items } = (await outbox.json()) as { items: Array<{ token: string; email: string; consumed: boolean }> };
    const entry = items.filter((item) => item.email === email && !item.consumed).pop();
    expect(entry).toBeDefined();

    await page.getByTestId('cust-recovery-token').fill(entry!.token);
    await page.getByTestId('cust-recovery-new-password').fill(resetPassword);
    await page.getByTestId('cust-recovery-confirm-new-password').fill(resetPassword);
    const confirmCall = page.waitForResponse(
      (res) => res.url().includes('/api/v1/auth/password-reset/confirm') && res.request().method() === 'POST',
    );
    await page.getByTestId('cust-recovery-confirm-submit').click();
    expect((await confirmCall).status()).toBe(200);
    await expect(page.getByRole('heading', { name: 'Password updated' })).toBeVisible();
    await page.getByRole('button', { name: 'Back to sign in' }).click();

    // 10. Sign in with the reset password.
    await page.getByTestId('cust-login-email').fill(email);
    await page.getByTestId('cust-login-password').fill(resetPassword);
    const thirdLogin = page.waitForResponse(
      (res) => res.url().includes('/api/v1/auth/login') && res.request().method() === 'POST',
    );
    await page.getByTestId('cust-login-submit').click();
    expect((await thirdLogin).status()).toBe(200);
    await expect(page.getByRole('heading', { name: 'Customer Portal' })).toBeVisible();
  });

  test('the header offers Login and Register, never a demo entry point, before this journey begins', async ({ page }) => {
    await page.goto('/');
    await openMobileMenuIfNeeded(page);
    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Register' })).toBeVisible();
    await expect(page.getByText('DEMO ACCOUNT')).toHaveCount(0);
  });
});

test.describe('Cross-account isolation across every customer domain', () => {
  // Same reasoning as above: no shared `__reset`. Fresh, uniquely emailed
  // accounts (and the always-present seeded fixture account, which no test
  // here mutates) are independent without it.

  test('a freshly registered account sees none of the seeded fixture account\'s data', async ({ request }) => {
    // Account A: the seeded fixture identity, which owns real seeded data across every domain.
    const { token: fixtureToken } = await loginViaApi(request, FIXTURE_EMAIL, FIXTURE_PASSWORD);
    const fixtureAuth = { Authorization: `Bearer ${fixtureToken}` };

    const fixtureVehicles = await (await request.get(`${MOCK_API_BASE_URL}/api/v1/customer/vehicles`, { headers: fixtureAuth })).json();
    const fixtureInvoices = await (await request.get(`${MOCK_API_BASE_URL}/api/v1/customer/invoices`, { headers: fixtureAuth })).json();
    const fixturePayments = await (await request.get(`${MOCK_API_BASE_URL}/api/v1/customer/payments`, { headers: fixtureAuth })).json();
    const fixtureShipments = await (await request.get(`${MOCK_API_BASE_URL}/api/v1/customer/shipments`, { headers: fixtureAuth })).json();
    const fixtureDocuments = await (await request.get(`${MOCK_API_BASE_URL}/api/v1/customer/documents`, { headers: fixtureAuth })).json();
    const fixtureNotifications = await (
      await request.get(`${MOCK_API_BASE_URL}/api/v1/customer/notifications`, { headers: fixtureAuth })
    ).json();

    // The fixture identity must actually own data in every domain, or this isolation check would be vacuous.
    expect((fixtureVehicles.items ?? fixtureVehicles).length).toBeGreaterThan(0);
    expect((fixtureInvoices.items ?? fixtureInvoices).length).toBeGreaterThan(0);
    expect((fixturePayments.items ?? fixturePayments).length).toBeGreaterThan(0);
    expect((fixtureShipments.items ?? fixtureShipments).length).toBeGreaterThan(0);
    expect((fixtureDocuments.items ?? fixtureDocuments).length).toBeGreaterThan(0);
    expect((fixtureNotifications.items ?? fixtureNotifications).length).toBeGreaterThan(0);

    const fixtureVehicleIds = (fixtureVehicles.items ?? fixtureVehicles).map((v: { id: string }) => v.id);
    const fixtureInvoiceIds = (fixtureInvoices.items ?? fixtureInvoices).map((v: { id: string }) => v.id);
    const fixturePaymentIds = (fixturePayments.items ?? fixturePayments).map((v: { id: string }) => v.id);
    const fixtureShipmentIds = (fixtureShipments.items ?? fixtureShipments).map((v: { id: string }) => v.id);
    const fixtureDocumentIds = (fixtureDocuments.items ?? fixtureDocuments).map((v: { id: string }) => v.id);
    const fixtureNotificationIds = (fixtureNotifications.items ?? fixtureNotifications).map((v: { id: string }) => v.id);

    // Account B: a brand-new self-registered account.
    const email = uniqueEmail('isolation-b');
    const password = 'Sup3rSecretPass1';
    await registerViaApi(request, email, password);
    const { token: freshToken } = await loginViaApi(request, email, password);
    const freshAuth = { Authorization: `Bearer ${freshToken}` };

    const freshVehicles = await (await request.get(`${MOCK_API_BASE_URL}/api/v1/customer/vehicles`, { headers: freshAuth })).json();
    const freshInvoices = await (await request.get(`${MOCK_API_BASE_URL}/api/v1/customer/invoices`, { headers: freshAuth })).json();
    const freshPayments = await (await request.get(`${MOCK_API_BASE_URL}/api/v1/customer/payments`, { headers: freshAuth })).json();
    const freshShipments = await (await request.get(`${MOCK_API_BASE_URL}/api/v1/customer/shipments`, { headers: freshAuth })).json();
    const freshDocuments = await (await request.get(`${MOCK_API_BASE_URL}/api/v1/customer/documents`, { headers: freshAuth })).json();
    const freshNotifications = await (
      await request.get(`${MOCK_API_BASE_URL}/api/v1/customer/notifications`, { headers: freshAuth })
    ).json();

    const freshVehicleIds = (freshVehicles.items ?? freshVehicles).map((v: { id: string }) => v.id);
    const freshInvoiceIds = (freshInvoices.items ?? freshInvoices).map((v: { id: string }) => v.id);
    const freshPaymentIds = (freshPayments.items ?? freshPayments).map((v: { id: string }) => v.id);
    const freshShipmentIds = (freshShipments.items ?? freshShipments).map((v: { id: string }) => v.id);
    const freshDocumentIds = (freshDocuments.items ?? freshDocuments).map((v: { id: string }) => v.id);
    const freshNotificationIds = (freshNotifications.items ?? freshNotifications).map((v: { id: string }) => v.id);

    // No overlap in any domain, in either direction.
    expect(freshVehicleIds.filter((id: string) => fixtureVehicleIds.includes(id))).toHaveLength(0);
    expect(freshInvoiceIds.filter((id: string) => fixtureInvoiceIds.includes(id))).toHaveLength(0);
    expect(freshPaymentIds.filter((id: string) => fixturePaymentIds.includes(id))).toHaveLength(0);
    expect(freshShipmentIds.filter((id: string) => fixtureShipmentIds.includes(id))).toHaveLength(0);
    expect(freshDocumentIds.filter((id: string) => fixtureDocumentIds.includes(id))).toHaveLength(0);
    expect(freshNotificationIds.filter((id: string) => fixtureNotificationIds.includes(id))).toHaveLength(0);

    // Direct record access across accounts is refused, not merely absent from a list.
    if (fixtureVehicleIds[0]) {
      const cross = await request.get(`${MOCK_API_BASE_URL}/api/v1/customer/vehicles/${fixtureVehicleIds[0]}`, { headers: freshAuth });
      expect(cross.status()).toBeGreaterThanOrEqual(400);
    }
    if (fixtureInvoiceIds[0]) {
      const cross = await request.get(`${MOCK_API_BASE_URL}/api/v1/customer/invoices/${fixtureInvoiceIds[0]}`, { headers: freshAuth });
      expect(cross.status()).toBeGreaterThanOrEqual(400);
    }
    if (fixtureShipmentIds[0]) {
      const cross = await request.get(`${MOCK_API_BASE_URL}/api/v1/customer/shipments/${fixtureShipmentIds[0]}`, { headers: freshAuth });
      expect(cross.status()).toBeGreaterThanOrEqual(400);
    }
    if (fixtureDocumentIds[0]) {
      const cross = await request.get(`${MOCK_API_BASE_URL}/api/v1/customer/documents/${fixtureDocumentIds[0]}`, { headers: freshAuth });
      expect(cross.status()).toBeGreaterThanOrEqual(400);
    }

    // The fresh account's own profile belongs to itself, not the fixture customer.
    const freshProfile = await (await request.get(`${MOCK_API_BASE_URL}/api/v1/customer/profile`, { headers: freshAuth })).json();
    expect(freshProfile.email).toBe(email);
    expect(freshProfile.email).not.toBe(FIXTURE_EMAIL);
  });

  test('two freshly registered accounts are isolated from each other', async ({ request }) => {
    const emailA = uniqueEmail('isolation-a');
    const emailB = uniqueEmail('isolation-b2');
    const password = 'Sup3rSecretPass1';
    await registerViaApi(request, emailA, password);
    await registerViaApi(request, emailB, password);
    const { token: tokenA } = await loginViaApi(request, emailA, password);
    const { token: tokenB } = await loginViaApi(request, emailB, password);

    const profileA = await (
      await request.get(`${MOCK_API_BASE_URL}/api/v1/customer/profile`, { headers: { Authorization: `Bearer ${tokenA}` } })
    ).json();
    const profileB = await (
      await request.get(`${MOCK_API_BASE_URL}/api/v1/customer/profile`, { headers: { Authorization: `Bearer ${tokenB}` } })
    ).json();
    expect(profileA.customerId).not.toBe(profileB.customerId);
    expect(profileA.email).toBe(emailA);
    expect(profileB.email).toBe(emailB);

    // Account A cannot change account B's password with A's own bearer token.
    const crossChange = await request.post(`${MOCK_API_BASE_URL}/api/v1/auth/change-password`, {
      headers: { Authorization: `Bearer ${tokenA}` },
      data: { currentPassword: password, newPassword: 'SomethingElse9', confirmNewPassword: 'SomethingElse9' },
    });
    // This changes A's own password (there is no target-account parameter to
    // hijack) — confirm the account actually mutated is A, never B, by
    // signing in as B with the original password afterward.
    expect(crossChange.status()).toBe(200);
    const bStillWorks = await loginViaApi(request, emailB, password);
    expect(bStillWorks.token).toBeTruthy();
  });
});
