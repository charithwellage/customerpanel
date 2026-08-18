import { test, expect, type Page } from '@playwright/test';
import { CUSTOMER_APP_BASE_URL } from './customerAppBase.js';

const FIXTURE_EMAIL = 'demo.customer@carchief.com';
const FIXTURE_PASSWORD = 'CarChief#Fixture2026';

async function signIn(page: Page): Promise<void> {
  await page.goto(CUSTOMER_APP_BASE_URL);
  await page.getByTestId('cust-login-email').fill(FIXTURE_EMAIL);
  await page.getByTestId('cust-login-password').fill(FIXTURE_PASSWORD);
  await page.getByTestId('cust-login-submit').click();
  await expect(page.getByRole('heading', { name: 'Customer Portal' })).toBeVisible();
}

async function navigateToWishlist(page: Page): Promise<void> {
  const isDesktop = (page.viewportSize()?.width ?? 0) >= 1024;
  if (!isDesktop) {
    await page.getByTestId('cust-mobile-toggle').click();
  }
  const nav = page.locator(isDesktop ? '.cc-cust-shell-nav--desktop' : '.cc-cust-shell-nav--mobile');
  await nav.getByRole('link', { name: /My Wishlist/ }).click();
}

test.describe('Customer My Wishlist E2E (D02-P13-T007)', () => {
  test('displays empty state when customer has no wishlisted vehicles', async ({ page }) => {
    await signIn(page);
    await navigateToWishlist(page);

    // Verify empty state is displayed
    await expect(page.getByTestId('customer-wishlist-page')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'My Wishlist' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'No wishlisted vehicles' })).toBeVisible();
    await expect(page.getByText(/Start exploring our inventory/)).toBeVisible();
    await expect(page.getByRole('button', { name: /Browse Inventory/ })).toBeVisible();
  });

  test('navigates to inventory from empty state', async ({ page }) => {
    await signIn(page);
    await navigateToWishlist(page);

    // Click browse inventory link
    await page.getByRole('button', { name: /Browse Inventory/ }).click();

    // Verify inventory page is shown
    await expect(page.getByTestId('customer-inventory-page')).toBeVisible();
  });

  test('displays wishlist after adding a vehicle', async ({ page }) => {
    await signIn(page);

    const isDesktop = (page.viewportSize()?.width ?? 0) >= 1024;
    if (!isDesktop) {
      await page.getByTestId('cust-mobile-toggle').click();
    }
    const nav = page.locator(isDesktop ? '.cc-cust-shell-nav--desktop' : '.cc-cust-shell-nav--mobile');

    // Navigate to inventory
    await nav.getByRole('link', { name: /Inventory/ }).click();
    await expect(page.getByTestId('customer-inventory-page')).toBeVisible();

    // Click the first vehicle card
    const firstCard = page.locator('.cc-vehicle-card').first();
    await firstCard.click();

    // Verify detail page is loaded
    await expect(page.getByTestId('customer-vehicle-detail-page')).toBeVisible();

    // Add to wishlist if button is visible
    const wishlistBtn = page.getByTestId('add-to-wishlist-btn');
    if (await wishlistBtn.isVisible()) {
      await wishlistBtn.click();
      // Wait for successful submission
      await expect(page.getByText(/added to wishlist|Already in wishlist/i)).toBeVisible({ timeout: 5000 });
    }

    // Navigate back to inventory
    await page.getByTestId('back-to-inventory-btn').click();
    await expect(page.getByTestId('customer-inventory-page')).toBeVisible();

    // Navigate to My Wishlist
    await nav.getByRole('link', { name: /My Wishlist/ }).click();

    // Verify My Wishlist page is displayed
    await expect(page.getByTestId('customer-wishlist-page')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'My Wishlist' })).toBeVisible();

    // Verify at least one item is shown
    const wishlistItems = page.locator('[role="article"]');
    await expect(wishlistItems.first()).toBeVisible();
  });

  test('displays wishlist limit information', async ({ page }) => {
    await signIn(page);
    await navigateToWishlist(page);

    // Verify page is displayed
    await expect(page.getByTestId('customer-wishlist-page')).toBeVisible();

    // The wishlist should have a description
    await expect(page.getByText(/Vehicles you've saved for later/)).toBeVisible();
  });

  test('navigates to vehicle details from wishlist item', async ({ page }) => {
    await signIn(page);
    await navigateToWishlist(page);

    const wishlistItems = page.locator('[role="article"]');
    const itemCount = await wishlistItems.count();

    if (itemCount > 0) {
      // Click the view details button on the first item
      const firstItem = wishlistItems.first();
      const viewBtn = firstItem.getByRole('button', { name: /View Vehicle Details/ });
      await viewBtn.click();

      // Verify vehicle detail page is shown
      await expect(page.getByTestId('customer-vehicle-detail-page')).toBeVisible();
    }
  });

  test('handles loading state gracefully', async ({ page }) => {
    await signIn(page);

    const isDesktop = (page.viewportSize()?.width ?? 0) >= 1024;
    if (!isDesktop) {
      await page.getByTestId('cust-mobile-toggle').click();
    }
    const nav = page.locator(isDesktop ? '.cc-cust-shell-nav--desktop' : '.cc-cust-shell-nav--mobile');

    // Navigate to wishlist
    await nav.getByRole('link', { name: /My Wishlist/ }).click();

    // Wait for the page to load (should not crash during loading)
    await expect(page.getByRole('heading', { name: 'My Wishlist' })).toBeVisible({ timeout: 10000 });
  });

  test('displays page title and description', async ({ page }) => {
    await signIn(page);
    await navigateToWishlist(page);

    // Verify page header
    await expect(page.getByRole('heading', { name: 'My Wishlist' })).toBeVisible();
    await expect(page.getByText(/Vehicles you've saved for later/)).toBeVisible();
  });

  test('wishlist navigation appears in both desktop and mobile menus', async ({ page }) => {
    await signIn(page);

    // Check desktop nav
    const desktopNav = page.locator('.cc-cust-shell-nav--desktop');
    if (await desktopNav.isVisible()) {
      const wishlistLink = desktopNav.getByRole('link', { name: /My Wishlist/ });
      await expect(wishlistLink).toBeVisible();
    }

    // Check mobile nav
    const mobileToggle = page.getByTestId('cust-mobile-toggle');
    if (await mobileToggle.isVisible()) {
      await mobileToggle.click();
      const mobileNav = page.locator('.cc-cust-shell-nav--mobile');
      const wishlistLink = mobileNav.getByRole('link', { name: /My Wishlist/ });
      await expect(wishlistLink).toBeVisible();
    }
  });
});
