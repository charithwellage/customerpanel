import React from 'react';
import type { Metadata } from 'next';
import { loadContentPageBySlug } from '../../features/public-content/loadPublicContent';
import { ContentPageTemplate } from '../../features/public-content/components/ContentPageTemplate';
import '../../features/public-content/public-content.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Ocean Shipping Schedule | CarChief',
  description:
    'How ocean shipping works for CarChief vehicle exports from Japan, and where to get current sailing information for your route.',
};

export default async function ShippingSchedulePage() {
  const page = await loadContentPageBySlug('shipping-schedule');

  const defaultSections = [
    {
      title: 'How Ocean Shipping Generally Works',
      content:
        'After purchase, vehicles are consolidated for RORO (Roll-on/Roll-off) or container shipment from a Japanese port to your destination port. Route and vessel choice depend on your destination.',
    },
    {
      title: 'Current Sailing Information',
      content:
        'Confirmed departure dates and transit times are pending approved carrier data and are not shown here. Contact our logistics team for the current schedule for your route.',
    },
  ];

  return (
    <ContentPageTemplate
      title={page?.title ?? 'Ocean Shipping Schedule'}
      subtitle={
        page?.summary ??
        'How ocean shipping works for CarChief vehicle exports from Japan, and where to get current sailing information.'
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
          <a href="/allstock" className="cc-btn cc-btn--secondary">
            Browse Stock
          </a>
        </div>
      }
    />
  );
}
