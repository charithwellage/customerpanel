import { test, expect, type Page } from '@playwright/test';

/** On phone/tablet the header's Login/Register actions live inside the collapsed hamburger drawer — open it first, mirroring tests/e2e/account-entry.spec.ts. */
async function openMobileMenuIfNeeded(page: Page): Promise<void> {
  const mobileMenu = page.locator('.mobile-menu-toggle');
  if (await mobileMenu.isVisible()) {
    await mobileMenu.click();
  }
}

function uniqueEmail(prefix: string): string {
  return `${prefix}.${Date.now()}.${Math.floor(Math.random() * 100000)}@example.com`;
}

/**
 * Header Login/Register actions and the `/register` self-service
 * registration page (CUST-26, CUST-27, D02-P12-T003).
 *
 * Registration never mints a public-web session; a successful submission is
 * proven by the account-creation response and the resulting forward link to
 * the Customer application sign-in with the registered email pre-filled,
 * never by a stored token (DEC-CUST-IDENTITY-RECOVERY).
 */
test.describe('Header Login/Register actions', () => {
  // No shared `__reset` here (D02-P12-T007): `__reset` clears every
  // registered account process-wide on the one shared Profile A Mock API
  // instance, and this file's own registration tests below use uniquely
  // emailed accounts specifically so they do not depend on it — calling it
  // per test instead created cross-worker fixture contention with other
  // concurrently running viewport projects/spec files (a duplicate-email
  // 409 test observed a 201 because another project's reset ran between its
  // two submissions), the same class of issue documented in
  // tasks/execution_logs/D02-P12-T004.md and D02-P12-T006.md. These header
  // assertions do not depend on Mock API state at all.

  test('the header shows Login and Register, with no remaining Customer Portal/demo entry point', async ({ page }) => {
    await page.goto('/');
    await openMobileMenuIfNeeded(page);

    const loginLink = page.getByRole('link', { name: 'Login' });
    const registerLink = page.getByRole('link', { name: 'Register' });
    await expect(loginLink).toBeVisible();
    await expect(registerLink).toBeVisible();
    await expect(registerLink).toHaveAttribute('href', '/register');

    await expect(page.getByRole('link', { name: 'Access Customer Portal' })).toHaveCount(0);
    await expect(page.getByText('CUSTOMER PORTAL')).toHaveCount(0);
    await expect(page.getByText('DEMO ACCOUNT')).toHaveCount(0);
  });

  test('Register navigates to the self-service registration page', async ({ page }) => {
    await page.goto('/');
    await openMobileMenuIfNeeded(page);
    await page.getByRole('link', { name: 'Register' }).click();
    await expect(page).toHaveURL(/\/register$/);
    await expect(page.getByRole('heading', { name: 'Create your CarChief account' })).toBeVisible();
  });
});

test.describe('Self-service registration (/register)', () => {
  // No shared `__reset` — see the note above. Every test here registers its
  // own uniquely emailed account per `uniqueEmail()`, so no cross-test or
  // cross-worker reset is required for independence.

  test('a visitor completes registration and is offered a forward link to the Customer sign-in with their email pre-filled', async ({ page }) => {
    await page.goto('/register');
    const email = uniqueEmail('new.customer');

    await page.getByLabel('Name with initials').fill('J. K. Perera');
    await page.getByLabel('Country').selectOption({ label: 'Kenya' });
    await expect(page.locator('.cc-registration-form__dial-code')).toHaveText('+254');
    await page.getByLabel('Mobile number').fill('712345678');
    await page.getByLabel('Email address').fill(email);
    await page.getByLabel(/^Password/).fill('Sup3rSecretPass1');
    await page.getByLabel(/^Re-enter password/).fill('Sup3rSecretPass1');

    const [response] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/v1/auth/register') && res.request().method() === 'POST'),
      page.getByRole('button', { name: 'Create account' }).click(),
    ]);
    expect(response.status()).toBe(201);
    const account = await response.json();
    expect(account.email).toBe(email);
    expect(JSON.stringify(account)).not.toMatch(/password|hash|salt/i);

    await expect(page.getByRole('heading', { name: 'Account created' })).toBeVisible();
    const continueLink = page.getByRole('link', { name: 'Continue to sign in' });
    await expect(continueLink).toBeVisible();
    const forwardHref = await continueLink.getAttribute('href');
    expect(forwardHref).toContain(`email=${encodeURIComponent(email)}`);

    // No public-web session was created by registration (DEC-CUST-IDENTITY-RECOVERY).
    const localStorageKeys = await page.evaluate(() => Object.keys(window.localStorage));
    expect(localStorageKeys.some((key) => key.toLowerCase().includes('session'))).toBe(false);
  });

  test('registering with an email already on file shows the duplicate-email 409 on the email field', async ({ page }) => {
    const email = uniqueEmail('duplicate.customer');

    async function submitRegistration() {
      await page.getByLabel('Name with initials').fill('A. B. Fernando');
      await page.getByLabel('Country').selectOption({ label: 'Uganda' });
      await page.getByLabel('Mobile number').fill('700111222');
      await page.getByLabel('Email address').fill(email);
      await page.getByLabel(/^Password/).fill('Sup3rSecretPass1');
      await page.getByLabel(/^Re-enter password/).fill('Sup3rSecretPass1');
      await page.getByRole('button', { name: 'Create account' }).click();
    }

    await page.goto('/register');
    await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/v1/auth/register') && res.request().method() === 'POST'),
      submitRegistration(),
    ]);
    await expect(page.getByRole('heading', { name: 'Account created' })).toBeVisible();

    await page.goto('/register');
    const [response] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/v1/auth/register') && res.request().method() === 'POST'),
      submitRegistration(),
    ]);
    expect(response.status()).toBe(409);

    const emailInput = page.getByLabel('Email address');
    await expect(emailInput).toHaveAttribute('aria-invalid', 'true');
    await expect(
      page.locator('.cc-registration-form__field-error', { hasText: 'An account with this email already exists' })
    ).toBeVisible();
  });

  test('submitting with invalid input shows client-side field validation errors and never calls the Mock API', async ({ page }) => {
    await page.goto('/register');

    let registerCalled = false;
    page.on('request', (request) => {
      if (request.url().includes('/api/v1/auth/register')) registerCalled = true;
    });

    await page.getByLabel('Mobile number').fill('not-digits');
    await page.getByLabel(/^Password/).fill('short');
    await page.getByLabel(/^Re-enter password/).fill('different');
    await page.getByRole('button', { name: 'Create account' }).click();

    // Each error is announced twice by design (the shared live region plus
    // the field-level message, COMMON_FRONTEND_RULES.md) — scope to the
    // visible inline field-error paragraph to avoid a strict-mode clash.
    const fieldError = (text: string) => page.locator('.cc-registration-form__field-error', { hasText: text });
    await expect(fieldError('Enter your name with initials.')).toBeVisible();
    await expect(fieldError('Select your country.')).toBeVisible();
    await expect(fieldError('Enter a valid mobile number (digits only).')).toBeVisible();
    await expect(fieldError('Enter your email address.')).toBeVisible();
    expect(registerCalled).toBe(false);
  });
});
