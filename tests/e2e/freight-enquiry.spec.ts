import { test, expect } from '@playwright/test';

const detailSlug = '2021-toyota-corolla-axio-veh-1';

/**
 * Quotation enquiry flow (PUB-13, PUB-15, D01-P05-T004).
 *
 * The enquiry flow does not depend on `DEC-PUB-FREIGHT-MODEL` /
 * `DEC-PUB-CITY-DELIVERY` (D01-ASM-001): a visitor can select a destination
 * and submit a quotation enquiry even though the enquiry carries no computed
 * estimate. These tests use the running mock HTTP service end to end and
 * never assert a fabricated total/currency figure or a claim of staff
 * notification (RULE-09, RULE-10).
 */
test.describe('Quotation enquiry submission', () => {
  test.beforeEach(async ({ request, baseURL }) => {
    // Deterministic reset (RULE-08): each test starts from a clean enquiries
    // table so dedupe behavior asserted by one test never leaks into another
    // sharing the same running mock across projects/tests.
    await request.post(`${baseURL}/api/v1/__reset`);
  });

  test('a visitor can send a general enquiry directly and see a receipt confirmation', async ({ page }) => {
    await page.goto('/contact');

    await expect(page.getByRole('heading', { name: 'Contact Us' })).toBeVisible();

    await page.getByLabel('Name').fill('Jane Doe');
    await page.getByLabel('Email').fill('jane@example.com');
    await page.getByLabel('Phone number').fill('+256700111222');
    await page.getByLabel('Message').fill('I would like more information about your inventory.');

    const [response] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/v1/enquiries') && res.request().method() === 'POST'),
      page.getByRole('button', { name: 'Send enquiry' }).click(),
    ]);
    expect(response.status()).toBe(201);

    const confirmation = page.getByRole('status').filter({ hasText: 'Your enquiry was received' });
    await expect(confirmation).toBeVisible();
    await expect(confirmation.getByText('Reference')).toBeVisible();

    // RULE-09/RULE-10: no fabricated total, and no claim of staff notification.
    const confirmationText = await confirmation.innerText();
    expect(confirmationText).not.toMatch(/\$\s?\d/);
    expect(confirmationText.toLowerCase()).not.toContain('notified');
  });

  test('shows accessible field validation when submitted with no fields filled in', async ({ page }) => {
    await page.goto('/contact');

    await page.getByRole('button', { name: 'Send enquiry' }).click();

    await expect(page.getByRole('alert').filter({ hasText: 'Enter your name.' })).toBeVisible();
    await expect(page.getByRole('alert').filter({ hasText: 'Enter your email address.' })).toBeVisible();
    await expect(page.getByRole('alert').filter({ hasText: 'Enter your phone number.' })).toBeVisible();
    await expect(page.getByRole('alert').filter({ hasText: 'Enter your enquiry message.' })).toBeVisible();
    await expect(page.getByLabel('Name')).toHaveAttribute('aria-invalid', 'true');
  });

  test('a resubmission of the same enquiry is recognized as a duplicate rather than creating a second lead', async ({
    page,
  }) => {
    await page.goto('/contact');

    async function fillAndSubmit() {
      await page.getByLabel('Name').fill('Jane Doe');
      await page.getByLabel('Email').fill('jane.duplicate@example.com');
      await page.getByLabel('Phone number').fill('+256700111222');
      await page.getByLabel('Message').fill('Same enquiry, sent twice.');
      const [response] = await Promise.all([
        page.waitForResponse((res) => res.url().includes('/api/v1/enquiries') && res.request().method() === 'POST'),
        page.getByRole('button', { name: 'Send enquiry' }).click(),
      ]);
      return response;
    }

    const first = await fillAndSubmit();
    expect(first.status()).toBe(201);
    const firstConfirmation = page.getByRole('status').filter({ hasText: 'Your enquiry was received' });
    await expect(firstConfirmation).toBeVisible();

    await page.getByRole('button', { name: 'Send another enquiry' }).click();
    const second = await fillAndSubmit();
    expect(second.status()).toBe(200);
    const duplicateConfirmation = page.getByRole('status').filter({ hasText: 'already have this enquiry on file' });
    await expect(duplicateConfirmation).toBeVisible();
  });

  test('shows a recoverable, accessible failure state and succeeds on retry', async ({ page }) => {
    await page.goto('/contact');

    let callCount = 0;
    await page.route('**/api/v1/enquiries', async (route) => {
      callCount += 1;
      if (callCount === 1) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ statusCode: 500, message: 'Internal server error', correlationId: 'corr-test-1' }),
        });
        return;
      }
      await route.continue();
    });

    await page.getByLabel('Name').fill('Jane Doe');
    await page.getByLabel('Email').fill('jane.retry@example.com');
    await page.getByLabel('Phone number').fill('+256700111222');
    await page.getByLabel('Message').fill('Retry path enquiry.');
    await page.getByRole('button', { name: 'Send enquiry' }).click();

    const errorState = page.getByRole('alert').filter({ hasText: 'We could not send your enquiry.' });
    await expect(errorState).toBeVisible();

    const [response] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/v1/enquiries') && res.request().method() === 'POST'),
      errorState.getByRole('button', { name: 'Try again' }).click(),
    ]);
    expect(response.status()).toBe(201);
    await expect(page.getByRole('status').filter({ hasText: 'Your enquiry was received' })).toBeVisible();
    expect(callCount).toBe(2);
  });

  test('the freight estimate "Request a formal quotation" link carries the selected destination into a quotation enquiry', async ({
    page,
  }) => {
    await page.goto(`/vehicles/${detailSlug}`);
    const section = page.locator('[aria-label="Shipping cost estimate"]');

    await section.getByLabel('Destination country').selectOption({ label: 'Uganda (Uganda)' });
    await section.getByLabel('Arrival port').selectOption({ label: 'Mombasa (Kenya)' });
    await section.getByRole('button', { name: 'Get shipping estimate' }).click();

    const enquiryLink = section.getByRole('link', { name: 'Request a formal quotation' });
    await expect(enquiryLink).toHaveAttribute(
      'href',
      new RegExp(`/contact\\?vehicle=${detailSlug}&topic=freight-estimate&destinationCode=UG&portCode=MBA`)
    );

    await enquiryLink.click();
    await expect(page).toHaveURL(/\/contact\?/);
    await expect(page.getByRole('heading', { name: 'Request a Formal Quotation' })).toBeVisible();
    await expect(page.getByText(detailSlug, { exact: true })).toBeVisible();

    await page.getByLabel('Name').fill('Amara Okoye');
    await page.getByLabel('Email').fill('amara@example.com');
    await page.getByLabel('Phone number').fill('+256700555666');

    const [response] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/v1/enquiries') && res.request().method() === 'POST'),
      page.getByRole('button', { name: 'Send enquiry' }).click(),
    ]);
    expect(response.status()).toBe(201);
    const requestBody = response.request().postDataJSON() as { destinationCode?: string; portCode?: string };
    expect(requestBody.destinationCode).toBe('UG');
    expect(requestBody.portCode).toBe('MBA');

    const confirmation = page.getByRole('status').filter({ hasText: 'Your enquiry was received' });
    await expect(confirmation).toBeVisible();
    await expect(confirmation.getByText('UG via MBA')).toBeVisible();

    // RULE-09: the estimate snapshot carried into the confirmation is lookup
    // context only, never a fabricated monetary total.
    const confirmationText = await confirmation.innerText();
    expect(confirmationText).not.toMatch(/\$\s?\d/);
  });
});
