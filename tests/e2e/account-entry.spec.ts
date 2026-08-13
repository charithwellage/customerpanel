import { test, expect, type Page } from '@playwright/test';

const detailSlug = '2021-toyota-corolla-axio-veh-1';

/** On phone/tablet the header's nav (including the account-entry trigger) lives inside the collapsed hamburger drawer — open it first, mirroring tests/e2e/home-showroom.spec.ts. */
async function openMobileMenuIfNeeded(page: Page): Promise<void> {
  const mobileMenu = page.locator('.mobile-menu-toggle');
  if (await mobileMenu.isVisible()) {
    await mobileMenu.click();
  }
}

/**
 * Account entry, stand-in demo session and reservation sign-in guidance
 * (PUB-22, PUB-23, PUB-27, DEC-PUB-AUTH-BOUNDARY, D01-P06-T003).
 *
 * These tests use the running mock HTTP service end to end: the demo
 * session is minted via `POST /api/v1/auth/demo-session`, never a
 * client-embedded/forced identity. No test claims a production account or a
 * completed reservation/Live Auction bid — RULE-10.
 */
test.describe('Account entry and reservation sign-in guidance', () => {
  test.beforeEach(async ({ request, baseURL }) => {
    // Deterministic reset (RULE-08): each test starts from a clean session state.
    await request.post(`${baseURL}/api/v1/__reset`);
  });

  test('an anonymous visitor sees a Sign In entry point in the header', async ({ page }) => {
    await page.goto('/');
    await openMobileMenuIfNeeded(page);
    const signInLink = page.getByRole('link', { name: 'Sign in or create an account' });
    await expect(signInLink).toBeVisible();
    await expect(signInLink).toHaveAttribute('href', '/account?returnTo=%2F');
  });

  test('reaching /account without a return target shows the anonymous sign-in entry, labelled as demo mode', async ({ page }) => {
    await page.goto('/account');
    await expect(page.getByRole('heading', { name: 'Sign in or create an account' })).toBeVisible();
    await expect(page.getByText('Demo Mode', { exact: false }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue with Demo Customer Account' })).toBeVisible();
  });

  test('a visitor attempting to reserve a specific vehicle while anonymous is told clearly what to do next (PUB-23)', async ({ page }) => {
    await page.goto(`/account?returnTo=%2Fvehicles%2F${detailSlug}`);
    const guidance = page.getByRole('status').filter({ hasText: 'Sign in to reserve this vehicle' });
    await expect(guidance).toBeVisible();
    const guidanceText = await guidance.innerText();
    expect(guidanceText).toContain('Nothing has been reserved yet');
    await expect(guidance.getByRole('link', { name: 'Sign In to Reserve' })).toBeVisible();
  });

  test('a demo sign-in mints a session via the mock HTTP service and returns the visitor to the vehicle they were viewing', async ({ page }) => {
    await page.goto(`/account?returnTo=%2Fvehicles%2F${detailSlug}`);

    const [response] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/v1/auth/demo-session') && res.request().method() === 'POST'),
      page.getByRole('button', { name: 'Continue with Demo Customer Account' }).click(),
    ]);
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.nonProduction).toBe(true);
    expect(body.claims.role).toBe('CustomerBuyer');

    await expect(page).toHaveURL(new RegExp(`/vehicles/${detailSlug}$`));
    await openMobileMenuIfNeeded(page);
    await expect(page.getByRole('link', { name: 'View demo account' })).toBeVisible();
  });

  test('the demo identity is visible through the auth boundary after sign-in, with sign-out returning to the anonymous state', async ({ page }) => {
    // A bare /account has no vehicle to return to, so a successful sign-in
    // redirects to "/" (PUB-22's "return the visitor where they were").
    // Wait for that redirect to complete before navigating back to /account,
    // rather than racing the redirect for a heading that is about to unmount.
    await page.goto('/account');
    await Promise.all([
      page.waitForURL((url) => url.pathname === '/'),
      page.getByRole('button', { name: 'Continue with Demo Customer Account' }).click(),
    ]);

    await page.goto('/account');
    await expect(page.getByRole('heading', { name: "You’re signed in" })).toBeVisible();
    await expect(page.getByText('user@carchief.com')).toBeVisible();
    await expect(page.getByText('CustomerBuyer')).toBeVisible();
    // No approved Live Auction destination is configured (D01-ASM-002) — the
    // account-gated entry must stay hidden, never a placeholder link (RULE-10).
    await expect(page.getByRole('link', { name: /Live Auction/i })).toHaveCount(0);

    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page.getByRole('heading', { name: 'Sign in or create an account' })).toBeVisible();
    await openMobileMenuIfNeeded(page);
    await expect(page.getByRole('link', { name: 'Sign in or create an account' })).toBeVisible();
  });

  test('an active demo session confirms readiness without claiming a reservation was created', async ({ page }) => {
    await page.goto(`/account?returnTo=%2Fvehicles%2F${detailSlug}`);
    await Promise.all([
      page.waitForURL(new RegExp(`/vehicles/${detailSlug}$`)),
      page.getByRole('button', { name: 'Continue with Demo Customer Account' }).click(),
    ]);
    await page.goto(`/account?returnTo=%2Fvehicles%2F${detailSlug}`);

    const guidance = page.getByRole('status').filter({ hasText: "You’re signed in" });
    await expect(guidance).toBeVisible();
    const guidanceText = (await guidance.innerText()).toLowerCase();
    expect(guidanceText).not.toContain('reservation confirmed');
    expect(guidanceText).not.toContain('reserved successfully');
  });
});
