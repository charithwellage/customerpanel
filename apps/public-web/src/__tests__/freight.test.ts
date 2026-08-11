/**
 * Freight estimate selection, form and explanation UI tests (D01-P05-T003,
 * PUB-12).
 *
 * Tests observable behavior and contracts of:
 * - `validateFreightFormValues` client-side validation (mirrors, never
 *   overrides, the service's own validation)
 * - `FreightService` HTTP contract as consumed from a browser context (via
 *   fetch mock), including the deterministic
 *   `estimate_unavailable_pending_rate` outcome and 400/500 failure paths
 * - `FreightEstimateForm` / `FreightEstimatePanel` presentational rendering
 *   across loading, empty, validation-error, service-failure and the
 *   first-class "unavailable — pending confirmed rate" success states
 * - `VehicleDetailPage` freight integration
 * - No fixed/duplicate DOM ids across repeated freight sections
 *
 * Does not import mock fixtures or private fields. Never asserts a
 * fabricated total/currency figure — RULE-09, RULE-10, D01-ASM-001.
 */
import { describe, it, expect, vi } from 'vitest';
import { HttpClient, FreightService } from '@carchief/api-client';
import type { FreightDestination, FreightPort, FreightEstimateResponse, VehicleDetail } from '@carchief/domain';
import {
  validateFreightFormValues,
  EMPTY_FREIGHT_FORM_VALUES,
  type FreightFormValues,
} from '../features/freight/hooks/useFreightEstimate.js';
import { FreightEstimateForm } from '../features/freight/components/FreightEstimateForm.js';
import { FreightEstimatePanel } from '../features/freight/components/FreightEstimatePanel.js';
import { FreightEstimateSection } from '../features/freight/FreightEstimateSection.js';
import VehicleDetailPage from '../features/vehicle-detail/VehicleDetailPage.js';

/* --------------------------------------------------------------------------
   Fixtures — public catalog/contract shapes only
   -------------------------------------------------------------------------- */

const destinationsFixture: FreightDestination[] = [
  { code: 'UG', name: 'Uganda', country: 'Uganda' },
  { code: 'KE', name: 'Kenya', country: 'Kenya' },
];

const portsFixture: FreightPort[] = [
  { code: 'MBA', name: 'Mombasa', country: 'Kenya' },
  { code: 'DAR', name: 'Dar es Salaam', country: 'Tanzania' },
];

const unavailableResultFixture: FreightEstimateResponse = {
  outcome: 'estimate_unavailable_pending_rate',
  destinationCode: 'UG',
  portCode: 'MBA',
  rateStatus: 'no_rate',
  message: 'Shipping estimate unavailable — pending a confirmed freight rate.',
};

const staleResultFixture: FreightEstimateResponse = {
  outcome: 'estimate_unavailable_pending_rate',
  destinationCode: 'KE',
  portCode: 'MBA',
  rateStatus: 'stale',
  currency: 'USD',
  rateEffectiveFrom: '2024-01-01T00:00:00.000Z',
  rateEffectiveTo: '2024-06-01T00:00:00.000Z',
  message: 'Shipping estimate unavailable — pending a confirmed freight rate.',
};

const basePricedVehicle: VehicleDetail = {
  id: 'veh-1',
  chassisNumber: 'NZE141-0001',
  slug: '2021-toyota-corolla-axio-veh-1',
  make: 'Toyota',
  model: 'Corolla Axio',
  year: 2021,
  status: 'Available',
  priceState: 'priced',
  priceUsd: 8500,
  requestPrice: false,
  media: { gallery: [], totalPicturesCount: 0 },
  bodyStyle: 'Sedan',
};

/* --------------------------------------------------------------------------
   validateFreightFormValues (client-side validation)
   -------------------------------------------------------------------------- */
describe('validateFreightFormValues', () => {
  it('requires destinationCode and portCode', () => {
    const errors = validateFreightFormValues(EMPTY_FREIGHT_FORM_VALUES);
    expect(errors.destinationCode).toBeTruthy();
    expect(errors.portCode).toBeTruthy();
  });

  it('passes with destination and port selected and no dimensions supplied', () => {
    const values: FreightFormValues = { ...EMPTY_FREIGHT_FORM_VALUES, destinationCode: 'UG', portCode: 'MBA' };
    const errors = validateFreightFormValues(values);
    expect(errors).toEqual({});
  });

  it('requires all three dimensions together when any one is filled', () => {
    const values: FreightFormValues = {
      ...EMPTY_FREIGHT_FORM_VALUES,
      destinationCode: 'UG',
      portCode: 'MBA',
      lengthMm: '4500',
    };
    const errors = validateFreightFormValues(values);
    expect(errors.dimensions).toBeTruthy();
  });

  it('rejects a zero or negative dimension', () => {
    const values: FreightFormValues = {
      ...EMPTY_FREIGHT_FORM_VALUES,
      destinationCode: 'UG',
      portCode: 'MBA',
      lengthMm: '0',
      widthMm: '1700',
      heightMm: '1500',
    };
    const errors = validateFreightFormValues(values);
    expect(errors.dimensions).toBeTruthy();
  });

  it('passes with all three positive dimensions supplied', () => {
    const values: FreightFormValues = {
      ...EMPTY_FREIGHT_FORM_VALUES,
      destinationCode: 'UG',
      portCode: 'MBA',
      lengthMm: '4500',
      widthMm: '1700',
      heightMm: '1500',
    };
    const errors = validateFreightFormValues(values);
    expect(errors).toEqual({});
  });
});

/* --------------------------------------------------------------------------
   FreightService HTTP contract (via fetch mock)
   -------------------------------------------------------------------------- */
describe('FreightService HTTP contract', () => {
  it('fetches the destination catalog', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(destinationsFixture), { status: 200, headers: { 'content-type': 'application/json' } })
    );
    const service = new FreightService(new HttpClient({ baseUrl: 'http://mock-api.test' }));
    const destinations = await service.getDestinations();
    expect(destinations).toEqual(destinationsFixture);
    vi.restoreAllMocks();
  });

  it('fetches the port catalog', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(portsFixture), { status: 200, headers: { 'content-type': 'application/json' } })
    );
    const service = new FreightService(new HttpClient({ baseUrl: 'http://mock-api.test' }));
    const ports = await service.getPorts();
    expect(ports).toEqual(portsFixture);
    vi.restoreAllMocks();
  });

  it('returns the deterministic estimate_unavailable_pending_rate outcome with no total field', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(unavailableResultFixture), { status: 200, headers: { 'content-type': 'application/json' } })
    );
    const service = new FreightService(new HttpClient({ baseUrl: 'http://mock-api.test' }));
    const result = await service.estimate({ destinationCode: 'UG', portCode: 'MBA' });
    expect(result.outcome).toBe('estimate_unavailable_pending_rate');
    expect(result).not.toHaveProperty('total');
    expect(result).not.toHaveProperty('totalUsd');
    expect(result).not.toHaveProperty('amount');
    vi.restoreAllMocks();
  });

  it('surfaces a field-associated 400 validation error distinct from the unavailable outcome', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({ statusCode: 400, message: "Unsupported destination 'ZZ'", field: 'destinationCode' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      )
    );
    const service = new FreightService(new HttpClient({ baseUrl: 'http://mock-api.test' }));
    await expect(service.estimate({ destinationCode: 'ZZ', portCode: 'MBA' })).rejects.toBeTruthy();
    vi.restoreAllMocks();
  });

  it('surfaces an unexpected server failure as a rejected promise', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ statusCode: 500, message: 'Internal server error' }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      })
    );
    const service = new FreightService(new HttpClient({ baseUrl: 'http://mock-api.test' }));
    await expect(service.estimate({ destinationCode: 'UG', portCode: 'MBA' })).rejects.toBeTruthy();
    vi.restoreAllMocks();
  });
});

/* --------------------------------------------------------------------------
   FreightEstimateForm presentational states
   -------------------------------------------------------------------------- */
describe('FreightEstimateForm rendering', () => {
  const baseProps = {
    destinations: destinationsFixture,
    ports: portsFixture,
    catalogLoading: false,
    catalogError: null,
    onRetryCatalog: vi.fn(),
    values: EMPTY_FREIGHT_FORM_VALUES,
    onFieldChange: vi.fn(),
    fieldErrors: {},
    isSubmitting: false,
    onSubmit: vi.fn(),
  };

  it('renders a loading state while the catalog is being fetched', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(React.createElement(FreightEstimateForm, { ...baseProps, catalogLoading: true }));
    expect(html).toContain('role="status"');
    expect(html.toLowerCase()).toContain('loading');
  });

  it('renders an accessible, recoverable error state with a retry control when the catalog fails to load', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(
      React.createElement(FreightEstimateForm, { ...baseProps, catalogError: 'Network error' })
    );
    expect(html).toContain('role="alert"');
    expect(html).toContain('Network error');
    expect(html).toContain('Retry');
  });

  it('renders an honest empty state when no destinations are configured', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(React.createElement(FreightEstimateForm, { ...baseProps, destinations: [] }));
    expect(html.toLowerCase()).toContain('no shipping destinations');
  });

  it('renders destination and port options from the catalog', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(React.createElement(FreightEstimateForm, baseProps));
    expect(html).toContain('Uganda');
    expect(html).toContain('Mombasa');
  });

  it('renders field-associated validation errors', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(
      React.createElement(FreightEstimateForm, {
        ...baseProps,
        fieldErrors: { destinationCode: 'Select a destination country.' },
      })
    );
    expect(html).toContain('Select a destination country.');
    expect(html).toContain('aria-invalid="true"');
  });

  it('discloses that city delivery and insurance are not yet configurable, rather than offering non-functional controls', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(React.createElement(FreightEstimateForm, baseProps));
    expect(html.toLowerCase()).toContain('city delivery and insurance');
    expect(html).not.toContain('type="checkbox"');
  });
});

/* --------------------------------------------------------------------------
   FreightEstimatePanel presentational states
   -------------------------------------------------------------------------- */
describe('FreightEstimatePanel rendering', () => {
  const baseProps = {
    isSubmitting: false,
    submitError: null,
    onRetrySubmit: vi.fn(),
    result: null,
    enquiryHref: '/contact?topic=freight-estimate',
  };

  it('renders an idle/empty state before any submission', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(React.createElement(FreightEstimatePanel, baseProps));
    expect(html).toContain('role="region"');
    expect(html.toLowerCase()).toContain('select a destination');
  });

  it('renders a loading state while the request is in flight', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(React.createElement(FreightEstimatePanel, { ...baseProps, isSubmitting: true }));
    expect(html).toContain('role="status"');
    expect(html.toLowerCase()).toContain('requesting');
  });

  it('renders a recoverable, accessible error state on service failure', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(
      React.createElement(FreightEstimatePanel, { ...baseProps, submitError: 'Unable to reach the shipping estimate service.' })
    );
    expect(html).toContain('role="alert"');
    expect(html).toContain('Unable to reach the shipping estimate service.');
    expect(html).toContain('Try again');
  });

  it('renders the estimate_unavailable_pending_rate outcome as a first-class explained state, never a placeholder total', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(
      React.createElement(FreightEstimatePanel, { ...baseProps, result: unavailableResultFixture })
    );
    expect(html).toContain('Estimate unavailable');
    expect(html).toContain(unavailableResultFixture.message);
    expect(html).toContain('Request a formal quotation');
    // RULE-09/RULE-10: no fabricated total, currency amount, or "$" figure anywhere.
    expect(html).not.toMatch(/\$\s?\d/);
    expect(html).not.toContain('total');
    expect(html).not.toContain('0.00');
  });

  it('surfaces rate lookup context (e.g. a stale rate) informationally, still without a total', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(
      React.createElement(FreightEstimatePanel, { ...baseProps, result: staleResultFixture })
    );
    expect(html.toLowerCase()).toContain('expired');
    expect(html).not.toMatch(/\$\s?\d/);
  });
});

/* --------------------------------------------------------------------------
   Vehicle detail page freight integration
   -------------------------------------------------------------------------- */
describe('VehicleDetailPage freight integration', () => {
  it('embeds the freight estimate section', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(React.createElement(VehicleDetailPage, { vehicle: basePricedVehicle }));
    expect(html).toContain('Estimate Shipping Cost');
  });
});

/* --------------------------------------------------------------------------
   No fixed/duplicate DOM ids (reusable component rule)
   -------------------------------------------------------------------------- */
describe('FreightEstimateSection DOM id hygiene', () => {
  it('rendering two freight sections on one document produces no duplicate DOM id values', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');

    const html = renderToStaticMarkup(
      React.createElement(
        'div',
        null,
        React.createElement(FreightEstimateSection, {
          vehicleSlug: 'veh-a',
          serviceOptions: { service: new FreightService() },
        }),
        React.createElement(FreightEstimateSection, {
          vehicleSlug: 'veh-b',
          serviceOptions: { service: new FreightService() },
        })
      )
    );

    const idMatches = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
    expect(idMatches.length).toBeGreaterThan(0);
    expect(idMatches.length).toBe(new Set(idMatches).size);
  });
});
