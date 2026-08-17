'use client';

import React from 'react';
import { useQuoteRequest } from './hooks/useQuoteRequest';
import { QuoteRequestAction } from './components/QuoteRequestAction';
import type { QuoteRequestFormSchemaValues } from '@carchief/validation';

export interface QuoteRequestSectionProps {
  vehicleSlug: string;
  vehicleLabel: string;
}

/**
 * Vehicle-detail quote-request composition (CUST-31, CUST-32, D02-P13-T004):
 * anonymous visitors can request a free quote by entering name, email and phone.
 * A repeat submission for the same vehicle by the same visitor completes with
 * the same success state, never an error (the Mock API's dedupe collapse
 * already guarantees this server-side).
 */
export function QuoteRequestSection({ vehicleSlug, vehicleLabel }: QuoteRequestSectionProps) {
  const { state, errorMessage, submitQuoteRequest, isSubmitted } = useQuoteRequest();

  const handleSubmit = async (data: QuoteRequestFormSchemaValues) => {
    await submitQuoteRequest(data, vehicleSlug);
  };

  return (
    <QuoteRequestAction
      state={state}
      vehicleLabel={vehicleLabel}
      errorMessage={errorMessage}
      onSubmit={handleSubmit}
      isSubmitted={isSubmitted}
    />
  );
}
