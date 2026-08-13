import React from 'react';
import type { Metadata } from 'next';
import { loadContentPageBySlug } from '../../features/public-content/loadPublicContent';
import { ContentPageTemplate } from '../../features/public-content/components/ContentPageTemplate';
import '../../features/public-content/public-content.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Company Services & Why Choose Us | CarChief',
  description:
    'Comprehensive auto export, multi-point pre-shipment inspection, container loading, and marine insurance services by CarChief.',
};

export default async function ServicesPage() {
  const page = await loadContentPageBySlug('company-services');

  const defaultSections = [
    {
      title: 'Japanese Auto Auction Sourcing',
      content:
        'Our team sources vehicles found at major Japanese auto auctions on your behalf, reviewing authentic condition grading and inspection sheets before purchase.',
    },
    {
      title: 'Pre-Shipment Inspections (JAVIC / QISJ)',
      content:
        'Every vehicle is thoroughly inspected for roadworthiness, mileage verification, and structural integrity before export.',
    },
    {
      title: 'RORO & Container Logistics Management',
      content:
        'Efficient vessel booking and container consolidation from Yokohama and Kobe ports to East/Southern Africa & Caribbean.',
    },
    {
      title: 'Marine Transit Insurance Coverage',
      content:
        'Optional comprehensive transit insurance covering vehicle loss or damage during ocean transit.',
    },
  ];

  return (
    <ContentPageTemplate
      title={page?.title ?? 'CarChief Company Services'}
      subtitle={
        page?.summary ??
        'Comprehensive auto export, inspection, marine insurance, and international logistics management.'
      }
      badge="Why Choose CarChief"
      owner={page?.owner ?? 'OperationsTeam'}
      updatedAt={page?.updatedAt ?? '2026-08-10T10:00:00.000Z'}
      status={page?.status ?? 'approved'}
      body={page?.body}
      sections={page?.sections ?? defaultSections}
      heroActions={
        <div className="cc-public-content-page__actions">
          <a href="/auction" className="cc-btn cc-btn--primary">
            Auction Services
          </a>
          <a href="/shipping-schedule" className="cc-btn cc-btn--secondary">
            Shipping Schedules
          </a>
        </div>
      }
    />
  );
}
