import { describe, it, expect } from 'vitest';
import { parseUrlSearchQuery, serializeSearchQuery } from '@carchief/vehicle-search';
import type { SearchVehiclesQuery } from '@carchief/domain';

describe('GlobalSearch and Navigation Filter Contract Tests (D02-P14-T002)', () => {
  it('serializes and parses make, year, price, mileage, discount, and keyword correctly', () => {
    const query: SearchVehiclesQuery = {
      searchQuery: 'Toyota Prado',
      make: 'Toyota',
      model: 'Prado',
      yearMin: 2018,
      yearMax: 2024,
      priceMin: 15000,
      priceMax: 45000,
      mileageMax: 80000,
      discountMin: 10,
      category: 'clearance',
    };

    const params = serializeSearchQuery(query);
    const queryString = params.toString();

    expect(queryString).toContain('searchQuery=Toyota+Prado');
    expect(queryString).toContain('make=Toyota');
    expect(queryString).toContain('model=Prado');
    expect(queryString).toContain('yearMin=2018');
    expect(queryString).toContain('yearMax=2024');
    expect(queryString).toContain('priceMin=15000');
    expect(queryString).toContain('priceMax=45000');
    expect(queryString).toContain('mileageMax=80000');
    expect(queryString).toContain('discountMin=10');
    expect(queryString).toContain('category=clearance');

    // Round-trip parse back from URLSearchParams
    const parsed = parseUrlSearchQuery(params);
    expect(parsed.searchQuery).toBe('Toyota Prado');
    expect(parsed.make).toBe('Toyota');
    expect(parsed.model).toBe('Prado');
    expect(parsed.yearMin).toBe(2018);
    expect(parsed.yearMax).toBe(2024);
    expect(parsed.priceMin).toBe(15000);
    expect(parsed.priceMax).toBe(45000);
    expect(parsed.mileageMax).toBe(80000);
    expect(parsed.discountMin).toBe(10);
    expect(parsed.category).toBe('clearance');
  });

  it('omits empty, null, or undefined filter parameters cleanly', () => {
    const query: SearchVehiclesQuery = {
      make: 'Honda',
      searchQuery: '',
      yearMin: undefined,
    };

    const params = serializeSearchQuery(query);
    expect(params.get('make')).toBe('Honda');
    expect(params.has('searchQuery')).toBe(false);
    expect(params.has('yearMin')).toBe(false);
    expect(params.has('discountMin')).toBe(false);
  });
});
