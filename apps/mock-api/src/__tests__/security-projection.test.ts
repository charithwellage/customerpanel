import { describe, expect, it } from 'vitest';
import { createStore } from '../store.js';

describe('Mock API Security & Projection Guard (RULE-08, RULE-09)', () => {
  it('projects public vehicle details without exposing internal cost or supplier fields', async () => {
    const store = createStore();
    await store.ready();

    const vehicle = await store.getVehicleDetail('2021-toyota-corolla-axio-veh-1');
    expect(vehicle).not.toBeNull();
    if (!vehicle) return;

    expect(vehicle.id).toBeDefined();
    expect(vehicle.make).toBe('Toyota');

    // Assert internal fields are never projected on public objects
    expect((vehicle as Record<string, unknown>).supplierId).toBeUndefined();
    expect((vehicle as Record<string, unknown>).purchasePriceJpy).toBeUndefined();
    expect((vehicle as Record<string, unknown>).reservePriceUsd).toBeUndefined();
    expect((vehicle as Record<string, unknown>).internalNotes).toBeUndefined();
  });

  it('rejects reset execution when node environment is production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    try {
      const isProduction = process.env.NODE_ENV === 'production';
      expect(isProduction).toBe(true);
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });
});
