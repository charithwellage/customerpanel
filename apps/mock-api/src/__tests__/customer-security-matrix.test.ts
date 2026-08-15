import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Server } from 'node:http';
import { createDemoJwtToken } from '@carchief/domain';
import { createMockApiApp } from '../server.js';
import { createStore } from '../store.js';

describe('Customer security acceptance matrix (D02-P09-T002)', () => {
  let server: Server | undefined;
  let baseUrl = '';

  beforeEach(async () => {
    const app = createMockApiApp(createStore(''));
    server = await new Promise<Server>((resolve) => {
      const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
    });
    baseUrl = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  });

  afterEach(async () => {
    server?.closeAllConnections?.();
    if (server) await new Promise<void>((resolve) => server?.close(() => resolve()));
  });

  const headers = (customerId: string) => ({
    Authorization: `Bearer ${createDemoJwtToken('CustomerBuyer', customerId)}`,
  });

  it('never returns another customer’s vehicle, invoice, shipment, document, payment, notification, or profile', async () => {
    const foreign = headers('cust-exception-001');
    const ownedResources = [
      '/api/v1/customer/vehicles/veh-1',
      '/api/v1/customer/invoices/inv-001',
      '/api/v1/customer/shipments/ship-001',
      '/api/v1/customer/documents/doc-001',
      '/api/v1/customer/payments/pay-004',
      '/api/v1/customer/notifications/notif-002',
    ];

    for (const path of ownedResources) {
      const response = await fetch(`${baseUrl}${path}`, { headers: foreign });
      expect(response.status, path).toBe(404);
    }

    const profile = await fetch(`${baseUrl}/api/v1/customer/profile`, { headers: foreign });
    expect(profile.status).toBe(200);
    expect((await profile.json()).customerId).toBe('cust-exception-001');

    const listChecks = [
      '/api/v1/customer/vehicles',
      '/api/v1/customer/invoices',
      '/api/v1/customer/shipments',
      '/api/v1/customer/documents',
      '/api/v1/customer/payments',
      '/api/v1/customer/notifications',
    ];
    for (const path of listChecks) {
      const response = await fetch(`${baseUrl}${path}`, { headers: foreign });
      expect(response.ok, path).toBe(true);
      const body = await response.json() as { items?: unknown[] };
      expect(body.items, path).toEqual(expect.arrayContaining([]));
      expect(JSON.stringify(body)).not.toContain('cust-123');
    }
  });

  it('rejects expired sessions before any customer route can authorize them', async () => {
    const expired = createDemoJwtToken('CustomerBuyer');
    const payload = JSON.parse(Buffer.from(expired.split('.')[1], 'base64').toString('utf8')) as { exp: number };
    payload.exp = Math.floor(Date.now() / 1000) - 1;
    const token = `${expired.split('.')[0]}.${Buffer.from(JSON.stringify(payload)).toString('base64')}.${expired.split('.')[2]}`;
    const response = await fetch(`${baseUrl}/api/v1/customer/profile`, { headers: { Authorization: `Bearer ${token}` } });
    expect(response.status).toBe(401);
  });
});
