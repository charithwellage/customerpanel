import { test, expect } from '@playwright/test';

test.describe('Services Page & Navigation Integration Suite (D02-P14-T004)', () => {
  test('navigates from homepage header to /services via SERVICES link', async ({ page }) => {
    await page.goto('/');
    const mobileMenuBtn = page.getByRole('button', { name: /open navigation menu|menu/i });
    if (await mobileMenuBtn.isVisible()) {
      await mobileMenuBtn.click();
    }
    const servicesLink = page.getByRole('link', { name: 'SERVICES' });
    await expect(servicesLink).toBeVisible();
    await servicesLink.click();
    await expect(page).toHaveURL(/\/services/);
    await expect(page.locator('h1')).toContainText('Global Vehicle Services');
  });

  test('renders all 4 service pillars with marketing copy', async ({ page }) => {
    await page.goto('/services');

    // Hero & Stats
    await expect(page.locator('h1')).toContainText('Global Vehicle Services & Direct Buyer Solutions');
    await expect(page.locator('.services-stat-value').first()).toContainText('~2 Weeks');
    await expect(page.getByText('Fast-Track Shipment (vs. 3-4 weeks normal)')).toBeVisible();

    // Pillar 1: Shipment
    await expect(page.getByRole('heading', { level: 3, name: 'Vehicle Shipment & Fast-Track Logistics' })).toBeVisible();
    await expect(page.getByText('CarChief processes cars for shipment to local agents in approximately two weeks')).toBeVisible();

    // Pillar 2: Additional Services & Warranty
    await expect(page.getByRole('heading', { level: 3, name: 'Additional Services & CarChief Warranty' })).toBeVisible();
    await expect(page.getByText('Exclusive CarChief Warranty: Peace of mind warranty for direct buyers.')).toBeVisible();

    // Pillar 3: Port Clearing
    await expect(page.getByRole('heading', { level: 3, name: 'Destination Port Clearing Services' })).toBeVisible();
    await expect(page.getByText('Single Point of Contact: Full clearing handled from Japan to destination port.')).toBeVisible();

    // Pillar 4: Border Delivery
    await expect(page.getByRole('heading', { level: 2, name: 'Border Delivery Logistics & Inland Partnerships' })).toBeVisible();
  });

  test('interactively switches border logistics country tabs and displays border towns', async ({ page }) => {
    await page.goto('/services');

    // Default tab: Zimbabwe
    const zimTab = page.getByRole('tab', { name: /Zimbabwe/ });
    await expect(zimTab).toBeVisible();
    await expect(page.getByText('Beitbridge')).toBeVisible();
    await expect(page.getByText('Harare')).toBeVisible();

    // Switch to Zambia
    const zamTab = page.getByRole('tab', { name: /Zambia/ });
    await zamTab.click();
    await expect(zamTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByText('Lusaka')).toBeVisible();
    await expect(page.getByText('Ndola')).toBeVisible();
    await expect(page.getByText('Kitwe')).toBeVisible();

    // Switch to Botswana
    const botTab = page.getByRole('tab', { name: /Botswana/ });
    await botTab.click();
    await expect(botTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByText('Gaborone')).toBeVisible();

    // Switch to DR Congo
    const drcTab = page.getByRole('tab', { name: /DR Congo/ });
    await drcTab.click();
    await expect(drcTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByText('Kasumbalesa')).toBeVisible();
    await expect(page.getByText('Mokambo')).toBeVisible();
    await expect(page.getByText('Sakania')).toBeVisible();
  });

  test('renders CTA buttons with correct destinations', async ({ page }) => {
    await page.goto('/services');
    await expect(page.getByRole('link', { name: 'BROWSE ALL STOCK', exact: true })).toHaveAttribute('href', '/allstock');
    await expect(page.getByRole('link', { name: 'Browse All Stock', exact: true })).toHaveAttribute('href', '/allstock');
    await expect(page.getByRole('link', { name: 'Freight Calculator' })).toHaveAttribute('href', '/freight-calculator');
    await expect(page.getByRole('link', { name: 'Contact Sales Support' })).toHaveAttribute('href', '/contact');
  });
});
