import { describe, it, expect } from 'vitest';
import { CUSTOMER_FEATURE_REGISTRY, validateCustomerFeatureRegistry } from '../index.js';

describe('Customer Feature Ownership Registry Unit Tests', () => {
  it('registers all 8 required Customer Application feature slots', () => {
    const keys = Object.keys(CUSTOMER_FEATURE_REGISTRY);
    expect(keys).toContain('dashboard');
    expect(keys).toContain('inventory');
    expect(keys).toContain('vehicles');
    expect(keys).toContain('invoices');
    expect(keys).toContain('payments');
    expect(keys).toContain('shipments');
    expect(keys).toContain('documents');
    expect(keys).toContain('profile');
  });

  it('verifies non-overlapping ownership for routes, APIs, fixtures, and specs', () => {
    const validation = validateCustomerFeatureRegistry();
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
    expect(validation.totalFeatures).toBe(8);
  });

  it('ensures each feature record contains phase, title, route, openapi, and spec paths', () => {
    for (const record of Object.values(CUSTOMER_FEATURE_REGISTRY)) {
      expect(record.id).toBeTruthy();
      expect(record.phase).toMatch(/^Phase 2\.\d+$/);
      expect(record.title).toBeTruthy();
      expect(record.routePath).toMatch(/^\/[a-z]+$/);
      expect(record.openapiPrefix).toMatch(/^\/api\/v1\/customer\/[a-z]+$/);
      expect(record.mockApiPrefix).toMatch(/^\/api\/v1\/customer\/[a-z]+$/);
      expect(record.fixtureNamespace).toMatch(/^customer_[a-z]+$/);
      expect(record.e2eSpecPath).toMatch(/^tests\/e2e\/customer\/[a-z]+\.spec\.ts$/);
    }
  });
});
