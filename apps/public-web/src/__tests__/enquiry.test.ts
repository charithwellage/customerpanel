/**
 * Quotation enquiry form and confirmation UI tests (D01-P05-T004, PUB-13,
 * PUB-15).
 *
 * Tests observable behavior and contracts of:
 * - `validateEnquiryFormValues` client-side validation (mirrors, never
 *   overrides, the mock's own `prepareEnquiry` validation)
 * - `EnquiryService` HTTP contract as consumed from a browser context (via
 *   fetch mock), including the duplicate-receipt and 400 validation paths
 * - `EnquiryForm` / `EnquiryConfirmation` presentational rendering across
 *   loading, empty, validation-error, service-failure and success states
 * - `EnquirySection` composition (form <-> confirmation swap) and DOM id
 *   hygiene across repeated sections
 *
 * Never asserts a fabricated total/currency figure or a claim of staff
 * notification — RULE-09, RULE-10, D01-ASM-001.
 */
import { describe, it, expect, vi } from 'vitest';
import { HttpClient, EnquiryService } from '@carchief/api-client';
import type { FreightDestination, FreightPort, EnquiryResponse } from '@carchief/domain';
import {
  validateEnquiryFormValues,
  type EnquiryFormValues,
} from '../features/enquiry/hooks/useEnquiryForm.js';
import { EnquiryForm } from '../features/enquiry/components/EnquiryForm.js';
import { EnquiryConfirmation } from '../features/enquiry/components/EnquiryConfirmation.js';
import { EnquirySection } from '../features/enquiry/EnquirySection.js';

/* --------------------------------------------------------------------------
   Fixtures
   -------------------------------------------------------------------------- */

const EMPTY_VALUES: EnquiryFormValues = {
  name: '',
  email: '',
  phone: '',
  message: '',
  destinationCode: '',
  portCode: '',
};

const destinationsFixture: FreightDestination[] = [
  { code: 'UG', name: 'Uganda', country: 'Uganda' },
  { code: 'KE', name: 'Kenya', country: 'Kenya' },
];

const portsFixture: FreightPort[] = [{ code: 'MBA', name: 'Mombasa', country: 'Kenya' }];

const receiptFixture: EnquiryResponse = {
  id: 'enq-1723368000000-0',
  receivedAt: '2026-08-11T12:00:00.000Z',
  status: 'received',
  duplicate: false,
};

const duplicateReceiptFixture: EnquiryResponse = {
  ...receiptFixture,
  duplicate: true,
};

const quotationReceiptFixture: EnquiryResponse = {
  ...receiptFixture,
  vehicleSlug: '2021-toyota-corolla-axio-veh-1',
  estimateSnapshot: {
    destinationCode: 'UG',
    portCode: 'MBA',
    rateStatus: 'active',
    currency: 'USD',
    rateEffectiveFrom: '2026-06-01T00:00:00.000Z',
    message: 'Shipping estimate unavailable — pending a confirmed freight rate.',
  },
};

/* --------------------------------------------------------------------------
   validateEnquiryFormValues (client-side validation)
   -------------------------------------------------------------------------- */
describe('validateEnquiryFormValues', () => {
  it('requires name, email, phone and message', () => {
    const errors = validateEnquiryFormValues(EMPTY_VALUES);
    expect(errors.name).toBeTruthy();
    expect(errors.email).toBeTruthy();
    expect(errors.phone).toBeTruthy();
    expect(errors.message).toBeTruthy();
  });

  it('rejects an invalid email format', () => {
    const errors = validateEnquiryFormValues({ ...EMPTY_VALUES, email: 'not-an-email' });
    expect(errors.email).toBeTruthy();
  });

  it('passes with only the required contact fields and no destination', () => {
    const errors = validateEnquiryFormValues({
      ...EMPTY_VALUES,
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '+256700111222',
      message: 'General enquiry.',
    });
    expect(errors).toEqual({});
  });

  it('requires both destinationCode and portCode when either one is filled', () => {
    const errors = validateEnquiryFormValues({
      ...EMPTY_VALUES,
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '+256700111222',
      message: 'General enquiry.',
      destinationCode: 'UG',
    });
    expect(errors.portCode).toBeTruthy();
  });

  it('passes with a complete destination/port pair supplied', () => {
    const errors = validateEnquiryFormValues({
      ...EMPTY_VALUES,
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '+256700111222',
      message: 'Quotation enquiry.',
      destinationCode: 'UG',
      portCode: 'MBA',
    });
    expect(errors).toEqual({});
  });
});

/* --------------------------------------------------------------------------
   EnquiryService HTTP contract (via fetch mock)
   -------------------------------------------------------------------------- */
describe('EnquiryService HTTP contract', () => {
  it('submits an enquiry and returns the receipt confirmation', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(receiptFixture), { status: 201, headers: { 'content-type': 'application/json' } })
    );
    const service = new EnquiryService(new HttpClient({ baseUrl: 'http://mock-api.test' }));
    const result = await service.submit({
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '+256700111222',
      message: 'General enquiry.',
    });
    expect(result.status).toBe('received');
    expect(result.duplicate).toBe(false);
    expect(result).not.toHaveProperty('total');
  });

  it('returns duplicate: true for a resubmission without treating it as a new lead', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(duplicateReceiptFixture), { status: 200, headers: { 'content-type': 'application/json' } })
    );
    const service = new EnquiryService(new HttpClient({ baseUrl: 'http://mock-api.test' }));
    const result = await service.submit({
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '+256700111222',
      message: 'General enquiry.',
    });
    expect(result.duplicate).toBe(true);
  });

  it('surfaces a field-associated 400 validation error as a rejected promise', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ statusCode: 400, message: 'Email is required', field: 'email' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      })
    );
    const service = new EnquiryService(new HttpClient({ baseUrl: 'http://mock-api.test' }));
    await expect(
      service.submit({ name: 'Jane Doe', email: '', phone: '+256700111222', message: 'General enquiry.' })
    ).rejects.toBeTruthy();
  });

  it('surfaces an unexpected server failure as a rejected promise (failure/retry path)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ statusCode: 500, message: 'Internal server error' }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      })
    );
    const service = new EnquiryService(new HttpClient({ baseUrl: 'http://mock-api.test' }));
    await expect(
      service.submit({ name: 'Jane Doe', email: 'jane@example.com', phone: '+256700111222', message: 'General enquiry.' })
    ).rejects.toBeTruthy();
  });
});

/* --------------------------------------------------------------------------
   EnquiryForm presentational states
   -------------------------------------------------------------------------- */
describe('EnquiryForm rendering', () => {
  const baseProps = {
    vehicleSlug: undefined,
    values: EMPTY_VALUES,
    onFieldChange: vi.fn(),
    fieldErrors: {},
    destinations: destinationsFixture,
    ports: portsFixture,
    catalogLoading: false,
    catalogError: null,
    onRetryCatalog: vi.fn(),
    isSubmitting: false,
    submitError: null,
    onSubmit: vi.fn(),
    onRetrySubmit: vi.fn(),
  };

  it('renders the required contact fields and an optional destination pairing', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(React.createElement(EnquiryForm, baseProps));
    expect(html).toContain('Name');
    expect(html).toContain('Email');
    expect(html).toContain('Phone number');
    expect(html).toContain('Message');
    expect(html).toContain('Uganda');
    expect(html).toContain('Mombasa');
  });

  it('declares the vehicle being enquired about when a vehicleSlug is supplied', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(
      React.createElement(EnquiryForm, { ...baseProps, vehicleSlug: '2021-toyota-corolla-axio-veh-1' })
    );
    expect(html).toContain('2021-toyota-corolla-axio-veh-1');
  });

  it('renders field-associated validation errors', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(
      React.createElement(EnquiryForm, { ...baseProps, fieldErrors: { email: 'Enter a valid email address.' } })
    );
    expect(html).toContain('Enter a valid email address.');
    expect(html).toContain('aria-invalid="true"');
  });

  it('renders a recoverable, accessible error state with a retry control on submit failure', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(
      React.createElement(EnquiryForm, { ...baseProps, submitError: 'Unable to send your enquiry. Please try again.' })
    );
    expect(html).toContain('role="alert"');
    expect(html).toContain('Unable to send your enquiry. Please try again.');
    expect(html).toContain('Try again');
  });

  it('renders a loading state for the destination catalog', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(React.createElement(EnquiryForm, { ...baseProps, catalogLoading: true }));
    expect(html).toContain('role="status"');
    expect(html.toLowerCase()).toContain('loading');
  });

  it('renders an accessible, recoverable catalog error state', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(
      React.createElement(EnquiryForm, { ...baseProps, catalogError: 'Network error' })
    );
    expect(html).toContain('role="alert"');
    expect(html).toContain('Network error');
    expect(html).toContain('Retry');
  });

  it('disables the submit control while a submission is in flight', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(React.createElement(EnquiryForm, { ...baseProps, isSubmitting: true }));
    expect(html).toContain('disabled=""');
    expect(html).toContain('Sending enquiry');
  });
});

/* --------------------------------------------------------------------------
   EnquiryConfirmation presentational states
   -------------------------------------------------------------------------- */
describe('EnquiryConfirmation rendering', () => {
  it('renders the receipt reference and received timestamp, never a monetary total', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(
      React.createElement(EnquiryConfirmation, { result: receiptFixture, onStartNewEnquiry: vi.fn() })
    );
    expect(html).toContain('Your enquiry was received');
    expect(html).toContain(receiptFixture.id);
    // RULE-10: never claims a staff member was notified/contacted.
    expect(html.toLowerCase()).not.toContain('notified');
    expect(html).not.toMatch(/\$\s?\d/);
  });

  it('renders a distinct message for a duplicate resubmission, reusing the original reference', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(
      React.createElement(EnquiryConfirmation, { result: duplicateReceiptFixture, onStartNewEnquiry: vi.fn() })
    );
    expect(html).toContain('already have this enquiry on file');
    expect(html).toContain(duplicateReceiptFixture.id);
  });

  it('renders the linked vehicle and destination when the enquiry carried an estimate snapshot', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(
      React.createElement(EnquiryConfirmation, { result: quotationReceiptFixture, onStartNewEnquiry: vi.fn() })
    );
    expect(html).toContain(quotationReceiptFixture.vehicleSlug!);
    expect(html).toContain('UG');
    expect(html).toContain('MBA');
    expect(html).not.toMatch(/\$\s?\d/);
  });
});

/* --------------------------------------------------------------------------
   No fixed/duplicate DOM ids (reusable component rule)
   -------------------------------------------------------------------------- */
describe('EnquirySection DOM id hygiene', () => {
  it('rendering two enquiry sections on one document produces no duplicate DOM id values', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');

    const html = renderToStaticMarkup(
      React.createElement(
        'div',
        null,
        React.createElement(EnquirySection, {
          context: { vehicleSlug: 'veh-a' },
          serviceOptions: { enquiryService: new EnquiryService(), freightService: undefined },
        }),
        React.createElement(EnquirySection, {
          context: { vehicleSlug: 'veh-b' },
          serviceOptions: { enquiryService: new EnquiryService(), freightService: undefined },
        })
      )
    );

    const idMatches = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
    expect(idMatches.length).toBeGreaterThan(0);
    expect(idMatches.length).toBe(new Set(idMatches).size);
  });
});
