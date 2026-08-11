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

  test('supports gallery keyboard navigation and contact intent actions', async ({ page }) => {
    await page.goto(`/vehicles/${detailSlug}`);

    const gallery = page.locator('[role="region"][aria-label^="Image"]');
    await expect(gallery).toBeVisible();
    await gallery.focus();

    // Verify initial image label
    await expect(gallery).toHaveAttribute('aria-label', 'Image 1 of 2');

    // Press ArrowRight to navigate to next image
    await gallery.press('ArrowRight');
    await expect(gallery).toHaveAttribute('aria-label', 'Image 2 of 2');

    // Press ArrowLeft to return to previous image
    await gallery.press('ArrowLeft');
    await expect(gallery).toHaveAttribute('aria-label', 'Image 1 of 2');

    // Verify contact intent action buttons
    const primaryAction = page.locator('.cc-vehicle-detail__actions a').first();
    await expect(primaryAction).toBeVisible();
    await expect(page.locator('.cc-vehicle-detail__actions a[href*="wa.me"]')).toBeVisible();
  });

  test('renders no-image fallback when media is missing', async ({ page }) => {
    await page.goto('/vehicles/2018-subaru-forester-veh-no-media');
    await expect(page.getByText('No images available for this vehicle yet.')).toBeVisible();
  });

  test('renders not-found state for unknown vehicle slug or ID', async ({ page }) => {
    await page.goto('/vehicles/non-existent-vehicle-slug-999');
    await expect(page.locator('.cc-vehicle-detail__not-found-text')).toContainText('Vehicle not found.');
    await expect(page.getByRole('link', { name: /Browse all vehicles/i })).toBeVisible();
  });

});

