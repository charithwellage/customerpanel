import { describe, expect, it } from 'vitest';
import { resolveDemoCustomerScope } from '../auth/customer-scope.js';

describe('demo customer scope resolution', () => {
  it('maps the signed demo subject to the canonical seeded customer', () => {
    expect(resolveDemoCustomerScope('user-123')).toBe('cust-123');
  });

  it('preserves non-demo subjects for server-side ownership checks', () => {
    expect(resolveDemoCustomerScope('customer-other')).toBe('customer-other');
  });
});
