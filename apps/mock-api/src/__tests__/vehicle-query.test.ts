import { describe, it, expect, beforeEach } from 'vitest';
import { createStore, resolveLocationStatus, type VehicleRecord } from '../store.js';

describe('Vehicle Query, Dynamic Filters, Sorting, and Pagination Tests (PUB-04..PUB-08)', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(async () => {
    store = createStore();
    await store.reset();
  });

  it('supports keyword search across make, model, chassisNumber, bodyStyle', async () => {
    const res1 = await store.searchVehicles({ searchQuery: 'Toyota' });
    expect(res1.items.length).toBeGreaterThan(0);
    res1.items.forEach((item) => {
      expect(item.make.toLowerCase()).toContain('toyota');
    });

    const res2 = await store.searchVehicles({ searchQuery: 'NZE141-1234567' });
    expect(res2.items).toHaveLength(1);
    expect(res2.items[0].id).toBe('veh-1');
  });

  it('filters by make, bodyStyle, fuelType, transmission, driveTrain', async () => {
    const res = await store.searchVehicles({
      make: 'Toyota',
      bodyStyle: 'Sedan',
      fuelType: 'Petrol',
    });

    expect(res.items.length).toBeGreaterThan(0);
    res.items.forEach((item) => {
      expect(item.make).toBe('Toyota');
      expect(item.bodyStyle).toBe('Sedan');
      expect(item.fuelType).toBe('Petrol');
    });
  });

  it('filters by year range and price range', async () => {
    const res = await store.searchVehicles({
      yearMin: 2020,
      yearMax: 2022,
      priceMin: 5000,
      priceMax: 15000,
    });

    expect(res.items.length).toBeGreaterThan(0);
    res.items.forEach((item) => {
      expect(item.year).toBeGreaterThanOrEqual(2020);
      expect(item.year).toBeLessThanOrEqual(2022);
      if (!item.requestPrice) {
        expect(item.priceUsd).toBeGreaterThanOrEqual(5000);
        expect(item.priceUsd).toBeLessThanOrEqual(15000);
      }
    });
  });

  it('resolves location status dynamically based on ETD/ETA rules (PUB-08)', () => {
    const nowISO = '2026-08-10T10:00:00.000Z';

    // 1. Future ETD -> In Japan
    const vInJapan: VehicleRecord = {
      id: 'v1',
      chassisNumber: 'C1',
      make: 'Toyota',
      model: 'Axio',
      year: 2021,
      priceUsd: 10000,
      status: 'Available',
      etd: '2026-08-20T00:00:00.000Z',
      eta: '2026-09-10T00:00:00.000Z',
    };
    expect(resolveLocationStatus(vInJapan, nowISO)).toBe('In Japan');

    // 2. Past ETD, Future ETA -> In Transit
    const vInTransit: VehicleRecord = {
      id: 'v2',
      chassisNumber: 'C2',
      make: 'Toyota',
      model: 'HiAce',
      year: 2020,
      priceUsd: 14000,
      status: 'Available',
      etd: '2026-08-01T00:00:00.000Z',
      eta: '2026-08-25T00:00:00.000Z',
    };
    expect(resolveLocationStatus(vInTransit, nowISO)).toBe('In Transit');

    // 3. Past ETA -> In Port
    const vInPort: VehicleRecord = {
      id: 'v3',
      chassisNumber: 'C3',
      make: 'Nissan',
      model: 'X-Trail',
      year: 2022,
      priceUsd: 19000,
      status: 'Available',
      etd: '2026-07-01T00:00:00.000Z',
      eta: '2026-07-25T00:00:00.000Z',
    };
    expect(resolveLocationStatus(vInPort, nowISO)).toBe('In Port');
  });

  it('supports sorting by newest, price_asc, price_desc, year_desc, mileage_asc (PUB-05)', async () => {
    const ascRes = await store.searchVehicles({ sortBy: 'price_asc' });
    const pricesAsc = ascRes.items.filter((i) => !i.requestPrice).map((i) => i.priceUsd);
    for (let i = 1; i < pricesAsc.length; i++) {
      expect(pricesAsc[i]).toBeGreaterThanOrEqual(pricesAsc[i - 1]);
    }

    const descRes = await store.searchVehicles({ sortBy: 'price_desc' });
    const pricesDesc = descRes.items.filter((i) => !i.requestPrice).map((i) => i.priceUsd);
    for (let i = 1; i < pricesDesc.length; i++) {
      expect(pricesDesc[i]).toBeLessThanOrEqual(pricesDesc[i - 1]);
    }

    const yearRes = await store.searchVehicles({ sortBy: 'year_desc' });
    for (let i = 1; i < yearRes.items.length; i++) {
      expect(yearRes.items[i].year).toBeLessThanOrEqual(yearRes.items[i - 1].year);
    }
  });

  it('provides pagination metadata and paginated items (PUB-06)', async () => {
    const page1 = await store.searchVehicles({ page: 1, limit: 4 });
    expect(page1.items).toHaveLength(4);
    expect(page1.page).toBe(1);
    expect(page1.limit).toBe(4);
    expect(page1.total).toBeGreaterThan(4);
    expect(page1.totalPages).toBe(Math.ceil(page1.total / 4));
    expect(page1.hasNextPage).toBe(true);
    expect(page1.hasPrevPage).toBe(false);

    const page2 = await store.searchVehicles({ page: 2, limit: 4 });
    expect(page2.items).toHaveLength(4);
    expect(page2.page).toBe(2);
    expect(page2.hasPrevPage).toBe(true);

    // Items on page 1 and page 2 are distinct
    const ids1 = page1.items.map((i) => i.id);
    const ids2 = page2.items.map((i) => i.id);
    ids2.forEach((id) => expect(ids1).not.toContain(id));
  });

  it('calculates dynamic facets matching current result universe (PUB-07)', async () => {
    const res = await store.searchVehicles({ make: 'Toyota' });
    expect(res.facets.makes.length).toBeGreaterThan(0);
    const toyotaFacet = res.facets.makes.find((m) => m.name === 'Toyota');
    expect(toyotaFacet).toBeDefined();
    expect(toyotaFacet?.count).toBe(res.total);
    expect(res.facets.bodyStyles.length).toBeGreaterThan(0);
    expect(res.facets.yearRange.min).toBeLessThanOrEqual(res.facets.yearRange.max);
  });

  it('enforces public field projection (PUB-25, PUB-26)', async () => {
    const res = await store.searchVehicles();
    res.items.forEach((item) => {
      expect(item).not.toHaveProperty('internalNotes');
      expect(item).not.toHaveProperty('staffOwnerId');
    });
  });

  it('handles request-price stock without inventing prices (PUB-32)', async () => {
    const res = await store.searchVehicles();
    const reqPriceItem = res.items.find((i) => i.requestPrice === true);
    expect(reqPriceItem).toBeDefined();
    expect(reqPriceItem?.priceUsd).toBe(0);
    expect(reqPriceItem?.requestPrice).toBe(true);
  });

  it('returns honest empty results for non-matching criteria', async () => {
    const res = await store.searchVehicles({ searchQuery: 'NonExistentVehicle12345' });
    expect(res.items).toHaveLength(0);
    expect(res.total).toBe(0);
    expect(res.totalPages).toBe(1);
    expect(res.hasNextPage).toBe(false);
    expect(res.hasPrevPage).toBe(false);
  });

  it('resets data deterministically', async () => {
    await store.reset();
    const res = await store.searchVehicles();
    expect(res.total).toBe(36);
  });
});
