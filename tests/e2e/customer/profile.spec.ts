import { test, expect } from '@playwright/test';
import { CUSTOMER_APP_BASE_URL } from './customerAppBase.js';

test.describe.configure({ mode: 'serial' });

test.describe('Customer profile and identity handoff @serial-reset', () => {
  test.beforeEach(async ({ page }) => {
    await page.request.post(`${CUSTOMER_APP_BASE_URL}/api/v1/__reset`);
    await page.goto(`${CUSTOMER_APP_BASE_URL}/profile`);
    await expect(page.getByRole('heading', { name: 'Sign In to CarChief' })).toBeVisible();
    await page.getByRole('button', { name: /Request Demo Session/ }).click();
    await expect(page.getByRole('heading', { name: 'Profile & Account' })).toBeVisible();
  });

  test('shows fixed identity, edits contact details, and persists the saved result', async ({ page }) => {
    await expect(page.getByText('Name and email are fixed by the authenticated customer identity')).toBeVisible();
    await expect(page.getByText('user@carchief.com')).toBeVisible();
    await expect(page.getByText('user@carchief.com')).not.toHaveAttribute('contenteditable', 'true');
    await page.getByLabel('Company name').fill('Profile Acceptance Co');
    await page.getByLabel('Phone number').fill('+1 555 0177');
    await page.getByLabel('Delivery address').fill('77 Acceptance Road');
    await page.getByRole('button', { name: 'Save contact details' }).click();
    await expect(page.getByRole('status')).toContainText('Your contact details were saved.');
    await expect(page.getByLabel('Company name')).toHaveValue('Profile Acceptance Co');
  });

  test('shows validation, honest password handoff, and blocks offline mutation', async ({ page }) => {
    await page.getByLabel('Company name').fill('x');
    await page.getByRole('button', { name: 'Save contact details' }).click();
    await expect(page.getByRole('alert')).toContainText('at least 2 characters');
    await page.getByRole('button', { name: 'Open identity-provider handoff' }).click();
    await expect(page.getByRole('alert')).toContainText('not completed by this demo');
    await page.evaluate(() => window.dispatchEvent(new Event('offline')));
    await expect(page.getByText('Profile updates are disabled until connectivity returns.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save contact details' })).toBeDisabled();
  });

  test('returns to sign-in when the authenticated session is cleared', async ({ page }) => {
    await page.evaluate(() => sessionStorage.clear());
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Sign In to CarChief' })).toBeVisible();
  });
});
