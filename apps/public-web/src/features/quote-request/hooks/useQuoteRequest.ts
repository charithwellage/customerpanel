'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { HttpClient, NormalizedApiError, EnquiryService } from '@carchief/api-client';
import type { QuoteRequestFormSchemaValues } from '@carchief/validation';
import { readStoredSession } from '../../account-entry';

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
 * On submission, the backend derives the customer identity and contact data
 * from the Bearer token; the browser sends only enquiry-specific data.
 */
export function useQuoteRequest(options: UseQuoteRequestOptions = {}): UseQuoteRequestReturn {
  const service = useMemo(
    () =>
      options.enquiryService ??
      new EnquiryService(
        new HttpClient({
          baseUrl: resolveBaseUrl(),
          getAuthToken: () => {
            if (typeof window === 'undefined') return null;
            try {
              const session = readStoredSession((k) => window.localStorage.getItem(k));
              return session?.token || null;
            } catch {
              return null;
            }
          },
        })
      ),
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
