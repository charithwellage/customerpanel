import { test, expect, type Page } from '@playwright/test';
import { CUSTOMER_APP_BASE_URL } from './customerAppBase.js';

/**
 * Asserts the authenticated shell that only the Customer Application bundle can
 * render. The previous version checked `header`/`main`/`body` visibility, which
 * passed against any page on any port (D02-P01-CODE_REVIEW finding 2).
 */

/** Signs in through the Mock API demo-session endpoint and waits for the shell. */
async function signIn(page: Page): Promise<void> {
  await page.goto(CUSTOMER_APP_BASE_URL);
  await page.getByRole('button', { name: /Request Demo Session/ }).click();
  await expect(page.getByRole('heading', { name: 'Customer Portal' })).toBeVisible();
}

test.describe('Customer Application Shell & Navigation E2E', () => {
  test('renders the customer portal shell with brand marks, page container and honest footer', async ({ page }) => {
    await signIn(page);

    await expect(page.getByText('CARCHIEF', { exact: true })).toBeVisible();
    await expect(page.getByText('CUSTOMER PORTAL', { exact: true })).toBeVisible();
    await expect(page.locator('main#main-content')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeAttached();

    // Honest placeholder rather than invented dashboard figures.
    await expect(page.getByText('NOT BUILT YET')).toBeVisible();
    await expect(page.getByRole('heading', { name: /is not available yet/ })).toBeVisible();

    // No page may claim a live Keycloak integration; this build has none.
    await expect(page.locator('.cc-cust-shell-footer')).toContainText('Demo session — not a production identity');
    await expect(page.locator('body')).not.toContainText('Keycloak Secured');
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
    await expect(page.getByRole('heading', { name: /Shipments & Tracking Operations is not available yet/ })).toBeVisible();
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
