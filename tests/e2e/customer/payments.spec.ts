import { test, expect, type Page } from '@playwright/test';
import { issueSessionToken } from '@carchief/domain';
import { CUSTOMER_APP_BASE_URL } from './customerAppBase.js';

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
    await page.getByTestId('payment-controls').getByRole('button', { name: 'All', exact: true }).click();
    await expect(page.getByTestId('payment-detail')).toBeVisible();
    await page.getByLabel('Search payments').fill('does-not-exist');
    await expect(page.getByText('No matching payment records are available.')).toBeVisible();
  });
});

test.describe('Customer TT submission (D02-P06-T003)', () => {
  test('validates and submits proof metadata without uploading proof bytes', async ({ page }) => {
    await signIn(page);
    const desktop = (page.viewportSize()?.width ?? 0) >= 1024;
    if (!desktop) await page.getByTestId('cust-mobile-toggle').click();
    const nav = page.locator(desktop ? '.cc-cust-shell-nav--desktop' : '.cc-cust-shell-nav--mobile');
    await nav.getByRole('link', { name: 'Payments' }).click();
    await expect(page.getByRole('heading', { name: 'Submit a TT payment' })).toBeVisible();

    await page.getByRole('button', { name: 'Submit TT payment' }).click();
    await expect(page.getByText('Invoice ID is required.')).toBeVisible();

    const paymentRequests: Array<{ body?: string }> = [];
    page.on('request', (request) => {
      if (request.method() === 'POST' && request.url().includes('/customer/payments')) paymentRequests.push({ body: request.postData() || undefined });
    });
    await page.getByLabel('Invoice ID').fill('inv-003');
    await page.getByLabel('Transfer reference').fill(`TT-E2E-${Date.now()}`);
    await page.getByLabel('Bank name').fill('Customer Bank');
    await page.getByLabel('Amount (USD)').fill('125.50');
    await page.getByLabel('Transfer date').fill('2026-08-14');
    await page.getByLabel('Proof metadata (PDF, JPG or PNG; max 10 MB)').setInputFiles({ name: 'receipt.pdf', mimeType: 'application/pdf', buffer: Buffer.from('proof bytes must not be sent') });
    await page.getByRole('button', { name: 'Submit TT payment' }).click();
    await expect(page.getByText(/was submitted for review/)).toBeVisible();
    expect(paymentRequests).toHaveLength(1);
    expect(paymentRequests[0]?.body).toContain('receipt.pdf');
    expect(paymentRequests[0]?.body).not.toContain('proof bytes must not be sent');
  });
});

test.describe('Customer payment workflow (D02-P06-T004)', () => {
  test('shows the server hold reason and allows an online owner resubmission', async ({ page }, testInfo) => {
    const suffix = `${testInfo.project.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const customerToken = issueSessionToken('CustomerBuyer');
    const customerPayment = await page.request.post('/api/v1/customer/payments', {
      headers: { Authorization: `Bearer ${customerToken}` },
      data: {
        invoiceId: 'inv-003', reference: `TT-E2E-HOLD-${suffix}`, bankName: 'Customer Bank', currency: 'USD', amountUsd: 125,
        paymentDate: '2026-08-14', idempotencyKey: `idem-${suffix}`,
        proof: { fileName: 'hold-proof.pdf', fileType: 'PDF', sizeBytes: 1200, scanStatus: 'Pending' },
      },
    });
    expect(customerPayment.status()).toBe(201);
    const payment = await customerPayment.json() as { id: string };
    const financeToken = issueSessionToken('FinanceManager');
    const hold = await page.request.post(`/api/v1/finance/customer-payments/${payment.id}/notifications`, {
      headers: { Authorization: `Bearer ${financeToken}` },
      data: { event: 'PaymentHeld', reason: 'Playwright workflow hold' },
    });
    expect([201, 409]).toContain(hold.status());

    await signIn(page);
    const desktop = (page.viewportSize()?.width ?? 0) >= 1024;
    if (!desktop) await page.getByTestId('cust-mobile-toggle').click();
    const nav = page.locator(desktop ? '.cc-cust-shell-nav--desktop' : '.cc-cust-shell-nav--mobile');
    await nav.getByRole('link', { name: 'Payments' }).click();
    await page.getByTestId(`payment-card-${payment.id}`).click();
    await expect(page.getByText('Hold reason: Playwright workflow hold')).toBeVisible();
    await page.getByRole('button', { name: 'Resubmit payment' }).click();
    await expect(page.getByTestId(`payment-card-${payment.id}`).getByText('Resubmitted')).toBeVisible();
  });
});
