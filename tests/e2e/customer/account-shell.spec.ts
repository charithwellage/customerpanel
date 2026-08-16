import { test, expect, type Page } from '@playwright/test';
import { CUSTOMER_APP_BASE_URL } from './customerAppBase.js';

/**
 * Asserts the authenticated shell that only the Customer Application bundle can
 * render. The previous version checked `header`/`main`/`body` visibility, which
 * passed against any page on any port (D02-P01-CODE_REVIEW finding 2).
 */

/** Signs in through the Mock API demo-session endpoint and waits for the shell. */
const FIXTURE_EMAIL = 'demo.customer@carchief.com';
const FIXTURE_PASSWORD = 'CarChief#Fixture2026';

/** Signs in with the seeded fixture credential (D02-P12-T001), the removed
 * demo-session endpoint's replacement (D02-P12-T007 reopen of D02-P12-T005's
 * customer-app e2e migration — this file's helper still targeted the deleted
 * `Request Demo Session` button). */
async function signIn(page: Page): Promise<void> {
  await page.goto(CUSTOMER_APP_BASE_URL);
  await page.getByTestId('cust-login-email').fill(FIXTURE_EMAIL);
  await page.getByTestId('cust-login-password').fill(FIXTURE_PASSWORD);
  await page.getByTestId('cust-login-submit').click();
  await expect(page.getByRole('heading', { name: 'Customer Portal' })).toBeVisible();
}

test.describe('Customer Application Shell & Navigation E2E', () => {
  test('renders the customer portal shell with brand marks, page container and honest footer', async ({ page }) => {
    await signIn(page);

    await expect(page.getByText('CARCHIEF', { exact: true })).toBeVisible();
    await expect(page.getByText('CUSTOMER PORTAL', { exact: true })).toBeVisible();
    await expect(page.locator('main#main-content')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeAttached();

    // The dashboard is now an implemented, server-projected customer surface.
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByText('Your account overview and shipment status')).toBeVisible();

    // No page may claim a live Keycloak integration or a demo/placeholder
    // identity; the footer honestly states this is a Mock-API-backed build
    // (D02-P12-T007 reopen of D02-P12-T005's customer-app e2e migration —
    // this assertion still targeted the removed "Demo session" footer copy).
    await expect(page.locator('.cc-cust-shell-footer')).toContainText('Mock API Enabled');
    await expect(page.locator('body')).not.toContainText('Keycloak Secured');
    await expect(page.locator('body')).not.toContainText('Demo session');
  });

  test('exposes the customer navigation items and reflects the selected route', async ({ page }) => {
    await signIn(page);

    // Both navs are in the DOM at every width; CSS decides which one is shown,
    // so the spec must target the one that belongs to this viewport.
    const isDesktop = (page.viewportSize()?.width ?? 0) >= 1024;
    if (!isDesktop) {
      await page.getByTestId('cust-mobile-toggle').click();
    }
    const nav = page.locator(isDesktop ? '.cc-cust-shell-nav--desktop' : '.cc-cust-shell-nav--mobile');

    await expect(nav.getByRole('link', { name: /Dashboard/ })).toBeVisible();
    await expect(nav.getByRole('link', { name: /Invoices & Ledger/ })).toBeVisible();

    await nav.getByRole('link', { name: /Shipments/ }).click();
    await expect(page.getByRole('heading', { name: 'Shipment tracking' })).toBeVisible();
  });

  test('switches between the desktop navigation bar and the mobile drawer by viewport', async ({ page }) => {
    await signIn(page);

    const toggle = page.getByTestId('cust-mobile-toggle');
    const desktopNav = page.locator('.cc-cust-shell-nav--desktop');
    const isDesktop = (page.viewportSize()?.width ?? 0) >= 1024;

    if (isDesktop) {
      await expect(desktopNav).toBeVisible();
      await expect(toggle).toBeHidden();
      return;
    }

    await expect(desktopNav).toBeHidden();
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('.cc-cust-shell-nav--mobile')).toBeVisible();
  });
});
