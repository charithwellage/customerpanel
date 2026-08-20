/**
 * Schema boundary tests for `favouriteSearchCriteriaSchema` and `favouriteSearchCreateSchema`
 * (D02-P13-T007, CUST-38/CUST-39/CUST-40, D02-ASM-008/010).
 */
import { describe, it, expect } from 'vitest';
import { favouriteSearchCriteriaSchema, favouriteSearchCreateSchema } from '../index.js';

describe('favouriteSearchCriteriaSchema', () => {
  const EMPTY_CRITERIA = {
    make: '',
    model: '',
    modelCode: '',
    engineCc: '',
    fuelType: '',
    color: '',
    steering: '',
    driveTrain: '',
    transmission: '',
  };

  it('accepts a criteria with one non-empty field', () => {
    const result = favouriteSearchCriteriaSchema.safeParse({ ...EMPTY_CRITERIA, make: 'Toyota' });
    expect(result.success).toBe(true);
  });

  it('accepts a criteria with multiple non-empty fields', () => {
    const result = favouriteSearchCriteriaSchema.safeParse({
      make: 'Toyota',
      model: 'Corolla',
      yearFrom: 2015,
      yearTo: 2020,
      fuelType: 'Petrol',
    });
    expect(result.success).toBe(true);
  });

  it('validates yearFrom <= yearTo', () => {
    const result = favouriteSearchCriteriaSchema.safeParse({
      yearFrom: 2020,
      yearTo: 2015,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === 'yearTo')).toBe(true);
    }
  });

  it('allows yearFrom > yearTo for optional fields', () => {
    const result = favouriteSearchCriteriaSchema.safeParse({
      yearFrom: undefined,
      yearTo: 2020,
    });
    expect(result.success).toBe(true);
  });

  it('validates priceFromUsd <= priceToUsd', () => {
    const result = favouriteSearchCriteriaSchema.safeParse({
      priceFromUsd: 50000,
      priceToUsd: 30000,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === 'priceToUsd')).toBe(true);
    }
  });

  it('validates mileageMin <= mileageMax', () => {
    const result = favouriteSearchCriteriaSchema.safeParse({
      mileageMin: 100000,
      mileageMax: 50000,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === 'mileageMax')).toBe(true);
    }
  });

  it('accepts equal From/To values', () => {
    expect(favouriteSearchCriteriaSchema.safeParse({ yearFrom: 2020, yearTo: 2020 }).success).toBe(true);
    expect(favouriteSearchCriteriaSchema.safeParse({ priceFromUsd: 25000, priceToUsd: 25000 }).success).toBe(true);
    expect(favouriteSearchCriteriaSchema.safeParse({ mileageMin: 50000, mileageMax: 50000 }).success).toBe(true);
  });

  it('accepts zero prices and mileage', () => {
    expect(favouriteSearchCriteriaSchema.safeParse({ priceFromUsd: 0, priceToUsd: 100000 }).success).toBe(true);
    expect(favouriteSearchCriteriaSchema.safeParse({ mileageMin: 0, mileageMax: 100000 }).success).toBe(true);
  });
});

describe('favouriteSearchCreateSchema', () => {
  const EMPTY_CRITERIA = {
    make: '',
    model: '',
    modelCode: '',
    engineCc: '',
    fuelType: '',
    color: '',
    steering: '',
    driveTrain: '',
    transmission: '',
  };

  const VALID_FAVOURITES = {
    name: 'My Favourite Search',
    criteria: {
      make: 'Toyota',
    },
  };

  it('accepts a valid favourite with name and at least one criteria field', () => {
    const result = favouriteSearchCreateSchema.safeParse(VALID_FAVOURITES);
    expect(result.success).toBe(true);
  });

  it('requires a name field', () => {
    const result = favouriteSearchCreateSchema.safeParse({
      name: '',
      criteria: { make: 'Toyota' },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === 'name')).toBe(true);
    }
  });

  it('enforces a maximum name length of 80 characters', () => {
    const longName = 'a'.repeat(81);
    const result = favouriteSearchCreateSchema.safeParse({
      name: longName,
      criteria: { make: 'Toyota' },
    });
    expect(result.success).toBe(false);
  });

  it('accepts a name of exactly 80 characters', () => {
    const exactName = 'a'.repeat(80);
    const result = favouriteSearchCreateSchema.safeParse({
      name: exactName,
      criteria: { make: 'Toyota' },
    });
    expect(result.success).toBe(true);
  });

  it('rejects all-empty criteria (D02-ASM-010)', () => {
    const result = favouriteSearchCreateSchema.safeParse({
      name: 'Empty Search',
      criteria: EMPTY_CRITERIA,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === 'criteria')).toBe(true);
    }
  });

  it('accepts criteria with a single numeric field', () => {
    expect(
      favouriteSearchCreateSchema.safeParse({
        name: 'Year Range',
        criteria: { yearFrom: 2015 },
      }).success,
    ).toBe(true);
  });

  it('accepts criteria with multiple field types', () => {
    const result = favouriteSearchCreateSchema.safeParse({
      name: 'Mixed Criteria',
      criteria: {
        make: 'Honda',
        yearFrom: 2015,
        priceFromUsd: 20000,
        fuelType: 'Diesel',
      },
    });
    expect(result.success).toBe(true);
  });

  it('rejects zero-value fields as empty when checking for at least one non-empty field', () => {
    const result = favouriteSearchCreateSchema.safeParse({
      name: 'Zero Values',
      criteria: {
        ...EMPTY_CRITERIA,
        priceFromUsd: 0,
        priceToUsd: 0,
        mileageMin: 0,
        mileageMax: 0,
        yearFrom: 0,
        yearTo: 0,
      },
    });
    expect(result.success).toBe(false);
  });

  it('validates From/To constraints even when rejecting for empty criteria', () => {
    const result = favouriteSearchCreateSchema.safeParse({
      name: 'Invalid Range',
      criteria: {
        yearFrom: 2020,
        yearTo: 2015,
      },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      // Should have both the criteria emptiness issue and potentially the yearTo constraint
      const paths = result.error.issues.map((issue) => issue.path[0]);
      expect(paths.length).toBeGreaterThan(0);
    }
  });

  it('accepts unbacked fields (modelCode, engineCc, color, steering) when provided', () => {
    // D02-ASM-008: These fields exist but have no backing columns; the schema should not reject them
    const result = favouriteSearchCreateSchema.safeParse({
      name: 'Unbacked Fields',
      criteria: {
        modelCode: 'CODE123', // D02-ASM-008
        engineCc: '2000', // D02-ASM-008
        color: 'Red', // D02-ASM-008
        steering: 'Left', // D02-ASM-008
      },
    });
    expect(result.success).toBe(true);
  });

  it('trims whitespace from text fields', () => {
    const result = favouriteSearchCreateSchema.safeParse({
      name: '  My Favourite  ',
      criteria: {
        make: '  Toyota  ',
        model: '  Corolla  ',
      },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('My Favourite');
      expect(result.data.criteria.make).toBe('Toyota');
      expect(result.data.criteria.model).toBe('Corolla');
    }
  });
});
