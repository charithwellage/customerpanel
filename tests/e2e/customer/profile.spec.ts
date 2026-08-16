import { test, expect } from '@playwright/test';
import { CUSTOMER_APP_BASE_URL } from './customerAppBase.js';

/**
 * D02-P12-T006: profile identity, contact-detail editing (with its
 * optimistic-concurrency 409 path) and real password change.
 *
 * The seeded fixture credential (`demo.customer@carchief.com`) is used
 * rather than a fresh `POST /api/v1/auth/register` account: only the fixture
 * customer (`cust-123`) has a seeded `CustomerProfile` record (the Mock API,
 * out of this task's owned paths, does not create one for a newly registered
 * account — `GET /customer/profile` 404s for a fresh registration). Each
 * test resets the Mock API first, which also restores the fixture account's
 * password, so tests can run independently even though they mutate it.
 */
const FIXTURE_EMAIL = 'demo.customer@carchief.com';
const FIXTURE_PASSWORD = 'CarChief#Fixture2026';

test.describe.configure({ mode: 'serial' });

test.describe('Customer profile — identity, contact details and password change @serial-reset', () => {
  test.beforeEach(async ({ page }) => {
    await page.request.post(`${CUSTOMER_APP_BASE_URL}/api/v1/__reset`);
    await page.goto(`${CUSTOMER_APP_BASE_URL}/profile`);
    await expect(page.getByRole('heading', { name: 'Sign In to CarChief' })).toBeVisible();
    await page.getByTestId('cust-login-email').fill(FIXTURE_EMAIL);
    await page.getByTestId('cust-login-password').fill(FIXTURE_PASSWORD);
    await page.getByTestId('cust-login-submit').click();
    await expect(page.getByRole('heading', { name: 'Profile & Account' })).toBeVisible();
  });

  test('shows read-only identity, edits and saves contact details, and no demo copy remains', async ({ page }) => {
    await expect(page.getByText('Name and email were captured at registration')).toBeVisible();
    await expect(page.getByText(FIXTURE_EMAIL)).toBeVisible();
    await page.getByLabel('Company name').fill('Profile Acceptance Co');
    await page.getByLabel('Phone number').fill('+1 555 0177');
    await page.getByLabel('Delivery address').fill('77 Acceptance Road');
    await page.getByRole('button', { name: 'Save contact details' }).click();
    await expect(page.getByRole('status')).toContainText('Your contact details were saved.');
    await expect(page.getByLabel('Company name')).toHaveValue('Profile Acceptance Co');
    await expect(page.locator('body')).not.toContainText(/demo session/i);
    await expect(page.locator('body')).not.toContainText(/demo customer/i);
    await expect(page.locator('body')).not.toContainText(/not a production identity/i);
  });

  test('shows validation and blocks contact-detail saves while offline', async ({ page }) => {
    await page.getByLabel('Company name').fill('x');
    await page.getByRole('button', { name: 'Save contact details' }).click();
    await expect(page.getByRole('alert')).toContainText('at least 2 characters');
    await page.evaluate(() => window.dispatchEvent(new Event('offline')));
    await expect(page.getByText('Profile updates are disabled until connectivity returns.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save contact details' })).toBeDisabled();
  });

  test('surfaces the 409 optimistic-concurrency conflict and recovers via the refresh affordance', async ({ page, request }) => {
    const loginResponse = await request.post(`${CUSTOMER_APP_BASE_URL}/api/v1/auth/login`, {
      data: { email: FIXTURE_EMAIL, password: FIXTURE_PASSWORD },
    });
    const { token } = await loginResponse.json();

    // A concurrent edit through the raw HTTP contract bumps the server-side
    // version without the open browser tab knowing, exactly as two devices
    // editing the same profile would.
    const elsewhereResponse = await request.put(`${CUSTOMER_APP_BASE_URL}/api/v1/customer/profile`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { companyName: 'Updated Elsewhere Co', phone: '+1 555 0199', deliveryAddress: 'Elsewhere address' },
    });
    expect(elsewhereResponse.status()).toBe(200);

    await page.getByLabel('Company name').fill('Stale Browser Edit Co');
    await page.getByRole('button', { name: 'Save contact details' }).click();
    await expect(page.getByRole('alert')).toContainText('This profile changed elsewhere. Refresh the profile before saving again.');

    await page.getByRole('button', { name: 'Refresh profile' }).click();
    await expect(page.getByLabel('Company name')).toHaveValue('Updated Elsewhere Co');
  });

  test('blocks password changes while offline with an honest message', async ({ page }) => {
    await page.evaluate(() => window.dispatchEvent(new Event('offline')));
    await expect(page.getByText('You are offline. Password changes are disabled until connectivity returns.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Change password' })).toBeDisabled();
  });

  test('reports a wrong current password on that field, never as a session expiry', async ({ page }) => {
    await page.getByLabel('Current password').fill('TotallyWrongPassword1');
    await page.getByLabel('New password', { exact: true }).fill('BrandNewPassw0rd1');
    await page.getByLabel('Re-enter new password').fill('BrandNewPassw0rd1');
    await page.getByRole('button', { name: 'Change password' }).click();

    const currentPasswordField = page.getByLabel('Current password');
    await expect(currentPasswordField).toHaveAttribute('aria-invalid', 'true');
    const errorId = await currentPasswordField.getAttribute('aria-describedby');
    await expect(page.locator(`#${errorId}`)).toContainText('Current password is incorrect');
    await expect(page.locator('body')).not.toContainText('session has expired');
  });

  test('changes the password, clears the fields, confirms via the live region, and the new password signs in while the old one no longer works', async ({ page }) => {
    await page.getByLabel('Current password').fill(FIXTURE_PASSWORD);
    await page.getByLabel('New password', { exact: true }).fill('BrandNewPassw0rd1');
    await page.getByLabel('Re-enter new password').fill('BrandNewPassw0rd1');

    const changeCall = page.waitForResponse(
      (response) => response.url().includes('/api/v1/auth/change-password') && response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Change password' }).click();
    const changeResponse = await changeCall;
    expect(changeResponse.status()).toBe(200);
    // The request body carries the passwords (expected — POST body, not a
    // logged URL); the response URL itself must never carry one.
    expect(changeResponse.url()).not.toContain('BrandNewPassw0rd1');

    await expect(page.getByRole('status')).toContainText('Your password was changed.');
    await expect(page.getByLabel('Current password')).toHaveValue('');
    await expect(page.getByLabel('New password', { exact: true })).toHaveValue('');
    await expect(page.getByLabel('Re-enter new password')).toHaveValue('');

    await page.getByRole('button', { name: 'Sign out' }).first().click();
    await expect(page.getByRole('heading', { name: 'Sign In to CarChief' })).toBeVisible();

    await page.getByTestId('cust-login-email').fill(FIXTURE_EMAIL);
    await page.getByTestId('cust-login-password').fill(FIXTURE_PASSWORD);
    await page.getByTestId('cust-login-submit').click();
    await expect(page.getByRole('alert')).toContainText('Invalid email or password');

    await page.getByTestId('cust-login-password').fill('BrandNewPassw0rd1');
    await page.getByTestId('cust-login-submit').click();
    await expect(page.getByRole('heading', { name: 'Customer Portal' })).toBeVisible();
  });

  test('returns to sign-in when the authenticated session is cleared', async ({ page }) => {
    await page.evaluate(() => sessionStorage.clear());
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Sign In to CarChief' })).toBeVisible();
  });
});
