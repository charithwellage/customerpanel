import { test, expect } from '@playwright/test';

const detailSlug = '2021-toyota-corolla-axio-veh-1';

test.describe('Vehicle detail page', () => {
  test('renders the vehicle detail page with gallery and price indicators', async ({ page }) => {
    await page.goto(`/allstock/${detailSlug}`);

    await expect(page.locator('h1')).toContainText('2021 Toyota Corolla Axio');
    await expect(page.locator('[aria-label="Vehicle media gallery"]')).toBeVisible();
    await expect(page.locator('.cc-badge').first()).toBeVisible();
  });

  test('supports gallery keyboard navigation and contact intent actions', async ({ page }) => {
    await page.goto(`/allstock/${detailSlug}`);

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
    await page.goto('/allstock/2018-subaru-forester-veh-no-media');
    await expect(page.getByText('No images available for this vehicle yet.')).toBeVisible();
  });

  test('returns a real 404 for an unknown vehicle slug, not a soft 404', async ({ page }) => {
    const response = await page.goto('/allstock/non-existent-vehicle-slug-999');

    expect(response?.status()).toBe(404);
    await expect(page.locator('.cc-vehicle-detail__not-found-text')).toContainText('Vehicle not found.');
    await expect(page.getByRole('link', { name: /Browse all vehicles/i })).toBeVisible();
  });

  test('returns 404 for a fabricated slug that merely ends with a real vehicle id', async ({ page }) => {
    // Guards the removed suffix matcher: these must not resolve to veh-1.
    for (const fabricated of ['totally-bogus-junk-veh-1', 'XYZ-veh-1']) {
      const response = await page.goto(`/allstock/${fabricated}`);
      expect(response?.status(), `expected 404 for /allstock/${fabricated}`).toBe(404);
    }
  });

  test('permanently redirects a bare id alias to the canonical slug', async ({ page }) => {
    const response = await page.goto('/allstock/veh-1');

    expect(response?.status()).toBe(200);
    expect(new URL(page.url()).pathname).toBe(`/allstock/${detailSlug}`);

    const redirectStatus = response?.request().redirectedFrom()?.response();
    expect((await redirectStatus)?.status()).toBe(308);
  });

  test('declares the canonical URL of the resolved vehicle, never the requested alias', async ({ page }) => {
    await page.goto('/allstock/veh-1');

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      new RegExp(`/allstock/${detailSlug}$`),
    );
  });
});
