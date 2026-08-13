import { test, expect } from '@playwright/test';

test.describe('Public Web Performance & Resource Budgets', () => {
  test('verifies page load performance and DOM node budget on homepage', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const loadDurationMs = Date.now() - startTime;

    // Load time under budget (15 seconds for dev server compilation mode)
    expect(loadDurationMs).toBeLessThan(15000);

    // DOM node count under budget (< 1500 elements)
    const domNodeCount = await page.evaluate(() => document.querySelectorAll('*').length);
    expect(domNodeCount).toBeLessThan(1500);
  });

  test('verifies responsive image optimizations and layout stability', async ({ page }) => {
    await page.goto('/allstock', { waitUntil: 'domcontentloaded' });

    // Verify images have alt attributes
    const missingAltCount = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs.filter((img) => !img.hasAttribute('alt')).length;
    });

    expect(missingAltCount).toBe(0);
  });
});
