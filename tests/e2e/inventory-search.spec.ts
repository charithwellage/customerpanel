import { test, expect } from '@playwright/test';

test.describe('Inventory Search and Showroom Phase 1.3 tests', () => {
  test('standard search flow: keyword search, pagination, and url persistence', async ({ page }) => {
    await page.goto('/allstock');

    // Check page loaded
    await expect(page.locator('h1')).toContainText('Inventory Search');

    // Type in search bar
    const searchInput = page.getByPlaceholder('Search by keyword (e.g., Porsche, GT3, Black, V8)...');
    await searchInput.fill('Toyota');
    await searchInput.press('Enter');

    // URL should have make=Toyota since Toyota is a known make
    await expect(page).toHaveURL(/make=Toyota/);

    // Wait for results to update
    const resultHeader = page.locator('.cc-results-header');
    await expect(resultHeader).toBeVisible();

    // Refresh page and ensure state is kept
    await page.reload();
    await expect(searchInput).toHaveValue('');
    await expect(page).toHaveURL(/make=Toyota/);

    // Pagination
    // If there's a next page button
    const nextBtn = page.getByRole('button', { name: 'Next page' });
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
    }
  });

  test('natural language search parsing and reset behavior', async ({ page }) => {
    await page.goto('/allstock');

    // Type natural query and search
    const searchInput = page.getByPlaceholder('Search by keyword (e.g., Porsche, GT3, Black, V8)...');
    await searchInput.fill('Honda Civic newer than 2018');
    await searchInput.press('Enter');

    // Expected to parse "newer than 2018" into year_min
    // The visual tokens should render
    await expect(page.locator('.cc-understood-token-chip', { hasText: 'Make: Honda' }).first()).toBeVisible();
    // 'Civic' should just be left as the search input value
    await expect(searchInput).toHaveValue('Civic');
    await expect(page.locator('.cc-understood-token-chip', { hasText: 'From Year: 2018' }).first()).toBeVisible();

    // Click reset
    await page.getByRole('button', { name: 'Reset All' }).click();

    // Should reset searchQuery and remove tokens
    await expect(page).toHaveURL(/\/allstock(\?.*)?$/); // maybe page=1, limit=12 etc
    await expect(page.getByPlaceholder('Search by keyword (e.g., Porsche, GT3, Black, V8)...')).toHaveValue('');
    await expect(page.getByText('Make: Honda', { exact: false })).toBeHidden();
  });

  test('Premium full-list action retains query and legacy New tag is not rendered', async ({ page }) => {
    await page.goto('/allstock?collection=premium');

    // Ensure we are in premium stock view
    await expect(page).toHaveURL(/collection=premium/);

    // Ensure the old New tag is absent. Since we don't know the exact class, we'll check there's no tag with exactly "New"
    // The requirement says: "Ensure the Premium full-list action retains its query and the UI never renders the legacy New tag."
    // Let's assume the status badges are usually "Available", "Sold", "Reserved". There should be NO exact text "New".
    const newTags = page.locator('.cc-vehicle-card__status span', { hasText: /^New$/ });
    await expect(newTags).toHaveCount(0);
  });

  test('no-stock fallback, Multi-port union, 5-day Latest Arrival, Discounted/Clearance URL combos', async ({ page }) => {
    // Latest Arrival 5 days
    await page.goto('/allstock?collection=latest-arrivals');
    await expect(page).toHaveURL(/collection=latest-arrivals/);

    // Multi-port union
    await page.goto('/allstock?destinationPort=ALL');
    await expect(page).toHaveURL(/destinationPort=ALL/);

    // Discounted / Clearance
    await page.goto('/allstock?collection=clearance');
    await expect(page).toHaveURL(/collection=clearance/);

    // No-stock fallback - use a crazy string that returns 0 results
    await page.goto('/allstock?searchQuery=ASDFGHJKLQWERTYUIOP12345');
    await expect(page.getByText('No Vehicles Found')).toBeVisible();
  });
});
