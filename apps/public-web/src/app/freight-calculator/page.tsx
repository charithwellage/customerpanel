import React from 'react';
import type { Metadata } from 'next';
import { FreightEstimateSection } from '../../features/freight';

export const metadata: Metadata = {
  title: 'Global Ocean Freight Shipping Calculator | CarChief',
  description: 'Calculate ocean freight shipping costs, transit times, and port options for Japanese vehicle exports.',
  alternates: {
    canonical: process.env.NEXT_PUBLIC_SITE_URL
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/freight-calculator`
      : 'http://127.0.0.1:3000/freight-calculator',
  },
  openGraph: {
    title: 'Global Ocean Freight Shipping Calculator | CarChief',
    description: 'Calculate ocean freight shipping costs, transit times, and port options for Japanese vehicle exports.',
    url: process.env.NEXT_PUBLIC_SITE_URL
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/freight-calculator`
      : 'http://127.0.0.1:3000/freight-calculator',
    siteName: 'CarChief',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Global Ocean Freight Shipping Calculator | CarChief',
    description: 'Calculate ocean freight shipping costs, transit times, and port options for Japanese vehicle exports.',
  },
};

export default function FreightCalculatorPage() {
  return (
    <main className="min-h-screen py-12 px-4 max-w-5xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-3">Ocean Freight Calculator</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Get instantaneous shipping estimates, estimated transit schedules, and port availability for shipping Japanese vehicles to your destination port.
        </p>
      </div>
      <FreightEstimateSection />
    </main>
  );
}
