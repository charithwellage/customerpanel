'use client';

import { useCallback, useEffect, useState } from 'react';
import { HttpClient, FreightService } from '@carchief/api-client';
import type { FreightDestination, FreightEstimateResponse, FreightPort } from '@carchief/domain';

/**
 * Freight estimate selection form values (PUB-12). Dimensions are optional —
 * empty strings mean "not supplied" — but when any one of the three is
 * filled in, all three are required (mirrors
 * `packages/domain/src/freight.ts` `validateFreightEstimateRequest`).
 */
export interface FreightFormValues {
  destinationCode: string;
  portCode: string;
  lengthMm: string;
  widthMm: string;
  heightMm: string;
}

export interface FreightFieldErrors {
  destinationCode?: string;
  portCode?: string;
  dimensions?: string;
}

export const EMPTY_FREIGHT_FORM_VALUES: FreightFormValues = {
  destinationCode: '',
  portCode: '',
  lengthMm: '',
  widthMm: '',
  heightMm: '',
};

/**
 * Client-side validation mirroring the service's own validation
 * (`validateFreightEstimateRequest`). This is a UX convenience only — the
 * service revalidates authoritatively and this function never overrides or
 * suppresses a service-reported field error.
 */
export function validateFreightFormValues(values: FreightFormValues): FreightFieldErrors {
  const errors: FreightFieldErrors = {};

  if (!values.destinationCode.trim()) {
    errors.destinationCode = 'Select a destination country.';
  }
  if (!values.portCode.trim()) {
    errors.portCode = 'Select an arrival port.';
  }

  const dimensionFields = [values.lengthMm, values.widthMm, values.heightMm];
  const anyDimensionFilled = dimensionFields.some((v) => v.trim() !== '');
  if (anyDimensionFilled) {
    const allFilled = dimensionFields.every((v) => v.trim() !== '');
    const allPositive = dimensionFields.every((v) => {
      const n = Number(v);
      return v.trim() !== '' && Number.isFinite(n) && n > 0;
    });
    if (!allFilled) {
      errors.dimensions = 'Enter length, width and height together, or leave all three blank.';
    } else if (!allPositive) {
      errors.dimensions = 'Length, width and height must each be a positive number.';
    }
  }

  return errors;
}

function buildEstimateRequest(values: FreightFormValues) {
  const anyDimensionFilled = [values.lengthMm, values.widthMm, values.heightMm].some((v) => v.trim() !== '');
  return {
    destinationCode: values.destinationCode,
    portCode: values.portCode,
    ...(anyDimensionFilled
      ? {
          dimensions: {
            lengthMm: Number(values.lengthMm),
            widthMm: Number(values.widthMm),
            heightMm: Number(values.heightMm),
          },
        }
      : {}),
  };
}

function resolveBaseUrl(): string {
  // In the browser this resolves relative to the current origin, so the
  // request goes through the same-origin Next.js proxy
  // (src/app/api/v1/[...path]/route.ts) rather than depending on the mock
  // API being reachable directly from the visitor's network. On the server
  // (SSR/build) there is no same-origin proxy, so the mock API is called
  // directly.
  return typeof window !== 'undefined' ? '' : process.env.API_BASE_URL || 'http://127.0.0.1:4000';
}

export interface UseFreightEstimateOptions {
  service?: FreightService;
}

export interface UseFreightEstimateReturn {
  destinations: FreightDestination[];
  ports: FreightPort[];
  catalogLoading: boolean;
  catalogError: string | null;
  reloadCatalog: () => void;
  values: FreightFormValues;
  setField: (field: keyof FreightFormValues, value: string) => void;
  fieldErrors: FreightFieldErrors;
  isSubmitting: boolean;
  submitError: string | null;
  result: FreightEstimateResponse | null;
  submit: () => Promise<void>;
  reset: () => void;
}

/**
 * Orchestrates the freight-estimate selection form and result (PUB-12). Calls
 * the generated `FreightService` for the destination/port catalog and the
 * estimate operation; never calculates a total locally (RULE-09). While
 * `DEC-PUB-FREIGHT-MODEL` is `OPEN` (D01-ASM-001), every successful estimate
 * call returns the deterministic `estimate_unavailable_pending_rate`
 * outcome — this hook renders exactly what the service returns.
 */
export function useFreightEstimate(options: UseFreightEstimateOptions = {}): UseFreightEstimateReturn {
  const [service] = useState<FreightService>(
    () => options.service || new FreightService(new HttpClient({ baseUrl: resolveBaseUrl() }))
  );

  const [destinations, setDestinations] = useState<FreightDestination[]>([]);
  const [ports, setPorts] = useState<FreightPort[]>([]);
  const [catalogLoading, setCatalogLoading] = useState<boolean>(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const [values, setValues] = useState<FreightFormValues>(EMPTY_FREIGHT_FORM_VALUES);
  const [fieldErrors, setFieldErrors] = useState<FreightFieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<FreightEstimateResponse | null>(null);

  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true);
    setCatalogError(null);
    try {
      const [destinationList, portList] = await Promise.all([service.getDestinations(), service.getPorts()]);
      setDestinations(destinationList);
      setPorts(portList);
    } catch (err: unknown) {
      setCatalogError(err instanceof Error ? err.message : 'Failed to load destinations and ports.');
    } finally {
      setCatalogLoading(false);
    }
  }, [service]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const setField = useCallback((field: keyof FreightFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field === 'destinationCode' || field === 'portCode' ? field : 'dimensions']: undefined }));
  }, []);

  const submit = useCallback(async () => {
    const errors = validateFreightFormValues(values);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setResult(null);
    try {
      const response = await service.estimate(buildEstimateRequest(values));
      setResult(response);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Unable to reach the shipping estimate service. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [service, values]);

  const reset = useCallback(() => {
    setValues(EMPTY_FREIGHT_FORM_VALUES);
    setFieldErrors({});
    setSubmitError(null);
    setResult(null);
  }, []);

  return {
    destinations,
    ports,
    catalogLoading,
    catalogError,
    reloadCatalog: loadCatalog,
    values,
    setField,
    fieldErrors,
    isSubmitting,
    submitError,
    result,
    submit,
    reset,
  };
}
