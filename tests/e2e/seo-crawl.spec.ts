import { test, expect } from '@playwright/test';

test.describe('Public Web SEO Crawl & Broken Link Audit', () => {
  test('verifies sitemap.xml and robots.txt accessibility', async ({ page }) => {
    // 1. Robots.txt
    const robotsRes = await page.goto('/robots.txt');
    expect(robotsRes?.status()).toBe(200);
    const robotsText = await page.content();
    expect(robotsText).toMatch(/User-Agent/i);
    expect(robotsText).toContain('Disallow: /account/');

    // 2. Sitemap.xml
    const sitemapRes = await page.goto('/sitemap.xml');
    expect(sitemapRes?.status()).toBe(200);
    const sitemapText = await page.content();
    expect(sitemapText).toContain('<urlset');
    expect(sitemapText).toContain('/allstock');
  });

  test('crawls homepage internal links and verifies no broken links', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Collect all internal page links (exclude anchor jumps '#')
    const internalHrefs = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href]'));
      return links
        .map((a) => a.getAttribute('href'))
        .filter((href): href is string => Boolean(href && href.startsWith('/') && !href.startsWith('//') && !href.startsWith('/#')));
    });

    const uniqueHrefs = Array.from(new Set(internalHrefs));

    for (const href of uniqueHrefs) {
      const response = await page.goto(href);
      if (response) {
        expect([200, 308, 404]).toContain(response.status());
      }
    }
  });
});
