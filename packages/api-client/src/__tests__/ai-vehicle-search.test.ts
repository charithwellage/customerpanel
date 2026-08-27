import { describe, expect, it, vi } from 'vitest';
import { AiVehicleSearchService, HttpClient, NormalizedApiError } from '../index.js';

describe('AI vehicle search API client', () => {
  it('posts the scope, prompt, pagination, filters, and customer token', async () => {
    let capturedUrl = '';
    let capturedInit: RequestInit | undefined;
    global.fetch = vi.fn().mockImplementation(async (url, init) => {
      capturedUrl = String(url);
      capturedInit = init;
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          scope: 'customerInventory', query: 'hybrid SUV', interpretation: { summary: 'Hybrid SUVs', appliedConstraints: ['Hybrid'] },
          items: [], total: 0, page: 1, limit: 15, totalPages: 0, hasNextPage: false, hasPrevPage: false,
        }),
      };
    });

    const service = new AiVehicleSearchService(new HttpClient({
      baseUrl: 'http://localhost:4000',
      getAuthToken: () => 'customer-token',
    }));
    await service.search({
      query: 'hybrid SUV', scope: 'customerInventory', page: 1, limit: 15,
      filters: { fuelType: 'Hybrid' }, constraints: { complianceOnly: true },
    });

    expect(capturedUrl).toBe('http://localhost:4000/api/v1/vehicles/ai-search');
    expect(capturedInit?.method).toBe('POST');
    expect((capturedInit?.headers as Headers).get('Authorization')).toBe('Bearer customer-token');
    expect(JSON.parse(String(capturedInit?.body))).toMatchObject({ scope: 'customerInventory', query: 'hybrid SUV', limit: 15 });
  });

  it('preserves the structured 501 response for the UI availability state', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 501,
      statusText: 'Not Implemented',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ statusCode: 501, code: 'AI_SEARCH_NOT_IMPLEMENTED', message: 'AI vehicle search is not implemented in the mock API.' }),
    });

    const service = new AiVehicleSearchService(new HttpClient({ baseUrl: 'http://localhost:4000' }));
    await expect(service.search({ query: 'Toyota', scope: 'publicInventory' })).rejects.toMatchObject<Partial<NormalizedApiError>>({
      statusCode: 501,
      message: 'AI vehicle search is not implemented in the mock API.',
    });
  });
});
