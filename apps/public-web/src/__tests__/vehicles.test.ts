import { describe, it, expect } from 'vitest';
import { createElement, Fragment } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createStore } from '../../../mock-api/src/store.js';
import { VehicleCollectionPrimitive } from '@carchief/vehicle-search';

describe('Vehicle Collection & Mock Store Tests', () => {
  it('filters Latest Arrivals to eligible In Japan vehicles created within the 5-day window', async () => {
    const store = createStore();
    const latest = await store.getVehicles({ collection: 'latest_arrivals' });
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
    const store = createStore();
    const premiumTeaser = await store.getVehicles({ collection: 'premium_teaser' });
    expect(premiumTeaser.length).toBeLessThanOrEqual(10);
    premiumTeaser.forEach((v) => {
      expect(v.category).toContain('premium');
    });
  });

  it('orders Browse Stock collection by In Port -> In Transit -> In Japan', async () => {
    const store = createStore();
    const browse = await store.getVehicles({ collection: 'browse' });
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
    const store = createStore();
    const vehicles = await store.getVehicles();
    vehicles.forEach((v) => {
      expect(v).not.toHaveProperty('internalNotes');
      expect(v).not.toHaveProperty('staffOwnerId');
    });
  });

  it('gives each rendered vehicle collection a unique accessible heading reference', async () => {
    const store = createStore();
    const vehicles = await store.getVehicles({ collection: 'featured' });
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
