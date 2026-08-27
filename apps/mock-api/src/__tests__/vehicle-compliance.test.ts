import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createStore } from '../store.js';
import { createMockApiApp } from '../server.js';
import { issueSessionToken } from '@carchief/domain';

describe('Vehicle Country Compliance & Localization API (D02-P14-T005)', () => {
  let app: ReturnType<typeof createMockApiApp>;
  let store: ReturnType<typeof createStore>;

  beforeEach(async () => {
    store = createStore();
    await store.ready();
    app = createMockApiApp(store);
  });

  describe('GET /api/v1/vehicles with destinationCountry', () => {
    it('filters out vehicles older than 8 years (e.g. < 2018 in 2026) for Kenya', async () => {
      const res = await request(app)
        .get('/api/v1/vehicles')
        .query({ destinationCountry: 'Kenya', limit: 50 });

      expect(res.status).toBe(200);
      expect(res.body.items.length).toBeGreaterThan(0);

      // Every returned vehicle must be compliant with Kenya import rules (>= 2018 and RHD)
      for (const item of res.body.items) {
        expect(item.year).toBeGreaterThanOrEqual(2018);
        expect(item.compliance?.isCompliant).toBe(true);
        expect(item.compliance?.countryCode).toBe('KE');
      }
    });

    it('filters out Left-Hand Drive (LHD) vehicles for Right-Hand Drive countries like Sri Lanka', async () => {
      const res = await request(app)
        .get('/api/v1/vehicles')
        .query({ destinationCountry: 'Sri Lanka', limit: 50 });

      expect(res.status).toBe(200);
      for (const item of res.body.items) {
        expect(item.year).toBeGreaterThanOrEqual(2023); // 3-year rule for Sri Lanka in 2026
        expect(item.compliance?.isCompliant).toBe(true);
        expect(item.compliance?.countryCode).toBe('LK');
      }
    });

    it('filters out Right-Hand Drive (RHD) vehicles for UAE / Dubai (LHD only)', async () => {
      const res = await request(app)
        .get('/api/v1/vehicles')
        .query({ destinationCountry: 'United Arab Emirates', limit: 50 });

      expect(res.status).toBe(200);
      for (const item of res.body.items) {
        expect(item.compliance?.isCompliant).toBe(true);
        expect(item.compliance?.countryCode).toBe('AE');
      }
    });

    it('returns non-compliant vehicles with compliance failure metadata when complianceOnly=false', async () => {
      const res = await request(app)
        .get('/api/v1/vehicles')
        .query({ destinationCountry: 'Kenya', complianceOnly: 'false', limit: 100 });

      expect(res.status).toBe(200);
      const nonCompliantItems = res.body.items.filter((v: any) => v.compliance?.isCompliant === false);
      expect(nonCompliantItems.length).toBeGreaterThan(0);

      const sample = nonCompliantItems[0];
      expect(sample.compliance).toBeDefined();
      expect(sample.compliance.isCompliant).toBe(false);
      expect(sample.compliance.failedCriteria.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/vehicles/:idOrSlug with destinationCountry', () => {
    it('attaches compliance evaluation to vehicle detail response', async () => {
      const res = await request(app)
        .get('/api/v1/vehicles/veh-1')
        .query({ destinationCountry: 'Kenya' });

      expect(res.status).toBe(200);
      expect(res.body.id).toBe('veh-1');
      expect(res.body.compliance).toBeDefined();
      expect(res.body.compliance.countryCode).toBe('KE');
      expect(res.body.compliance.countryName).toBe('Kenya');
      expect(res.body.compliance.isCompliant).toBe(true);
    });
  });
});
