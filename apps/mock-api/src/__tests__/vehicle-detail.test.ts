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

  it('returns null for unknown vehicle ID or slug', async () => {
    const detail = await store.getVehicleDetail('unknown-vehicle-999');
    expect(detail).toBeNull();
  });

  it('does not resolve an arbitrary string that merely ends with a known vehicle id', async () => {
    // A suffix fallback here would mint unlimited duplicate public URLs for one
    // vehicle, each able to declare itself canonical (PUB-10, PUB-11).
    for (const fabricated of [
      'custom-renamed-title-veh-1',
      'totally-bogus-junk-veh-1',
      'XYZ-veh-1',
      '-veh-1',
    ]) {
      expect(await store.getVehicleDetail(fabricated)).toBeNull();
    }
  });

  it('resolves only the exact id, chassis number and canonical slug', async () => {
    const byId = await store.getVehicleDetail('veh-1');
    const byChassis = await store.getVehicleDetail('NZE141-1234567');
    const bySlug = await store.getVehicleDetail('2021-toyota-corolla-axio-veh-1');

    expect(byId?.id).toBe('veh-1');
    expect(byChassis?.id).toBe('veh-1');
    expect(bySlug?.id).toBe('veh-1');
    expect(bySlug?.slug).toBe('2021-toyota-corolla-axio-veh-1');
  });

  it('does not re-label gallery images as an uncategorized media category', async () => {
    const detail = await store.getVehicleDetail('veh-1');
    expect(detail?.media.gallery.length).toBeGreaterThan(0);
    expect(detail?.media.japanPictures).toEqual([]);
    expect(detail?.media.auctionPictures).toEqual([]);
    expect(detail?.media.durbanPictures).toEqual([]);
    expect(detail?.media.showJapanPictures).toBe(false);
    expect(detail?.media.showAuctionPictures).toBe(false);
    expect(detail?.media.showDurbanPictures).toBe(false);
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
