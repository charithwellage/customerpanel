import { describe, expect, it } from 'vitest';
import sitemap from '../app/sitemap';
import robots from '../app/robots';
import nextConfig from '../../next.config.mjs';

describe('SEO Routes & Policy (PUB-11, PUB-24, DEC-PUB-SEO-SCOPE)', () => {
  it('generates complete sitemap.xml entries for all public routes', async () => {
    const entries = await sitemap();
    expect(entries.length).toBeGreaterThanOrEqual(13);

    const urls = entries.map((entry) => entry.url);
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://127.0.0.1:3000';

    expect(urls).toContain(`${baseUrl}`);
    expect(urls).toContain(`${baseUrl}/vehicles`);
    expect(urls).toContain(`${baseUrl}/freight-calculator`);
    expect(urls).toContain(`${baseUrl}/contact`);
    expect(urls).toContain(`${baseUrl}/about`);
    expect(urls).toContain(`${baseUrl}/services`);
    expect(urls).toContain(`${baseUrl}/how-to-buy`);
    expect(urls).toContain(`${baseUrl}/auction`);
    expect(urls).toContain(`${baseUrl}/branches`);
    expect(urls).toContain(`${baseUrl}/shipping-schedule`);
    expect(urls).toContain(`${baseUrl}/privacy`);
    expect(urls).toContain(`${baseUrl}/faq`);
    expect(urls).toContain(`${baseUrl}/testimonials`);

    const homeEntry = entries.find((e) => e.url === `${baseUrl}`);
    expect(homeEntry?.priority).toBe(1.0);
    expect(homeEntry?.changeFrequency).toBe('daily');
  });

  it('generates robots.txt rules allowing public indexing and blocking private account routes', () => {
    const robotRules = robots();
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://127.0.0.1:3000';

    expect(robotRules.sitemap).toBe(`${baseUrl}/sitemap.xml`);

    const rules = Array.isArray(robotRules.rules) ? robotRules.rules : [robotRules.rules];
    expect(rules.length).toBeGreaterThan(0);

    const defaultRule = rules.find((r) => r.userAgent === '*');
    expect(defaultRule).toBeDefined();
    expect(defaultRule?.allow).toBe('/');

    const disallows = Array.isArray(defaultRule?.disallow)
      ? defaultRule.disallow
      : [defaultRule?.disallow];

    expect(disallows).toContain('/account/dashboard');
    expect(disallows).toContain('/account/settings');
    expect(disallows).toContain('/account/orders');
    expect(disallows).toContain('/api/');
  });

  it('configures legacy PHP redirects for PUB-24 traceability inventory', async () => {
    expect(nextConfig.redirects).toBeDefined();
    if (!nextConfig.redirects) return;

    const redirects = await nextConfig.redirects();
    expect(redirects.length).toBeGreaterThanOrEqual(15);

    const redirectMap = new Map(redirects.map((r) => [r.source, r.destination]));

    expect(redirectMap.get('/index.php')).toBe('/');
    expect(redirectMap.get('/stock.php')).toBe('/vehicles');
    expect(redirectMap.get('/stock_list.php')).toBe('/vehicles');
    expect(redirectMap.get('/search.php')).toBe('/vehicles');
    expect(redirectMap.get('/stock_detail.php')).toBe('/vehicles');
    expect(redirectMap.get('/shipping.php')).toBe('/shipping-schedule');
    expect(redirectMap.get('/schedule.php')).toBe('/shipping-schedule');
    expect(redirectMap.get('/auction.php')).toBe('/auction');
    expect(redirectMap.get('/company.php')).toBe('/about');
    expect(redirectMap.get('/contact.php')).toBe('/contact');
    expect(redirectMap.get('/services.php')).toBe('/services');
    expect(redirectMap.get('/how_to_buy.php')).toBe('/how-to-buy');
    expect(redirectMap.get('/privacy.php')).toBe('/privacy');
    expect(redirectMap.get('/faq.php')).toBe('/faq');
    expect(redirectMap.get('/testimonials.php')).toBe('/testimonials');
    expect(redirectMap.get('/branch.php')).toBe('/branches');

    for (const r of redirects) {
      expect(r.permanent).toBe(true);
    }
  });
});
