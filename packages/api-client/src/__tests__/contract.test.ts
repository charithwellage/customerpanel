import { describe, it, expect } from 'vitest';
import { VehicleService } from '../services/vehicles.js';
import { getMockVehiclesEndpoint } from '@carchief/testing';

describe('API Client & Contract Integration Tests', () => {
  it('instantiates VehicleService and returns empty list initially', async () => {
    const service = new VehicleService();
    const vehicles = await service.getVehicles();
    expect(vehicles).toEqual([]);
  });

  it('matches OpenAPI mock HTTP endpoint payload shape', () => {
    const mock = getMockVehiclesEndpoint();
    expect(mock.status).toBe(200);
    expect(mock.data.length).toBeGreaterThan(0);
  });
});
