'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { HttpClient, AuthService, CountryService, NormalizedApiError } from '@carchief/api-client';
// Deep import, bypassing `@carchief/domain`'s barrel: that barrel re-exports
// `./auth.js`, which uses `node:crypto`/`node:buffer` and is not safe to
// pull into a browser bundle (this file runs client-side). Every other
// client-side consumer of `@carchief/domain` in this app avoids the same
// trap by only ever taking a type-only import from the barrel; this hook
// needs the runtime `findCountryByIsoCode` helper too, so it imports the
// country submodule directly instead. Content stays identical to the
// barrel's own `./countries.js` re-export (`packages/domain/src/index.ts`).
import { findCountryByIsoCode, type CountryOption } from '@carchief/domain/dist/countries.js';
import {
  registrationFormSchema,
  type RegistrationFormSchemaValues,
  type RegistrationFormSchemaInput,
} from '@carchief/validation';
import { resolveCustomerAppUrl } from '../../../shell/Header';

/**
 * Self-service registration form (CUST-26, D02-P12-T003). Field names match
 * the shared `registrationFormSchema` (which itself mirrors the Mock API's
 * `RegisterCustomerRequest` 1:1) so a server-reported 400 `field` maps
 * directly onto `setError(field)` with no translation table.
 */
export type RegistrationFormValues = Required<RegistrationFormSchemaInput>;
export type RegistrationFieldErrors = Partial<Record<keyof RegistrationFormValues, string>>;

function buildDefaultValues(): RegistrationFormValues {
  return {
    nameWithInitials: '',
    countryCode: '',
    mobileNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
  };
}

function resolveBaseUrl(): string {
  // In the browser this resolves relative to the current origin, so the
  // request goes through the same-origin Next.js proxy
  // (src/app/api/v1/[...path]/route.ts). On the server there is no
  // same-origin proxy, so the mock API is called directly.
  return typeof window !== 'undefined' ? '' : process.env.API_BASE_URL || 'http://127.0.0.1:4000';
}

export interface UseRegistrationFormOptions {
  authService?: AuthService;
  countryService?: CountryService;
}

export interface UseRegistrationFormReturn {
  values: RegistrationFormValues;
  setField: (field: keyof RegistrationFormValues, value: string) => void;
  fieldErrors: RegistrationFieldErrors;
  countries: CountryOption[];
  countriesLoading: boolean;
  countriesError: string | null;
  reloadCountries: () => void;
  dialCode: string | undefined;
  isSubmitting: boolean;
  submitError: string | null;
  /** Set once registration succeeds; carries the Customer sign-in forward target with the registered email pre-filled (no session/token crosses the origin boundary). */
  successForwardUrl: string | null;
  submit: () => Promise<void>;
}

/**
 * Orchestrates the `/register` form with `react-hook-form` + the shared
 * `registrationFormSchema` (Zod) resolver, the same pattern as
 * `useEnquiryForm`. Submits through `AuthService.register`; success never
 * mints a public-web session — it only computes the Customer application
 * sign-in forward URL with the registered email pre-filled as a query
 * parameter, per this phase's decision disposition (no token crosses an
 * origin boundary).
 */
export function useRegistrationForm(options: UseRegistrationFormOptions = {}): UseRegistrationFormReturn {
  const [authService] = useState<AuthService>(
    () => options.authService || new AuthService(new HttpClient({ baseUrl: resolveBaseUrl() }))
  );
  const [countryService] = useState<CountryService>(
    () => options.countryService || new CountryService(new HttpClient({ baseUrl: resolveBaseUrl() }))
  );

  const defaultValues = useMemo(() => buildDefaultValues(), []);

  const {
    watch,
    setValue,
    handleSubmit,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<RegistrationFormSchemaInput, unknown, RegistrationFormSchemaValues>({
    resolver: zodResolver(registrationFormSchema),
    defaultValues,
    mode: 'onSubmit',
  });

  const values = watch() as RegistrationFormValues;
  const clientFieldErrors: RegistrationFieldErrors = useMemo(() => {
    const mapped: RegistrationFieldErrors = {};
    (Object.keys(errors) as (keyof RegistrationFormValues)[]).forEach((field) => {
      const message = errors[field]?.message;
      if (typeof message === 'string') {
        mapped[field] = message;
      }
    });
    return mapped;
  }, [errors]);

  // Server-reported field errors (400 `field`, the duplicate-email 409) are
  // tracked separately from `react-hook-form`'s own client-validation
  // `errors`, rather than through `setError`: `setError` writes into RHF's
  // internal state from inside an async `handleSubmit` callback, and this
  // form's `mode: 'onSubmit'` + async-resolver combination does not
  // reliably surface that write back out through the `formState.errors`
  // subscription this hook reads (RHF's formState updates in this exact
  // configuration were observed, in Playwright, to never actually re-render
  // the consuming component). A plain `useState` merged on top of the
  // client errors is unconditionally reliable and needs no explainer for
  // why a real 400/409 sometimes failed to reach the DOM.
  const [serverFieldErrors, setServerFieldErrors] = useState<RegistrationFieldErrors>({});
  const fieldErrors: RegistrationFieldErrors = useMemo(
    () => ({ ...clientFieldErrors, ...serverFieldErrors }),
    [clientFieldErrors, serverFieldErrors]
  );

  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [countriesLoading, setCountriesLoading] = useState<boolean>(true);
  const [countriesError, setCountriesError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successForwardUrl, setSuccessForwardUrl] = useState<string | null>(null);

  const loadCountries = useCallback(async () => {
    setCountriesLoading(true);
    setCountriesError(null);
    try {
      const response = await countryService.getCountries();
      setCountries(response.items);
    } catch (err: unknown) {
      setCountriesError(err instanceof Error ? err.message : 'Failed to load the country list.');
    } finally {
      setCountriesLoading(false);
    }
  }, [countryService]);

  useEffect(() => {
    loadCountries();
  }, [loadCountries]);

  const setField = useCallback(
    (field: keyof RegistrationFormValues, value: string) => {
      setValue(field, value as never, { shouldValidate: false });
      clearErrors(field);
      setServerFieldErrors((prev) => {
        if (!(field in prev)) return prev;
        const next = { ...prev };
        delete next[field];
        return next;
      });
    },
    [setValue, clearErrors]
  );

  const dialCode = useMemo(() => findCountryByIsoCode(values.countryCode)?.dialCode, [values.countryCode]);

  const submit = useCallback(
    async (e?: React.FormEvent) => {
      if (e && typeof e.preventDefault === 'function') {
        e.preventDefault();
      }
      setSubmitError(null);
      setServerFieldErrors({});
      await handleSubmit(async (formValues) => {
        try {
          const account = await authService.register({
            nameWithInitials: formValues.nameWithInitials.trim(),
            countryCode: formValues.countryCode,
            mobileNumber: formValues.mobileNumber.trim(),
            email: formValues.email.trim(),
            password: formValues.password,
            confirmPassword: formValues.confirmPassword,
          });
          // No session/token is stored in public-web (DEC-CUST-IDENTITY-
          // RECOVERY, this phase's CONTEXT.md §4) — only the registered
          // email is forwarded, as a plain query parameter, never the
          // password or any credential material.
          const forwardUrl = `${resolveCustomerAppUrl()}/?email=${encodeURIComponent(account.email)}`;
          setSuccessForwardUrl(forwardUrl);
        } catch (err: unknown) {
          // Server `field` errors (400) and the duplicate-email 409 attach
          // to the matching input instead of only a generic banner
          // (CUST-26 acceptance, account-enumeration boundary noted in
          // CODE_REVIEW_RULES.md #6 — the message itself never claims an
          // email exists beyond what the field association already implies).
          if (err instanceof NormalizedApiError && (err.statusCode === 400 || err.statusCode === 409)) {
            const rawField =
              err.rawError && typeof err.rawError === 'object' && 'field' in err.rawError
                ? (err.rawError as { field?: unknown }).field
                : undefined;
            const field: keyof RegistrationFormValues | undefined =
              typeof rawField === 'string' && rawField in formValues
                ? (rawField as keyof RegistrationFormValues)
                : err.statusCode === 409
                  ? 'email'
                  : undefined;
            if (field) {
              setServerFieldErrors({ [field]: err.message || 'An account with this email already exists.' });
              return;
            }
          }
          setSubmitError(err instanceof Error ? err.message : 'Unable to create your account. Please try again.');
        }
      })(e);
    },
    [authService, handleSubmit]
  );

  return {
    values,
    setField,
    fieldErrors,
    countries,
    countriesLoading,
    countriesError,
    reloadCountries: loadCountries,
    dialCode,
    isSubmitting,
    submitError,
    successForwardUrl,
    submit,
  };
}
