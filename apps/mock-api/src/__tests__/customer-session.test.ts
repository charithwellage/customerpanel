import { describe, it, expect, beforeEach } from 'vitest';
import type { Server } from 'node:http';
import { createStore } from '../store.js';
import { createMockApiApp } from '../server.js';
import type { JwtClaims } from '@carchief/domain';

// CUST-01, CUST-02, CUST-03, CUST-25, CUST-27, RULE-10,
// DEC-CUST-IDENTITY-RECOVERY, D02-P12-T001. Verifies customer session
// authentication through the real credential login contract, JWT claims
// minting, authorization headers, expired/invalid token responses and
// identity boundary. Replaces the removed no-input demo-session mint.

const SEED_EMAIL = 'demo.customer@carchief.com';
const SEED_PASSWORD = 'CarChief#Fixture2026';

async function startServer(store: ReturnType<typeof createStore>) {
  const app = createMockApiApp(store);
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const port = (server.address() as { port: number }).port;
  return { server, port };
}

async function login(port: number) {
  return fetch(`http://localhost:${port}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: SEED_EMAIL, password: SEED_PASSWORD }),
  });
}

describe('Customer Session & Identity Integration (POST /api/v1/auth/login, GET /api/v1/auth/me)', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(async () => {
    store = createStore();
    await store.reset();
  });

  it('signs in the seeded registered credential to a valid CustomerBuyer session', async () => {
    const { server, port } = await startServer(store);
    try {
      const res = await login(port);
      expect(res.status).toBe(200);
      const body = (await res.json()) as { token: string; claims: JwtClaims };
      expect(body.claims.role).toBe('CustomerBuyer');
      expect(body.token).toBeTruthy();
      expect(body.claims.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it('returns 200 and claims for valid Bearer token on /api/v1/auth/me', async () => {
    const { server, port } = await startServer(store);
    try {
      const loginRes = await login(port);
      const { token, claims } = (await loginRes.json()) as { token: string; claims: JwtClaims };

      const meRes = await fetch(`http://localhost:${port}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(meRes.status).toBe(200);
      const me = (await meRes.json()) as JwtClaims;
      expect(me.sub).toBe(claims.sub);
      expect(me.role).toBe('CustomerBuyer');
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it('returns 401 Unauthorized for missing or invalid Authorization token', async () => {
    const { server, port } = await startServer(store);
    try {
      const noHeaderRes = await fetch(`http://localhost:${port}/api/v1/auth/me`);
      expect(noHeaderRes.status).toBe(401);

      const invalidTokenRes = await fetch(`http://localhost:${port}/api/v1/auth/me`, {
        headers: { Authorization: 'Bearer invalid_bogus_token' },
      });
      expect(invalidTokenRes.status).toBe(401);
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it('returns 401 for a wrong password against a registered account', async () => {
    const { server, port } = await startServer(store);
    try {
      const res = await fetch(`http://localhost:${port}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: SEED_EMAIL, password: 'wrong-password-value-1' }),
      });
      expect(res.status).toBe(401);
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });
});
