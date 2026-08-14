import { test, expect } from '@playwright/test';
import { CUSTOMER_APP_BASE_URL } from './customerAppBase.js';

/**
 * Asserts content that can only come from the Customer Application bundle.
 * The previous version of this spec checked for generic `main`/`body`
 * landmarks, which passed against any page on any port
 * (D02-P01-CODE_REVIEW finding 2).
 */
test.describe('Customer Application Access & Session E2E', () => {
  test('renders the customer sign-in card with empty credentials and no fabricated identity', async ({ page }) => {
    await page.goto(CUSTOMER_APP_BASE_URL);

    await expect(page.getByText('CUSTOMER PORTAL ACCESS')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Sign In to CarChief' })).toBeVisible();

    const email = page.getByTestId('cust-login-email');
    const password = page.getByTestId('cust-login-password');
    await expect(email).toBeVisible();
    await expect(password).toBeVisible();

    // Credentials must not ship pre-filled with a specimen identity.
    await expect(email).toHaveValue('');
    await expect(password).toHaveValue('');
    await expect(page.locator('body')).not.toContainText('Sterling', { ignoreCase: true });

    // Labelled for assistive technology and reachable by keyboard.
    await expect(page.getByLabel('Work Email Address')).toBeVisible();
    await email.focus();
    await expect(email).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Forgot Password?' })).toBeFocused();
  });

  test('opens the AutoPulse/Keycloak identity boundary card from the recovery control', async ({ page }) => {
    await page.goto(CUSTOMER_APP_BASE_URL);

    await page.getByRole('button', { name: 'Forgot Password?' }).click();

    await expect(page.getByRole('heading', { name: /Password Recovery/ })).toBeVisible();
    await expect(page.getByText('KEYCLOAK IDENTITY BOUNDARY')).toBeVisible();
    await expect(page.getByText('DEC-CUST-IDENTITY-RECOVERY')).toBeVisible();
    await expect(page.getByRole('button', { name: /Back to Customer Login/ })).toBeVisible();
  });

  test('signs in through the mock demo-session endpoint and reports the real claim identity', async ({ page }) => {
    await page.goto(CUSTOMER_APP_BASE_URL);

    const sessionCall = page.waitForResponse(
      (response) => response.url().includes('/api/v1/auth/demo-session') && response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: /Request Demo Session/ }).click();
    const response = await sessionCall;
    expect(response.status()).toBe(201);

    // The identity shown is the one the Mock API actually minted.
    await expect(page.getByText('user@carchief.com')).toBeVisible();
    await expect(page.locator('body')).not.toContainText('Sterling', { ignoreCase: true });
  });
});
