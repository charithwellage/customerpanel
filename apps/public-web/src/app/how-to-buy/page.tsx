import React from 'react';
import type { Metadata } from 'next';
import { loadContentPageBySlug } from '../../features/public-content/loadPublicContent';
import { ContentPageTemplate } from '../../features/public-content/components/ContentPageTemplate';
import '../../features/public-content/public-content.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'How to Buy a Vehicle | CarChief Step-by-Step Guide',
  description:
    'Step-by-step guide on how to search, reserve, pay for, and receive your Japanese imported vehicle with CarChief.',
};

export default async function HowToBuyPage() {
  const page = await loadContentPageBySlug('how-to-buy');

  const defaultSections = [
    {
      title: 'Step 1: Select Your Vehicle',
      content:
        'Browse our verified stock online or submit a quotation request for your preferred make, model, year, and destination port.',
    },
    {
      title: 'Step 2: Reserve & Receive Quotation',
      content:
        'Click Reserve or Request Quote to lock in vehicle availability for 48 hours and receive an official Proforma Invoice.',
    },
    {
      title: 'Step 3: Complete Payment',
      content:
        'Transfer payment via T/T wire transfer using the verified banking instructions detailed on your Proforma Invoice.',
    },
    {
      title: 'Step 4: Shipping & Tracking',
      content:
        'Track ocean shipping progress from Yokohama/Kobe to your port. Original export and inspection certificates are dispatched via DHL.',
    },
    {
      title: 'Step 5: Destination Port Clearance & Delivery',
      content:
        'Receive your vehicle at your destination port or coordinate with our regional branch hubs for customs clearance assistance.',
    },
  ];

  return (
    <ContentPageTemplate
      title={page?.title ?? 'How to Buy a Vehicle Step-by-Step'}
      subtitle={
        page?.summary ??
        'A clear five-step guide explaining vehicle selection, reservation, payment, ocean freight, and port delivery.'
      }
      badge="Step-by-Step Buying Guide"
      owner={page?.owner ?? 'SalesTeam'}
      updatedAt={page?.updatedAt ?? '2026-08-10T10:00:00.000Z'}
      status={page?.status ?? 'approved'}
      body={page?.body}
      sections={page?.sections ?? defaultSections}
      heroActions={
        <div className="cc-public-content-page__actions">
          <a href="/vehicles" className="cc-btn cc-btn--primary">
            Browse Vehicles
          </a>
          <a href="/contact" className="cc-btn cc-btn--secondary">
            Talk to an Advisor
          </a>
        </div>
      }
    />
  );
}
