import { describe, it, expect, beforeEach } from 'vitest';
import type { Server } from 'node:http';
import { createStore } from '../store.js';
import { createMockApiApp } from '../server.js';
import type { DemoSessionResponse, JwtClaims } from '@carchief/domain';

// CUST-01, CUST-02, CUST-03, CUST-25, RULE-10, DEC-CUST-IDENTITY-RECOVERY
// Verifies customer session authentication, JWT claims minting, authorization headers,
// expired/invalid token responses and identity boundary.

async function startServer(store: ReturnType<typeof createStore>) {
  const app = createMockApiApp(store);
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const port = (server.address() as { port: number }).port;
  return { server, port };
}

describe('Customer Session & Identity Integration (POST /api/v1/auth/demo-session, GET /api/v1/auth/me)', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(async () => {
    store = createStore();
    await store.reset();
  });

  it('mints a valid stand-in CustomerBuyer demo session', async () => {
    const { server, port } = await startServer(store);
    try {
      const res = await fetch(`http://localhost:${port}/api/v1/auth/demo-session`, { method: 'POST' });
      expect(res.status).toBe(201);
      const body = (await res.json()) as DemoSessionResponse;
      expect(body.nonProduction).toBe(true);
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
      const mintRes = await fetch(`http://localhost:${port}/api/v1/auth/demo-session`, { method: 'POST' });
      const { token, claims } = (await mintRes.json()) as DemoSessionResponse;

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
});
