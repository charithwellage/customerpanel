import React from 'react';
import type { Metadata } from 'next';
import { loadContentPageBySlug } from '../../features/public-content/loadPublicContent';
import { ContentPageTemplate } from '../../features/public-content/components/ContentPageTemplate';
import '../../features/public-content/public-content.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Ocean Shipping Schedule | CarChief Vessel Schedules',
  description:
    'Vessel departure schedules from Yokohama and Kobe ports to destination ports in Kenya, Tanzania, South Africa, and Jamaica.',
};

export default async function ShippingSchedulePage() {
  const page = await loadContentPageBySlug('shipping-schedule');

  const defaultSections = [
    {
      title: 'Yokohama to Mombasa / Dar es Salaam',
      content:
        'Bi-monthly RORO and container vessel sailings departing 1st & 15th of each month. Estimated voyage duration: 22-26 days.',
    },
    {
      title: 'Kobe / Yokohama to Durban',
      content:
        'Direct liner sailings departing 10th & 25th of each month. Estimated voyage duration: 25-28 days.',
    },
    {
      title: 'Yokohama to Kingston (Jamaica)',
      content:
        'Monthly transshipment and direct container sailings. Estimated voyage duration: 32-35 days.',
    },
    {
      title: 'Port Clearance & Shipping Advice',
      content:
        'Vessel ETD and ETA dates are updated dynamically based on carrier notices. Contact our shipping department for urgent space bookings.',
    },
  ];

  return (
    <ContentPageTemplate
      title={page?.title ?? 'Ocean Shipping Schedule'}
      subtitle={
        page?.summary ??
        'Monthly vessel departure schedules from Yokohama and Kobe to African and Caribbean destination ports.'
      }
      badge="Ocean Freight Schedules"
      owner={page?.owner ?? 'LogisticsTeam'}
      updatedAt={page?.updatedAt ?? '2026-08-10T10:00:00.000Z'}
      status={page?.status ?? 'approved'}
      body={page?.body}
      sections={page?.sections ?? defaultSections}
      isUnavailable={!page}
      unavailableMessage="Shipping schedule updates are currently being refreshed with carrier vessel lines. Please check back shortly or contact our logistics team directly."
      heroActions={
        <div className="cc-public-content-page__actions">
          <a href="/contact" className="cc-btn cc-btn--primary">
            Logistics Support
          </a>
          <a href="/vehicles" className="cc-btn cc-btn--secondary">
            Browse Stock
          </a>
        </div>
      }
    />
  );
}
