import { describe, expect, it } from 'vitest';
import { resolveCustomerScope } from '../auth/customer-scope.js';

describe('customer scope resolution', () => {
  it('maps the legacy seeded fixture subject to the canonical seeded customer', () => {
    expect(resolveCustomerScope('user-123')).toBe('cust-123');
  });

  it('resolves a registered account subject to its own customer id', () => {
    expect(resolveCustomerScope('cust-9001')).toBe('cust-9001');
  });

  it('preserves other subjects for server-side ownership checks', () => {
    expect(resolveCustomerScope('customer-other')).toBe('customer-other');
  });
});
