'use client';

import React, { useId } from 'react';
import type { EnquiryResponse } from '@carchief/domain';

export interface EnquiryConfirmationProps {
  result: EnquiryResponse;
  onStartNewEnquiry: () => void;
}

/**
 * Receipt confirmation after a successful enquiry submission (PUB-15). This
 * confirms only that the enquiry was received and stored — it never claims a
 * staff member was notified or that any downstream action occurred
 * (RULE-10). A resubmission of the same enquiry surfaces the original
 * receipt rather than pretending a second, distinct submission was created.
 */
export function EnquiryConfirmation({ result, onStartNewEnquiry }: EnquiryConfirmationProps) {
  const headingId = useId();
  const receivedAtLabel = new Date(result.receivedAt).toLocaleString();

  return (
    <div role="status" aria-live="polite" aria-labelledby={headingId} className="cc-enquiry-confirmation">
      <h3 id={headingId} className="cc-enquiry-confirmation__title">
        {result.duplicate ? 'We already have this enquiry on file' : 'Your enquiry was received'}
      </h3>
      <p className="cc-enquiry-confirmation__message">
        {result.duplicate
          ? 'This looks the same as an enquiry you already sent us, so we have not created a second one. Here is your original reference.'
          : 'Thank you — we have recorded your enquiry.'}
      </p>
      <dl className="cc-enquiry-confirmation__details">
        <div className="cc-enquiry-confirmation__detail">
          <dt>Reference</dt>
          <dd>{result.id}</dd>
        </div>
        <div className="cc-enquiry-confirmation__detail">
          <dt>Received</dt>
          <dd>{receivedAtLabel}</dd>
        </div>
        {result.vehicleSlug && (
          <div className="cc-enquiry-confirmation__detail">
            <dt>Vehicle</dt>
            <dd>{result.vehicleSlug}</dd>
          </div>
        )}
        {result.estimateSnapshot && (
          <div className="cc-enquiry-confirmation__detail">
            <dt>Destination</dt>
            <dd>
              {result.estimateSnapshot.destinationCode} via {result.estimateSnapshot.portCode}
            </dd>
          </div>
        )}
      </dl>
      <p className="cc-enquiry-confirmation__note">
        Our team reviews enquiries directly; a specific reply time is not guaranteed here.
      </p>
      <button type="button" className="cc-btn cc-btn--secondary" onClick={onStartNewEnquiry}>
        Send another enquiry
      </button>
    </div>
  );
}
