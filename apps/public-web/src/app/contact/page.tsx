import React from 'react';
import type { Metadata } from 'next';
import { ContactExperience } from '../../features/public-content/components/ContactExperience';
import '../../features/public-content/contact.css';

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

  return (
    <main id="main-content" tabIndex={-1}>
      <ContactExperience searchParams={resolvedSearchParams} />
    </main>
  );
}
