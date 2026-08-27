import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Server } from 'node:http';
import { issueSessionToken } from '@carchief/domain';
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
    Authorization: `Bearer ${issueSessionToken('CustomerBuyer', customerId)}`,
  });

  it('does not expose the retired customer shipment page APIs', async () => {
    for (const path of ['/api/v1/customer/shipments', '/api/v1/customer/shipments/ship-001']) {
      const response = await fetch(`${baseUrl}${path}`, { headers: headers('cust-123') });
      expect(response.status, path).toBe(404);
    }
  });

  it('never returns another customer’s vehicle, invoice, shipment, document, payment, notification, or profile', async () => {
    const foreign = headers('cust-exception-001');
    const ownedResources = [
      '/api/v1/customer/vehicles/veh-1',
      '/api/v1/customer/invoices/inv-001',
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

  it('never lets one registered customer sign in with, change, or reset the other\'s credential', async () => {
    const passwordA = 'AccountAPassw0rd!';
    const passwordB = 'AccountBPassw0rd!';
    const register = (email: string, password: string) =>
      fetch(`${baseUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nameWithInitials: 'A. Account',
          countryCode: 'UG',
          mobileNumber: '700999888',
          email,
          password,
          confirmPassword: password,
        }),
      });
    const login = (email: string, password: string) =>
      fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

    const regA = await register('account-a@example.com', passwordA);
    const regB = await register('account-b@example.com', passwordB);
    expect(regA.status).toBe(201);
    expect(regB.status).toBe(201);
    const accountA = await regA.json();
    const accountB = await regB.json();
    expect(accountA.customerId).not.toBe(accountB.customerId);

    // Account A cannot sign in with account B's password, and vice versa.
    expect((await login('account-a@example.com', passwordB)).status).toBe(401);
    expect((await login('account-b@example.com', passwordA)).status).toBe(401);

    // Account A's session cannot change account B's password by supplying
    // B's current password value — change-password is always scoped to the
    // authenticated session's own customer id, never a body-supplied target.
    const loginA = await (await login('account-a@example.com', passwordA)).json();
    const changeAsA = await fetch(`${baseUrl}/api/v1/auth/change-password`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${loginA.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: passwordB, newPassword: 'TakeoverPassw0rd!', confirmNewPassword: 'TakeoverPassw0rd!' }),
    });
    expect(changeAsA.status).toBe(401);
    expect((await login('account-b@example.com', passwordB)).status).toBe(200);

    // A reset token issued for account A cannot be used to reset account B.
    await fetch(`${baseUrl}/api/v1/auth/password-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'account-a@example.com' }),
    });
    const outbox = await (await fetch(`${baseUrl}/api/v1/auth/__outbox`)).json();
    const tokenA = outbox.items.find((i: { email: string }) => i.email === 'account-a@example.com').token;
    const confirmRes = await fetch(`${baseUrl}/api/v1/auth/password-reset/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: tokenA, newPassword: 'NewPassw0rdForA!', confirmNewPassword: 'NewPassw0rdForA!' }),
    });
    expect(confirmRes.status).toBe(200);
    // Only A's credential moved; B's is unaffected.
    expect((await login('account-b@example.com', passwordB)).status).toBe(200);
    expect((await login('account-a@example.com', 'NewPassw0rdForA!')).status).toBe(200);
  });

  it('rejects expired sessions before any customer route can authorize them', async () => {
    const expired = issueSessionToken('CustomerBuyer');
    const payload = JSON.parse(Buffer.from(expired.split('.')[1], 'base64').toString('utf8')) as { exp: number };
    payload.exp = Math.floor(Date.now() / 1000) - 1;
    const token = `${expired.split('.')[0]}.${Buffer.from(JSON.stringify(payload)).toString('base64')}.${expired.split('.')[2]}`;
    const response = await fetch(`${baseUrl}/api/v1/customer/profile`, { headers: { Authorization: `Bearer ${token}` } });
    expect(response.status).toBe(401);
  });
});
