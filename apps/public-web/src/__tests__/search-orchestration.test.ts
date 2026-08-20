import { describe, it, expect } from 'vitest';
import { parseNaturalSearchQuery, parseUrlSearchQuery, serializeSearchQuery } from '@carchief/vehicle-search';

describe('Search Orchestration, Deterministic Parser & URL State Tests', () => {
  describe('Deterministic Natural Search Query Parser', () => {
    it('parses make, bodyStyle, and max price from phrase "Toyota SUV under $20,000"', () => {
      const res = parseNaturalSearchQuery('Toyota SUV under $20,000');
      expect(res.parsedParams.make).toBe('Toyota');
      expect(res.parsedParams.bodyStyle).toBe('SUV');
      expect(res.parsedParams.priceMax).toBe(20000);
      expect(res.understoodTokens).toHaveLength(3);
    });

    it('parses fuelType, transmission, and yearMin from phrase "Hybrid automatic after 2020"', () => {
      const res = parseNaturalSearchQuery('Hybrid automatic after 2020');
      expect(res.parsedParams.fuelType).toBe('Hybrid');
      expect(res.parsedParams.transmission).toBe('Automatic');
      expect(res.parsedParams.yearMin).toBe(2020);
      expect(res.understoodTokens).toHaveLength(3);
    });

    it('parses minPrice, driveTrain, and fuelType from phrase "above 10k 4WD Diesel"', () => {
      const res = parseNaturalSearchQuery('above 10k 4WD Diesel');
      expect(res.parsedParams.priceMin).toBe(10000);
      expect(res.parsedParams.driveTrain).toBe('4WD');
      expect(res.parsedParams.fuelType).toBe('Diesel');
    });

    it('assigns remaining unparsed terms as keyword searchQuery without throwing', () => {
      const res = parseNaturalSearchQuery('Subaru Forester turbo red');
      expect(res.parsedParams.make).toBe('Subaru');
      expect(res.parsedParams.searchQuery).toBe('Forester turbo red');
    });

    it('returns empty understoodTokens for blank inputs', () => {
      const res = parseNaturalSearchQuery('   ');
      expect(res.understoodTokens).toHaveLength(0);
      expect(res.parsedParams).toEqual({});
    });
  });

  describe('URL State Serialization and Parsing', () => {
    it('serializes and parses SearchVehiclesQuery roundtrip', () => {
      const originalQuery = {
        make: 'Nissan',
        bodyStyle: 'SUV',
        fuelType: 'Petrol',
        priceMax: 25000,
        yearMin: 2019,
        sortBy: 'price_asc' as const,
        page: 2,
        limit: 12,
      };

      const params = serializeSearchQuery(originalQuery);
      const restored = parseUrlSearchQuery(params);

      expect(restored.make).toBe('Nissan');
      expect(restored.bodyStyle).toBe('SUV');
      expect(restored.fuelType).toBe('Petrol');
      expect(restored.priceMax).toBe(25000);
      expect(restored.yearMin).toBe(2019);
      expect(restored.sortBy).toBe('price_asc');
      expect(restored.page).toBe(2);
    });

    it('preserves market and destinationPort context across URL updates', () => {
      const originalQuery = {
        make: 'Toyota',
        market: 'UG',
        destinationPort: 'Mombasa',
      };

      const params = serializeSearchQuery(originalQuery);
      expect(params.get('market')).toBe('UG');
      expect(params.get('destinationPort')).toBe('Mombasa');

      const restored = parseUrlSearchQuery(params);
      expect(restored.market).toBe('UG');
      expect(restored.destinationPort).toBe('Mombasa');
    });

    it('preserves category and collection parameters across URL updates', () => {
      const originalQuery = {
        category: 'premium',
        collection: 'premium_teaser',
      };

      const params = serializeSearchQuery(originalQuery);
      expect(params.get('category')).toBe('premium');
      expect(params.get('collection')).toBe('premium_teaser');

      const restored = parseUrlSearchQuery(params);
      expect(restored.category).toBe('premium');
      expect(restored.collection).toBe('premium_teaser');
    });

    it('omits default parameters (page=1, sortBy=newest) from URL to keep URLs clean', () => {
      const params = serializeSearchQuery({
        make: 'Toyota',
        page: 1,
        sortBy: 'newest',
      });

      expect(params.has('page')).toBe(false);
      expect(params.has('sortBy')).toBe(false);
      expect(params.get('make')).toBe('Toyota');
    });
  });
});
