import { test, expect } from '@playwright/test';

const detailSlug = '2021-toyota-corolla-axio-veh-1';

/**
 * Freight estimate selection and explanation UI (PUB-12, D01-P05-T003).
 *
 * While `DEC-PUB-FREIGHT-MODEL`/`DEC-PUB-CITY-DELIVERY` remain OPEN
 * (D01-ASM-001), a successful estimate request always returns the
 * deterministic `estimate_unavailable_pending_rate` outcome — these tests
 * assert that honest state renders, and that no fabricated total/currency
 * figure ever appears (RULE-09, RULE-10).
 */
test.describe('Freight estimate section on the vehicle detail page', () => {
  test('renders the destination/port selection form with an idle result panel', async ({ page }) => {
    await page.goto(`/vehicles/${detailSlug}`);

    const section = page.locator('[aria-label="Shipping cost estimate"]');
    await expect(section.getByRole('heading', { name: 'Estimate Shipping Cost' })).toBeVisible();
    await expect(section.getByLabel('Destination country')).toBeVisible();
    await expect(section.getByLabel('Arrival port')).toBeVisible();
    await expect(section.getByRole('button', { name: 'Get shipping estimate' })).toBeVisible();
    await expect(section.getByText(/Select a destination and arrival port/i)).toBeVisible();
  });

  test('shows accessible field validation when submitted without a destination or port', async ({ page }) => {
    await page.goto(`/vehicles/${detailSlug}`);
    const section = page.locator('[aria-label="Shipping cost estimate"]');

    await section.getByRole('button', { name: 'Get shipping estimate' }).click();

    await expect(section.getByRole('alert').filter({ hasText: 'Select a destination country.' })).toBeVisible();
    await expect(section.getByRole('alert').filter({ hasText: 'Select an arrival port.' })).toBeVisible();
    await expect(section.getByLabel('Destination country')).toHaveAttribute('aria-invalid', 'true');
  });

  test('renders the first-class "estimate unavailable" state with no fabricated total after a valid submission', async ({
    page,
  }) => {
    await page.goto(`/vehicles/${detailSlug}`);
    const section = page.locator('[aria-label="Shipping cost estimate"]');

    await section.getByLabel('Destination country').selectOption({ label: 'Uganda (Uganda)' });
    await section.getByLabel('Arrival port').selectOption({ label: 'Mombasa (Kenya)' });

    const [response] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/v1/freight/estimate') && res.request().method() === 'POST'),
      section.getByRole('button', { name: 'Get shipping estimate' }).click(),
    ]);
    expect(response.status()).toBe(200);

    const resultPanel = section.getByRole('status').filter({ hasText: 'Estimate unavailable' });
    await expect(resultPanel).toBeVisible();
    await expect(resultPanel).toContainText('pending confirmed rate');
    await expect(resultPanel.getByRole('link', { name: 'Request a formal quotation' })).toBeVisible();

    // RULE-09/RULE-10: no fabricated currency total anywhere in the panel.
    const panelText = await resultPanel.innerText();
    expect(panelText).not.toMatch(/\$\s?\d/);
    expect(panelText.toLowerCase()).not.toContain('total');
  });

  test('the enquiry link declares the vehicle and topic without claiming a quotation was sent', async ({ page }) => {
    await page.goto(`/vehicles/${detailSlug}`);
    const section = page.locator('[aria-label="Shipping cost estimate"]');

    await section.getByLabel('Destination country').selectOption({ label: 'Uganda (Uganda)' });
    await section.getByLabel('Arrival port').selectOption({ label: 'Mombasa (Kenya)' });
    await section.getByRole('button', { name: 'Get shipping estimate' }).click();

    const enquiryLink = section.getByRole('link', { name: 'Request a formal quotation' });
    await expect(enquiryLink).toHaveAttribute('href', new RegExp(`/contact\\?vehicle=${detailSlug}&topic=freight-estimate`));
  });
});
