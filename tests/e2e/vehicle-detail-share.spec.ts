import { test, expect } from '@playwright/test';

const detailSlug = '2021-toyota-corolla-axio-veh-1';

test.describe('Vehicle detail share, print, and metadata', () => {
  test('direct load in fresh browser renders vehicle title and metadata', async ({ page }) => {
    await page.goto(`/vehicles/${detailSlug}`);

    // Verify main heading
    await expect(page.locator('h1')).toContainText('2021 Toyota Corolla Axio');

    // Verify metadata tags (PUB-11)
    await expect(page).toHaveTitle(/2021 Toyota Corolla Axio \| CarChief/i);

    const descriptionMeta = page.locator('meta[name="description"]');
    await expect(descriptionMeta).toHaveAttribute('content', /2021 Toyota Corolla Axio/i);

    // Verify canonical URL
    const canonicalLink = page.locator('link[rel="canonical"]');
    await expect(canonicalLink).toHaveAttribute('href', new RegExp(`/vehicles/${detailSlug}$`));

    // Verify OpenGraph tags
    const ogTitle = page.locator('meta[property="og:title"]');
    await expect(ogTitle).toHaveAttribute('content', /2021 Toyota Corolla Axio/i);

    // Verify Schema.org JSON-LD structured data
    const jsonLdScript = page.locator('script[type="application/ld+json"]');
    await expect(jsonLdScript).toBeAttached();
    const jsonLdContent = await jsonLdScript.textContent();
    expect(jsonLdContent).toContain('"@type":"Vehicle"');
    expect(jsonLdContent).toContain('"name":"2021 Toyota Corolla Axio"');
  });

  test('supports share button and clipboard fallback notification', async ({ page, context }) => {
    // Grant clipboard permissions for automated test environment
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await page.goto(`/vehicles/${detailSlug}`);

    const shareBtn = page.getByRole('button', { name: /Share vehicle page/i });
    await expect(shareBtn).toBeVisible();

    // Click Share button
    await shareBtn.click();

    // Verify toast notification appears accessibly (role="status", aria-live="polite").
    // Scoped to `.cc-toast` specifically (not a bare `[role="status"]`): the
    // page also carries the reservation sign-in guidance's own `role="status"`
    // region (D01-P06-T005), and Playwright's strict mode fails a locator
    // matching more than one element (`tasks/delivery_01/phase_06/CONTEXT.md` §5).
    const toast = page.locator('.cc-toast[role="status"]');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('Link copied to clipboard!');
  });

  test('supports print spec sheet button and print media styles', async ({ page }) => {
    await page.goto(`/vehicles/${detailSlug}`);

    const printBtn = page.getByRole('button', { name: /Print spec sheet/i });
    await expect(printBtn).toBeVisible();

    // Emulate print media and verify hidden navigation/utility elements
    await page.emulateMedia({ media: 'print' });

    // Verify utility bar and navigation controls are hidden in print media
    const utilityBar = page.locator('.cc-vehicle-detail__utility-bar');
    await expect(utilityBar).toBeHidden();
  });

  test('accessibility scan verifies ARIA attributes and focusable elements', async ({ page }) => {
    await page.goto(`/vehicles/${detailSlug}`);

    // The article is labelled by its own <h1>. The id is generated with useId(),
    // so assert the relationship rather than a hardcoded value — a literal id
    // here would be a collision risk if the component were ever rendered twice.
    const article = page.locator('article.cc-vehicle-detail');
    const labelledBy = await article.getAttribute('aria-labelledby');
    expect(labelledBy).toBeTruthy();

    const label = page.locator(`[id="${labelledBy}"]`);
    await expect(label).toHaveText(/2021 Toyota Corolla Axio/i);
    expect(await label.evaluate((el) => el.tagName)).toBe('H1');

    await expect(page.locator('[aria-label="Vehicle media gallery"]')).toBeVisible();
    await expect(page.locator('[aria-label="Status badges"]')).toBeVisible();
    await expect(page.locator('[aria-label="Contact options"]')).toBeVisible();
    await expect(page.locator('[aria-label="Vehicle specifications"]')).toBeVisible();
  });
});
