'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { EnquirySection, type EnquiryContext } from '../../features/enquiry';

function buildContextFromParams(params: URLSearchParams): EnquiryContext {
  const vehicleSlug = params.get('vehicle') || undefined;
  const destinationCode = params.get('destinationCode') || undefined;
  const portCode = params.get('portCode') || undefined;
  const topic = params.get('topic');

  let message: string | undefined;
  if (topic === 'freight-estimate') {
    message = vehicleSlug
      ? `Please send a formal shipping quotation for vehicle ${vehicleSlug}.`
      : 'Please send a formal shipping quotation.';
  }

  return { vehicleSlug, destinationCode, portCode, message };
}

function ContactPageContent() {
  const searchParams = useSearchParams();
  const context = buildContextFromParams(searchParams);
  return <EnquirySection context={context} />;
}

/**
 * Quotation enquiry / contact route (PUB-13, PUB-15). Reached from the
 * vehicle detail page's declared-intent contact actions and from the freight
 * estimate section's "Request a formal quotation" link; also reachable
 * directly for a general enquiry. Delivered independent of
 * DEC-PUB-FREIGHT-MODEL/DEC-PUB-CITY-DELIVERY (D01-ASM-001).
 */
export default function ContactPage() {
  return (
    <Suspense fallback={<div className="cc-enquiry__intro">Loading contact form&hellip;</div>}>
      <ContactPageContent />
    </Suspense>
  );
}
