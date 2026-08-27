import type { MetadataRoute } from 'next';

const DEFAULT_SITE_URL = 'http://127.0.0.1:3000';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL;
  const now = new Date();

  const staticRoutes = [
    '',
    '/allstock',
    '/premium-stock',
    '/freight-calculator',
    '/contact',
    '/about',
    '/services',
    '/how-to-buy',
    '/auction',
    '/branches',
    '/shipping-schedule',
    '/privacy',
    '/faq',
    '/testimonials',
  ];

  const routes: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: route === '' || route === '/allstock' ? 'daily' : 'weekly',
    priority: route === '' ? 1.0 : route === '/allstock' ? 0.9 : 0.7,
  }));

  return routes;
}
