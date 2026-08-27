import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Server } from 'node:http';
import { issueSessionToken } from '@carchief/domain';
import { createMockApiApp } from '../server.js';
import { createStore } from '../store.js';

describe('Customer notification contract (D02-P08-T001)', () => {
  let server: Server | undefined;
  let baseUrl = '';
  const customerHeaders = (customerId = 'cust-123') => ({ Authorization: `Bearer ${issueSessionToken('CustomerBuyer', customerId)}` });

  beforeEach(async () => {
    const app = createMockApiApp(createStore(''));
    server = await new Promise<Server>((resolve) => { const instance = app.listen(0, () => resolve(instance)); });
    baseUrl = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  });

  afterEach(async () => {
    server?.closeAllConnections?.();
    if (server) await new Promise<void>((resolve) => server?.close(() => resolve()));
  });

  it('lists only owned notifications, supports unread/search filters and exposes approved links', async () => {
    const response = await fetch(`${baseUrl}/api/v1/customer/notifications?status=unread&q=ready`, { headers: customerHeaders() });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.total).toBe(1);
    expect(body.unreadCount).toBe(2);
    expect(body.items[0]).toMatchObject({ id: 'notif-002', customerId: 'cust-123', isRead: false, related: { kind: 'Shipment', id: 'ship-001' } });
  });

  it('enforces ownership and makes mark-read/read-all idempotent', async () => {
    const foreign = await fetch(`${baseUrl}/api/v1/customer/notifications/notif-002`, { headers: customerHeaders('cust-exception-001') });
    expect(foreign.status).toBe(404);
    const first = await fetch(`${baseUrl}/api/v1/customer/notifications/notif-002/read`, { method: 'POST', headers: customerHeaders() });
    const second = await fetch(`${baseUrl}/api/v1/customer/notifications/notif-002/read`, { method: 'POST', headers: customerHeaders() });
    expect(first.status).toBe(200);
    expect((await second.json()).isRead).toBe(true);
    expect((await (await fetch(`${baseUrl}/api/v1/customer/notifications/read-all`, { method: 'POST', headers: customerHeaders() })).json())).toEqual({ updatedCount: 1, unreadCount: 0 });
    expect((await (await fetch(`${baseUrl}/api/v1/customer/notifications/read-all`, { method: 'POST', headers: customerHeaders() })).json())).toEqual({ updatedCount: 0, unreadCount: 0 });
  });

  it('rejects unauthenticated access and resets mutations to deterministic fixtures', async () => {
    expect((await fetch(`${baseUrl}/api/v1/customer/notifications`)).status).toBe(401);
    await fetch(`${baseUrl}/api/v1/customer/notifications/read-all`, { method: 'POST', headers: customerHeaders() });
    await fetch(`${baseUrl}/api/v1/__reset`, { method: 'POST' });
    const body = await (await fetch(`${baseUrl}/api/v1/customer/notifications`, { headers: customerHeaders() })).json();
    expect(body.unreadCount).toBe(2);
  });
});
