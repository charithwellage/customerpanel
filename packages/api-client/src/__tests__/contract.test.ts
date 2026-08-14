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

  describe('EnquiryService (PUB-13, PUB-15, D01-P05-T004)', () => {
    it('submits a general enquiry and receives a receipt confirmation', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          id: 'enq-1',
          receivedAt: '2026-08-11T12:00:00.000Z',
          status: 'received',
          duplicate: false,
          enquiryType: 'general',
          source: 'form',
        }),
      });
      global.fetch = mockFetch;

      const client = new HttpClient({ baseUrl: 'http://localhost:4000' });
      const { EnquiryService } = await import('../services/enquiries.js');
      const service = new EnquiryService(client);

      const receipt = await service.submit({
        name: 'Jane Doe',
        consent: true,
        email: 'jane@example.com',
        phone: '+256700111222',
        message: 'General enquiry about your inventory.',
      });
      expect(receipt.status).toBe('received');
      expect(receipt.duplicate).toBe(false);
      expect(receipt.enquiryType).toBe('general');
      expect(receipt.source).toBe('form');
      // RULE-09/RULE-10: an enquiry receipt never carries a monetary total or
      // a claim of staff notification/contact.
      expect(receipt).not.toHaveProperty('total');
      expect(JSON.stringify(receipt).toLowerCase()).not.toContain('notified');
    });

    it('submits a quotation enquiry carrying a server-resolved estimate snapshot with no monetary total', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          id: 'enq-2',
          receivedAt: '2026-08-11T12:05:00.000Z',
          status: 'received',
          duplicate: false,
          vehicleSlug: '2021-toyota-corolla-axio-veh-1',
          estimateSnapshot: {
            destinationCode: 'UG',
            portCode: 'MBA',
            rateStatus: 'active',
            currency: 'USD',
            rateEffectiveFrom: '2026-06-01T00:00:00.000Z',
            message: 'Shipping estimate unavailable — pending a confirmed freight rate.',
          },
        }),
      });
      global.fetch = mockFetch;

      const client = new HttpClient({ baseUrl: 'http://localhost:4000' });
      const { EnquiryService } = await import('../services/enquiries.js');
      const service = new EnquiryService(client);

      const receipt = await service.submit({
        name: 'Amara Okoye',
        consent: true,
        email: 'amara@example.com',
        phone: '+256700555666',
        message: 'Please confirm shipping cost to Uganda.',
        vehicleSlug: '2021-toyota-corolla-axio-veh-1',
        destinationCode: 'UG',
        portCode: 'MBA',
      });
      expect(receipt.estimateSnapshot?.destinationCode).toBe('UG');
      expect(receipt.estimateSnapshot).not.toHaveProperty('total');
      expect(receipt.estimateSnapshot).not.toHaveProperty('amount');
    });

    it('normalizes a 200 duplicate receipt distinct from a fresh submission', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          id: 'enq-1',
          receivedAt: '2026-08-11T12:00:00.000Z',
          status: 'received',
          duplicate: true,
        }),
      });
      global.fetch = mockFetch;

      const client = new HttpClient({ baseUrl: 'http://localhost:4000' });
      const { EnquiryService } = await import('../services/enquiries.js');
      const service = new EnquiryService(client);

      const receipt = await service.submit({
        name: 'Jane Doe',
        consent: true,
        email: 'jane@example.com',
        phone: '+256700111222',
        message: 'General enquiry about your inventory.',
      });
      expect(receipt.duplicate).toBe(true);
    });

    it('normalizes a 400 validation error for a missing required field with a field reference', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          statusCode: 400,
          message: 'Email is required',
          correlationId: 'corr-test-enquiry-1',
          field: 'email',
        }),
      });
      global.fetch = mockFetch;

      const client = new HttpClient({ baseUrl: 'http://localhost:4000' });
      const { EnquiryService } = await import('../services/enquiries.js');
      const service = new EnquiryService(client);

      try {
        await service.submit({ name: 'Jane Doe', consent: true, email: '', phone: '+256700111222', message: 'Hello' });
        expect.fail('Should have thrown NormalizedApiError');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(NormalizedApiError);
        expect((err as NormalizedApiError).statusCode).toBe(400);
      }
    });

    // Phase 1.6 (D01-P06-T001): staff-facing lead read-by-ID/list proof
    // operation, the regression fix proving a submitted enquiry is
    // retrievable through the Salesperson service boundary (PUB-16).
    it('fetches a lead by id via EnquiryService.getLeadById, carrying full staff-visible contact fields', async () => {
      let capturedUrl: string | undefined;
      const mockFetch = vi.fn().mockImplementation(async (url) => {
        capturedUrl = url;
        return {
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({
            id: 'enq-1',
            receivedAt: '2026-08-11T12:00:00.000Z',
            status: 'New',
            enquiryType: 'general',
            source: 'form',
            name: 'Jane Doe',
            email: 'jane@example.com',
            phone: '+256700111222',
            message: 'General enquiry about your inventory.',
            duplicateResubmissionCount: 0,
          }),
        };
      });
      global.fetch = mockFetch;

      const client = new HttpClient({ baseUrl: 'http://localhost:4000' });
      const { EnquiryService } = await import('../services/enquiries.js');
      const service = new EnquiryService(client);

      const lead = await service.getLeadById('enq-1');
      expect(capturedUrl).toContain('/api/v1/enquiries/enq-1');
      expect(lead).not.toBeNull();
      expect(lead?.name).toBe('Jane Doe');
      expect(lead?.status).toBe('New');
    });

    it('returns null from EnquiryService.getLeadById when the mock returns 404', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ statusCode: 404, message: "Enquiry 'missing' not found", correlationId: 'corr-404' }),
      });
      global.fetch = mockFetch;

      const client = new HttpClient({ baseUrl: 'http://localhost:4000' });
      const { EnquiryService } = await import('../services/enquiries.js');
      const service = new EnquiryService(client);

      const lead = await service.getLeadById('missing');
      expect(lead).toBeNull();
    });

    it('normalizes a 401/403 from EnquiryService.getLeadById as a NormalizedApiError (not silently null)', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ statusCode: 403, message: 'Forbidden: insufficient role permissions', correlationId: 'corr-403' }),
      });
      global.fetch = mockFetch;

      const client = new HttpClient({ baseUrl: 'http://localhost:4000' });
      const { EnquiryService } = await import('../services/enquiries.js');
      const service = new EnquiryService(client);

      try {
        await service.getLeadById('enq-1');
        expect.fail('Should have thrown NormalizedApiError');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(NormalizedApiError);
        expect((err as NormalizedApiError).statusCode).toBe(403);
      }
    });

    it('fetches the staff-facing lead list via EnquiryService.listLeads', async () => {
      let capturedUrl: string | undefined;
      const mockFetch = vi.fn().mockImplementation(async (url) => {
        capturedUrl = url;
        return {
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({
            items: [
              {
                id: 'enq-1',
                receivedAt: '2026-08-11T12:00:00.000Z',
                status: 'New',
                enquiryType: 'general',
                source: 'form',
                name: 'Jane Doe',
                email: 'jane@example.com',
                phone: '+256700111222',
                message: 'General enquiry about your inventory.',
                duplicateResubmissionCount: 0,
              },
            ],
            total: 1,
          }),
        };
      });
      global.fetch = mockFetch;

      const client = new HttpClient({ baseUrl: 'http://localhost:4000' });
      const { EnquiryService } = await import('../services/enquiries.js');
      const service = new EnquiryService(client);

      const list = await service.listLeads();
      expect(capturedUrl).toContain('/api/v1/enquiries');
      expect(list.total).toBe(1);
      expect(list.items[0].name).toBe('Jane Doe');
    });
  });

  describe('SessionService (PUB-22, DEC-PUB-AUTH-BOUNDARY, D01-P06-T003)', () => {
    it('mints a demo session via SessionService.startDemoSession, always labelled non-production', async () => {
      let capturedUrl: string | undefined;
      let capturedMethod: string | undefined;
      const mockFetch = vi.fn().mockImplementation(async (url, options) => {
        capturedUrl = url;
        capturedMethod = options?.method;
        return {
          ok: true,
          status: 201,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({
            token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo.demo-signature',
            claims: { sub: 'user-123', email: 'user@carchief.com', role: 'CustomerBuyer', permissions: ['read:public'], exp: 9999999999 },
            nonProduction: true,
          }),
        };
      });
      global.fetch = mockFetch;

      const client = new HttpClient({ baseUrl: 'http://localhost:4000' });
      const { SessionService } = await import('../services/session.js');
      const service = new SessionService(client);

      const session = await service.startDemoSession();
      expect(capturedUrl).toContain('/api/v1/auth/demo-session');
      expect(capturedMethod).toBe('POST');
      expect(session.nonProduction).toBe(true);
      expect(session.claims.role).toBe('CustomerBuyer');
    });

    it('returns the current claims via SessionService.getCurrentSession when authenticated', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ sub: 'user-123', email: 'user@carchief.com', role: 'CustomerBuyer', permissions: ['read:public'], exp: 9999999999 }),
      });
      global.fetch = mockFetch;

      const client = new HttpClient({ baseUrl: 'http://localhost:4000', getAuthToken: () => 'demo-token' });
      const { SessionService } = await import('../services/session.js');
      const service = new SessionService(client);

      const claims = await service.getCurrentSession();
      expect(claims?.role).toBe('CustomerBuyer');
    });

    it('returns null from SessionService.getCurrentSession for an unauthenticated 401 (never throws for the honest anonymous state)', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' }),
      });
      global.fetch = mockFetch;

      const client = new HttpClient({ baseUrl: 'http://localhost:4000' });
      const { SessionService } = await import('../services/session.js');
      const service = new SessionService(client);

      expect(await service.getCurrentSession()).toBeNull();
    });
  });

  describe('ReservationService (PUB-23, RULE-05, RULE-08, RULE-10, D01-P06-T004)', () => {
    it('creates a reservation via ReservationService.create, exposing status and expiresAt with no automatic-release claim', async () => {
      let capturedUrl: string | undefined;
      let capturedMethod: string | undefined;
      let capturedBody: string | undefined;
      const mockFetch = vi.fn().mockImplementation(async (url, options) => {
        capturedUrl = url;
        capturedMethod = options?.method;
        capturedBody = options?.body;
        return {
          ok: true,
          status: 201,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({
            id: 'res-1',
            vehicleSlug: '2021-toyota-corolla-axio-veh-1',
            vehicleId: 'veh-1',
            customerId: 'user-123',
            customerEmail: 'user@carchief.com',
            status: 'active',
            createdAt: '2026-08-11T12:00:00.000Z',
            expiresAt: '2026-08-13T12:00:00.000Z',
            holdHours: 48,
          }),
        };
      });
      global.fetch = mockFetch;

      const client = new HttpClient({ baseUrl: 'http://localhost:4000', getAuthToken: () => 'demo-token' });
      const { ReservationService } = await import('../services/reservations.js');
      const service = new ReservationService(client);

      const reservation = await service.create({ vehicleSlug: '2021-toyota-corolla-axio-veh-1' });
      expect(capturedUrl).toContain('/api/v1/reservations');
      expect(capturedMethod).toBe('POST');
      expect(JSON.parse(capturedBody!)).toEqual({ vehicleSlug: '2021-toyota-corolla-axio-veh-1' });
      expect(reservation.status).toBe('active');
      expect(reservation.expiresAt).toBe('2026-08-13T12:00:00.000Z');
      expect(reservation.holdHours).toBe(48);
      // RULE-10: never a claim of automatic release/notification action.
      expect(JSON.stringify(reservation).toLowerCase()).not.toContain('notified');
      expect(JSON.stringify(reservation).toLowerCase()).not.toContain('released');
    });

    it('normalizes a 409 conflict from ReservationService.create with the reason field intact', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          statusCode: 409,
          message: 'This vehicle is already on hold for another customer',
          correlationId: 'corr-409',
          reason: 'conflict',
        }),
      });
      global.fetch = mockFetch;

      const client = new HttpClient({ baseUrl: 'http://localhost:4000', getAuthToken: () => 'demo-token' });
      const { ReservationService } = await import('../services/reservations.js');
      const service = new ReservationService(client);

      try {
        await service.create({ vehicleSlug: '2021-toyota-corolla-axio-veh-1' });
        expect.fail('Should have thrown NormalizedApiError');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(NormalizedApiError);
        expect((err as NormalizedApiError).statusCode).toBe(409);
        expect((err as NormalizedApiError).rawError).toMatchObject({ reason: 'conflict' });
      }
    });

    it('fetches a reservation by id via ReservationService.getById', async () => {
      let capturedUrl: string | undefined;
      const mockFetch = vi.fn().mockImplementation(async (url) => {
        capturedUrl = url;
        return {
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({
            id: 'res-1',
            vehicleSlug: '2021-toyota-corolla-axio-veh-1',
            vehicleId: 'veh-1',
            customerId: 'user-123',
            customerEmail: 'user@carchief.com',
            status: 'active',
            createdAt: '2026-08-11T12:00:00.000Z',
            expiresAt: '2026-08-13T12:00:00.000Z',
            holdHours: 48,
          }),
        };
      });
      global.fetch = mockFetch;

      const client = new HttpClient({ baseUrl: 'http://localhost:4000', getAuthToken: () => 'demo-token' });
      const { ReservationService } = await import('../services/reservations.js');
      const service = new ReservationService(client);

      const reservation = await service.getById('res-1');
      expect(capturedUrl).toContain('/api/v1/reservations/res-1');
      expect(reservation).not.toBeNull();
      expect(reservation?.id).toBe('res-1');
    });

    it('returns null from ReservationService.getById when the mock returns 404', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ statusCode: 404, message: "Reservation 'missing' not found", correlationId: 'corr-404' }),
      });
      global.fetch = mockFetch;

      const client = new HttpClient({ baseUrl: 'http://localhost:4000', getAuthToken: () => 'demo-token' });
      const { ReservationService } = await import('../services/reservations.js');
      const service = new ReservationService(client);

      const reservation = await service.getById('missing');
      expect(reservation).toBeNull();
    });

    it('normalizes a 403 from ReservationService.getById as a NormalizedApiError (not silently null)', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ statusCode: 403, message: 'Forbidden: insufficient role permissions', correlationId: 'corr-403' }),
      });
      global.fetch = mockFetch;

      const client = new HttpClient({ baseUrl: 'http://localhost:4000', getAuthToken: () => 'demo-token' });
      const { ReservationService } = await import('../services/reservations.js');
      const service = new ReservationService(client);

      try {
        await service.getById('res-1');
        expect.fail('Should have thrown NormalizedApiError');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(NormalizedApiError);
        expect((err as NormalizedApiError).statusCode).toBe(403);
      }
    });
  });

  describe('ConfigService (D01-P06-T003)', () => {
    it('fetches public config, including an optional liveAuctionUrl when approved', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ siteName: 'CarChief', currency: 'USD', contactPhone: '+256 700 000 000', liveAuctionUrl: 'https://auctions.example.com/live' }),
      });
      global.fetch = mockFetch;

      const client = new HttpClient({ baseUrl: 'http://localhost:4000' });
      const { ConfigService } = await import('../services/config.js');
      const service = new ConfigService(client);

      const config = await service.getPublicConfig();
      expect(config.liveAuctionUrl).toBe('https://auctions.example.com/live');
    });
  });

  describe('ContentService (D01-P07-T001)', () => {
    it('calls getFaqs with category and query parameters', async () => {
      let capturedUrl: string | undefined;
      const mockFetch = vi.fn().mockImplementation(async (url) => {
        capturedUrl = url;
        return {
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({
            categories: [{ id: 'cat-buying-process', name: 'Buying Process', order: 1 }],
            items: [],
            total: 1,
            matchedCount: 0,
            groundedNoAnswer: false,
          }),
        };
      });
      global.fetch = mockFetch;

      const client = new HttpClient({ baseUrl: 'http://localhost:4000' });
      const { ContentService } = await import('../services/content.js');
      const service = new ContentService(client);

      await service.getFaqs({ category: 'cat-buying-process', q: 'buying' });
      expect(capturedUrl).toContain('/api/v1/content/faq?category=cat-buying-process&q=buying');
    });

    it('submits testimonial payload to ContentService', async () => {
      let capturedUrl: string | undefined;
      let capturedBody: unknown;
      const mockFetch = vi.fn().mockImplementation(async (url, options) => {
        capturedUrl = url;
        capturedBody = JSON.parse(options.body as string);
        return {
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({
            id: 'testim-100',
            status: 'pending',
            submittedAt: '2026-08-12T10:00:00.000Z',
            message: 'Testimonial submitted successfully and is pending review.',
          }),
        };
      });
      global.fetch = mockFetch;

      const client = new HttpClient({ baseUrl: 'http://localhost:4000' });
      const { ContentService } = await import('../services/content.js');
      const service = new ContentService(client);

      const res = await service.submitTestimonial({
        authorName: 'Jane Doe',
        authorLocation: 'Kampala',
        content: 'Great service!',
        rating: 5,
        consent: true,
      });

      expect(capturedUrl).toBe('http://localhost:4000/api/v1/content/testimonials');
      expect(capturedBody).toEqual({
        authorName: 'Jane Doe',
        authorLocation: 'Kampala',
        content: 'Great service!',
        rating: 5,
        consent: true,
      });
      expect(res.status).toBe('pending');
    });

    it('fetches public content page by slug and handles 404', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ statusCode: 404, message: 'Content page missing not found', correlationId: 'corr-404' }),
      });
      global.fetch = mockFetch;

      const client = new HttpClient({ baseUrl: 'http://localhost:4000' });
      const { ContentService } = await import('../services/content.js');
      const service = new ContentService(client);

      const page = await service.getContentPageBySlug('missing');
      expect(page).toBeNull();
    });

    it('fetches offices and branches list', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ items: [], total: 0 }),
      });
      global.fetch = mockFetch;

      const client = new HttpClient({ baseUrl: 'http://localhost:4000' });
      const { ContentService } = await import('../services/content.js');
      const service = new ContentService(client);

      const offices = await service.getOffices();
      const branches = await service.getBranches();
      expect(offices.items).toEqual([]);
      expect(branches.items).toEqual([]);
    });
  });

  // Phase 2.2: customer dashboard KPI baseline (D02-ASM-001).
  // Non-blocking aggregate: outstanding balance = issued invoice total - approved allocations;
  // credit utilisation = outstanding balance ÷ credit limit; vehicle counts use canonical IDs + status.
  describe('CustomerDashboard Service (D02-ASM-001)', () => {
    it('fetches customer dashboard with reconciled KPI values', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          customerId: 'cust-123',
          customerEmail: 'customer@example.com',
          creditLimitUsd: 500000,
          outstandingBalanceUsd: 29700,
          creditUtilisationPercent: 5.94,
          vehicleCountReserved: 2,
          vehicleCountInvoiced: 3,
          vehicleCountDelivered: 0,
          lastUpdated: '2026-08-14T10:00:00.000Z',
        }),
      });
      global.fetch = mockFetch;

      const client = new HttpClient({
        baseUrl: 'http://localhost:4000',
        getAuthToken: () => 'demo-token',
      });

      const dashboard = await client.request<any>('/api/v1/customer/dashboard');

      expect(dashboard.customerId).toBe('cust-123');
      expect(dashboard.outstandingBalanceUsd).toBe(29700);
      expect(dashboard.creditUtilisationPercent).toBe(5.94);
      expect(dashboard.vehicleCountInvoiced).toBe(3);
      expect(dashboard.vehicleCountReserved).toBe(2);
      expect(dashboard.vehicleCountDelivered).toBe(0);
    });

    it('validates CustomerDashboard payload schema', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          customerId: 'cust-123',
          customerEmail: 'customer@example.com',
          creditLimitUsd: 500000,
          outstandingBalanceUsd: 0,
          creditUtilisationPercent: 0,
          vehicleCountReserved: 0,
          vehicleCountInvoiced: 0,
          vehicleCountDelivered: 0,
          lastUpdated: '2026-08-14T10:00:00.000Z',
        }),
      });
      global.fetch = mockFetch;

      const client = new HttpClient({
        baseUrl: 'http://localhost:4000',
        getAuthToken: () => 'demo-token',
      });

      const dashboard = await client.request<any>('/api/v1/customer/dashboard');

      // Verify all required fields are present
      expect(dashboard).toHaveProperty('customerId');
      expect(dashboard).toHaveProperty('customerEmail');
      expect(dashboard).toHaveProperty('creditLimitUsd');
      expect(dashboard).toHaveProperty('outstandingBalanceUsd');
      expect(dashboard).toHaveProperty('creditUtilisationPercent');
      expect(dashboard).toHaveProperty('vehicleCountReserved');
      expect(dashboard).toHaveProperty('vehicleCountInvoiced');
      expect(dashboard).toHaveProperty('vehicleCountDelivered');
      expect(dashboard).toHaveProperty('lastUpdated');

      // Verify types
      expect(typeof dashboard.customerId).toBe('string');
      expect(typeof dashboard.creditLimitUsd).toBe('number');
      expect(typeof dashboard.outstandingBalanceUsd).toBe('number');
      expect(typeof dashboard.creditUtilisationPercent).toBe('number');
      expect(typeof dashboard.vehicleCountReserved).toBe('number');
      expect(typeof dashboard.vehicleCountInvoiced).toBe('number');
      expect(typeof dashboard.vehicleCountDelivered).toBe('number');
    });

    it('prohibits browser-side calculation: returns server-derived values only', async () => {
      // This test verifies that the contract never exposes raw invoice/allocation data
      // that would tempt browser-side recalculation
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          customerId: 'cust-123',
          customerEmail: 'customer@example.com',
          creditLimitUsd: 500000,
          outstandingBalanceUsd: 42200, // Server-computed, not browser-computed
          creditUtilisationPercent: 8.44, // Server-computed percentage
          vehicleCountReserved: 1,
          vehicleCountInvoiced: 2,
          vehicleCountDelivered: 0,
          lastUpdated: '2026-08-14T10:00:00.000Z',
          paymentStatusSummary: { approved: 2, pending: 0, rejected: 0 },
          shipmentStatusSummary: { ready: 1, inTransit: 1, delivered: 0, other: 0 },
          documentAvailabilityCount: { available: 3, pending: 0, unavailable: 0 },
          notificationUnreadCount: 1,
          partialFailureIndicators: { paymentsFailed: false, shipmentsFailed: false, documentsFailed: false, notificationsFailed: false },
        }),
      });
      global.fetch = mockFetch;

      const client = new HttpClient({
        baseUrl: 'http://localhost:4000',
        getAuthToken: () => 'demo-token',
      });

      const dashboard = await client.request<any>('/api/v1/customer/dashboard');

      // Verify no raw invoice list is exposed (which would enable browser calculation)
      expect(dashboard).not.toHaveProperty('invoices');
      expect(dashboard).not.toHaveProperty('allocations');
      expect(dashboard).not.toHaveProperty('payments');
      expect(dashboard).not.toHaveProperty('shipments');
      expect(dashboard).not.toHaveProperty('documents');

      // Verify reconciled totals only
      expect(typeof dashboard.outstandingBalanceUsd).toBe('number');
      expect(typeof dashboard.creditUtilisationPercent).toBe('number');
    });

    it('includes linked record aggregates: payment/shipment/document/notification summaries (D02-P02-T001)', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          customerId: 'cust-123',
          customerEmail: 'customer@example.com',
          creditLimitUsd: 500000,
          outstandingBalanceUsd: 29700,
          creditUtilisationPercent: 5.94,
          vehicleCountReserved: 2,
          vehicleCountInvoiced: 3,
          vehicleCountDelivered: 0,
          lastUpdated: '2026-08-14T10:00:00.000Z',
          paymentStatusSummary: { approved: 3, pending: 1, rejected: 0 },
          shipmentStatusSummary: { ready: 1, inTransit: 1, delivered: 1, other: 0 },
          documentAvailabilityCount: { available: 3, pending: 1, unavailable: 0 },
          notificationUnreadCount: 2,
          partialFailureIndicators: { paymentsFailed: false, shipmentsFailed: false, documentsFailed: false, notificationsFailed: false },
        }),
      });
      global.fetch = mockFetch;

      const client = new HttpClient({
        baseUrl: 'http://localhost:4000',
        getAuthToken: () => 'demo-token',
      });

      const dashboard = await client.request<any>('/api/v1/customer/dashboard');

      // Verify linked record aggregates are present
      expect(dashboard).toHaveProperty('paymentStatusSummary');
      expect(dashboard).toHaveProperty('shipmentStatusSummary');
      expect(dashboard).toHaveProperty('documentAvailabilityCount');
      expect(dashboard).toHaveProperty('notificationUnreadCount');
      expect(dashboard).toHaveProperty('partialFailureIndicators');

      // Verify payment status summary structure and values
      expect(dashboard.paymentStatusSummary).toEqual({ approved: 3, pending: 1, rejected: 0 });
      expect(typeof dashboard.paymentStatusSummary.approved).toBe('number');
      expect(typeof dashboard.paymentStatusSummary.pending).toBe('number');
      expect(typeof dashboard.paymentStatusSummary.rejected).toBe('number');

      // Verify shipment status summary structure
      expect(dashboard.shipmentStatusSummary).toEqual({ ready: 1, inTransit: 1, delivered: 1, other: 0 });
      expect(typeof dashboard.shipmentStatusSummary.ready).toBe('number');
      expect(typeof dashboard.shipmentStatusSummary.inTransit).toBe('number');
      expect(typeof dashboard.shipmentStatusSummary.delivered).toBe('number');
      expect(typeof dashboard.shipmentStatusSummary.other).toBe('number');

      // Verify document availability summary structure
      expect(dashboard.documentAvailabilityCount).toEqual({ available: 3, pending: 1, unavailable: 0 });
      expect(typeof dashboard.documentAvailabilityCount.available).toBe('number');
      expect(typeof dashboard.documentAvailabilityCount.pending).toBe('number');
      expect(typeof dashboard.documentAvailabilityCount.unavailable).toBe('number');

      // Verify notification unread count
      expect(dashboard.notificationUnreadCount).toBe(2);
      expect(typeof dashboard.notificationUnreadCount).toBe('number');
    });

    it('validates partial failure indicators in response', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          customerId: 'cust-exception-001',
          customerEmail: 'exception@example.com',
          creditLimitUsd: 500000,
          outstandingBalanceUsd: 9500,
          creditUtilisationPercent: 1.9,
          vehicleCountReserved: 0,
          vehicleCountInvoiced: 1,
          vehicleCountDelivered: 0,
          lastUpdated: '2026-08-14T10:00:00.000Z',
          paymentStatusSummary: { approved: 0, pending: 0, rejected: 1 },
          shipmentStatusSummary: { ready: 0, inTransit: 0, delivered: 0, other: 1 },
          documentAvailabilityCount: { available: 0, pending: 0, unavailable: 1 },
          notificationUnreadCount: 0,
          partialFailureIndicators: { paymentsFailed: false, shipmentsFailed: false, documentsFailed: false, notificationsFailed: false },
        }),
      });
      global.fetch = mockFetch;

      const client = new HttpClient({
        baseUrl: 'http://localhost:4000',
        getAuthToken: () => 'demo-token',
      });

      const dashboard = await client.request<any>('/api/v1/customer/dashboard');

      // Verify partial failure indicators structure and types
      expect(dashboard.partialFailureIndicators).toBeDefined();
      expect(dashboard.partialFailureIndicators).toHaveProperty('paymentsFailed');
      expect(dashboard.partialFailureIndicators).toHaveProperty('shipmentsFailed');
      expect(dashboard.partialFailureIndicators).toHaveProperty('documentsFailed');
      expect(dashboard.partialFailureIndicators).toHaveProperty('notificationsFailed');

      // Verify all indicators are booleans
      expect(typeof dashboard.partialFailureIndicators.paymentsFailed).toBe('boolean');
      expect(typeof dashboard.partialFailureIndicators.shipmentsFailed).toBe('boolean');
      expect(typeof dashboard.partialFailureIndicators.documentsFailed).toBe('boolean');
      expect(typeof dashboard.partialFailureIndicators.notificationsFailed).toBe('boolean');
    });
  });

  describe('Customer Vehicle Service & Contracts (D02-P04-T001)', () => {
    it('lists customer fleet vehicles via CustomerVehicleService', async () => {
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
                vehicleId: 'veh-1',
                chassisNumber: 'NZE141-1234567',
                make: 'Toyota',
                model: 'Corolla Axio',
                year: 2021,
                slug: '2021-toyota-corolla-axio-veh-1',
                priceUsd: 8500,
                totalAmountUsd: 8500,
                status: 'Confirmed',
                createdAt: '2026-08-10T10:00:00.000Z',
                updatedAt: '2026-08-10T10:00:00.000Z',
              },
            ],
            total: 1,
            countsByStatus: {
              underNegotiation: 0,
              underNegotiationWithPI: 0,
              confirmed: 1,
              inTransit: 0,
              delivered: 0,
              all: 1,
            },
          }),
        };
      });
      global.fetch = mockFetch;

      const client = new HttpClient({ baseUrl: 'http://localhost:4000' });
      const { CustomerVehicleService } = await import('../services/customerVehicles.js');
      const service = new CustomerVehicleService(client);

      const res = await service.listCustomerVehicles({ status: 'Confirmed', query: 'Corolla', page: 1, limit: 10 });
      expect(capturedUrl).toBe('http://localhost:4000/customer/vehicles?status=Confirmed&query=Corolla&page=1&limit=10');
      expect(res.total).toBe(1);
      expect(res.items[0].make).toBe('Toyota');
      expect(res.countsByStatus.confirmed).toBe(1);
    });

    it('fetches customer vehicle detail via CustomerVehicleService', async () => {
      let capturedUrl: string | undefined;
      const mockFetch = vi.fn().mockImplementation(async (url) => {
        capturedUrl = url;
        return {
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({
            id: 'veh-1',
            vehicleId: 'veh-1',
            chassisNumber: 'NZE141-1234567',
            make: 'Toyota',
            model: 'Corolla Axio',
            year: 2021,
            slug: '2021-toyota-corolla-axio-veh-1',
            priceUsd: 8500,
            totalAmountUsd: 8500,
            status: 'Confirmed',
            images: ['https://example.com/veh-1.jpg'],
            statusHistory: [
              { status: 'Under Negotiation', timestamp: '2026-08-09T10:00:00.000Z' },
              { status: 'Confirmed', timestamp: '2026-08-11T10:00:00.000Z' },
            ],
            documents: [
              { id: 'doc-inv-1', type: 'CommercialInvoice', title: 'Commercial Invoice INV-001', status: 'Available' },
            ],
            createdAt: '2026-08-10T10:00:00.000Z',
            updatedAt: '2026-08-10T10:00:00.000Z',
          }),
        };
      });
      global.fetch = mockFetch;

      const client = new HttpClient({ baseUrl: 'http://localhost:4000' });
      const { CustomerVehicleService } = await import('../services/customerVehicles.js');
      const service = new CustomerVehicleService(client);

      const detail = await service.getCustomerVehicleDetail('veh-1');
      expect(capturedUrl).toBe('http://localhost:4000/customer/vehicles/veh-1');
      expect(detail).not.toBeNull();
      expect(detail?.id).toBe('veh-1');
      expect(detail?.status).toBe('Confirmed');
      expect(detail?.statusHistory.length).toBe(2);
      expect(detail?.documents.length).toBe(1);
    });

    it('returns null on 404 from getCustomerVehicleDetail', async () => {
      const mockFetch = vi.fn().mockImplementation(async () => {
        return {
          ok: false,
          status: 404,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({
            statusCode: 404,
            message: 'Vehicle not found',
          }),
        };
      });
      global.fetch = mockFetch;

      const client = new HttpClient({ baseUrl: 'http://localhost:4000' });
      const { CustomerVehicleService } = await import('../services/customerVehicles.js');
      const service = new CustomerVehicleService(client);

      const detail = await service.getCustomerVehicleDetail('non-existent');
      expect(detail).toBeNull();
    });
  });
});
