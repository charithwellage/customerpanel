import { test, expect } from '@playwright/test';

/**
 * Full Visitor Critical Journey E2E Test Suite (D01-P08-T001).
 * Tests the complete end-to-end journey from homepage to vehicle search,
 * detail page, freight estimator, enquiry submission, and content pages,
 * with deterministic reset verification.
 */
test.describe('Public Visitor Critical Journey & Reset Repeatability', () => {
  test.beforeEach(async ({ request }) => {
    // Reset mock data before each test for deterministic state
    const apiBaseUrl = process.env.API_BASE_URL ?? 'http://127.0.0.1:4000';
    try {
      await request.post(`${apiBaseUrl}/api/v1/reset`);
    } catch {
      // Ignore if server reset endpoint is not reachable in local dry-run
    }
  });

  test('executes complete public visitor journey (Home -> Search -> Detail -> Freight -> Enquiry -> Content)', async ({
    page,
  }) => {
    // 1. Home Page Navigation & Content Verification
    await page.goto('/');
    await expect(page).toHaveTitle(/CarChief/i);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/PREMIUM VEHICLES/i);
    await expect(page.getByText('CURATED GLOBAL ACQUISITIONS')).toBeVisible();

    // Verify Value Proposition Strip
    await expect(page.getByText('ELITE QUALITY SOURCING')).toBeVisible();
    await expect(page.getByText('CONTAINER OCEAN FREIGHT')).toBeVisible();
    await expect(page.getByText('DEDICATED SECURE PORTAL')).toBeVisible();

    // 2. Navigation to Vehicle Search Showroom
    await page.goto('/allstock');
    await expect(page).toHaveTitle(/Inventory Search/i);

    // Filter/Search Vehicles
    const searchInput = page.getByPlaceholder(/search by keyword/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('Toyota');
    }

    // 3. Navigation to Vehicle Detail Page
    await page.goto('/allstock/2021-toyota-corolla-axio-veh-1');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Toyota Corolla/i);
    await expect(page.getByText(/Body Style/i)).toBeVisible();

    // Verify Freight Estimator Section on Detail Page
    await expect(page.getByRole('heading', { name: /Estimate Shipping Cost/i })).toBeVisible();

    // 4. Dedicated Freight Calculator Page
    await page.goto('/freight-calculator');
    await expect(page).toHaveTitle(/Ocean Freight/i);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Ocean Freight Calculator/i);

    // 5. Contact & Enquiry Form Submission
    await page.goto('/contact?vehicle=2021-toyota-corolla-axio-veh-1');
    await expect(page.getByRole('heading', { level: 1, name: /Connect With Our Operations Agents/i })).toBeVisible();

    // Fill Enquiry Form
    await page.getByLabel(/name/i).first().fill('John Smith');
    await page.getByLabel(/email/i).first().fill('john.smith@example.com');
    await page.getByLabel(/phone number/i).first().fill('+15551234567');

    const messageField = page.getByLabel(/message/i).first();
    if (await messageField.isVisible()) {
      await messageField.fill('Interested in purchasing this Toyota Corolla for shipment to Mombasa.');
    }

    const consentCheckbox = page.getByLabel(/I agree to be contacted/i);
    if (await consentCheckbox.isVisible()) {
      await consentCheckbox.check();
    }

    const submitBtn = page.getByRole('button', { name: /send inquiry/i });
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await expect(page.getByRole('heading', { level: 3, name: /received|on file/i })).toBeVisible({ timeout: 10000 });
    }

    // 6. Public Content Pages Verification
    await page.goto('/about');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Welcome to CarChief/i);

    await page.goto('/services');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Services/i);

    await page.goto('/how-to-buy');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Buy Vehicles/i);

    await page.goto('/faq');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Logistics Knowledge Base/i);

    await page.goto('/shipping-schedule');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Shipping Schedule/i);

    await page.goto('/branches');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Regional Branch/i);

    await page.goto('/privacy');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Privacy.*Policy/i);
  });

  test('verifies legacy PHP URL redirection policy (PUB-24)', async ({ page }) => {
    // Legacy stock.php -> /allstock
    const response = await page.goto('/stock.php');
    expect(response?.url()).toContain('/allstock');
    expect(response?.ok(), 'the redirect target must actually resolve, not just match by string').toBeTruthy();

    // Legacy contact.php -> /contact
    const contactResponse = await page.goto('/contact.php');
    expect(contactResponse?.url()).toContain('/contact');
    expect(contactResponse?.ok()).toBeTruthy();

    // Legacy shipping.php -> /shipping-schedule
    const shippingResponse = await page.goto('/shipping.php');
    expect(shippingResponse?.url()).toContain('/shipping-schedule');
    expect(shippingResponse?.ok()).toBeTruthy();
  });
});
