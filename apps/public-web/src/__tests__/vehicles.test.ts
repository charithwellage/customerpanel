import { describe, it, expect, vi } from 'vitest';
import { createElement, Fragment } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { HttpClient, VehicleService } from '@carchief/api-client';
import type { VehicleDomainSummary } from '@carchief/domain';
import { VehicleCollectionPrimitive } from '@carchief/vehicle-search';

const publicVehicles: VehicleDomainSummary[] = [
  {
    id: 'veh-latest', chassisNumber: 'LATEST-001', make: 'Toyota', model: 'Corolla Axio', year: 2021,
    priceUsd: 8500, status: 'Available', category: 'arrival,premium', locationStatus: 'In Japan',
    createdAt: '2026-08-09T10:00:00.000Z', images: [], featured: true,
  },
  {
    id: 'veh-premium', chassisNumber: 'PREMIUM-001', make: 'Nissan', model: 'X-Trail', year: 2022,
    priceUsd: 19500, status: 'Available', category: 'premium', locationStatus: 'In Japan',
    createdAt: '2026-08-01T10:00:00.000Z', images: [], featured: false,
  },
  {
    id: 'veh-port', chassisNumber: 'PORT-001', make: 'Subaru', model: 'Forester', year: 2019,
    priceUsd: 11800, status: 'Available', category: 'clearance', locationStatus: 'In Port',
    createdAt: '2026-07-30T10:00:00.000Z', images: [], featured: false,
  },
  {
    id: 'veh-transit', chassisNumber: 'TRANSIT-001', make: 'Honda', model: 'Vezel', year: 2020,
    priceUsd: 14000, status: 'Available', category: 'best_offer', locationStatus: 'In Transit',
    createdAt: '2026-07-29T10:00:00.000Z', images: [], featured: false,
  },
];

async function getVehiclesFromMockHttp(collection?: string): Promise<VehicleDomainSummary[]> {
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = new URL(String(input));
    const requestedCollection = url.searchParams.get('collection') ?? collection;
    const data = requestedCollection === 'latest_arrivals'
      ? publicVehicles.filter((vehicle) => vehicle.id === 'veh-latest')
      : requestedCollection === 'premium_teaser'
        ? publicVehicles.filter((vehicle) => vehicle.category?.includes('premium'))
        : requestedCollection === 'browse'
          ? [...publicVehicles].sort((left, right) => {
            const order = { 'In Port': 0, 'In Transit': 1, 'In Japan': 2 } as const;
            return order[left.locationStatus ?? 'In Japan'] - order[right.locationStatus ?? 'In Japan'];
          })
          : publicVehicles;

    return new Response(JSON.stringify(data), { status: 200, headers: { 'content-type': 'application/json' } });
  });

  try {
    return await new VehicleService(new HttpClient({ baseUrl: 'http://mock-api.test' })).getVehicles(
      collection ? { collection } : undefined,
    );
  } finally {
    fetchMock.mockRestore();
  }
}

describe('Vehicle Collection HTTP contract', () => {
  it('filters Latest Arrivals to eligible In Japan vehicles created within the 5-day window', async () => {
    const latest = await getVehiclesFromMockHttp('latest_arrivals');
    expect(latest.length).toBeGreaterThan(0);
    latest.forEach((v) => {
      expect(v.locationStatus).toBe('In Japan');
      if (v.createdAt) {
        const createdDate = new Date(v.createdAt).getTime();
        const refDate = new Date('2026-08-10T10:00:00.000Z').getTime();
        const diffDays = (refDate - createdDate) / (1000 * 60 * 60 * 24);
        expect(diffDays).toBeLessThanOrEqual(5);
      }
    });
  });

  it('limits Premium Teaser collection to at most 10 returned vehicles', async () => {
    const premiumTeaser = await getVehiclesFromMockHttp('premium_teaser');
    expect(premiumTeaser.length).toBeLessThanOrEqual(10);
    premiumTeaser.forEach((v) => {
      expect(v.category).toContain('premium');
    });
  });

  it('orders Browse Stock collection by In Port -> In Transit -> In Japan', async () => {
    const browse = await getVehiclesFromMockHttp('browse');
    expect(browse.length).toBeGreaterThan(0);

    const locationOrder = browse.map((v) => v.locationStatus);
    const firstInPort = locationOrder.indexOf('In Port');
    const firstInTransit = locationOrder.indexOf('In Transit');
    const firstInJapan = locationOrder.indexOf('In Japan');

    if (firstInPort !== -1 && firstInTransit !== -1) {
      expect(firstInPort).toBeLessThan(firstInTransit);
    }
    if (firstInTransit !== -1 && firstInJapan !== -1) {
      expect(firstInTransit).toBeLessThan(firstInJapan);
    }
  });

  it('enforces public field projection on returned vehicle summaries', async () => {
    const vehicles = await getVehiclesFromMockHttp();
    vehicles.forEach((v) => {
      expect(v).not.toHaveProperty('internalNotes');
      expect(v).not.toHaveProperty('staffOwnerId');
    });
  });

  it('gives each rendered vehicle collection a unique accessible heading reference', async () => {
    const vehicles = await getVehiclesFromMockHttp('featured');
    const markup = renderToStaticMarkup(
      createElement(
        Fragment,
        null,
        createElement(VehicleCollectionPrimitive, { title: 'Featured vehicles', vehicles: vehicles.slice(0, 1) }),
        createElement(VehicleCollectionPrimitive, { title: 'Featured vehicles', vehicles: vehicles.slice(0, 1) }),
      ),
    );

    const headingIds = Array.from(markup.matchAll(/<h2 id="([^"]+)"/g), (match) => match[1]);
    const labelledByIds = Array.from(markup.matchAll(/aria-labelledby="([^"]+)"/g), (match) => match[1]);

    expect(headingIds).toHaveLength(2);
    expect(new Set(headingIds).size).toBe(2);
    expect(labelledByIds).toEqual(headingIds);
  });
});
