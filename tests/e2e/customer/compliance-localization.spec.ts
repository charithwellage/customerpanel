import { test, expect, type Page, type APIRequestContext } from '@playwright/test';
import { CUSTOMER_APP_BASE_URL } from './customerAppBase.js';

const REGISTERED_PASSWORD = 'Sup3rSecretPass1';

async function registerFreshKenyaCustomer(request: APIRequestContext): Promise<{ email: string; token: string }> {
  const email = `cust-comp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  const registerResponse = await request.post(`${CUSTOMER_APP_BASE_URL}/api/v1/auth/register`, {
    data: {
      nameWithInitials: 'K. Compliance',
      countryCode: 'KE',
      mobileNumber: '712345678',
      email,
      password: REGISTERED_PASSWORD,
      confirmPassword: REGISTERED_PASSWORD,
    },
  });
  expect(registerResponse.status()).toBe(201);

  const loginResponse = await request.post(`${CUSTOMER_APP_BASE_URL}/api/v1/auth/login`, {
    data: { email, password: REGISTERED_PASSWORD },
  });
  expect(loginResponse.status()).toBe(200);
  const { token } = (await loginResponse.json()) as { token: string };

  await request.put(`${CUSTOMER_APP_BASE_URL}/api/v1/customer/profile`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      deliveryAddress: 'Kenya',
      phone: '+254712345678',
    },
  });

  return { email, token };
}

async function signIn(page: Page, email: string): Promise<void> {
  await page.goto(CUSTOMER_APP_BASE_URL);
  await page.getByTestId('cust-login-email').fill(email);
  await page.getByTestId('cust-login-password').fill(REGISTERED_PASSWORD);
  await page.getByTestId('cust-login-submit').click();
  await expect(page.locator('.cc-cust-shell-layout')).toBeVisible({ timeout: 10000 });
}

test.describe('Vehicle Localization & Regulatory Import Compliance (D02-P14-T005)', () => {
  test('automatically displays country compliance localization banner for Kenya customer on inventory search', async ({
    page,
    request,
  }) => {
    const { email } = await registerFreshKenyaCustomer(request);
    await signIn(page, email);

    const isDesktop = (page.viewportSize()?.width ?? 0) >= 1024;
    if (!isDesktop) {
      await page.getByTestId('cust-mobile-toggle').click();
    }
    const nav = page.locator(isDesktop ? '.cc-cust-shell-nav--desktop' : '.cc-cust-shell-nav--mobile');
    await nav.getByRole('link', { name: /Inventory/ }).click();

    await expect(page.getByTestId('customer-inventory-page')).toBeVisible({ timeout: 10000 });

    // Compliance banner should be visible and active for Kenya
    const banner = page.getByTestId('compliance-localization-banner');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('Import Compliance: Kenya');
    await expect(banner).toContainText('Kenya import regulations');

    // Toggle button should allow viewing global stock
    const toggleBtn = page.getByTestId('compliance-toggle-btn');
    await expect(toggleBtn).toBeVisible();
    await expect(toggleBtn).toHaveText('Show All Global Stock');

    // Clicking toggle switches mode to global stock
    await toggleBtn.click();
    await expect(banner).toContainText('Global Stock (Kenya Filter Off)');
    await expect(toggleBtn).toHaveText('Filter for Kenya Only');

    // Clicking again restores Kenya compliance filter
    await toggleBtn.click();
    await expect(banner).toContainText('Import Compliance: Kenya');
  });

  test('displays regulatory import compliance evaluation card on vehicle detail view', async ({
    page,
    request,
  }) => {
    const { email } = await registerFreshKenyaCustomer(request);
    await signIn(page, email);

    const isDesktop = (page.viewportSize()?.width ?? 0) >= 1024;
    if (!isDesktop) {
      await page.getByTestId('cust-mobile-toggle').click();
    }
    const nav = page.locator(isDesktop ? '.cc-cust-shell-nav--desktop' : '.cc-cust-shell-nav--mobile');
    await nav.getByRole('link', { name: /Inventory/ }).click();

    await expect(page.getByTestId('customer-inventory-page')).toBeVisible({ timeout: 10000 });

    // Click first vehicle card
    const firstCard = page.locator('.cc-vehicle-card').first();
    await expect(firstCard).toBeVisible();
    await firstCard.click();

    await expect(page.getByTestId('customer-vehicle-detail-page')).toBeVisible({ timeout: 10000 });

    const complianceCard = page.getByTestId('vehicle-compliance-card');
    await expect(complianceCard).toBeVisible();
    await expect(complianceCard).toContainText('Kenya');
  });
});
