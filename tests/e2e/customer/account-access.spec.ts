import { test, expect, type APIRequestContext } from '@playwright/test';
import { CUSTOMER_APP_BASE_URL } from './customerAppBase.js';

/**
 * D02-P12-T005: real credential sign-in and password recovery.
 *
 * The old demo-session UI flow (`POST /api/v1/auth/demo-session`) was removed
 * in T001/T002 (CUST-30); this suite exercises the real credential contract
 * instead. Each test registers its own fresh account through the real
 * `POST /api/v1/auth/register` HTTP contract (never a forged/local token) so
 * that concurrent viewport projects sharing one Profile A Mock API instance
 * do not collide on account state, following the fresh-account-per-test
 * precedent recorded in `tasks/execution_logs/D02-P12-T004.md`.
 */
const MOCK_API_BASE_URL = process.env.MOCK_API_BASE_URL ?? 'http://127.0.0.1:4000';
const REGISTERED_PASSWORD = 'Sup3rSecretPass1';

async function registerFreshCustomer(request: APIRequestContext) {
  const email = `cust-access-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  const response = await request.post(`${MOCK_API_BASE_URL}/api/v1/auth/register`, {
    data: {
      nameWithInitials: 'J. Access',
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

test.describe('Customer Application credential sign-in & password recovery E2E', () => {
  test('signs in with a registered credential and out again', async ({ page, request }) => {
    const email = await registerFreshCustomer(request);

    await page.goto(CUSTOMER_APP_BASE_URL);
    await expect(page.getByRole('heading', { name: 'Sign In to CarChief' })).toBeVisible();

    await page.getByTestId('cust-login-email').fill(email);
    await page.getByTestId('cust-login-password').fill(REGISTERED_PASSWORD);

    const loginCall = page.waitForResponse(
      (response) => response.url().includes('/api/v1/auth/login') && response.request().method() === 'POST',
    );
    await page.getByTestId('cust-login-submit').click();
    const response = await loginCall;
    expect(response.status()).toBe(200);

    await expect(page.getByRole('heading', { name: 'Customer Portal' })).toBeVisible();
    await expect(page.locator('body')).not.toContainText('Demo Customer', { ignoreCase: false });

    const signOutButton = page.getByRole('button', { name: 'Sign out' });
    await expect(signOutButton).toBeVisible();
    await signOutButton.click();

    await expect(page.getByRole('heading', { name: 'Sign In to CarChief' })).toBeVisible();
    await expect(page.getByTestId('cust-login-email')).toHaveValue('');
  });

  test('rejects a wrong password with the single generic invalid-credential message', async ({ page, request }) => {
    const email = await registerFreshCustomer(request);

    await page.goto(CUSTOMER_APP_BASE_URL);
    await page.getByTestId('cust-login-email').fill(email);
    await page.getByTestId('cust-login-password').fill('TotallyWrongPassword1');

    const loginCall = page.waitForResponse(
      (response) => response.url().includes('/api/v1/auth/login') && response.request().method() === 'POST',
    );
    await page.getByTestId('cust-login-submit').click();
    const response = await loginCall;
    expect(response.status()).toBe(401);

    await expect(page.getByRole('alert')).toContainText('Invalid email or password');
    // No hint that the account itself exists.
    await expect(page.locator('body')).not.toContainText('no account', { ignoreCase: true });
  });

  test('rejects an unknown email with the same generic message (no account enumeration)', async ({ page }) => {
    await page.goto(CUSTOMER_APP_BASE_URL);
    await page.getByTestId('cust-login-email').fill(`unknown-${Date.now()}@example.com`);
    await page.getByTestId('cust-login-password').fill('WhateverPassword1');

    const loginCall = page.waitForResponse(
      (response) => response.url().includes('/api/v1/auth/login') && response.request().method() === 'POST',
    );
    await page.getByTestId('cust-login-submit').click();
    const response = await loginCall;
    expect(response.status()).toBe(401);

    await expect(page.getByRole('alert')).toContainText('Invalid email or password');
  });

  test('pre-fills the email from a forwarded registration query parameter', async ({ page }) => {
    const email = `prefill-${Date.now()}@example.com`;
    await page.goto(`${CUSTOMER_APP_BASE_URL}/?email=${encodeURIComponent(email)}`);
    await expect(page.getByTestId('cust-login-email')).toHaveValue(email);
    // The URL never carries a password or token, only the email.
    await expect(page.getByTestId('cust-login-password')).toHaveValue('');
  });

  test('completes a full forgot-password cycle via the non-production outbox and signs in with the new password', async ({
    page,
    request,
  }) => {
    const email = await registerFreshCustomer(request);
    const newPassword = 'BrandNewPass2';

    await page.goto(CUSTOMER_APP_BASE_URL);
    await page.getByRole('button', { name: 'Forgot password?' }).click();
    await expect(page.getByRole('heading', { name: 'Forgot your password?' })).toBeVisible();

    await page.getByTestId('cust-recovery-email').fill(email);
    const requestCall = page.waitForResponse(
      (response) =>
        response.url().includes('/api/v1/auth/password-reset') &&
        !response.url().includes('/confirm') &&
        response.request().method() === 'POST',
    );
    await page.getByTestId('cust-recovery-request-submit').click();
    const requestResponse = await requestCall;
    expect(requestResponse.status()).toBe(202);

    await expect(page.getByRole('heading', { name: 'Enter your reset token' })).toBeVisible();

    // Non-production only: read the token the reset request placed in the
    // mock outbox (DEC-CUST-IDENTITY-RECOVERY — no real email provider here).
    const outbox = await request.get(`${MOCK_API_BASE_URL}/api/v1/auth/__outbox`);
    expect(outbox.status()).toBe(200);
    const { items } = (await outbox.json()) as { items: Array<{ token: string; email: string; consumed: boolean }> };
    const entry = items.filter((item) => item.email === email && !item.consumed).pop();
    expect(entry).toBeDefined();

    await page.getByTestId('cust-recovery-token').fill(entry!.token);
    await page.getByTestId('cust-recovery-new-password').fill(newPassword);
    await page.getByTestId('cust-recovery-confirm-new-password').fill(newPassword);

    const confirmCall = page.waitForResponse(
      (response) => response.url().includes('/api/v1/auth/password-reset/confirm') && response.request().method() === 'POST',
    );
    await page.getByTestId('cust-recovery-confirm-submit').click();
    const confirmResponse = await confirmCall;
    expect(confirmResponse.status()).toBe(200);

    await expect(page.getByRole('heading', { name: 'Password updated' })).toBeVisible();
    await page.getByRole('button', { name: 'Back to sign in' }).click();

    // The old password no longer works.
    await page.getByTestId('cust-login-email').fill(email);
    await page.getByTestId('cust-login-password').fill(REGISTERED_PASSWORD);
    const oldPasswordCall = page.waitForResponse(
      (response) => response.url().includes('/api/v1/auth/login') && response.request().method() === 'POST',
    );
    await page.getByTestId('cust-login-submit').click();
    expect((await oldPasswordCall).status()).toBe(401);

    // The token is single-use: replaying it against confirm fails.
    const replay = await request.post(`${MOCK_API_BASE_URL}/api/v1/auth/password-reset/confirm`, {
      data: { token: entry!.token, newPassword: 'AnotherOne3', confirmNewPassword: 'AnotherOne3' },
    });
    expect(replay.status()).toBeGreaterThanOrEqual(400);

    // The new password signs in successfully.
    await page.getByTestId('cust-login-password').fill(newPassword);
    const newPasswordCall = page.waitForResponse(
      (response) => response.url().includes('/api/v1/auth/login') && response.request().method() === 'POST',
    );
    await page.getByTestId('cust-login-submit').click();
    expect((await newPasswordCall).status()).toBe(200);
    await expect(page.getByRole('heading', { name: 'Customer Portal' })).toBeVisible();
  });
});
