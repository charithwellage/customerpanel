import { test, expect } from '@playwright/test';

const detailSlug = '2021-toyota-corolla-axio-veh-1';

test.describe('Vehicle detail page', () => {
  test('renders the vehicle detail page with gallery and price indicators', async ({ page }) => {
    page.on('console', (msg) => console.log('PAGE LOG:', msg.type(), msg.text()));
    page.on('pageerror', (err) => console.log('PAGE ERROR:', err.message));
    page.on('response', (res) => console.log('RESPONSE:', res.status(), res.url()));
    await page.goto(`/vehicles/${detailSlug}`);

    await expect(page.locator('h1')).toContainText('2021 Toyota Corolla Axio');
    await expect(page.locator('[aria-label="Vehicle media gallery"]')).toBeVisible();
    await expect(page.locator('.cc-badge').first()).toBeVisible();
  });

  test('renders no-image fallback when media is missing', async ({ page }) => {
    await page.goto('/vehicles/2018-subaru-forester-veh-no-media');
    await expect(page.getByText('No images available for this vehicle yet.')).toBeVisible();
  });
});
