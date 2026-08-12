import { describe, it, expect, beforeEach } from 'vitest';
import type { Server } from 'node:http';
import { createStore } from '../store.js';
import { createMockApiApp } from '../server.js';
import type { DemoSessionResponse, JwtClaims } from '@carchief/domain';

// PUB-22, PUB-27, DEC-PUB-AUTH-BOUNDARY, D01-P06-T003. The stand-in demo
// customer session and public-config Live Auction gate — never a
// production identity or a live external capability claim (RULE-10).

async function startServer(store: ReturnType<typeof createStore>) {
  const app = createMockApiApp(store);
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const port = (server.address() as { port: number }).port;
  return { server, port };
}

describe('Stand-in demo session (POST /api/v1/auth/demo-session)', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(async () => {
    store = createStore();
    await store.reset();
  });

  it('mints a non-production CustomerBuyer identity', async () => {
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

  it('never mints a staff role, even though the endpoint takes no caller input to abuse', async () => {
    const { server, port } = await startServer(store);
    try {
      const res = await fetch(`http://localhost:${port}/api/v1/auth/demo-session`, { method: 'POST' });
      const body = (await res.json()) as DemoSessionResponse;
      expect(body.claims.permissions).not.toContain('reset:data');
      expect(body.claims.permissions).not.toContain('read:leads');
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it('mints a token that GET /api/v1/auth/me recognizes as the same CustomerBuyer identity', async () => {
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

  it('mints an independently usable session on every call (no server-side session mutation between calls)', async () => {
    const { server, port } = await startServer(store);
    try {
      const first = (await (await fetch(`http://localhost:${port}/api/v1/auth/demo-session`, { method: 'POST' })).json()) as DemoSessionResponse;
      const second = (await (await fetch(`http://localhost:${port}/api/v1/auth/demo-session`, { method: 'POST' })).json()) as DemoSessionResponse;
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
