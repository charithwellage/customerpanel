'use client';

import React, { useId } from 'react';
import { EnquiryForm } from './components/EnquiryForm';
import { EnquiryConfirmation } from './components/EnquiryConfirmation';
import { useEnquiryForm, type EnquiryContext, type UseEnquiryFormOptions } from './hooks/useEnquiryForm';

export interface EnquirySectionProps {
  context?: EnquiryContext;
  headingLevel?: 'h1' | 'h2';
  /** Injectable for tests; production callers omit this and let the hook construct its own services. */
  serviceOptions?: UseEnquiryFormOptions;
}

const ENQUIRY_HEADINGS: Record<string, string> = {
  'premium-vehicle': 'Premium Vehicle Enquiry',
  'price-request': 'Request a Price',
  vehicle: 'Vehicle Enquiry',
  general: 'Contact Us',
};

/**
 * General/vehicle/Premium Vehicle/quotation enquiry composition (PUB-13,
 * PUB-15, PUB-34, D01-P06-T002). A visitor can submit a general enquiry, a
 * vehicle enquiry, a Premium Vehicle enquiry, or a quotation enquiry naming a
 * shipping destination — delivered in full independent of
 * DEC-PUB-FREIGHT-MODEL/DEC-PUB-CITY-DELIVERY (D01-ASM-001). After a
 * successful submission this renders the receipt confirmation in place of
 * the form (RULE-08); the enquiry link never claims a staff response beyond
 * receipt (RULE-10).
 */
export function EnquirySection({ context = {}, headingLevel = 'h1', serviceOptions }: EnquirySectionProps) {
  const headingId = useId();
  const enquiry = useEnquiryForm(context, serviceOptions);

  const heading = context.destinationCode
    ? 'Request a Formal Quotation'
    : ENQUIRY_HEADINGS[context.enquiryType ?? ''] ?? ENQUIRY_HEADINGS.general;

  const HeadingTag = headingLevel;

  return (
    <section className="cc-enquiry" aria-labelledby={headingId}>
      <HeadingTag id={headingId} className="cc-enquiry__heading">
        {heading}
      </HeadingTag>
      <p className="cc-enquiry__intro">
        Tell us about your enquiry and how to reach you. We record every enquiry and follow up directly — this form does not
        send an automatic price or shipping quote.
      </p>

      {enquiry.result ? (
        <EnquiryConfirmation result={enquiry.result} onStartNewEnquiry={enquiry.startNewEnquiry} />
      ) : (
        <EnquiryForm
          vehicleSlug={context.vehicleSlug}
          values={enquiry.values}
          onFieldChange={enquiry.setField}
          fieldErrors={enquiry.fieldErrors}
          destinations={enquiry.destinations}
          ports={enquiry.ports}
          catalogLoading={enquiry.catalogLoading}
          catalogError={enquiry.catalogError}
          onRetryCatalog={enquiry.reloadCatalog}
          isSubmitting={enquiry.isSubmitting}
          submitError={enquiry.submitError}
          onSubmit={enquiry.submit}
          onRetrySubmit={enquiry.submit}
        />
      )}
    </section>
  );
}
