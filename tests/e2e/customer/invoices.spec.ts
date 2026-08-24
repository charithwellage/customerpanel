import { test, expect, type Page } from '@playwright/test';
import { CUSTOMER_APP_BASE_URL } from './customerAppBase.js';

/** Signs in through the Mock API demo-session endpoint and waits for the shell. */
const FIXTURE_EMAIL = 'prabodha@carchief.com';
const FIXTURE_PASSWORD = 'Password@1234';

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

test.describe('Customer Invoices & PI Contract E2E (D02-P05-T003)', () => {
  test('navigates to Invoices & Ledger, checks KPI cards, tab groupings and search filtering', async ({ page }) => {
    await signIn(page);

    const isDesktop = (page.viewportSize()?.width ?? 0) >= 1024;
    if (!isDesktop) {
      await page.getByTestId('cust-mobile-toggle').click();
    }
    const nav = page.locator(isDesktop ? '.cc-cust-shell-nav--desktop' : '.cc-cust-shell-nav--mobile');

    // Click Invoices & Ledger link
    await nav.getByRole('link', { name: /Invoices & Ledger/ }).click();

    // Verify invoices page is rendered
    await expect(page.getByTestId('customer-invoices-page')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Invoices & Customer Ledger' })).toBeVisible();

    // Verify KPI Summary Cards
    await expect(page.getByTestId('invoice-kpi-grid')).toBeVisible();
    await expect(page.getByTestId('kpi-total-invoiced')).toContainText('$50,100.00');
    await expect(page.getByTestId('kpi-total-paid')).toContainText('$12,500.00');
    await expect(page.getByTestId('kpi-total-outstanding')).toContainText('$37,600.00');

    // Verify all 3 tabs are visible
    await expect(page.getByTestId('tab-all-invoices')).toBeVisible();
    await expect(page.getByTestId('tab-proforma-invoices')).toBeVisible();
    await expect(page.getByTestId('tab-commercial-invoices')).toBeVisible();

    // Verify search input
    const searchInput = page.getByTestId('invoice-search-input');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('HiAce');

    // Verify filtered card is visible
    await expect(page.getByText('2020 Toyota HiAce Van')).toBeVisible();
    await expect(page.getByText('INV-0002')).toBeVisible();

    // Clear search
    await page.getByTestId('clear-search-btn').click();
    await expect(searchInput).toHaveValue('');
  });

  test('switches invoice type tabs and verifies PI vs Commercial scoping (RULE-08)', async ({ page }) => {
    await signIn(page);

    const isDesktop = (page.viewportSize()?.width ?? 0) >= 1024;
    if (!isDesktop) {
      await page.getByTestId('cust-mobile-toggle').click();
    }
    const nav = page.locator(isDesktop ? '.cc-cust-shell-nav--desktop' : '.cc-cust-shell-nav--mobile');
    await nav.getByRole('link', { name: /Invoices & Ledger/ }).click();

    await expect(page.getByTestId('customer-invoices-page')).toBeVisible();

    // Switch to Proforma Invoices tab
    await page.getByTestId('tab-proforma-invoices').click();
    await expect(page.getByTestId('tab-proforma-invoices')).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByText('PI-0001')).toBeVisible();
    await expect(page.getByText('Proforma Invoice (PI)')).toBeVisible();

    // Switch to Commercial Invoices tab
    await page.getByTestId('tab-commercial-invoices').click();
    await expect(page.getByTestId('tab-commercial-invoices')).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByText('INV-0001')).toBeVisible();
    await expect(page.getByText('INV-0002')).toBeVisible();
    await expect(page.getByText('INV-0003')).toBeVisible();

    // Switch back to All Invoices
    await page.getByTestId('tab-all-invoices').click();
    await expect(page.getByTestId('tab-all-invoices')).toHaveAttribute('aria-selected', 'true');
  });

  test('opens commercial invoice detail, checks line items, allocations, bank wire instructions, and printable modal', async ({ page }) => {
    await signIn(page);

    const isDesktop = (page.viewportSize()?.width ?? 0) >= 1024;
    if (!isDesktop) {
      await page.getByTestId('cust-mobile-toggle').click();
    }
    const nav = page.locator(isDesktop ? '.cc-cust-shell-nav--desktop' : '.cc-cust-shell-nav--mobile');
    await nav.getByRole('link', { name: /Invoices & Ledger/ }).click();

    await expect(page.getByTestId('customer-invoices-page')).toBeVisible();

    // Click on View Details for INV-0001
    await page.getByTestId('btn-view-invoice-inv-001').click();

    // Verify detail page elements
    await expect(page.getByTestId('customer-invoice-detail-page')).toBeVisible();
    await expect(page.getByTestId('invoice-detail-number')).toHaveText('INV-0001');
    await expect(page.getByTestId('invoice-detail-status')).toHaveText('PartiallyPaid');
    await expect(page.getByTestId('invoice-detail-header').getByText('2021 Toyota Corolla Axio')).toBeVisible();

    // Verify Financial Overview cards
    await expect(page.getByTestId('detail-kpi-total')).toContainText('$8,500.00');
    await expect(page.getByTestId('detail-kpi-paid')).toContainText('$5,500.00');
    await expect(page.getByTestId('detail-kpi-outstanding')).toContainText('$3,000.00');

    // Verify authoritative totals and honest unavailable line-item projection
    await expect(page.getByTestId('invoice-line-items-table')).toBeVisible();
    await expect(page.getByText('Itemized charges are unavailable pending an approved invoice breakdown.')).toBeVisible();
    await expect(page.getByTestId('line-items-total')).toContainText('$8,500.00');
    await expect(page.getByTestId('line-items-paid')).toContainText('-$5,500.00');
    await expect(page.getByTestId('line-items-outstanding')).toContainText('$3,000.00');

    // Verify Payment Allocations Table
    await expect(page.getByTestId('invoice-allocations-table')).toBeVisible();
    await expect(page.getByTestId('allocations-total-amount')).toContainText('$5,500.00');

    // Verify bank instructions are not fabricated before Finance confirmation
    await expect(page.getByTestId('bank-wire-instructions-card')).toBeVisible();
    await expect(page.getByText('Bank instructions are unavailable pending Finance confirmation.')).toBeVisible();
    await expect(page.getByText('MUFG Bank, Ltd.')).not.toBeVisible();

    // Open Printable Document Modal
    await page.getByTestId('open-printable-doc-btn').click();
    await expect(page.getByTestId('printable-invoice-modal')).toBeVisible();
    await expect(page.getByTestId('doc-modal-title')).toContainText('Commercial Invoice INV-0001');
    await expect(page.getByTestId('invoice-document-html')).toBeVisible();
    await expect(page.getByTestId('print-document-btn')).toBeVisible();

    // Close Modal
    await page.getByTestId('close-modal-btn').click();
    await expect(page.getByTestId('printable-invoice-modal')).not.toBeVisible();

    // Return to invoices list
    await page.getByTestId('invoice-detail-back-btn').click();
    await expect(page.getByTestId('customer-invoices-page')).toBeVisible();
  });

  test('opens proforma invoice detail and checks 72-hour payment deadline banner and 50% deposit requirement (RULE-07)', async ({ page }) => {
    await signIn(page);

    const isDesktop = (page.viewportSize()?.width ?? 0) >= 1024;
    if (!isDesktop) {
      await page.getByTestId('cust-mobile-toggle').click();
    }
    const nav = page.locator(isDesktop ? '.cc-cust-shell-nav--desktop' : '.cc-cust-shell-nav--mobile');
    await nav.getByRole('link', { name: /Invoices & Ledger/ }).click();

    await expect(page.getByTestId('customer-invoices-page')).toBeVisible();

    // Switch to Proforma tab and click PI-0001
    await page.getByTestId('tab-proforma-invoices').click();
    await page.getByTestId('btn-view-invoice-pi-001').click();

    // Verify PI Detail page
    await expect(page.getByTestId('customer-invoice-detail-page')).toBeVisible();
    await expect(page.getByTestId('invoice-detail-number')).toHaveText('PI-0001');
    await expect(page.getByText('Proforma Invoice (PI)')).toBeVisible();

    // Verify 72-hour Payment Deadline & 50% Deposit banner (RULE-07)
    await expect(page.getByTestId('proforma-deadline-banner')).toBeVisible();
    await expect(page.getByTestId('proforma-deadline-banner')).toContainText('72-Hour Payment Deadline & 50% Deposit Requirement');
    await expect(page.getByTestId('proforma-deadline-banner')).toContainText('$3,950.00 USD');

    // Open Printable Document Modal for PI
    await page.getByTestId('open-printable-doc-btn').click();
    await expect(page.getByTestId('printable-invoice-modal')).toBeVisible();
    await expect(page.getByTestId('doc-modal-title')).toContainText('Proforma Invoice PI-0001');
    await expect(page.getByTestId('invoice-document-html')).toBeVisible();

    // Close Modal
    await page.getByTestId('close-modal-btn').click();
    await expect(page.getByTestId('printable-invoice-modal')).not.toBeVisible();
  });
});
