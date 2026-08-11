import { describe, it, expect } from 'vitest';
import { generateVehicleSlug, type VehicleDomainSummary } from '../index.js';

function createMockVehicle(overrides?: Partial<VehicleDomainSummary>): VehicleDomainSummary {
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

describe('Domain Package Unit Tests', () => {
  it('creates a valid mock vehicle summary with defaults', () => {
    const vehicle = createMockVehicle();
    expect(vehicle.id).toBe('veh-mock-1');
    expect(vehicle.make).toBe('Toyota');
    expect(vehicle.status).toBe('Available');
  });

  it('allows overriding mock vehicle fields', () => {
    const vehicle = createMockVehicle({ make: 'Nissan', model: 'X-Trail', year: 2022 });
    expect(vehicle.make).toBe('Nissan');
    expect(vehicle.model).toBe('X-Trail');
    expect(vehicle.year).toBe(2022);
  });

  it('generates clean vehicle slugs', () => {
    const slug = generateVehicleSlug(2021, 'Toyota', 'Corolla Axio!', 'veh-1');
    expect(slug).toBe('2021-toyota-corolla-axio-veh-1');
  });
});
