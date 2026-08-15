import { test, expect } from '@playwright/test';
import { CUSTOMER_APP_BASE_URL } from './customerAppBase.js';

test.describe.configure({ mode: 'serial' });

test.describe('Customer notifications and linked navigation @serial-reset', () => {
  test.beforeEach(async ({ page }) => {
    await page.request.post(`${CUSTOMER_APP_BASE_URL}/api/v1/__reset`);
    await page.goto(CUSTOMER_APP_BASE_URL);
    await expect(page.getByRole('heading', { name: 'Sign In to CarChief' })).toBeVisible();
    await page.getByRole('button', { name: /Request Demo Session/ }).click();
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await page.goto(`${CUSTOMER_APP_BASE_URL}/notifications`);
    await expect(page.getByRole('heading', { name: 'Notifications' })).toBeVisible();
  });

  test('filters unread updates, marks one read and opens its related shipment', async ({ page }) => {
    await expect(page.getByText('2 unread')).toBeVisible();
    await page.getByRole('button', { name: 'Unread' }).click();
    await expect(page.getByText('Your vehicle veh-1 is ready for shipment')).toBeVisible();
    await expect(page.getByText('Delivery proof for vehicle veh-3 now available')).toBeVisible();
    await page.getByRole('article').filter({ hasText: 'Your vehicle veh-1 is ready for shipment' }).getByRole('button', { name: 'Mark as read' }).click();
    await expect(page.getByText('1 unread')).toBeVisible();
    await page.getByRole('button', { name: 'All', exact: true }).click();
    await page.getByRole('article').filter({ hasText: 'Your vehicle veh-1 is ready for shipment' }).getByRole('button', { name: 'Open related record' }).click();
    await expect(page.getByRole('heading', { name: 'Shipment tracking' })).toBeVisible();
  });

  test('supports search, mark-all, empty results and keyboard focus', async ({ page }) => {
    const search = page.getByRole('searchbox', { name: 'Search notifications' });
    await search.fill('does-not-exist');
    await expect(page.getByText('No notifications match your search.')).toBeVisible();
    await search.fill('');
    await page.getByRole('button', { name: 'Mark all read' }).click();
    await expect(page.getByText('0 unread')).toBeVisible();
    await page.getByRole('button', { name: 'Unread' }).click();
    await expect(page.getByText('You have no unread notifications.')).toBeVisible();
    await search.focus();
    await expect(search).toBeFocused();
  });
});
