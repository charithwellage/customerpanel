/**
 * D01-P06-T002 — accessible contact and vehicle/Premium Vehicle enquiry
 * forms (PUB-13, PUB-14, PUB-15, PUB-28, PUB-34, RULE-10).
 *
 * Schema boundary tests for the shared `enquiryFormSchema` (Zod, consumed by
 * `react-hook-form`'s `zodResolver`) live in
 * `packages/validation/src/__tests__/enquiry.test.ts`. This file tests:
 * - `EnquiryForm` consent-field and vehicle-preference-fieldset presentation
 *   (component focus/error markup — `aria-invalid`/`aria-describedby`/
 *   `role="alert"` — since this repo's vitest environment has no DOM/jsdom
 *   for simulated focus events)
 * - `EnquirySection` heading copy for general/vehicle/price-request/
 *   Premium Vehicle enquiry types (PUB-34)
 * - `EnquiryConfirmation` honest preferred-contact-method note (RULE-10:
 *   never claims a WhatsApp/email/call message was actually sent)
 * - Double-submit prevention (disabled control while in flight) and the
 *   `EnquiryService` HTTP contract carrying `consent`/vehicle-preference
 *   fields end to end, including the server-error field-mapping contract a
 *   400 response relies on
 */
import { describe, it, expect, vi } from 'vitest';
import { HttpClient, EnquiryService } from '@carchief/api-client';
import type { FreightDestination, FreightPort, EnquiryResponse } from '@carchief/domain';
import type { EnquiryFormValues } from '../features/enquiry/hooks/useEnquiryForm.js';
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
  consent: false,
  destinationCode: '',
  portCode: '',
  source: 'form',
  preferredMake: '',
  preferredModel: '',
  preferredDriveSide: '',
  preferredYear: '',
  targetPriceUsd: '',
};

const destinationsFixture: FreightDestination[] = [{ code: 'UG', name: 'Uganda', country: 'Uganda' }];
const portsFixture: FreightPort[] = [{ code: 'MBA', name: 'Mombasa', country: 'Kenya' }];

const receiptFixture: EnquiryResponse = {
  id: 'enq-1723368000000-0',
  receivedAt: '2026-08-11T12:00:00.000Z',
  status: 'received',
  duplicate: false,
  enquiryType: 'general',
  source: 'form',
};

const baseFormProps = {
  vehicleSlug: undefined as string | undefined,
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

/* --------------------------------------------------------------------------
   Consent field (PUB-14) — validated beyond native browser checkbox checks
   -------------------------------------------------------------------------- */
describe('EnquiryForm consent field', () => {
  it('renders a required consent checkbox alongside the contact fields', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(React.createElement(EnquiryForm, baseFormProps));
    expect(html).toContain('type="checkbox"');
    expect(html).toContain('I agree to be contacted');
    expect(html).toContain('aria-required="true"');
  });

  it('renders an accessible, field-associated consent error', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(
      React.createElement(EnquiryForm, {
        ...baseFormProps,
        fieldErrors: { consent: 'You must agree to be contacted before sending this enquiry.' },
      })
    );
    expect(html).toContain('role="alert"');
    expect(html).toContain('You must agree to be contacted before sending this enquiry.');
    // The checkbox itself is marked invalid and described by its error, not
    // just a floating message with no association (accessible focus/error
    // wiring, since this repo's test environment has no jsdom for a real
    // focus-event simulation).
    expect(html).toMatch(/type="checkbox"[^>]*aria-invalid="true"/);
  });
});

/* --------------------------------------------------------------------------
   Vehicle-preference capture (D01-P06-T002 "In scope")
   -------------------------------------------------------------------------- */
describe('EnquiryForm vehicle-preference fieldset', () => {
  it('shows the optional vehicle-preference fieldset when no specific vehicle is named', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(React.createElement(EnquiryForm, { ...baseFormProps, vehicleSlug: undefined }));
    expect(html).toContain('Tell us what you');
    expect(html).toContain('Make');
    expect(html).toContain('Drive side');
    expect(html).toContain('Target price');
  });

  it('hides the vehicle-preference fieldset once a specific vehicle is already named', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(
      React.createElement(EnquiryForm, { ...baseFormProps, vehicleSlug: '2021-toyota-corolla-axio-veh-1' })
    );
    expect(html).not.toContain('Tell us what you');
  });

  it('renders a field-associated error for an invalid preferred year without fabricating a default', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(
      React.createElement(EnquiryForm, {
        ...baseFormProps,
        fieldErrors: { preferredYear: 'Enter a preferred year between 1990 and 2027.' },
      })
    );
    expect(html).toContain('Enter a preferred year between 1990 and 2027.');
    expect(html).toContain('role="alert"');
  });

  it('renders a preferred-contact-method select alongside the contact fields', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(React.createElement(EnquiryForm, baseFormProps));
    expect(html).toContain('Preferred contact method');
    expect(html).toContain('WhatsApp');
  });
});

/* --------------------------------------------------------------------------
   Double-submit prevention
   -------------------------------------------------------------------------- */
describe('EnquiryForm double-submit prevention', () => {
  it('disables the submit control while a submission is in flight, not only styling it', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(React.createElement(EnquiryForm, { ...baseFormProps, isSubmitting: true }));
    expect(html).toContain('disabled=""');
    expect(html).toContain('Sending enquiry');
  });
});

/* --------------------------------------------------------------------------
   EnquirySection heading copy per enquiry type (PUB-34)
   -------------------------------------------------------------------------- */
describe('EnquirySection heading per enquiry type', () => {
  it('renders "Contact Us" for a general enquiry with no explicit type', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(
      React.createElement(EnquirySection, {
        context: {},
        serviceOptions: { enquiryService: new EnquiryService(), freightService: undefined },
      })
    );
    expect(html).toContain('Contact Us');
  });

  it('renders a distinct Premium Vehicle Enquiry heading, never implying Live Auction access', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(
      React.createElement(EnquirySection, {
        context: { vehicleSlug: 'veh-premium-1', enquiryType: 'premium-vehicle' },
        serviceOptions: { enquiryService: new EnquiryService(), freightService: undefined },
      })
    );
    expect(html).toContain('Premium Vehicle Enquiry');
    expect(html.toLowerCase()).not.toContain('live auction');
  });

  it('renders a distinct Request a Price heading for a price-request enquiry type', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(
      React.createElement(EnquirySection, {
        context: { vehicleSlug: 'veh-1', enquiryType: 'price-request' },
        serviceOptions: { enquiryService: new EnquiryService(), freightService: undefined },
      })
    );
    expect(html).toContain('Request a Price');
  });
});

/* --------------------------------------------------------------------------
   EnquiryConfirmation preferred-contact note (RULE-10)
   -------------------------------------------------------------------------- */
describe('EnquiryConfirmation preferred-contact note', () => {
  it('never claims a WhatsApp/email/call message was actually sent when a non-form contact method was preferred', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(
      React.createElement(EnquiryConfirmation, {
        result: { ...receiptFixture, source: 'whatsapp' },
        onStartNewEnquiry: vi.fn(),
      })
    );
    expect(html).toContain('whatsapp');
    expect(html.toLowerCase()).not.toContain('message sent');
    expect(html.toLowerCase()).not.toContain('we have sent');
  });

  it('omits the preferred-contact note when the visitor used the form itself', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(
      React.createElement(EnquiryConfirmation, { result: { ...receiptFixture, source: 'form' }, onStartNewEnquiry: vi.fn() })
    );
    expect(html).not.toContain('preferred contact method');
  });
});

/* --------------------------------------------------------------------------
   EnquiryService HTTP contract — consent and vehicle-preference fields
   (D01-P06-T002), plus server-error field mapping
   -------------------------------------------------------------------------- */
describe('EnquiryService HTTP contract (D01-P06-T002 additions)', () => {
  it('submits consent and vehicle-preference fields on the wire when provided', async () => {
    let capturedBody: string | undefined;
    const mockFetch = vi.fn().mockImplementation(async (_url, init?: RequestInit) => {
      capturedBody = init?.body as string;
      return new Response(JSON.stringify(receiptFixture), { status: 201, headers: { 'content-type': 'application/json' } });
    });
    vi.stubGlobal('fetch', mockFetch);

    const service = new EnquiryService(new HttpClient({ baseUrl: 'http://mock-api.test' }));
    await service.submit({
      name: 'Jane Doe',
      consent: true,
      email: 'jane@example.com',
      phone: '+256700111222',
      message: 'Looking for a specific type of vehicle.',
      preferredMake: 'Toyota',
      preferredModel: 'Corolla',
      preferredDriveSide: 'right',
      preferredYear: 2021,
      targetPriceUsd: 12000,
    });

    const parsed = JSON.parse(capturedBody ?? '{}');
    expect(parsed.consent).toBe(true);
    expect(parsed.preferredMake).toBe('Toyota');
    expect(parsed.preferredDriveSide).toBe('right');
    expect(parsed.targetPriceUsd).toBe(12000);
    vi.unstubAllGlobals();
  });

  it('surfaces a field-associated 400 for missing consent as a rejected promise carrying the field name', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          statusCode: 400,
          message: 'You must agree to be contacted before sending this enquiry.',
          field: 'consent',
        }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      )
    );
    const service = new EnquiryService(new HttpClient({ baseUrl: 'http://mock-api.test' }));
    await expect(
      service.submit({
        name: 'Jane Doe',
        consent: false,
        email: 'jane@example.com',
        phone: '+256700111222',
        message: 'General enquiry.',
      })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('an integration failure surfaces as a rejected promise, and a subsequent success returns a receipt (retry path)', async () => {
    const service = new EnquiryService(new HttpClient({ baseUrl: 'http://mock-api.test' }));

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ statusCode: 500, message: 'Internal server error' }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      })
    );
    await expect(
      service.submit({
        name: 'Jane Doe',
        consent: true,
        email: 'jane@example.com',
        phone: '+256700111222',
        message: 'General enquiry.',
      })
    ).rejects.toBeTruthy();

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(receiptFixture), { status: 201, headers: { 'content-type': 'application/json' } })
    );
    const receipt = await service.submit({
      name: 'Jane Doe',
      consent: true,
      email: 'jane@example.com',
      phone: '+256700111222',
      message: 'General enquiry.',
    });
    expect(receipt.status).toBe('received');
  });
});
