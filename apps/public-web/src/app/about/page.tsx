import React from 'react';
import type { Metadata } from 'next';
import { loadContentPageBySlug } from '../../features/public-content/loadPublicContent';
import { ContentPageTemplate } from '../../features/public-content/components/ContentPageTemplate';
import '../../features/public-content/public-content.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'About CarChief | Japanese Used Vehicle Exporters',
  description:
    'Learn about CarChief, premier Japanese auto auction and used car export specialists supplying African and global markets.',
};

export default async function AboutPage() {
  const page = await loadContentPageBySlug('about-us');

  return (
    <ContentPageTemplate
      title={page?.title ?? 'About CarChief'}
      subtitle={
        page?.summary ??
        'Leading Japanese vehicle export specialist connecting global buyers with certified quality stock.'
      }
      badge="Company Information"
      owner={page?.owner ?? 'ExecutiveTeam'}
      updatedAt={page?.updatedAt ?? '2026-08-10T10:00:00.000Z'}
      status={page?.status ?? 'approved'}
      body={page?.body}
      sections={page?.sections}
      isUnavailable={!page}
      heroActions={
        <div className="cc-public-content-page__actions">
          <a href="/how-to-buy" className="cc-btn cc-btn--primary">
            How to Buy Guide
          </a>
          <a href="/contact" className="cc-btn cc-btn--secondary">
            Contact Support
          </a>
        </div>
      }
    />
  );
}
