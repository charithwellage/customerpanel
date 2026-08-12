import React from 'react';
import type { Metadata } from 'next';
import { loadContentPageBySlug } from '../../features/public-content/loadPublicContent';
import { ContentPageTemplate } from '../../features/public-content/components/ContentPageTemplate';
import '../../features/public-content/public-content.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Japanese Auto Auction Services & Calendar | CarChief',
  description:
    'Search and bid on live Japanese vehicle auto auctions (USS, TAA, CAA, JU) with translated inspection sheets and staff bidding guidance.',
};

export default async function AuctionPage() {
  const page = await loadContentPageBySlug('auction-services');

  const defaultSections = [
    {
      title: 'Weekly Auction Coverage',
      content:
        'We cover over 150,000 weekly vehicle auction listings across major Japanese auction halls including USS Tokyo, USS Yokohama, TAA Kanto, and CAA Chubu.',
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
    {
      title: 'Auction Days Calendar',
      content:
        'Monday: JU Auctions | Tuesday: TAA & CAA | Wednesday: ARAI & BAYAUC | Thursday: USS Nagoya & JU | Friday: USS Tokyo | Saturday: HAA Kobe.',
    },
  ];

  return (
    <ContentPageTemplate
      title={page?.title ?? 'Japanese Auto Auction Services'}
      subtitle={
        page?.summary ??
        'Access live Japanese auto auctions with over 150,000 vehicles listed weekly across USS, TAA, CAA, and JU halls.'
      }
      badge="Live Auction Access"
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
