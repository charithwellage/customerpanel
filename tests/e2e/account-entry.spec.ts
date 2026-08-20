import { test, expect, type Page } from '@playwright/test';

const detailSlug = '2021-toyota-corolla-axio-veh-1';

/** On phone/tablet the header's nav (including the account actions) lives inside the collapsed hamburger drawer — open it first, mirroring tests/e2e/home-showroom.spec.ts. */
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
 * Registers a brand-new real account and signs in through the real Mock API
 * HTTP contract (never a locally-minted token), then writes the resulting
 * session into public-web's own localStorage under its real, non-demo
 * storage key (`features/account-entry/session-storage.ts`'s
 * `carchief.session.v1`). There is no public-web UI form that performs this
 * — sign-in only ever happens in the Customer application
 * (`DEC-CUST-IDENTITY-RECOVERY`) — so an automated test exercising the
 * *signed-in* public-web experience must seed the session this way, exactly
 * mirroring how a real cross-application hand-off would leave public-web's
 * storage populated. A fresh account per call (rather than the single shared
 * `cust-123` fixture) keeps this file's tests independent when the three
 * viewport projects run concurrently against the one shared Mock API
 * instance (Profile A) — a shared identity's reservation state would
 * otherwise leak between projects.
 */
async function signInAsFreshCustomer(page: Page, request: import('@playwright/test').APIRequestContext, baseURL: string, tag: string): Promise<{ email: string }> {
  const email = uniqueEmail(tag);
  const registerResponse = await request.post(`${baseURL}/api/v1/auth/register`, {
    data: {
      nameWithInitials: 'E2E Tester',
      countryCode: 'KE',
      mobileNumber: '712345678',
      email,
      password: 'Sup3rSecretPass1',
      confirmPassword: 'Sup3rSecretPass1',
    },
  });
  expect(registerResponse.status()).toBe(201);

  const loginResponse = await request.post(`${baseURL}/api/v1/auth/login`, {
    data: { email, password: 'Sup3rSecretPass1' },
  });
  expect(loginResponse.status()).toBe(200);
  const session = await loginResponse.json();
  expect(session.token).toBeTruthy();
  expect(session.claims.role).toBe('CustomerBuyer');

  await page.addInitScript(
    ({ key, value }) => {
      window.localStorage.setItem(key, value);
    },
    { key: 'carchief.session.v1', value: JSON.stringify(session) }
  );
  return { email };
}

/**
 * Account entry and reservation sign-in guidance (PUB-22, PUB-23, PUB-27,
 * DEC-PUB-AUTH-BOUNDARY, D01-P06-T003, D02-P12-T004, CUST-30).
 *
 * No demo identity path remains: there is no `POST /api/v1/auth/demo-session`
 * (removed in D02-P12-T001) and no client-side sign-in action on public-web.
 * A visitor is directed to the real `/register` page or to the Customer
 * application's own sign-in — never a locally-minted, non-production
 * identity.
 */
test.describe('Account entry and reservation sign-in guidance', () => {
  test.beforeEach(async ({ request, baseURL }) => {
    // Deterministic reset (RULE-08): each test starts from a clean session state.
    await request.post(`${baseURL}/api/v1/__reset`);
  });

  test('an anonymous visitor sees Login and Register entry points in the header, not a demo portal trigger', async ({ page }) => {
    await page.goto('/');
    await openMobileMenuIfNeeded(page);
    const loginLink = page.getByRole('link', { name: 'Login' });
    const registerLink = page.getByRole('link', { name: 'Register' });
    await expect(loginLink).toBeVisible();
    await expect(registerLink).toBeVisible();
    await expect(registerLink).toHaveAttribute('href', '/register');
    await expect(page.getByRole('link', { name: 'Access Customer Portal' })).toHaveCount(0);
  });

  test('reaching /account without a return target shows an honest account-required entry, with real Sign In and Create an Account actions', async ({ page }) => {
    await page.goto('/account');
    await expect(page.getByRole('heading', { name: 'An account is required' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Create an Account' })).toHaveAttribute('href', '/register');
    // No demo affordance anywhere on the page.
    const bodyText = (await page.textContent('body')) ?? '';
    expect(bodyText.toLowerCase()).not.toContain('demo account');
    expect(bodyText.toLowerCase()).not.toContain('demo session');
    expect(bodyText.toLowerCase()).not.toContain('non-production identity');
    expect(bodyText.toLowerCase()).not.toContain('demo mode');
  });

  test('a visitor attempting to reserve a specific vehicle while anonymous is told clearly what to do next (PUB-23)', async ({ page }) => {
    await page.goto(`/account?returnTo=%2Fallstock%2F${detailSlug}`);
    const guidance = page.getByRole('status').filter({ hasText: 'Sign in to reserve this vehicle' });
    await expect(guidance).toBeVisible();
    const guidanceText = await guidance.innerText();
    expect(guidanceText).toContain('Nothing has been reserved yet');
    await expect(guidance.getByRole('link', { name: 'Sign In to Reserve' })).toBeVisible();
  });

  test('a signed-in visitor sees their real identity on /account, with sign-out returning to the anonymous state', async ({ page, request, baseURL }) => {
    const { email } = await signInAsFreshCustomer(page, request, baseURL!, 'account-identity');

    await page.goto('/account');
    await expect(page.getByRole('heading', { name: "You’re signed in" })).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();
    await expect(page.getByText('CustomerBuyer')).toBeVisible();
    // No approved Live Auction destination is configured (D01-ASM-002) — the
    // account-gated entry must stay hidden, never a placeholder link (RULE-10).
    await expect(page.getByRole('link', { name: /Live Auction/i })).toHaveCount(0);

    const bodyText = (await page.textContent('body')) ?? '';
    expect(bodyText.toLowerCase()).not.toContain('demo mode');
    expect(bodyText.toLowerCase()).not.toContain('demo account');
    expect(bodyText.toLowerCase()).not.toContain('non-production identity');

    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page.getByRole('heading', { name: 'An account is required' })).toBeVisible();
    await openMobileMenuIfNeeded(page);
    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
  });

  test('a signed-in visitor on the vehicle detail page sees an active-session reservation notice honestly, without claiming a reservation was created', async ({ page, request, baseURL }) => {
    await signInAsFreshCustomer(page, request, baseURL!, 'account-reservation-notice');
    await page.goto(`/account?returnTo=%2Fallstock%2F${detailSlug}`);

    const guidance = page.getByRole('status').filter({ hasText: "You’re signed in" });
    await expect(guidance).toBeVisible();
    const guidanceText = (await guidance.innerText()).toLowerCase();
    expect(guidanceText).not.toContain('reservation confirmed');
    expect(guidanceText).not.toContain('reserved successfully');
    expect(guidanceText).not.toContain('demo');
  });
});
