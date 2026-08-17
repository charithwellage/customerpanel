'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { HttpClient, NormalizedApiError, EnquiryService } from '@carchief/api-client';
import type { QuoteRequestFormSchemaValues } from '@carchief/validation';

function resolveBaseUrl(): string {
  // Same-origin proxy in the browser (src/app/api/v1/[...path]/route.ts);
  // direct mock-api call on the server.
  return typeof window !== 'undefined' ? '' : process.env.API_BASE_URL || 'http://127.0.0.1:4000';
}

const GENERIC_ERROR_MESSAGE =
  'We could not submit your quote request. Please check your connection and try again.';

export type QuoteRequestActionState = 'ready' | 'submitting' | 'success';

export interface UseQuoteRequestOptions {
  enquiryService?: EnquiryService;
}

export interface UseQuoteRequestReturn {
  state: QuoteRequestActionState;
  errorMessage: string | null;
  submitQuoteRequest: (data: QuoteRequestFormSchemaValues, vehicleSlug: string) => Promise<void>;
  isSubmitted: boolean;
}

/**
 * Orchestrates the "Get Free Quote" action (CUST-31, CUST-32, D02-P13-T004).
 * On submission, sends name, email and phone to the backend; message and
 * consent are auto-filled server-side (D02-ASM-009). A repeat submission for
 * the same vehicle always renders the same success state, never an error
 * (the Mock API's dedupe collapse already guarantees this).
 */
export function useQuoteRequest(options: UseQuoteRequestOptions = {}): UseQuoteRequestReturn {
  const service = useMemo(
    () =>
      options.enquiryService ??
      new EnquiryService(new HttpClient({ baseUrl: resolveBaseUrl(), getAuthToken: () => null })),
    [options.enquiryService]
  );

  const [state, setState] = useState<QuoteRequestActionState>('ready');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const submitCountRef = useRef(0);

  const submitQuoteRequest = useCallback(
    async (data: QuoteRequestFormSchemaValues, vehicleSlug: string) => {
      setState('submitting');
      setErrorMessage(null);
      submitCountRef.current += 1;

      try {
        await service.submit({
          name: data.name,
          email: data.email,
          phone: data.phone,
          message: 'Quote request from customer application',
          consent: true,
          vehicleSlug,
          enquiryType: 'price-request',
          source: 'form',
        });
        setIsSubmitted(true);
        setState('success');
      } catch (error) {
        // `NormalizedApiError.message` is the mock's own reviewed,
        // reason-specific copy; surface it directly matching the pattern
        // `useReservation` and `useEnquiryForm` already use.
        setErrorMessage(error instanceof NormalizedApiError ? error.message : GENERIC_ERROR_MESSAGE);
        setState('ready');
      }
    },
    [service]
  );

  return { state, errorMessage, submitQuoteRequest, isSubmitted };
}
