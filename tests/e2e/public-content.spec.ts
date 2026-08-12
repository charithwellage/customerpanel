import { test, expect } from '@playwright/test';

test.describe('Public Content & Information Pages E2E Suite (PUB-17..PUB-35, D01-P07-T002)', () => {
  test('renders About Us page with title, badge and sections', async ({ page }) => {
    await page.goto('/about');
    await expect(page.locator('h1')).toHaveText('About CarChief');
    await expect(page.getByText('Company Information')).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Our Mission' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Quality Standards' })).toBeVisible();
  });

  test('renders How to Buy guide page with steps', async ({ page }) => {
    await page.goto('/how-to-buy');
    await expect(page.locator('h1')).toHaveText('How to Buy a Vehicle Step-by-Step');
    await expect(page.getByRole('heading', { level: 2, name: 'Step 1: Select Your Vehicle' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Step 4: Shipping & Customs' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Browse Vehicles' })).toHaveAttribute('href', '/vehicles');
  });

  test('renders Contact page with office cards and WhatsApp link', async ({ page }) => {
    await page.goto('/contact');
    await expect(page.locator('h1')).toHaveText('Contact Us');
    await expect(page.getByRole('heading', { level: 2, name: 'Global Customer Support' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: 'Tokyo Head Office' })).toBeVisible();
    await expect(page.getByText('Headquarters')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Contact via WhatsApp' })).toBeVisible();
  });

  test('renders Company Services page', async ({ page }) => {
    await page.goto('/services');
    await expect(page.locator('h1')).toHaveText('CarChief Company Services');
    await expect(page.getByText('OperationsTeam')).toBeVisible();
  });

  test('renders Auction Services page', async ({ page }) => {
    await page.goto('/auction');
    await expect(page.locator('h1')).toHaveText('Japanese Auto Auction Services');
    await expect(page.getByRole('heading', { level: 2, name: 'Auction Sourcing Service' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Auction Terms' })).toBeVisible();
  });

  test('renders Shipping Schedule page', async ({ page }) => {
    await page.goto('/shipping-schedule');
    await expect(page.locator('h1')).toHaveText('Ocean Shipping Schedule');
    await expect(page.getByRole('heading', { level: 2, name: 'How Ocean Shipping Generally Works' })).toBeVisible();
  });

  test('renders Privacy Policy page with interactive cookie consent choices', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.locator('h1')).toHaveText('Privacy & Cookie Policy');
    await expect(page.getByRole('heading', { level: 2, name: 'Cookie Preferences & Consent Choice' })).toBeVisible();

    const essentialBtn = page.getByRole('button', { name: 'Essential Cookies Only' });
    await essentialBtn.click();
    await expect(page.getByRole('status')).toContainText('Essential Cookies Only');

    const allBtn = page.getByRole('button', { name: 'Accept All Cookies' });
    await allBtn.click();
    await expect(page.getByRole('status')).toContainText('All Cookies Accepted');
  });

  test('renders dynamic Content Page by slug (security-bank-info)', async ({ page }) => {
    await page.goto('/content/security-bank-info');
    await expect(page.locator('h1')).toHaveText('Official Bank Details & Payment Security');
    await expect(page.getByText('Owner: FinanceTeam')).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Payment Verification Protocol' })).toBeVisible();
  });

  test('renders Branch Hub page for Harare Hub with collections', async ({ page }) => {
    await page.goto('/branches/harare-hub');
    await expect(page.locator('h1')).toHaveText('Harare Hub (demo)');
    await expect(page.getByText(/Code: HRE/)).toBeVisible();
    await expect(page.getByText('Welcome to CarChief Harare Hub — Direct Imports to Zimbabwe')).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: 'Harare Branch Support' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Latest Arrivals for Durban' })).toBeVisible();
  });

  test('renders Testimonials page and submits a new testimonial for moderation (PUB-19)', async ({ page }) => {
    await page.goto('/testimonials');
    await expect(page.getByRole('heading', { level: 2, name: 'Customer Testimonials & Success Stories' })).toBeVisible();
    await expect(page.getByText('John K.')).toBeVisible();
    await expect(page.getByText('Harare, Zimbabwe')).toBeVisible();

    // Submit testimonial form
    await page.fill('#authorName', 'Patrick M.');
    await page.fill('#authorLocation', 'Lusaka, Zambia');
    await page.fill('#vehiclePurchased', '2022 Toyota Land Cruiser Prado');
    await page.selectOption('#rating', '5');
    await page.fill('#content', 'Outstanding vehicle quality and smooth customs documentation handling.');
    await page.check('#consent');

    await page.click('button[type="submit"]');

    await expect(page.getByRole('status')).toContainText('Submission Received!');
    await expect(page.getByRole('status')).toContainText('pending review');
  });

  test('renders FAQ page with 12 categories, keyword search and grounded no-answer escalation (PUB-20)', async ({ page }) => {
    await page.goto('/faq');
    await expect(page.locator('h1')).toHaveText('Frequently Asked Questions');
    await expect(page.getByText('Category Count: 12 Categories')).toBeVisible();

    // Verify category tab
    await expect(page.getByRole('tab', { name: /Auction Services/ })).toBeVisible();

    // Search for non-existent keyword to trigger grounded no-answer state
    await page.fill('#faq-search-input', 'xyzunmatchedquery999');
    await page.click('button[type="submit"]');

    await expect(page.getByRole('heading', { level: 2, name: 'No Matching Verified Answer Found' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Contact Operations & Support' })).toHaveAttribute('href', '/contact');
  });
});
