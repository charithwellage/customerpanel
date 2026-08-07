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
});
