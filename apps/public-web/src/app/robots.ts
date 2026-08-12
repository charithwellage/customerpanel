import type { MetadataRoute } from 'next';

const DEFAULT_SITE_URL = 'http://127.0.0.1:3000';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL;

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/account/dashboard',
          '/account/settings',
          '/account/orders',
          '/api/',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
