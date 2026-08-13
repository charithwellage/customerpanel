import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { loadContentPageBySlug, loadOffices } from '../../features/public-content/loadPublicContent';
import { ContentPageTemplate } from '../../features/public-content/components/ContentPageTemplate';
import { ContactPageContent } from '../../features/public-content/components/ContactPageContent';
import { ContactEnquirySection } from '../../features/enquiry';
import '../../features/public-content/public-content.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Contact Us & Office Locations | CarChief',
  description:
    'Get in touch with CarChief customer support, regional office locations, operating hours, and WhatsApp inquiry specialists.',
};

interface ContactPageProps {
  searchParams?: Promise<{
    vehicle?: string;
    vehicleSlug?: string;
    destinationCode?: string;
    portCode?: string;
    message?: string;
    enquiryType?: string;
  }>;
}

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const page = await loadContentPageBySlug('contact');
  const officesResponse = await loadOffices();

  return (
    <ContentPageTemplate
      title={page?.title ?? 'Contact Us'}
      subtitle={
        page?.summary ??
        'Connect with our global sales specialists, logistics managers, and regional office hubs.'
      }
      badge="Global Contact Hubs"
      owner={page?.owner ?? 'SupportTeam'}
      updatedAt={page?.updatedAt ?? '2026-08-10T10:00:00.000Z'}
      status={page?.status ?? 'approved'}
      body={page?.body}
    >
      <Suspense fallback={<div role="status">Loading enquiry form...</div>}>
        <ContactEnquirySection searchParams={resolvedSearchParams} />
      </Suspense>

      <ContactPageContent offices={officesResponse.items} />
    </ContentPageTemplate>
  );
}
