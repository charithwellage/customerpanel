import { describe, it, expect, beforeEach } from 'vitest';
import type { Server } from 'node:http';
import { createStore } from '../store.js';
import { createMockApiApp } from '../server.js';
import type { JwtClaims } from '@carchief/domain';

// CUST-27, DEC-CUST-IDENTITY-RECOVERY, D02-P12-T001. Registered
// customer sign-in replaces the removed stand-in demo session
// (`POST /api/v1/auth/demo-session`) — never a production identity, but now
// a real server-enforced credential check against the seeded fixture
// account instead of a no-input mint.

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

async function login(port: number, email = SEED_EMAIL, password = SEED_PASSWORD) {
  return fetch(`http://localhost:${port}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
}

describe('Registered customer sign-in (POST /api/v1/auth/login)', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(async () => {
    store = createStore();
    await store.reset();
  });

  it('mints a CustomerBuyer identity for the seeded registered credential', async () => {
    const { server, port } = await startServer(store);
    try {
      const res = await login(port);
      expect(res.status).toBe(200);
      const body = (await res.json()) as { token: string; claims: JwtClaims };
      expect(body.claims.role).toBe('CustomerBuyer');
      expect(body.token).toBeTruthy();
      expect(body.claims.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
      expect(JSON.stringify(body)).not.toMatch(/password/i);
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it('never mints a staff role for a customer credential', async () => {
    const { server, port } = await startServer(store);
    try {
      const res = await login(port);
      const body = (await res.json()) as { claims: JwtClaims };
      expect(body.claims.permissions).not.toContain('reset:data');
      expect(body.claims.permissions).not.toContain('read:leads');
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it('mints a token that GET /api/v1/auth/me recognizes as the same CustomerBuyer identity', async () => {
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

  it('mints an independently usable session on every call', async () => {
    const { server, port } = await startServer(store);
    try {
      const first = (await (await login(port)).json()) as { token: string; claims: JwtClaims };
      const second = (await (await login(port)).json()) as { token: string; claims: JwtClaims };
      expect(first.claims.role).toBe('CustomerBuyer');
      expect(second.claims.role).toBe('CustomerBuyer');
      const meRes = await fetch(`http://localhost:${port}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${second.token}` },
      });
      expect(meRes.status).toBe(200);
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it('returns the identical generic 401 for an unknown email and for a wrong password', async () => {
    const { server, port } = await startServer(store);
    try {
      const unknown = await login(port, 'nobody@example.com', 'irrelevant-password-12');
      const wrongPassword = await login(port, SEED_EMAIL, 'totally-wrong-password-9');
      expect(unknown.status).toBe(401);
      expect(wrongPassword.status).toBe(401);
      const unknownBody = await unknown.json();
      const wrongBody = await wrongPassword.json();
      expect(unknownBody).toMatchObject({ message: wrongBody.message, statusCode: 401 });
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });
});

describe('Public config Live Auction gate (PUB-27, D01-ASM-002)', () => {
  it('omits liveAuctionUrl by default — no approved external destination is configured, so the entry stays hidden', async () => {
    const store = createStore();
    await store.reset();
    const { server, port } = await startServer(store);
    try {
      const res = await fetch(`http://localhost:${port}/api/v1/config/public`);
      expect(res.status).toBe(200);
      const config = (await res.json()) as { liveAuctionUrl?: string };
      expect(config.liveAuctionUrl).toBeUndefined();
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });
});
