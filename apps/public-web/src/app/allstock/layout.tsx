import type { Metadata } from 'next';
import type { ReactNode } from 'react';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://127.0.0.1:3000';

export const metadata: Metadata = {
  title: 'Japanese Used Car Inventory Search | CarChief',
  description: 'Search quality Japanese used vehicles for global export. Filter by make, model, price, year, mileage, and location status.',
  alternates: {
    canonical: `${SITE_URL}/allstock`,
  },
  openGraph: {
    title: 'Japanese Used Car Inventory Search | CarChief',
    description: 'Search quality Japanese used vehicles for global export.',
    url: `${SITE_URL}/allstock`,
    siteName: 'CarChief',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Japanese Used Car Inventory Search | CarChief',
    description: 'Search quality Japanese used vehicles for global export.',
  },
};

export default function VehiclesLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
