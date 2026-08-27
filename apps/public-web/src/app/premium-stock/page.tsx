import type { Metadata } from 'next';
import { PremiumStockPageClient } from './PremiumStockPageClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://127.0.0.1:3000';

export const metadata: Metadata = {
  title: 'Premium Stock | CarChief',
  description: 'Search CarChief premium stock with dedicated vehicle search, filters, sorting, and pagination.',
  alternates: { canonical: `${SITE_URL}/premium-stock` },
  openGraph: {
    title: 'Premium Stock | CarChief',
    description: 'Browse and search CarChief premium vehicles.',
    url: `${SITE_URL}/premium-stock`,
    siteName: 'CarChief',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Premium Stock | CarChief',
    description: 'Browse and search CarChief premium vehicles.',
  },
};

export const dynamic = 'force-dynamic';

export default function PremiumStockPage() {
  return <PremiumStockPageClient />;
}
