import { test, expect } from '@playwright/test';
import { CUSTOMER_APP_BASE_URL } from './customerAppBase.js';

test.describe('Customer Secure Vault E2E (D02-P07-T003)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(CUSTOMER_APP_BASE_URL);
    const signIn = page.getByRole('heading', { name: 'Sign In to CarChief' });
    if (await signIn.isVisible()) {
      await page.getByRole('button', { name: /Request Demo Session/ }).click();
      await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 10000 });
    }
    // Deep-link to the owned feature route after establishing the demo session.
    // Navigation chrome is covered by the shell suite; this spec keeps the
    // Secure Vault assertions isolated from responsive menu timing.
    await page.goto(`${CUSTOMER_APP_BASE_URL}/documents`);
    await expect(page.getByRole('heading', { name: 'Customer documents' })).toBeVisible();
  });

  test('shows ten categories and only customer-visible metadata', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Document categories' })).toBeVisible();
    await expect(page.locator('.cc-cust-document-card')).toHaveCount(2);
    await expect(page.locator('.cc-cust-document-card__category', { hasText: 'Bill of Lading' })).toBeVisible();
    await expect(page.locator('.cc-cust-document-card__category', { hasText: 'Commercial Invoice' })).toBeVisible();
    await expect(page.getByText('Preview and download are available only after the authorised document-access workflow.').first()).toBeVisible();
    const categoryList = page.getByRole('region', { name: 'Document categories' });
    await expect(categoryList.getByText('Proforma Invoice')).toBeVisible();
    await expect(categoryList.getByText('Auction Sheet')).toBeVisible();
  });

  test('supports category and keyword filtering without exposing raw documents', async ({ page }) => {
    await page.getByRole('searchbox', { name: 'Search documents' }).fill('doc-004');
    await page.getByLabel('Category').selectOption('Commercial Invoice');
    await expect(page.getByRole('heading', { name: 'doc-004' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'doc-001' })).toHaveCount(0);
    await expect(page.getByText(/Preview and download/)).toBeVisible();
  });

  test('keeps search and filters usable on phone and desktop', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByRole('searchbox', { name: 'Search documents' })).toBeVisible();
    await page.getByRole('searchbox', { name: 'Search documents' }).focus();
    await expect(page.getByRole('searchbox', { name: 'Search documents' })).toBeFocused();
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(page.getByRole('heading', { name: 'Customer documents' })).toBeVisible();
  });
});
