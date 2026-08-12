import React from 'react';
import type { Metadata } from 'next';
import { loadContentPageBySlug } from '../../features/public-content/loadPublicContent';
import { ContentPageTemplate } from '../../features/public-content/components/ContentPageTemplate';
import '../../features/public-content/public-content.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Japanese Auto Auction Services | CarChief',
  description:
    'CarChief’s Japanese auction-sourcing service: buying guidance, translated inspection sheets and account-gated bidding access. This page does not provide live auction-site bidding.',
};

export default async function AuctionPage() {
  const page = await loadContentPageBySlug('auction-services');

  const defaultSections = [
    {
      title: 'Auction Sourcing Service',
      content:
        'CarChief’s team sources vehicles found at major Japanese auto auctions on your behalf, coordinating inspection review and the purchase process for registered clients.',
    },
    {
      title: 'Translated Inspection Sheets',
      content:
        'Our experienced Japanese staff translate official auction inspection sheets line-by-line, detailing interior/exterior condition, dent/scratch maps, and mechanical notes.',
    },
    {
      title: 'Bidding Deposit & Account Activation',
      content:
        'Live bidding access is account-gated for registered clients. A refundable security deposit is required prior to placing auction bids.',
    },
  ];

  return (
    <ContentPageTemplate
      title={page?.title ?? 'Japanese Auto Auction Services'}
      subtitle={
        page?.summary ??
        'CarChief’s Japanese auction-sourcing service: buying guidance, translated inspection sheets and account-gated bidding access.'
      }
      badge="Auction Sourcing Service"
      owner={page?.owner ?? 'AuctionTeam'}
      updatedAt={page?.updatedAt ?? '2026-08-10T10:00:00.000Z'}
      status={page?.status ?? 'approved'}
      body={page?.body}
      sections={page?.sections ?? defaultSections}
      heroActions={
        <div className="cc-public-content-page__actions">
          <a href="/contact" className="cc-btn cc-btn--primary">
            Request Bidding Access
          </a>
          <a href="/how-to-buy" className="cc-btn cc-btn--secondary">
            Auction Buying Guide
          </a>
        </div>
      }
    />
  );
}
