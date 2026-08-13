import React from 'react';
import type { Metadata } from 'next';
import { FreightEstimateSection } from '../../features/freight';
import { ContentPageTemplate } from '../../features/public-content/components/ContentPageTemplate';
import '../../features/public-content/public-content.css';

export const dynamic = 'force-dynamic';

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
    <ContentPageTemplate
      title="Ocean Freight Calculator"
      subtitle="Get instantaneous shipping estimates, estimated transit schedules, and port availability for shipping Japanese vehicles to your destination port."
      badge="Shipping Cost Estimator"
      owner="LogisticsTeam"
      updatedAt="2026-08-10T10:00:00.000Z"
      status="approved"
    >
      <FreightEstimateSection />
    </ContentPageTemplate>
  );
}
