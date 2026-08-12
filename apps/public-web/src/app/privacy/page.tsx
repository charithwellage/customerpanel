import React from 'react';
import type { Metadata } from 'next';
import { loadContentPageBySlug } from '../../features/public-content/loadPublicContent';
import { ContentPageTemplate } from '../../features/public-content/components/ContentPageTemplate';
import { PrivacyPageContent } from '../../features/public-content/components/PrivacyPageContent';
import '../../features/public-content/public-content.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Privacy & Cookie Policy | CarChief',
  description:
    'CarChief privacy policy, cookie consent choice management, and personal data protection information.',
};

export default async function PrivacyPage() {
  const page = await loadContentPageBySlug('privacy-cookie-policy');

  return (
    <ContentPageTemplate
      title={page?.title ?? 'Privacy & Cookie Policy'}
      subtitle={
        page?.summary ??
        'Information on data protection, cookie usage choices, and privacy rights.'
      }
      badge="Legal & Privacy"
      owner={page?.owner ?? 'LegalTeam'}
      updatedAt={page?.updatedAt ?? '2026-08-10T10:00:00.000Z'}
      status={page?.status ?? 'approved'}
    >
      <PrivacyPageContent title={page?.title} body={page?.body} />
    </ContentPageTemplate>
  );
}
