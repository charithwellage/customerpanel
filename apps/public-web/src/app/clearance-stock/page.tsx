import type { Metadata } from 'next';
import { ClearanceStockPageClient } from './ClearanceStockPageClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://127.0.0.1:3000';

export const metadata: Metadata = {
  title: 'Clearance Stock | CarChief',
  description: 'Search CarChief clearance stock with dedicated vehicle search, filters, sorting, and pagination.',
  alternates: { canonical: `${SITE_URL}/clearance-stock` },
  openGraph: {
    title: 'Clearance Stock | CarChief',
    description: 'Browse and search CarChief clearance vehicles.',
    url: `${SITE_URL}/clearance-stock`,
    siteName: 'CarChief',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Clearance Stock | CarChief',
    description: 'Browse and search CarChief clearance vehicles.',
  },
};

export const dynamic = 'force-dynamic';

export default function ClearanceStockPage() {
  return <ClearanceStockPageClient />;
}
