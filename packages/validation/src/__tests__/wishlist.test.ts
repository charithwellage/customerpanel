/**
 * Schema boundary tests for `wishlistToggleSchema` (D02-P13-T005, CUST-36).
 */
import { describe, it, expect } from 'vitest';
import { wishlistToggleSchema } from '../index.js';

describe('wishlistToggleSchema', () => {
  it('accepts a valid vehicle slug', () => {
    const result = wishlistToggleSchema.safeParse({ vehicleSlug: 'toyota-corolla-2020-123' });
    expect(result.success).toBe(true);
  });

  it('requires vehicleSlug', () => {
    const result = wishlistToggleSchema.safeParse({ vehicleSlug: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === 'vehicleSlug')).toBe(true);
    }
  });

  it('rejects a missing vehicleSlug field', () => {
    const result = wishlistToggleSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('trims whitespace from vehicleSlug', () => {
    const result = wishlistToggleSchema.safeParse({ vehicleSlug: '  toyota-corolla-2020  ' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.vehicleSlug).toBe('toyota-corolla-2020');
    }
  });
});
