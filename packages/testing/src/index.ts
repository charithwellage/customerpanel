import type { VehicleDomainSummary } from '@carchief/domain';

export function createMockVehicle(overrides?: Partial<VehicleDomainSummary>): VehicleDomainSummary {
  return {
    id: 'veh-mock-1',
    chassisNumber: 'NZE141-1234567',
    make: 'Toyota',
    model: 'Corolla Axio',
    year: 2021,
    priceUsd: 8500,
    status: 'Available',
    ...overrides,
  };
}
