import { describe, it, expect } from 'vitest';
import { createDemoJwtToken, parseDemoJwtToken, hasPermission } from '../auth.js';

describe('Domain Auth & Stand-in JWT Utilities', () => {
  it('creates and parses demo JWT tokens with claims', () => {
    const token = createDemoJwtToken('Salesperson', 'sales-1', 'sales@carchief.com');
    const claims = parseDemoJwtToken(token);
    expect(claims?.role).toBe('Salesperson');
    expect(claims?.sub).toBe('sales-1');
    expect(claims?.email).toBe('sales@carchief.com');
    expect(claims?.permissions).toContain('read:leads');
  });

  it('checks role permissions correctly', () => {
    expect(hasPermission('PublicVisitor', 'read:public')).toBe(true);
    expect(hasPermission('PublicVisitor', 'reset:data')).toBe(false);
    expect(hasPermission('SystemAdmin', 'reset:data')).toBe(true);
    expect(hasPermission('CustomerBuyer', 'create:reservation')).toBe(true);
  });
});
