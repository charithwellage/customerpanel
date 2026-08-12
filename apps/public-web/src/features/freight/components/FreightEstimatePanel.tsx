'use client';

import React, { useId } from 'react';
import Link from 'next/link';
import type { FreightEstimateResponse, FreightRateStatus } from '@carchief/domain';

export interface FreightEstimatePanelProps {
  isSubmitting: boolean;
  submitError: string | null;
  onRetrySubmit: () => void;
  result: FreightEstimateResponse | null;
  enquiryHref: string;
}

const RATE_STATUS_LABEL: Record<FreightRateStatus, string> = {
  active: 'A shipping rate exists for this route, but it is not yet approved for automatic display.',
  stale: 'The shipping rate on file for this route has expired and has not been renewed yet.',
  no_rate: 'No shipping rate has been recorded for this route yet.',
};

/**
 * Renders the freight estimate result (PUB-12). While `DEC-PUB-FREIGHT-MODEL`
 * is `OPEN` (D01-ASM-001), a successful call always carries
 * `outcome: 'estimate_unavailable_pending_rate'` — this is rendered as a
 * first-class, accessible state with its own explanation, never as an error,
 * a spinner, a placeholder figure or an empty/zero currency field
 * (RULE-09, RULE-10).
 */
export function FreightEstimatePanel({
  isSubmitting,
  submitError,
  onRetrySubmit,
  result,
  enquiryHref,
}: FreightEstimatePanelProps) {
  const headingId = useId();

  if (isSubmitting) {
    return (
      <div role="status" aria-live="polite" className="cc-freight-panel cc-freight-panel--loading">
        Requesting your shipping estimate&hellip;
      </div>
    );
  }

  if (submitError) {
    return (
      <div role="alert" className="cc-freight-panel cc-freight-panel--error">
        <strong>We could not process your shipping estimate request.</strong>
        <span>{submitError}</span>
        <button type="button" className="cc-btn cc-btn--secondary cc-btn--sm" onClick={onRetrySubmit}>
          Try again
        </button>
      </div>
    );
  }

  if (!result) {
    return (
      <div role="region" aria-label="Shipping estimate" className="cc-freight-panel cc-freight-panel--idle">
        <p>Select a destination and arrival port, then request an estimate to see shipping information for this route.</p>
      </div>
    );
  }

  // result.outcome is currently always 'estimate_unavailable_pending_rate'
  // (D01-ASM-001) — no monetary total is ever present on this contract.
  return (
    <div
      role="status"
      aria-live="polite"
      aria-labelledby={headingId}
      className="cc-freight-panel cc-freight-panel--unavailable"
    >
      <h3 id={headingId} className="cc-freight-panel__title">
        Estimate unavailable — pending confirmed rate
      </h3>
      <p className="cc-freight-panel__message">{result.message}</p>
      <p className="cc-freight-panel__context">{RATE_STATUS_LABEL[result.rateStatus]}</p>
      <p className="cc-freight-panel__explanation">
        We have not yet published an approved shipping rate for this route, so we cannot show a price here. This is not an
        error — our team can still confirm a shipping cost for you directly.
      </p>
      <Link href={enquiryHref} className="cc-btn cc-btn--primary">
        Request a formal quotation
      </Link>
    </div>
  );
}
