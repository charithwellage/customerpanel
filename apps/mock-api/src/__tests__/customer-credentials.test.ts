import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Server } from 'node:http';
import { createMockApiApp } from '../server.js';
import { createStore } from '../store.js';

// CUST-27, CUST-28, CUST-29, D02-ASM-005/007. Login success/failure,
// authenticated change-password, always-202 reset requests, single-use and
// expiring outbox tokens, and determinism after POST /api/v1/__reset.

const SEED_EMAIL = 'demo.customer@carchief.com';
const SEED_PASSWORD = 'CarChief#Fixture2026';
const NOW = '2026-08-15T00:00:00.000Z';

describe('Customer credentials (login, change-password, password reset)', () => {
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

  const login = (email: string, password: string) =>
    fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

  it('signs in the seeded registered credential', async () => {
    const res = await login(SEED_EMAIL, SEED_PASSWORD);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.claims.role).toBe('CustomerBuyer');
    expect(body.claims.sub).toBe('cust-123');
    expect(body.token).toBeTruthy();
    expect(JSON.stringify(body)).not.toMatch(/password/i);
  });

  it('returns the identical 401 for an unknown email and a wrong password', async () => {
    const unknown = await login('nobody@example.com', 'irrelevant-password-1');
    const wrong = await login(SEED_EMAIL, 'totally-wrong-password-1');
    expect(unknown.status).toBe(401);
    expect(wrong.status).toBe(401);
    const unknownBody = await unknown.json();
    const wrongBody = await wrong.json();
    expect(unknownBody.message).toBe(wrongBody.message);
    expect(unknownBody.statusCode).toBe(wrongBody.statusCode);
  });

  it('changes the authenticated customer password and rejects the old password afterwards', async () => {
    const loginRes = await login(SEED_EMAIL, SEED_PASSWORD);
    const { token } = await loginRes.json();
    const newPassword = 'BrandNewPassw0rd!';

    const changeRes = await fetch(`${baseUrl}/api/v1/auth/change-password`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: SEED_PASSWORD, newPassword, confirmNewPassword: newPassword }),
    });
    expect(changeRes.status).toBe(200);

    const oldLogin = await login(SEED_EMAIL, SEED_PASSWORD);
    expect(oldLogin.status).toBe(401);

    const newLogin = await login(SEED_EMAIL, newPassword);
    expect(newLogin.status).toBe(200);
  });

  it('rejects change-password with the wrong current password (401) and a weak new password (400)', async () => {
    const loginRes = await login(SEED_EMAIL, SEED_PASSWORD);
    const { token } = await loginRes.json();

    const wrongCurrent = await fetch(`${baseUrl}/api/v1/auth/change-password`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: 'not-the-current-password', newPassword: 'BrandNewPassw0rd!', confirmNewPassword: 'BrandNewPassw0rd!' }),
    });
    expect(wrongCurrent.status).toBe(401);

    const weakNew = await fetch(`${baseUrl}/api/v1/auth/change-password`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: SEED_PASSWORD, newPassword: 'short1', confirmNewPassword: 'short1' }),
    });
    expect(weakNew.status).toBe(400);
    expect((await weakNew.json()).field).toBe('newPassword');
  });

  it('requires authentication for change-password', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: SEED_PASSWORD, newPassword: 'BrandNewPassw0rd!', confirmNewPassword: 'BrandNewPassw0rd!' }),
    });
    expect(res.status).toBe(401);
  });

  it('always returns 202 for a password-reset request, whether or not the email exists', async () => {
    const known = await fetch(`${baseUrl}/api/v1/auth/password-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: SEED_EMAIL }),
    });
    const unknown = await fetch(`${baseUrl}/api/v1/auth/password-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nobody@example.com' }),
    });
    expect(known.status).toBe(202);
    expect(unknown.status).toBe(202);
    expect(await known.json()).toEqual(await unknown.json());
  });

  it('issues a single-use token: confirm succeeds once, then rejects reuse', async () => {
    await fetch(`${baseUrl}/api/v1/auth/password-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-mock-now': NOW },
      body: JSON.stringify({ email: SEED_EMAIL }),
    });
    const outbox = await (await fetch(`${baseUrl}/api/v1/auth/__outbox`)).json();
    const entry = outbox.items.find((i: { email: string }) => i.email === SEED_EMAIL);
    expect(entry).toBeTruthy();
    expect(entry).not.toHaveProperty('password');

    const newPassword = 'ResetFlowPassw0rd!';
    const first = await fetch(`${baseUrl}/api/v1/auth/password-reset/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-mock-now': NOW },
      body: JSON.stringify({ token: entry.token, newPassword, confirmNewPassword: newPassword }),
    });
    expect(first.status).toBe(200);

    const second = await fetch(`${baseUrl}/api/v1/auth/password-reset/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-mock-now': NOW },
      body: JSON.stringify({ token: entry.token, newPassword, confirmNewPassword: newPassword }),
    });
    expect(second.status).toBe(400);

    const loginWithNew = await login(SEED_EMAIL, newPassword);
    expect(loginWithNew.status).toBe(200);
  });

  it('rejects an expired reset token', async () => {
    await fetch(`${baseUrl}/api/v1/auth/password-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-mock-now': NOW },
      body: JSON.stringify({ email: SEED_EMAIL }),
    });
    const outbox = await (await fetch(`${baseUrl}/api/v1/auth/__outbox`)).json();
    const entry = outbox.items.find((i: { email: string }) => i.email === SEED_EMAIL);

    const wayLater = '2026-08-16T00:00:00.000Z';
    const newPassword = 'ResetFlowPassw0rd!';
    const res = await fetch(`${baseUrl}/api/v1/auth/password-reset/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-mock-now': wayLater },
      body: JSON.stringify({ token: entry.token, newPassword, confirmNewPassword: newPassword }),
    });
    expect(res.status).toBe(400);
  });

  it('rejects an unknown reset token', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/password-reset/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'not-a-real-token', newPassword: 'BrandNewPassw0rd!', confirmNewPassword: 'BrandNewPassw0rd!' }),
    });
    expect(res.status).toBe(400);
  });

  it('resets deterministically: the seeded credential and outbox return to baseline after POST /api/v1/__reset', async () => {
    await fetch(`${baseUrl}/api/v1/auth/password-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: SEED_EMAIL }),
    });
    let outbox = await (await fetch(`${baseUrl}/api/v1/auth/__outbox`)).json();
    expect(outbox.items.length).toBeGreaterThan(0);

    await fetch(`${baseUrl}/api/v1/__reset`, { method: 'POST' });

    outbox = await (await fetch(`${baseUrl}/api/v1/auth/__outbox`)).json();
    expect(outbox.items).toEqual([]);

    const res = await login(SEED_EMAIL, SEED_PASSWORD);
    expect(res.status).toBe(200);
  });
});
