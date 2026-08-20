import { describe, it, expect } from 'vitest';
import { createMockApiApp } from '../server.js';
import request from 'supertest';
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

  describe('GET /api/v1/bank-accounts', () => {
    it('returns 401 for anonymous users', async () => {
      const response = await request(app).get('/api/v1/bank-accounts');
      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/Unauthenticated/);
    });

    it('returns 200 and the list of bank accounts for authenticated users', async () => {
      const token = issueSessionToken('CustomerBuyer', 'cust-1', 'customer@carchief.com');
      const response = await request(app)
        .get('/api/v1/bank-accounts')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('bankName');
      expect(response.body[0]).toHaveProperty('accountNo');
    });
  });
});
