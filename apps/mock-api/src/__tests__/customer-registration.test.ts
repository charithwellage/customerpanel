import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Server } from 'node:http';
import { createMockApiApp } from '../server.js';
import { createStore } from '../store.js';

// CUST-26, D02-ASM-005, D02-ASM-006. Self-registration creates a persistent
// customer_accounts record in both store implementations (this suite runs
// against MemoryStore per the ephemeral-port pattern; PostgresStore shares
// the same validation/hash path). No response body ever carries a password,
// hash or salt.

const VALID_PASSWORD = 'Str0ngPassw0rd!';

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    nameWithInitials: 'A. B. Client',
    countryCode: 'UG',
    mobileNumber: '700123456',
    email: 'new.customer@example.com',
    password: VALID_PASSWORD,
    confirmPassword: VALID_PASSWORD,
    ...overrides,
  };
}

describe('Customer self-registration (POST /api/v1/auth/register)', () => {
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

  const register = (body: unknown) =>
    fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

  it('creates an immediately usable account for a valid payload, with no credential material in the response', async () => {
    const response = await register(validPayload());
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body).toMatchObject({
      nameWithInitials: 'A. B. Client',
      countryCode: 'UG',
      dialCode: '+256',
      mobileNumber: '700123456',
      email: 'new.customer@example.com',
      status: 'active',
      verificationState: 'unverified',
    });
    expect(body.customerId).toBeTruthy();
    expect(body).not.toHaveProperty('password');
    expect(body).not.toHaveProperty('passwordHash');
    expect(body).not.toHaveProperty('passwordSalt');
    expect(JSON.stringify(body)).not.toMatch(/password/i);

    // Immediately usable: no email verification gate (D02-ASM-006).
    const login = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'new.customer@example.com', password: VALID_PASSWORD }),
    });
    expect(login.status).toBe(200);
  });

  it.each([
    ['nameWithInitials', validPayload({ nameWithInitials: '' }), 'nameWithInitials'],
    ['countryCode', validPayload({ countryCode: 'ZZ' }), 'countryCode'],
    ['mobileNumber', validPayload({ mobileNumber: 'not-a-number' }), 'mobileNumber'],
    ['email', validPayload({ email: 'not-an-email' }), 'email'],
    ['password too short', validPayload({ password: 'short1', confirmPassword: 'short1' }), 'password'],
    ['password missing digit', validPayload({ password: 'onlyletterspassword', confirmPassword: 'onlyletterspassword' }), 'password'],
    ['password missing letter', validPayload({ password: '123456789012', confirmPassword: '123456789012' }), 'password'],
    ['confirmPassword mismatch', validPayload({ confirmPassword: 'DifferentPassw0rd!' }), 'confirmPassword'],
  ])('rejects %s with a 400 and a field reference', async (_label, payload, expectedField) => {
    const response = await register(payload);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.field).toBe(expectedField);
    expect(JSON.stringify(body)).not.toMatch(/password.{0,20}[:=]\s*["']/i);
  });

  it('rejects a duplicate email with 409, case-insensitively', async () => {
    const first = await register(validPayload({ email: 'dup.customer@example.com' }));
    expect(first.status).toBe(201);

    const second = await register(validPayload({ email: 'dup.customer@example.com' }));
    expect(second.status).toBe(409);
    expect((await second.json()).field).toBe('email');

    const thirdDifferentCase = await register(validPayload({ email: 'DUP.CUSTOMER@example.com' }));
    expect(thirdDifferentCase.status).toBe(409);
  });

  it('provisions a minimal CustomerProfile at registration so GET /api/v1/customer/profile succeeds immediately (D02-P12-T001 reopen)', async () => {
    const email = 'fresh.profile.customer@example.com';
    const registration = await register(validPayload({ email }));
    expect(registration.status).toBe(201);

    const login = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: VALID_PASSWORD }),
    });
    expect(login.status).toBe(200);
    const { token } = (await login.json()) as { token: string };

    const profile = await fetch(`${baseUrl}/api/v1/customer/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(profile.status).toBe(200);
    const body = await profile.json();
    expect(body).toMatchObject({
      email,
      name: email.split('@')[0],
      companyName: '',
      phone: '',
      deliveryAddress: '',
      version: 1,
    });
  });

  it('normalizes email case so sign-in matches regardless of the case used at registration', async () => {
    await register(validPayload({ email: 'Case.Sensitive@Example.com' }));
    const login = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'case.sensitive@example.com', password: VALID_PASSWORD }),
    });
    expect(login.status).toBe(200);
  });
});
