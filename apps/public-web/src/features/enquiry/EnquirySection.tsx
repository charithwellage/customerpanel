'use client';

import React, { useId } from 'react';
import { EnquiryForm } from './components/EnquiryForm';
import { EnquiryConfirmation } from './components/EnquiryConfirmation';
import { useEnquiryForm, type EnquiryContext, type UseEnquiryFormOptions } from './hooks/useEnquiryForm';

export interface EnquirySectionProps {
  context?: EnquiryContext;
  /** Injectable for tests; production callers omit this and let the hook construct its own services. */
  serviceOptions?: UseEnquiryFormOptions;
}

/**
 * Quotation enquiry composition (PUB-13, PUB-15). A visitor can submit a
 * general enquiry, a vehicle enquiry, or a quotation enquiry naming a
 * shipping destination — delivered in full independent of
 * DEC-PUB-FREIGHT-MODEL/DEC-PUB-CITY-DELIVERY (D01-ASM-001). After a
 * successful submission this renders the receipt confirmation in place of
 * the form (RULE-08); the enquiry link never claims a staff response beyond
 * receipt (RULE-10).
 */
export function EnquirySection({ context = {}, serviceOptions }: EnquirySectionProps) {
  const headingId = useId();
  const enquiry = useEnquiryForm(context, serviceOptions);

  return (
    <section className="cc-enquiry" aria-labelledby={headingId}>
      <h1 id={headingId} className="cc-enquiry__heading">
        {context.destinationCode ? 'Request a Formal Quotation' : 'Contact Us'}
      </h1>
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
