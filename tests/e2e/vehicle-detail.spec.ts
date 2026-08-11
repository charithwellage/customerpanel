import { test, expect } from '@playwright/test';

const detailSlug = '2021-toyota-corolla-axio-veh-1';

test.describe('Vehicle detail page', () => {
  test('renders the vehicle detail page with gallery and price indicators', async ({ page }) => {
    await page.goto(`/vehicles/${detailSlug}`);

    await expect(page.locator('h1')).toContainText('2021 Toyota Corolla Axio');
    await expect(page.locator('[aria-label="Vehicle media gallery"]')).toBeVisible();
    await expect(page.locator('.cc-gallery__main img')).toBeVisible();
    await expect(page.locator('.cc-badge')).toContainText(/Available|Sold|Request Price/);
    await expect(page.locator('.cc-gallery__thumb')).toHaveCount(2);
  });

  test('renders no-image fallback when media is missing', async ({ page }) => {
    await page.goto('/vehicles/2018-mitsubishi-outlander-veh-no-media');
    await expect(page.getByText('No images available for this vehicle yet.')).toBeVisible();
  });
});
