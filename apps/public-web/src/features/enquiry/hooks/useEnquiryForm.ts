'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { HttpClient, EnquiryService, FreightService, NormalizedApiError } from '@carchief/api-client';
import type { EnquiryResponse, EnquiryType, FreightDestination, FreightPort } from '@carchief/domain';
import { enquiryFormSchema, type EnquiryFormSchemaValues, type EnquiryFormSchemaInput } from '@carchief/validation';

/**
 * Quotation/general/vehicle/Premium Vehicle enquiry form values (PUB-13,
 * D01-P06-T002). Field names match the flat `EnquiryRequest` wire contract
 * 1:1 so a server-reported 400 `field` maps directly onto `setError(field)`
 * with no translation table. `preferred*`/`targetPriceUsd` are the optional
 * vehicle-preference capture for a visitor with no specific vehicle in mind
 * yet — informal intent only, never a saved search. `EnquiryFormValues` is
 * the input shape `react-hook-form` manages field-by-field (matching the
 * zod schema's pre-`.default()` shape); `submit` receives the fully-resolved
 * output shape once validation passes.
 */
export type EnquiryFormValues = Required<EnquiryFormSchemaInput>;
export type EnquiryFieldErrors = Partial<Record<keyof EnquiryFormValues, string>>;

export interface EnquiryContext {
  vehicleSlug?: string;
  destinationCode?: string;
  portCode?: string;
  /** Prefilled free-text message, e.g. carried from a specific product page. */
  message?: string;
  /**
   * Explicit enquiry type carried from the referring page (e.g. a Premium
   * Stock teaser or a "Request Price" CTA). Never inferred beyond the safe
   * MVP default the mock itself applies when this is omitted.
   */
  enquiryType?: EnquiryType;
}

function buildDefaultValues(context: EnquiryContext): EnquiryFormValues {
  return {
    name: '',
    email: '',
    phone: '',
    message: context.message ?? '',
    consent: false, // RHF default; the schema requires this to be explicitly `true` before submit succeeds.
    destinationCode: context.destinationCode ?? '',
    portCode: context.portCode ?? '',
    source: 'form',
    preferredMake: '',
    preferredModel: '',
    preferredDriveSide: '',
    preferredYear: '',
    targetPriceUsd: '',
  };
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
  setField: (field: keyof EnquiryFormValues, value: string | boolean) => void;
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
 * Orchestrates the general/vehicle/Premium Vehicle/quotation enquiry form
 * and confirmation (PUB-13, PUB-14, PUB-15, D01-P06-T002) with
 * `react-hook-form` + the shared `enquiryFormSchema` (Zod) resolver. The
 * schema is a UX convenience mirroring the mock's own authoritative
 * `prepareEnquiry` validation — it never suppresses a server-reported field
 * error. Submits through the generated `EnquiryService`; the enquiry is
 * delivered end to end whether or not a priced freight estimate exists, per
 * D01-ASM-001 — this hook never computes or displays a monetary total.
 * `isSubmitting` disables the submit control and the mock's own
 * content-based dedupe key guards a double submission server-side, so a
 * disabled button is never the only protection (Phase 1.6 CONTEXT.md §5).
 */
export function useEnquiryForm(context: EnquiryContext = {}, options: UseEnquiryFormOptions = {}): UseEnquiryFormReturn {
  const [enquiryService] = useState<EnquiryService>(
    () => options.enquiryService || new EnquiryService(new HttpClient({ baseUrl: resolveBaseUrl() }))
  );
  const [freightService] = useState<FreightService>(
    () => options.freightService || new FreightService(new HttpClient({ baseUrl: resolveBaseUrl() }))
  );

  const defaultValues = useMemo(() => buildDefaultValues(context), [context]);

  const {
    watch,
    setValue,
    handleSubmit,
    setError,
    clearErrors,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EnquiryFormSchemaInput, unknown, EnquiryFormSchemaValues>({
    resolver: zodResolver(enquiryFormSchema),
    defaultValues,
    mode: 'onSubmit',
  });

  // `watch()` is typed to the zod schema's pre-`.default()` input shape
  // (optional fields); `buildDefaultValues` always supplies a concrete value
  // for every field, so in practice this is never actually `undefined` —
  // asserted here once so `EnquiryForm` can stay a plain, ergonomic
  // controlled-input component with no per-field `?? ''` fallbacks.
  const values = watch() as EnquiryFormValues;
  const fieldErrors: EnquiryFieldErrors = useMemo(() => {
    const mapped: EnquiryFieldErrors = {};
    (Object.keys(errors) as (keyof EnquiryFormValues)[]).forEach((field) => {
      const message = errors[field]?.message;
      if (typeof message === 'string') {
        mapped[field] = message;
      }
    });
    return mapped;
  }, [errors]);

  const [destinations, setDestinations] = useState<FreightDestination[]>([]);
  const [ports, setPorts] = useState<FreightPort[]>([]);
  const [catalogLoading, setCatalogLoading] = useState<boolean>(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);

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

  const setField = useCallback(
    (field: keyof EnquiryFormValues, value: string | boolean) => {
      setValue(field, value as never, { shouldValidate: false });
      clearErrors(field);
    },
    [setValue, clearErrors]
  );

  const submit = useCallback(async () => {
    setSubmitError(null);
    await handleSubmit(async (formValues) => {
      try {
        const response = await enquiryService.submit({
          name: formValues.name.trim(),
          email: formValues.email.trim(),
          phone: formValues.phone.trim(),
          message: formValues.message.trim(),
          consent: formValues.consent === true,
          vehicleSlug: context.vehicleSlug,
          enquiryType: context.enquiryType,
          source: formValues.source,
          ...(formValues.destinationCode ? { destinationCode: formValues.destinationCode, portCode: formValues.portCode } : {}),
          ...(formValues.preferredMake ? { preferredMake: formValues.preferredMake.trim() } : {}),
          ...(formValues.preferredModel ? { preferredModel: formValues.preferredModel.trim() } : {}),
          ...(formValues.preferredDriveSide ? { preferredDriveSide: formValues.preferredDriveSide } : {}),
          ...(formValues.preferredYear ? { preferredYear: Number(formValues.preferredYear) } : {}),
          ...(formValues.targetPriceUsd ? { targetPriceUsd: Number(formValues.targetPriceUsd) } : {}),
        });
        setResult(response);
      } catch (err: unknown) {
        // Server-error mapping (D01-P06-T002 "In scope"): a field-associated
        // 400 is attached to the matching RHF field instead of only a
        // generic banner, so the visitor sees exactly what to fix.
        if (err instanceof NormalizedApiError && err.statusCode === 400) {
          const rawField =
            err.rawError && typeof err.rawError === 'object' && 'field' in err.rawError
              ? (err.rawError as { field?: unknown }).field
              : undefined;
          if (typeof rawField === 'string' && rawField in formValues) {
            setError(rawField as keyof EnquiryFormValues, { type: 'server', message: err.message });
            return;
          }
        }
        setSubmitError(err instanceof Error ? err.message : 'Unable to send your enquiry. Please try again.');
      }
    })();
  }, [enquiryService, handleSubmit, setError, context.vehicleSlug, context.enquiryType]);

  const startNewEnquiry = useCallback(() => {
    reset(buildDefaultValues(context));
    setSubmitError(null);
    setResult(null);
  }, [reset, context]);

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
