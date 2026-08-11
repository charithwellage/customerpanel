import { describe, it, expect, vi } from 'vitest';
import { HttpClient, NormalizedApiError } from '../http.js';
import { getMockVehiclesEndpoint } from '@carchief/testing';

describe('API Client & Contract Boundary Tests', () => {
  it('instantiates HttpClient and formats base URL', () => {
    const client = new HttpClient({ baseUrl: 'http://localhost:4000/' });
    expect(client.getBaseUrl()).toBe('http://localhost:4000');
  });

  it('verifies OpenAPI mock HTTP endpoint response payload shape', () => {
    const mock = getMockVehiclesEndpoint();
    expect(mock.status).toBe(200);
    expect(mock.data.length).toBeGreaterThan(0);
    expect(mock.data[0]).toHaveProperty('id');
    expect(mock.data[0]).toHaveProperty('chassisNumber');
  });

  it('normalizes HTTP 400 validation error responses with correlation IDs', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ statusCode: 400, message: 'Invalid VIN format', correlationId: 'corr-test-123' }),
    });
    global.fetch = mockFetch;

    const client = new HttpClient({ baseUrl: 'http://localhost:4000', getCorrelationId: () => 'corr-test-123' });

    try {
      await client.request('/api/v1/vehicles');
      expect.fail('Should have thrown NormalizedApiError');
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(NormalizedApiError);
      const apiErr = err as NormalizedApiError;
      expect(apiErr.statusCode).toBe(400);
      expect(apiErr.message).toBe('Invalid VIN format');
      expect(apiErr.correlationId).toBe('corr-test-123');
    }
  });

  it('injects authorization header when token hook is provided', async () => {
    let capturedHeaders: Headers | undefined;
    const mockFetch = vi.fn().mockImplementation(async (_url, options) => {
      capturedHeaders = options.headers;
      return {
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ status: 'ok' }),
      };
    });
    global.fetch = mockFetch;

    const client = new HttpClient({
      baseUrl: 'http://localhost:4000',
      getAuthToken: () => 'demo-jwt-token-xyz',
    });

    await client.request('/healthz');
    expect(capturedHeaders?.get('Authorization')).toBe('Bearer demo-jwt-token-xyz');
    expect(capturedHeaders?.has('X-Correlation-ID')).toBe(true);
  });

  it('builds VehicleService getVehicles query string with collection and limit parameters', async () => {
    let capturedUrl: string | undefined;
    const mockFetch = vi.fn().mockImplementation(async (url) => {
      capturedUrl = url;
      return {
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => [
          {
            id: 'veh-1',
            chassisNumber: 'NZE141-1234567',
            make: 'Toyota',
            model: 'Corolla Axio',
            year: 2021,
            priceUsd: 8500,
            status: 'Available',
            locationStatus: 'In Japan',
            category: 'arrival,premium',
            createdAt: '2026-08-09T10:00:00.000Z',
          },
        ],
      };
    });
    global.fetch = mockFetch;

    const client = new HttpClient({ baseUrl: 'http://localhost:4000' });
    const { VehicleService } = await import('../services/vehicles.js');
    const service = new VehicleService(client);

    const result = await service.getVehicles({ collection: 'latest_arrivals', limit: 10 });
    expect(capturedUrl).toContain('/api/v1/vehicles?collection=latest_arrivals&limit=10');
    expect(result.length).toBe(1);
    expect(result[0].locationStatus).toBe('In Japan');
  });

  it('builds VehicleService searchVehicles query with filters, sorting and pagination', async () => {
    let capturedUrl: string | undefined;
    const mockFetch = vi.fn().mockImplementation(async (url) => {
      capturedUrl = url;
      return {
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          items: [
            {
              id: 'veh-1',
              chassisNumber: 'NZE141-1234567',
              make: 'Toyota',
              model: 'Corolla Axio',
              year: 2021,
              priceUsd: 8500,
              status: 'Available',
              locationStatus: 'In Japan',
            },
          ],
          total: 1,
          page: 1,
          limit: 12,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
          facets: {
            makes: [{ name: 'Toyota', count: 1 }],
            bodyStyles: [{ name: 'Sedan', count: 1 }],
            fuelTypes: [{ name: 'Petrol', count: 1 }],
            yearRange: { min: 2021, max: 2021 },
            priceRange: { min: 8500, max: 8500 },
          },
        }),
      };
    });
    global.fetch = mockFetch;

    const client = new HttpClient({ baseUrl: 'http://localhost:4000' });
    const { VehicleService } = await import('../services/vehicles.js');
    const service = new VehicleService(client);

    const res = await service.searchVehicles({
      searchQuery: 'Toyota',
      make: 'Toyota',
      bodyStyle: 'Sedan',
      sortBy: 'price_asc',
      page: 1,
      limit: 12,
    });

    expect(capturedUrl).toContain('/api/v1/vehicles/search?searchQuery=Toyota&make=Toyota&bodyStyle=Sedan&sortBy=price_asc&page=1&limit=12');
    expect(res.total).toBe(1);
    expect(res.facets.makes[0].name).toBe('Toyota');
  });

  it('enforces public field projection and excludes private/staff fields', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => [
        {
          id: 'veh-1',
          chassisNumber: 'NZE141-1234567',
          make: 'Toyota',
          model: 'Corolla Axio',
          year: 2021,
          priceUsd: 8500,
          status: 'Available',
          locationStatus: 'In Japan',
          createdAt: '2026-08-09T10:00:00.000Z',
        },
      ],
    });
    global.fetch = mockFetch;

    const client = new HttpClient({ baseUrl: 'http://localhost:4000' });
    const { VehicleService } = await import('../services/vehicles.js');
    const service = new VehicleService(client);

    const vehicles = await service.getVehicles();
    expect(vehicles[0]).not.toHaveProperty('internalNotes');
    expect(vehicles[0]).not.toHaveProperty('staffOwnerId');
  });

  it('verifies category results exclude legacy "New" tag', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => [
        {
          id: 'veh-1',
          chassisNumber: 'NZE141-1234567',
          make: 'Toyota',
          model: 'Corolla Axio',
          year: 2021,
          priceUsd: 8500,
          status: 'Available',
          category: 'arrival,premium',
        },
      ],
    });
    global.fetch = mockFetch;

    const client = new HttpClient({ baseUrl: 'http://localhost:4000' });
    const { VehicleService } = await import('../services/vehicles.js');
    const service = new VehicleService(client);

    const vehicles = await service.getVehicles({ collection: 'latest_arrivals' });
    const categories = vehicles.map((v) => v.category).filter(Boolean);
    categories.forEach((cat) => {
      expect(cat).not.toContain('New');
    });
  });

  it('fetches vehicle detail via VehicleService getVehicleDetail', async () => {
    let capturedUrl: string | undefined;
    const mockFetch = vi.fn().mockImplementation(async (url) => {
      capturedUrl = url;
      return {
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          id: 'veh-1',
          chassisNumber: 'NZE141-1234567',
          slug: '2021-toyota-corolla-axio-veh-1',
          make: 'Toyota',
          model: 'Corolla Axio',
          year: 2021,
          status: 'Available',
          priceState: 'priced',
          priceUsd: 8500,
          requestPrice: false,
          media: {
            gallery: ['https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=400'],
            totalPicturesCount: 1,
          },
        }),
      };
    });
    global.fetch = mockFetch;

    const client = new HttpClient({ baseUrl: 'http://localhost:4000' });
    const { VehicleService } = await import('../services/vehicles.js');
    const service = new VehicleService(client);

    const detail = await service.getVehicleDetail('2021-toyota-corolla-axio-veh-1');
    expect(capturedUrl).toContain('/api/v1/vehicles/2021-toyota-corolla-axio-veh-1');
    expect(detail).not.toBeNull();
    expect(detail?.id).toBe('veh-1');
    expect(detail?.priceState).toBe('priced');
  });

  it('returns null from VehicleService getVehicleDetail when API returns 404', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ statusCode: 404, message: 'Vehicle not found', correlationId: 'corr-404' }),
    });
    global.fetch = mockFetch;

    const client = new HttpClient({ baseUrl: 'http://localhost:4000' });
    const { VehicleService } = await import('../services/vehicles.js');
    const service = new VehicleService(client);

    const detail = await service.getVehicleDetail('missing-veh');
    expect(detail).toBeNull();
  });

  // Phase 1.5 — freight destination, port and rate lookup (D01-ASM-001).
  // DEC-PUB-FREIGHT-MODEL and DEC-PUB-CITY-DELIVERY are OPEN, so the estimate
  // contract exposes a deterministic `estimate unavailable — pending
  // confirmed rate` outcome and no formula/computed total (RULE-09, RULE-10).
  describe('FreightService', () => {
    it('fetches the freight destinations catalog', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => [
          { code: 'UG', name: 'Uganda', country: 'Uganda' },
          { code: 'KE', name: 'Kenya', country: 'Kenya' },
        ],
      });
      global.fetch = mockFetch;

      const client = new HttpClient({ baseUrl: 'http://localhost:4000' });
      const { FreightService } = await import('../services/freight.js');
      const service = new FreightService(client);

      const destinations = await service.getDestinations();
      expect(destinations).toHaveLength(2);
      expect(destinations[0].code).toBe('UG');
    });

    it('fetches the freight ports catalog', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => [{ code: 'MBA', name: 'Mombasa', country: 'Kenya' }],
      });
      global.fetch = mockFetch;

      const client = new HttpClient({ baseUrl: 'http://localhost:4000' });
      const { FreightService } = await import('../services/freight.js');
      const service = new FreightService(client);

      const ports = await service.getPorts();
      expect(ports).toHaveLength(1);
      expect(ports[0].code).toBe('MBA');
    });

    it('posts an estimate request and returns the deterministic unavailable outcome for a valid-rate-record destination', async () => {
      let capturedUrl: string | undefined;
      let capturedBody: string | undefined;
      const mockFetch = vi.fn().mockImplementation(async (url, options) => {
        capturedUrl = url;
        capturedBody = options.body;
        return {
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({
            outcome: 'estimate_unavailable_pending_rate',
            destinationCode: 'UG',
            portCode: 'MBA',
            rateStatus: 'active',
            currency: 'USD',
            rateEffectiveFrom: '2026-06-01T00:00:00.000Z',
            message: 'Shipping estimate unavailable — pending a confirmed freight rate.',
          }),
        };
      });
      global.fetch = mockFetch;

      const client = new HttpClient({ baseUrl: 'http://localhost:4000' });
      const { FreightService } = await import('../services/freight.js');
      const service = new FreightService(client);

      const estimate = await service.estimate({ destinationCode: 'UG', portCode: 'MBA' });
      expect(capturedUrl).toContain('/api/v1/freight/estimate');
      expect(JSON.parse(capturedBody!)).toEqual({ destinationCode: 'UG', portCode: 'MBA' });
      expect(estimate.outcome).toBe('estimate_unavailable_pending_rate');
      expect(estimate.rateStatus).toBe('active');
      // RULE-09: no fabricated/computed monetary total may ever reach the caller.
      expect(estimate).not.toHaveProperty('total');
    });

    it('returns the unavailable outcome with rateStatus no_rate for a supported destination with no supplied rate', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          outcome: 'estimate_unavailable_pending_rate',
          destinationCode: 'RW',
          portCode: 'MBA',
          rateStatus: 'no_rate',
          message: 'Shipping estimate unavailable — pending a confirmed freight rate.',
        }),
      });
      global.fetch = mockFetch;

      const client = new HttpClient({ baseUrl: 'http://localhost:4000' });
      const { FreightService } = await import('../services/freight.js');
      const service = new FreightService(client);

      const estimate = await service.estimate({ destinationCode: 'RW', portCode: 'MBA' });
      expect(estimate.outcome).toBe('estimate_unavailable_pending_rate');
      expect(estimate.rateStatus).toBe('no_rate');
      expect(estimate.currency).toBeUndefined();
      expect(estimate).not.toHaveProperty('total');
    });

    it('returns the unavailable outcome with rateStatus stale for an expired rate record', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          outcome: 'estimate_unavailable_pending_rate',
          destinationCode: 'KE',
          portCode: 'MBA',
          rateStatus: 'stale',
          currency: 'USD',
          rateEffectiveFrom: '2025-01-01T00:00:00.000Z',
          rateEffectiveTo: '2026-01-01T00:00:00.000Z',
          message: 'Shipping estimate unavailable — pending a confirmed freight rate.',
        }),
      });
      global.fetch = mockFetch;

      const client = new HttpClient({ baseUrl: 'http://localhost:4000' });
      const { FreightService } = await import('../services/freight.js');
      const service = new FreightService(client);

      const estimate = await service.estimate({ destinationCode: 'KE', portCode: 'MBA' });
      expect(estimate.rateStatus).toBe('stale');
      expect(estimate).not.toHaveProperty('total');
    });

    it('normalizes a 400 validation error for invalid dimensions with a field reference', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          statusCode: 400,
          message: 'dimensions.lengthMm must be a positive number',
          correlationId: 'corr-test-freight-1',
          field: 'dimensions.lengthMm',
        }),
      });
      global.fetch = mockFetch;

      const client = new HttpClient({ baseUrl: 'http://localhost:4000' });
      const { FreightService } = await import('../services/freight.js');
      const service = new FreightService(client);

      try {
        await service.estimate({
          destinationCode: 'UG',
          portCode: 'MBA',
          dimensions: { lengthMm: 0, widthMm: 1800, heightMm: 1500 },
        });
        expect.fail('Should have thrown NormalizedApiError');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(NormalizedApiError);
        expect((err as NormalizedApiError).statusCode).toBe(400);
      }
    });

    it('normalizes a 400 validation error for an unsupported destination', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          statusCode: 400,
          message: "Unsupported destination 'ZZ'",
          correlationId: 'corr-test-freight-2',
          field: 'destinationCode',
        }),
      });
      global.fetch = mockFetch;

      const client = new HttpClient({ baseUrl: 'http://localhost:4000' });
      const { FreightService } = await import('../services/freight.js');
      const service = new FreightService(client);

      try {
        await service.estimate({ destinationCode: 'ZZ', portCode: 'MBA' });
        expect.fail('Should have thrown NormalizedApiError');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(NormalizedApiError);
        expect((err as NormalizedApiError).statusCode).toBe(400);
      }
    });
  });
});
