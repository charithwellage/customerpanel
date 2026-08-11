import { describe, it, expect, beforeEach } from 'vitest';
import type { Server } from 'node:http';
import { createStore, FreightRequestError, resolveFreightRateStatus, buildFreightEstimate } from '../store.js';
import { createMockApiApp } from '../server.js';
import type { FreightDestination, FreightPort, FreightRateRecord } from '@carchief/domain';

// D01-ASM-001: DEC-PUB-FREIGHT-MODEL and DEC-PUB-CITY-DELIVERY are OPEN. This
// task owns only the destination/port/rate lookup layer and the estimate
// request/response contract's deterministic `estimate unavailable — pending
// confirmed rate` outcome. No cubic-volume/freight formula and no computed
// monetary total are implemented or asserted here (RULE-09, RULE-10).

describe('Freight destination, port and rate lookup (PUB-12, D01-ASM-001)', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(async () => {
    store = createStore();
    await store.reset();
  });

  it('lists the supported freight destinations catalog', async () => {
    const destinations = await store.getFreightDestinations();
    expect(destinations.length).toBeGreaterThan(0);
    expect(destinations.map((d) => d.code)).toEqual(expect.arrayContaining(['UG', 'KE', 'TZ', 'RW', 'SS']));
    destinations.forEach((d) => {
      expect(d).toHaveProperty('code');
      expect(d).toHaveProperty('name');
      expect(d).toHaveProperty('country');
    });
  });

  it('lists the supported freight arrival ports catalog', async () => {
    const ports = await store.getFreightPorts();
    expect(ports.length).toBeGreaterThan(0);
    expect(ports.map((p) => p.code)).toEqual(expect.arrayContaining(['MBA', 'DAR']));
  });

  describe('estimate unavailable — pending confirmed rate (D01-ASM-001)', () => {
    it('returns the deterministic unavailable outcome for a destination with a valid active rate record', async () => {
      const estimate = await store.getFreightEstimate({ destinationCode: 'UG', portCode: 'MBA' });
      expect(estimate.outcome).toBe('estimate_unavailable_pending_rate');
      expect(estimate.rateStatus).toBe('active');
      expect(estimate.currency).toBe('USD');
      expect(estimate.rateEffectiveFrom).toBeDefined();
      expect(estimate.message).toMatch(/unavailable/i);
      // RULE-09: no fabricated/computed monetary total may ever be present.
      expect(estimate).not.toHaveProperty('total');
      expect(estimate).not.toHaveProperty('totalUsd');
      expect(estimate).not.toHaveProperty('amount');
      expect(estimate).not.toHaveProperty('freightCost');
    });

    it('returns the same unavailable outcome for a destination with a stale (expired) rate record', async () => {
      const estimate = await store.getFreightEstimate({ destinationCode: 'KE', portCode: 'MBA' });
      expect(estimate.outcome).toBe('estimate_unavailable_pending_rate');
      expect(estimate.rateStatus).toBe('stale');
      expect(estimate.rateEffectiveTo).toBeDefined();
      expect(estimate).not.toHaveProperty('total');
    });

    it('returns the same unavailable outcome for a supported destination with no rate record at all', async () => {
      const estimate = await store.getFreightEstimate({ destinationCode: 'RW', portCode: 'MBA' });
      expect(estimate.outcome).toBe('estimate_unavailable_pending_rate');
      expect(estimate.rateStatus).toBe('no_rate');
      expect(estimate.currency).toBeUndefined();
      expect(estimate.rateEffectiveFrom).toBeUndefined();
      expect(estimate).not.toHaveProperty('total');
    });

    it('is deterministic and distinguishable from an error and from a zero figure across every supported destination', async () => {
      const destinations = await store.getFreightDestinations();
      const ports = await store.getFreightPorts();
      for (const destination of destinations) {
        for (const port of ports) {
          const estimate = await store.getFreightEstimate({ destinationCode: destination.code, portCode: port.code });
          expect(estimate.outcome).toBe('estimate_unavailable_pending_rate');
          expect(['active', 'stale', 'no_rate']).toContain(estimate.rateStatus);
          expect(estimate).not.toHaveProperty('total');
        }
      }
    });
  });

  describe('invalid dimensions', () => {
    it('rejects a non-positive dimension with a field-associated validation error', async () => {
      await expect(
        store.getFreightEstimate({
          destinationCode: 'UG',
          portCode: 'MBA',
          dimensions: { lengthMm: 0, widthMm: 1800, heightMm: 1500 },
        })
      ).rejects.toMatchObject({ statusCode: 400, field: 'dimensions.lengthMm' });
    });

    it('rejects a negative dimension', async () => {
      await expect(
        store.getFreightEstimate({
          destinationCode: 'UG',
          portCode: 'MBA',
          dimensions: { lengthMm: 4500, widthMm: -10, heightMm: 1500 },
        })
      ).rejects.toBeInstanceOf(FreightRequestError);
    });
  });

  describe('unsupported destination', () => {
    it('rejects an unknown destination code, distinct from a supported destination with no rate', async () => {
      await expect(store.getFreightEstimate({ destinationCode: 'ZZ', portCode: 'MBA' })).rejects.toMatchObject({
        statusCode: 400,
        field: 'destinationCode',
      });
    });

    it('rejects an unknown port code', async () => {
      await expect(store.getFreightEstimate({ destinationCode: 'UG', portCode: 'ZZZ' })).rejects.toMatchObject({
        statusCode: 400,
        field: 'portCode',
      });
    });
  });

  describe('resolveFreightRateStatus (rate lookup fixtures)', () => {
    const destinations: FreightDestination[] = [{ code: 'UG', name: 'Uganda', country: 'Uganda' }];
    const ports: FreightPort[] = [{ code: 'MBA', name: 'Mombasa', country: 'Kenya' }];

    it('valid-rate-record: an open-ended effective rate resolves to active', () => {
      const records: FreightRateRecord[] = [
        { destinationCode: 'UG', portCode: 'MBA', currency: 'USD', amount: 950, effectiveFrom: '2026-06-01T00:00:00.000Z' },
      ];
      const result = resolveFreightRateStatus(records, 'UG', 'MBA', '2026-08-10T10:00:00.000Z');
      expect(result.status).toBe('active');
      expect(result.record?.amount).toBe(950);
    });

    it('no-rate: no matching record resolves to no_rate', () => {
      const result = resolveFreightRateStatus([], 'UG', 'MBA', '2026-08-10T10:00:00.000Z');
      expect(result.status).toBe('no_rate');
      expect(result.record).toBeUndefined();
    });

    it('stale-rate: a record whose effectiveTo has passed resolves to stale', () => {
      const records: FreightRateRecord[] = [
        {
          destinationCode: 'UG',
          portCode: 'MBA',
          currency: 'USD',
          amount: 400,
          effectiveFrom: '2025-01-01T00:00:00.000Z',
          effectiveTo: '2026-01-01T00:00:00.000Z',
        },
      ];
      const result = resolveFreightRateStatus(records, 'UG', 'MBA', '2026-08-10T10:00:00.000Z');
      expect(result.status).toBe('stale');
    });

    it('a future-dated rate that has not started yet resolves to no_rate', () => {
      const records: FreightRateRecord[] = [
        { destinationCode: 'UG', portCode: 'MBA', currency: 'USD', amount: 950, effectiveFrom: '2027-01-01T00:00:00.000Z' },
      ];
      const result = resolveFreightRateStatus(records, 'UG', 'MBA', '2026-08-10T10:00:00.000Z');
      expect(result.status).toBe('no_rate');
    });

    it('buildFreightEstimate never surfaces the record amount on the response contract', () => {
      const records: FreightRateRecord[] = [
        { destinationCode: 'UG', portCode: 'MBA', currency: 'USD', amount: 950, effectiveFrom: '2026-06-01T00:00:00.000Z' },
      ];
      const estimate = buildFreightEstimate(destinations, ports, records, { destinationCode: 'UG', portCode: 'MBA' });
      expect(estimate).not.toHaveProperty('amount');
      expect(JSON.stringify(estimate)).not.toContain('950');
    });
  });

  describe('HTTP contract via Express app', () => {
    it('serves GET /api/v1/freight/destinations and /api/v1/freight/ports', async () => {
      const app = createMockApiApp(store);
      const server: Server = await new Promise((resolve) => {
        const s = app.listen(0, () => resolve(s));
      });
      const port = (server.address() as { port: number }).port;

      try {
        const destRes = await fetch(`http://localhost:${port}/api/v1/freight/destinations`);
        expect(destRes.status).toBe(200);
        const destinations = (await destRes.json()) as FreightDestination[];
        expect(destinations.length).toBeGreaterThan(0);

        const portRes = await fetch(`http://localhost:${port}/api/v1/freight/ports`);
        expect(portRes.status).toBe(200);
        const ports = (await portRes.json()) as FreightPort[];
        expect(ports.length).toBeGreaterThan(0);
      } finally {
        await new Promise((resolve) => server.close(resolve));
      }
    });

    it('serves POST /api/v1/freight/estimate returning the unavailable outcome for a valid request', async () => {
      const app = createMockApiApp(store);
      const server: Server = await new Promise((resolve) => {
        const s = app.listen(0, () => resolve(s));
      });
      const port = (server.address() as { port: number }).port;

      try {
        const res = await fetch(`http://localhost:${port}/api/v1/freight/estimate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ destinationCode: 'UG', portCode: 'MBA' }),
        });
        expect(res.status).toBe(200);
        const data = (await res.json()) as { outcome: string; rateStatus: string };
        expect(data.outcome).toBe('estimate_unavailable_pending_rate');
        expect(data.rateStatus).toBe('active');
        expect(data).not.toHaveProperty('total');
      } finally {
        await new Promise((resolve) => server.close(resolve));
      }
    });

    it('serves POST /api/v1/freight/estimate returning a 400 with a field for an unsupported destination', async () => {
      const app = createMockApiApp(store);
      const server: Server = await new Promise((resolve) => {
        const s = app.listen(0, () => resolve(s));
      });
      const port = (server.address() as { port: number }).port;

      try {
        const res = await fetch(`http://localhost:${port}/api/v1/freight/estimate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ destinationCode: 'ZZ', portCode: 'MBA' }),
        });
        expect(res.status).toBe(400);
        const data = (await res.json()) as { statusCode: number; message: string; correlationId: string; field?: string };
        expect(data.statusCode).toBe(400);
        expect(data.field).toBe('destinationCode');
        expect(data.correlationId).toBeDefined();
      } finally {
        await new Promise((resolve) => server.close(resolve));
      }
    });

    it('serves POST /api/v1/freight/estimate returning a 400 for invalid dimensions', async () => {
      const app = createMockApiApp(store);
      const server: Server = await new Promise((resolve) => {
        const s = app.listen(0, () => resolve(s));
      });
      const port = (server.address() as { port: number }).port;

      try {
        const res = await fetch(`http://localhost:${port}/api/v1/freight/estimate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            destinationCode: 'UG',
            portCode: 'MBA',
            dimensions: { lengthMm: -1, widthMm: 1800, heightMm: 1500 },
          }),
        });
        expect(res.status).toBe(400);
        const data = (await res.json()) as { field?: string };
        expect(data.field).toBe('dimensions.lengthMm');
      } finally {
        await new Promise((resolve) => server.close(resolve));
      }
    });
  });
});
