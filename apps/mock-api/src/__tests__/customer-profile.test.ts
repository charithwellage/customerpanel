import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Server } from 'node:http';
import { createDemoJwtToken } from '@carchief/domain';
import { createMockApiApp } from '../server.js';
import { createStore } from '../store.js';

describe('Customer profile contract (D02-P08-T004)', () => {
  let server: Server | undefined;
  let baseUrl = '';
  const headers = (customerId = 'user-123') => ({ Authorization: `Bearer ${createDemoJwtToken('CustomerBuyer', customerId)}` });

  beforeEach(async () => {
    const app = createMockApiApp(createStore(''));
    server = await new Promise<Server>((resolve) => { const instance = app.listen(0, '127.0.0.1', () => resolve(instance)); });
    baseUrl = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  });
  afterEach(async () => {
    server?.closeAllConnections?.();
    if (server) await new Promise<void>((resolve) => server?.close(() => resolve()));
  });

  it('returns fixed identity and editable contact fields only for the owner', async () => {
    const response = await fetch(`${baseUrl}/api/v1/customer/profile`, { headers: headers() });
    expect(response.status).toBe(200);
    const profile = await response.json();
    expect(profile).toMatchObject({ customerId: 'cust-123', name: 'user', email: 'user@carchief.com', companyName: 'CarChief Demo Customer' });
    expect(profile).not.toHaveProperty('password');
    expect((await fetch(`${baseUrl}/api/v1/customer/profile`, { headers: headers('cust-unknown-001') })).status).toBe(404);
  });

  it('validates contact fields, persists updates, protects fixed identity and detects version conflicts', async () => {
    const initial = await (await fetch(`${baseUrl}/api/v1/customer/profile`, { headers: headers() })).json();
    const invalid = await fetch(`${baseUrl}/api/v1/customer/profile`, { method: 'PUT', headers: { ...headers(), 'Content-Type': 'application/json' }, body: JSON.stringify({ companyName: '', phone: 'bad', deliveryAddress: 'x' }) });
    expect(invalid.status).toBe(400);
    const updated = await fetch(`${baseUrl}/api/v1/customer/profile`, { method: 'PUT', headers: { ...headers(), 'Content-Type': 'application/json', 'x-mock-now': '2026-08-15T00:00:00.000Z' }, body: JSON.stringify({ companyName: 'Updated Demo Co', phone: '+1 555 0199', deliveryAddress: '99 Updated Road', expectedVersion: initial.version, name: 'Attacker', email: 'attacker@example.com' }) });
    expect(updated.status).toBe(200);
    expect(await updated.json()).toMatchObject({ name: 'user', email: 'user@carchief.com', companyName: 'Updated Demo Co', version: initial.version + 1 });
    const conflict = await fetch(`${baseUrl}/api/v1/customer/profile`, { method: 'PUT', headers: { ...headers(), 'Content-Type': 'application/json' }, body: JSON.stringify({ companyName: 'Conflict', phone: '+1 555 0100', deliveryAddress: 'Conflict address', expectedVersion: initial.version }) });
    expect(conflict.status).toBe(409);
  });

  it('requires customer authorization and resets deterministic profile data', async () => {
    expect((await fetch(`${baseUrl}/api/v1/customer/profile`)).status).toBe(401);
    expect((await fetch(`${baseUrl}/api/v1/customer/profile`, { headers: { Authorization: `Bearer ${createDemoJwtToken('PublicVisitor')}` } })).status).toBe(403);
    await fetch(`${baseUrl}/api/v1/__reset`, { method: 'POST' });
    const profile = await (await fetch(`${baseUrl}/api/v1/customer/profile`, { headers: headers() })).json();
    expect(profile.companyName).toBe('CarChief Demo Customer');
    expect(profile.version).toBe(1);
  });
});
