'use client';

import { useCallback, useEffect, useState } from 'react';
import { HttpClient, EnquiryService, FreightService } from '@carchief/api-client';
import type { EnquiryResponse, FreightDestination, FreightPort } from '@carchief/domain';

/**
 * Quotation enquiry form values (PUB-13). Destination/port are optional — a
 * visitor can submit a general enquiry, a vehicle enquiry, or a quotation
 * enquiry naming a shipping destination, independent of whether a priced
 * freight estimate exists yet (D01-ASM-001).
 */
export interface EnquiryFormValues {
  name: string;
  email: string;
  phone: string;
  message: string;
  destinationCode: string;
  portCode: string;
}

export interface EnquiryFieldErrors {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  destinationCode?: string;
  portCode?: string;
}

export interface EnquiryContext {
  vehicleSlug?: string;
  destinationCode?: string;
  portCode?: string;
  /** Prefilled free-text message, e.g. carried from a specific product page. */
  message?: string;
}

function buildInitialValues(context: EnquiryContext): EnquiryFormValues {
  return {
    name: '',
    email: '',
    phone: '',
    message: context.message ?? '',
    destinationCode: context.destinationCode ?? '',
    portCode: context.portCode ?? '',
  };
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Client-side validation mirroring the mock's own `prepareEnquiry`. This is a
 * UX convenience only — the service revalidates authoritatively and this
 * function never overrides or suppresses a service-reported field error.
 */
export function validateEnquiryFormValues(values: EnquiryFormValues): EnquiryFieldErrors {
  const errors: EnquiryFieldErrors = {};

  if (!values.name.trim()) {
    errors.name = 'Enter your name.';
  }
  if (!values.email.trim()) {
    errors.email = 'Enter your email address.';
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = 'Enter a valid email address.';
  }
  if (!values.phone.trim()) {
    errors.phone = 'Enter your phone number.';
  }
  if (!values.message.trim()) {
    errors.message = 'Enter your enquiry message.';
  }

  const hasDestination = values.destinationCode.trim() !== '';
  const hasPort = values.portCode.trim() !== '';
  if (hasDestination !== hasPort) {
    const fieldErr = 'Select both a destination and an arrival port, or leave both blank.';
    if (!hasDestination) {
      errors.destinationCode = fieldErr;
    } else {
      errors.portCode = fieldErr;
    }
  }

  return errors;
}

function resolveBaseUrl(): string {
  // In the browser this resolves relative to the current origin, so the
  // request goes through the same-origin Next.js proxy
  // (src/app/api/v1/[...path]/route.ts). On the server there is no
  // same-origin proxy, so the mock API is called directly.
  return typeof window !== 'undefined' ? '' : process.env.API_BASE_URL || 'http://127.0.0.1:4000';
}

export interface UseEnquiryFormOptions {
  enquiryService?: EnquiryService;
  freightService?: FreightService;
}

export interface UseEnquiryFormReturn {
  values: EnquiryFormValues;
  setField: (field: keyof EnquiryFormValues, value: string) => void;
  fieldErrors: EnquiryFieldErrors;
  destinations: FreightDestination[];
  ports: FreightPort[];
  catalogLoading: boolean;
  catalogError: string | null;
  reloadCatalog: () => void;
  isSubmitting: boolean;
  submitError: string | null;
  result: EnquiryResponse | null;
  submit: () => Promise<void>;
  startNewEnquiry: () => void;
}

/**
 * Orchestrates the quotation enquiry form and confirmation (PUB-13, PUB-15).
 * Submits through the generated `EnquiryService`; the enquiry is delivered
 * end to end whether or not a priced freight estimate exists, per
 * D01-ASM-001 — this hook never computes or displays a monetary total.
 */
export function useEnquiryForm(context: EnquiryContext = {}, options: UseEnquiryFormOptions = {}): UseEnquiryFormReturn {
  const [enquiryService] = useState<EnquiryService>(
    () => options.enquiryService || new EnquiryService(new HttpClient({ baseUrl: resolveBaseUrl() }))
  );
  const [freightService] = useState<FreightService>(
    () => options.freightService || new FreightService(new HttpClient({ baseUrl: resolveBaseUrl() }))
  );

  const [values, setValues] = useState<EnquiryFormValues>(() => buildInitialValues(context));
  const [fieldErrors, setFieldErrors] = useState<EnquiryFieldErrors>({});

  const [destinations, setDestinations] = useState<FreightDestination[]>([]);
  const [ports, setPorts] = useState<FreightPort[]>([]);
  const [catalogLoading, setCatalogLoading] = useState<boolean>(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<EnquiryResponse | null>(null);

  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true);
    setCatalogError(null);
    try {
      const [destinationList, portList] = await Promise.all([freightService.getDestinations(), freightService.getPorts()]);
      setDestinations(destinationList);
      setPorts(portList);
    } catch (err: unknown) {
      setCatalogError(err instanceof Error ? err.message : 'Failed to load shipping destinations.');
    } finally {
      setCatalogLoading(false);
    }
  }, [freightService]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const setField = useCallback((field: keyof EnquiryFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  const submit = useCallback(async () => {
    const errors = validateEnquiryFormValues(values);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const response = await enquiryService.submit({
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        message: values.message.trim(),
        vehicleSlug: context.vehicleSlug,
        ...(values.destinationCode ? { destinationCode: values.destinationCode, portCode: values.portCode } : {}),
      });
      setResult(response);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Unable to send your enquiry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [enquiryService, values, context.vehicleSlug]);

  const startNewEnquiry = useCallback(() => {
    setValues(buildInitialValues(context));
    setFieldErrors({});
    setSubmitError(null);
    setResult(null);
  }, [context]);

  return {
    values,
    setField,
    fieldErrors,
    destinations,
    ports,
    catalogLoading,
    catalogError,
    reloadCatalog: loadCatalog,
    isSubmitting,
    submitError,
    result,
    submit,
    startNewEnquiry,
  };
}
