import { test, expect, type Page } from '@playwright/test';
import { CUSTOMER_APP_BASE_URL } from './customerAppBase.js';

async function signIn(page: Page): Promise<void> {
  await page.goto(CUSTOMER_APP_BASE_URL);
  await page.getByRole('button', { name: /Request Demo Session/ }).click();
  await expect(page.getByRole('heading', { name: 'Customer Portal' })).toBeVisible();
}

test.describe('Customer payment journal (D02-P06-T002)', () => {
  test('lists, filters and opens a server-projected payment detail', async ({ page }) => {
    await signIn(page);
    const desktop = (page.viewportSize()?.width ?? 0) >= 1024;
    if (!desktop) await page.getByTestId('cust-mobile-toggle').click();
    const nav = page.locator(desktop ? '.cc-cust-shell-nav--desktop' : '.cc-cust-shell-nav--mobile');
    await nav.getByRole('link', { name: 'Payments' }).click();
    await expect(page.getByTestId('customer-payments-page')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'TT payment journal' })).toBeVisible();
    await expect(page.getByText('PAY-004')).toBeVisible();
    await page.getByTestId('payment-card-pay-004').click();
    await expect(page.getByText('FinanceReviewRequested')).toBeVisible();
    await page.getByTestId('payment-controls').getByRole('button', { name: 'Pending' }).click();
    await expect(page.getByTestId('payment-detail')).toBeVisible();
    await page.getByLabel('Search payments').fill('does-not-exist');
    await expect(page.getByText('No matching payment records are available.')).toBeVisible();
  });
});
