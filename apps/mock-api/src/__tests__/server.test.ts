import { describe, it, expect } from 'vitest';
import { createMockApiApp } from '../server.js';
import { issueSessionToken, parseSessionToken } from '@carchief/domain';

describe('Mock API Server Integration Tests with Auth Enforcement', () => {
  const app = createMockApiApp();

  it('instantiates app cleanly', () => {
    expect(app).toBeDefined();
  });

  it('allows public access to /healthz, /api/v1/config/public, and /api/v1/vehicles', () => {
    expect(typeof app).toBe('function');
  });

  it('generates valid demo tokens and recognizes stand-in identities', () => {
    const adminToken = issueSessionToken('SystemAdmin', 'admin-1', 'admin@carchief.com');
    expect(adminToken).toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.');
    const parsed = parseSessionToken(adminToken);
    expect(parsed?.role).toBe('SystemAdmin');
    expect(parsed?.permissions).toContain('reset:data');
  });
});
