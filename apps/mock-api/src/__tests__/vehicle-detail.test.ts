import { describe, it, expect, beforeEach } from 'vitest';
import { createStore } from '../store.js';
import { createMockApiApp } from '../server.js';
import type { Server } from 'node:http';

describe('Vehicle Detail API & Contract Tests', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(async () => {
    store = createStore();
    await store.reset();
  });

  it('fetches vehicle detail by direct ID (veh-1)', async () => {
    const detail = await store.getVehicleDetail('veh-1');
    expect(detail).not.toBeNull();
    expect(detail?.id).toBe('veh-1');
    expect(detail?.make).toBe('Toyota');
    expect(detail?.model).toBe('Corolla Axio');
    expect(detail?.slug).toBe('2021-toyota-corolla-axio-veh-1');
    expect(detail?.priceState).toBe('priced');
    expect(detail?.priceUsd).toBe(8500);
    expect(detail?.media).toBeDefined();
    expect(detail?.media.gallery.length).toBeGreaterThan(0);
  });

  it('fetches vehicle detail by chassis number (NZE141-1234567)', async () => {
    const detail = await store.getVehicleDetail('NZE141-1234567');
    expect(detail).not.toBeNull();
    expect(detail?.id).toBe('veh-1');
  });

  it('fetches vehicle detail by stable generated slug', async () => {
    const detail = await store.getVehicleDetail('2021-toyota-corolla-axio-veh-1');
    expect(detail).not.toBeNull();
    expect(detail?.id).toBe('veh-1');
  });

  it('fetches vehicle detail via renamed/custom slug suffix fallback', async () => {
    const detail = await store.getVehicleDetail('custom-renamed-title-veh-1');
    expect(detail).not.toBeNull();
    expect(detail?.id).toBe('veh-1');
  });

  it('returns null for unknown vehicle ID or slug', async () => {
    const detail = await store.getVehicleDetail('unknown-vehicle-999');
    expect(detail).toBeNull();
  });

  it('STRICTLY PREVENTS private field leakage (internalNotes, staffOwnerId, etc.)', async () => {
    const detail = await store.getVehicleDetail('veh-1');
    expect(detail).not.toBeNull();
    expect(detail).not.toHaveProperty('internalNotes');
    expect(detail).not.toHaveProperty('staffOwnerId');
    expect(detail).not.toHaveProperty('reservedByEmail');
    expect(detail).not.toHaveProperty('reservedByName');
    expect(detail).not.toHaveProperty('reservedCustomerId');
    expect(detail).not.toHaveProperty('adminComments');
    expect(detail).not.toHaveProperty('priceDomestic');
  });

  it('projects request-price stock cleanly without manufacturing a price', async () => {
    const detail = await store.getVehicleDetail('veh-price-req');
    expect(detail).not.toBeNull();
    expect(detail?.id).toBe('veh-price-req');
    expect(detail?.priceState).toBe('request_price');
    expect(detail?.requestPrice).toBe(true);
    expect(detail?.priceUsd).toBeUndefined();
    expect(detail?.discountedPriceUsd).toBeUndefined();
  });

  it('returns sold vehicle status accurately', async () => {
    const detail = await store.getVehicleDetail('veh-sold');
    expect(detail).not.toBeNull();
    expect(detail?.id).toBe('veh-sold');
    expect(detail?.status).toBe('Sold');
  });

  it('handles missing media scenario gracefully with empty gallery and count 0', async () => {
    const detail = await store.getVehicleDetail('veh-no-media');
    expect(detail).not.toBeNull();
    expect(detail?.id).toBe('veh-no-media');
    expect(detail?.media.gallery).toEqual([]);
    expect(detail?.media.totalPicturesCount).toBe(0);
  });

  it('serves GET /api/v1/vehicles/:idOrSlug via Express app', async () => {
    const app = createMockApiApp(store);
    const server: Server = await new Promise((resolve) => {
      const s = app.listen(0, () => resolve(s));
    });
    const port = (server.address() as { port: number }).port;

    try {
      const res = await fetch(`http://localhost:${port}/api/v1/vehicles/veh-1`);
      expect(res.status).toBe(200);
      const data = (await res.json()) as { id: string; slug: string };
      expect(data.id).toBe('veh-1');
      expect(data.slug).toBe('2021-toyota-corolla-axio-veh-1');

      const res404 = await fetch(`http://localhost:${port}/api/v1/vehicles/non-existent-veh`);
      expect(res404.status).toBe(404);
      const data404 = (await res404.json()) as { statusCode: number };
      expect(data404.statusCode).toBe(404);
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });
});
