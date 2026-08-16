/**
 * Self-service registration tests (CUST-26, D02-P12-T003).
 *
 * Covers, per the task's required areas:
 * - `AuthService.register` / `CountryService.getCountries` HTTP contract
 *   (via fetch mock), including the field-associated 400 and the
 *   duplicate-email 409
 * - `RegistrationForm` presentational rendering: all six required fields,
 *   the selected-country dial code, validation-error states, the password
 *   show/hide control and the in-flight submit-disabled state
 * - `RegistrationConfirmation` presentational rendering: the post-success
 *   forward target to the Customer application sign-in, with the
 *   registered email pre-filled
 * - `registrationFormSchema` client validation (accept/reject) as consumed
 *   from this app
 * - `resolveCustomerAppUrl` (`shell/Header.ts`): configuration-driven, never
 *   a hard-coded host
 *
 * Root `vitest.config.ts` runs with `environment: 'node'` (no jsdom), so
 * presentational components are asserted via `renderToStaticMarkup` against
 * explicit props, matching `apps/public-web/src/__tests__/enquiry.test.ts`.
 *
 * Never asserts that a password, hash or salt is present anywhere, and
 * never asserts that a public-web session/token was created on success
 * (DEC-CUST-IDENTITY-RECOVERY — registration never mints a session here).
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { HttpClient, AuthService, CountryService, NormalizedApiError } from '@carchief/api-client';
import type { CustomerAccount, CountriesResponse } from '@carchief/api-client/generated/schema.js';
import { registrationFormSchema } from '@carchief/validation';
import type { RegistrationFormValues } from '../features/registration/hooks/useRegistrationForm.js';
import { RegistrationForm } from '../features/registration/components/RegistrationForm.js';
import { RegistrationConfirmation } from '../features/registration/components/RegistrationConfirmation.js';
import { resolveCustomerAppUrl } from '../shell/Header.js';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

/* --------------------------------------------------------------------------
   Fixtures
   -------------------------------------------------------------------------- */

const EMPTY_VALUES: RegistrationFormValues = {
  nameWithInitials: '',
  countryCode: '',
  mobileNumber: '',
  email: '',
  password: '',
  confirmPassword: '',
};

const accountFixture: CustomerAccount = {
  id: 'acct-1',
  customerId: 'cust-999',
  nameWithInitials: 'J. K. Perera',
  countryCode: 'KE',
  dialCode: '+254',
  mobileNumber: '712345678',
  email: 'jk.perera@example.com',
  status: 'active',
  verificationState: 'unverified',
  createdAt: '2026-08-15T00:00:00.000Z',
  updatedAt: '2026-08-15T00:00:00.000Z',
};

const countriesFixture: CountriesResponse = {
  items: [
    { isoCode: 'KE', name: 'Kenya', dialCode: '+254' },
    { isoCode: 'UG', name: 'Uganda', dialCode: '+256' },
  ],
};

/* --------------------------------------------------------------------------
   AuthService / CountryService HTTP contract
   -------------------------------------------------------------------------- */
describe('AuthService.register HTTP contract', () => {
  it('registers an account and returns a projection carrying no password, hash or salt', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(accountFixture), { status: 201, headers: { 'content-type': 'application/json' } })
    );
    const service = new AuthService(new HttpClient({ baseUrl: 'http://mock-api.test' }));
    const account = await service.register({
      nameWithInitials: 'J. K. Perera',
      countryCode: 'KE',
      mobileNumber: '712345678',
      email: 'jk.perera@example.com',
      password: 'Sup3rSecretPass',
      confirmPassword: 'Sup3rSecretPass',
    });
    expect(account.email).toBe('jk.perera@example.com');
    expect(JSON.stringify(account)).not.toMatch(/password|hash|salt/i);
  });

  it('surfaces a field-associated 400 validation error as a rejected promise', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ statusCode: 400, message: 'A valid email address is required', field: 'email' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      })
    );
    const service = new AuthService(new HttpClient({ baseUrl: 'http://mock-api.test' }));
    await expect(
      service.register({
        nameWithInitials: 'J. K. Perera',
        countryCode: 'KE',
        mobileNumber: '712345678',
        email: '',
        password: 'Sup3rSecretPass',
        confirmPassword: 'Sup3rSecretPass',
      })
    ).rejects.toMatchObject({ statusCode: 400, rawError: { field: 'email' } });
  });

  it('surfaces the duplicate-email 409 on the email field, without confirming account existence beyond that association', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({ statusCode: 409, message: 'An account with this email already exists', field: 'email' }),
        { status: 409, headers: { 'content-type': 'application/json' } }
      )
    );
    const service = new AuthService(new HttpClient({ baseUrl: 'http://mock-api.test' }));
    let caught: unknown;
    try {
      await service.register({
        nameWithInitials: 'J. K. Perera',
        countryCode: 'KE',
        mobileNumber: '712345678',
        email: 'jk.perera@example.com',
        password: 'Sup3rSecretPass',
        confirmPassword: 'Sup3rSecretPass',
      });
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(NormalizedApiError);
    expect((caught as NormalizedApiError).statusCode).toBe(409);
    expect((caught as NormalizedApiError).rawError).toMatchObject({ field: 'email' });
  });
});

describe('CountryService.getCountries HTTP contract', () => {
  it('returns the country catalog used to populate the registration select', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(countriesFixture), { status: 200, headers: { 'content-type': 'application/json' } })
    );
    const service = new CountryService(new HttpClient({ baseUrl: 'http://mock-api.test' }));
    const result = await service.getCountries();
    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toMatchObject({ isoCode: 'KE', dialCode: '+254' });
  });
});

/* --------------------------------------------------------------------------
   registrationFormSchema client validation
   -------------------------------------------------------------------------- */
describe('registrationFormSchema client validation', () => {
  const valid = {
    nameWithInitials: 'J. K. Perera',
    countryCode: 'KE',
    mobileNumber: '712345678',
    email: 'jk.perera@example.com',
    password: 'Sup3rSecretPass1',
    confirmPassword: 'Sup3rSecretPass1',
  };

  it('accepts a fully valid registration payload', () => {
    expect(registrationFormSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects a mismatched confirmation password on the confirmPassword field', () => {
    const result = registrationFormSchema.safeParse({ ...valid, confirmPassword: 'DifferentPass1' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.join('.') === 'confirmPassword')).toBe(true);
    }
  });

  it('rejects a non-digit mobile number', () => {
    const result = registrationFormSchema.safeParse({ ...valid, mobileNumber: 'not-a-number' });
    expect(result.success).toBe(false);
  });

  it('rejects a missing country selection', () => {
    const result = registrationFormSchema.safeParse({ ...valid, countryCode: '' });
    expect(result.success).toBe(false);
  });
});

/* --------------------------------------------------------------------------
   RegistrationForm presentational states
   -------------------------------------------------------------------------- */
describe('RegistrationForm rendering', () => {
  const baseProps = {
    values: EMPTY_VALUES,
    onFieldChange: vi.fn(),
    fieldErrors: {},
    countries: countriesFixture.items,
    countriesLoading: false,
    countriesError: null,
    onRetryCountries: vi.fn(),
    dialCode: undefined as string | undefined,
    isSubmitting: false,
    submitError: null,
    onSubmit: vi.fn(),
  };

  it('renders all six required fields', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(React.createElement(RegistrationForm, baseProps));
    expect(html).toContain('Name with initials');
    expect(html).toContain('Country');
    expect(html).toContain('Mobile number');
    expect(html).toContain('Email address');
    expect(html).toContain('Password');
    expect(html).toContain('Re-enter password');
    expect(html).toContain('Kenya');
    expect(html).toContain('Uganda');
  });

  it('displays the selected country dial code beside the mobile number and updates when the country changes', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const noCountryHtml = renderToStaticMarkup(React.createElement(RegistrationForm, baseProps));
    expect(noCountryHtml).toContain('>—<');

    const kenyaHtml = renderToStaticMarkup(
      React.createElement(RegistrationForm, {
        ...baseProps,
        values: { ...EMPTY_VALUES, countryCode: 'KE' },
        dialCode: '+254',
      })
    );
    expect(kenyaHtml).toContain('+254');

    const ugandaHtml = renderToStaticMarkup(
      React.createElement(RegistrationForm, {
        ...baseProps,
        values: { ...EMPTY_VALUES, countryCode: 'UG' },
        dialCode: '+256',
      })
    );
    expect(ugandaHtml).toContain('+256');
    expect(ugandaHtml).not.toContain('+254');
  });

  it('renders field-associated validation errors, including a server-reported field error', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(
      React.createElement(RegistrationForm, {
        ...baseProps,
        fieldErrors: { email: 'An account with this email already exists.' },
      })
    );
    expect(html).toContain('An account with this email already exists.');
    expect(html).toContain('aria-invalid="true"');
  });

  it('renders a password show/hide control for both password fields', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(React.createElement(RegistrationForm, baseProps));
    expect(html).toContain('type="password"');
    const showButtons = html.match(/>Show</g) ?? [];
    expect(showButtons.length).toBe(2);
  });

  it('disables the submit control while a submission is in flight and shows the busy label', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(React.createElement(RegistrationForm, { ...baseProps, isSubmitting: true }));
    expect(html).toContain('disabled=""');
    expect(html).toContain('Creating account');
  });

  it('renders a loading state, then an accessible retry-capable error state for the country catalog', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const loadingHtml = renderToStaticMarkup(React.createElement(RegistrationForm, { ...baseProps, countriesLoading: true }));
    expect(loadingHtml).toContain('role="status"');
    expect(loadingHtml.toLowerCase()).toContain('loading');

    const errorHtml = renderToStaticMarkup(
      React.createElement(RegistrationForm, { ...baseProps, countriesLoading: false, countriesError: 'Network error' })
    );
    expect(errorHtml).toContain('role="alert"');
    expect(errorHtml).toContain('Network error');
    expect(errorHtml).toContain('Retry');
  });

  it('renders a submission-failure banner', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(
      React.createElement(RegistrationForm, { ...baseProps, submitError: 'Unable to create your account. Please try again.' })
    );
    expect(html).toContain('role="alert"');
    expect(html).toContain('Unable to create your account. Please try again.');
  });
});

/* --------------------------------------------------------------------------
   RegistrationConfirmation — post-success forward target
   -------------------------------------------------------------------------- */
describe('RegistrationConfirmation rendering', () => {
  it('renders a forward link to the Customer application sign-in with the registered email pre-filled, and never a session/token', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const forwardUrl = 'http://127.0.0.1:3001/?email=jk.perera%40example.com';
    const html = renderToStaticMarkup(
      React.createElement(RegistrationConfirmation, { email: 'jk.perera@example.com', forwardUrl })
    );
    expect(html).toContain('jk.perera@example.com');
    expect(html).toContain(`href="${forwardUrl}"`);
    expect(html).not.toMatch(/password|token|sessionStorage|localStorage/i);
  });
});

/* --------------------------------------------------------------------------
   resolveCustomerAppUrl — configuration-driven, never a hard-coded host
   -------------------------------------------------------------------------- */
describe('resolveCustomerAppUrl', () => {
  it('falls back to the documented local default when unset', () => {
    vi.stubEnv('NEXT_PUBLIC_CUSTOMER_APP_URL', '');
    expect(resolveCustomerAppUrl()).toBe('http://127.0.0.1:3001');
  });

  it('resolves the configured value, stripping a trailing slash', () => {
    vi.stubEnv('NEXT_PUBLIC_CUSTOMER_APP_URL', 'https://customer.carchief.example/');
    expect(resolveCustomerAppUrl()).toBe('https://customer.carchief.example');
  });
});
