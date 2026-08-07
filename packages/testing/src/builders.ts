import type { VehicleDomainSummary, VehicleStatus, CustomerTier } from '@carchief/domain';

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

export interface MockCustomer {
  id: string;
  name: string;
  email: string;
  tier: CustomerTier;
}

export function createMockCustomer(overrides?: Partial<MockCustomer>): MockCustomer {
  return {
    id: 'cust-mock-1',
    name: 'Kampala Auto Traders',
    email: 'info@kampalaauto.co.ug',
    tier: 'Gold',
    ...overrides,
  };
}
