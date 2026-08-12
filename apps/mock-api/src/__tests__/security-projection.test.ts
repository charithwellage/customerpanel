import { describe, expect, it } from 'vitest';
import type { Server } from 'node:http';
import { createStore } from '../store.js';
import { createMockApiApp } from '../server.js';

// Matches the real-HTTP-route pattern already used by enquiries.test.ts and
// reservations.test.ts in this package: start the real Express app on an
// ephemeral port and issue a real request against it, rather than asserting
// on a hand-rolled local literal.
async function startServer(store: ReturnType<typeof createStore>) {
  const app = createMockApiApp(store);
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const port = (server.address() as { port: number }).port;
  return { server, port };
}

describe('Mock API Security & Projection Guard (RULE-08, RULE-09)', () => {
  it('projects public vehicle details without exposing internal cost or supplier fields', async () => {
    const store = createStore();
    await store.ready();

    const vehicle = await store.getVehicleDetail('2021-toyota-corolla-axio-veh-1');
    expect(vehicle).not.toBeNull();
    if (!vehicle) return;

    expect(vehicle.id).toBeDefined();
    expect(vehicle.make).toBe('Toyota');

    // Assert internal fields are never projected on public objects
    expect((vehicle as Record<string, unknown>).supplierId).toBeUndefined();
    expect((vehicle as Record<string, unknown>).purchasePriceJpy).toBeUndefined();
    expect((vehicle as Record<string, unknown>).reservePriceUsd).toBeUndefined();
    expect((vehicle as Record<string, unknown>).internalNotes).toBeUndefined();
  });

  it('rejects reset execution over the real HTTP route when node environment is production', async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const originalResetFlag = process.env.ENABLE_MOCK_RESET;
    process.env.NODE_ENV = 'production';
    delete process.env.ENABLE_MOCK_RESET;

    const store = createStore();
    await store.ready();
    const { server, port } = await startServer(store);

    try {
      const res = await fetch(`http://localhost:${port}/api/v1/__reset`, { method: 'POST' });
      expect(res.status).toBe(403);

      const body = await res.json();
      expect(body.message).toContain('disabled in production environment');
    } finally {
      await new Promise((resolve) => server.close(resolve));
      process.env.NODE_ENV = originalNodeEnv;
      if (originalResetFlag === undefined) {
        delete process.env.ENABLE_MOCK_RESET;
      } else {
        process.env.ENABLE_MOCK_RESET = originalResetFlag;
      }
    }
  });

  it('allows reset execution over the real HTTP route when ENABLE_MOCK_RESET=true overrides production', async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const originalResetFlag = process.env.ENABLE_MOCK_RESET;
    process.env.NODE_ENV = 'production';
    process.env.ENABLE_MOCK_RESET = 'true';

    const store = createStore();
    await store.ready();
    const { server, port } = await startServer(store);

    try {
      const res = await fetch(`http://localhost:${port}/api/v1/__reset`, { method: 'POST' });
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
    } finally {
      await new Promise((resolve) => server.close(resolve));
      process.env.NODE_ENV = originalNodeEnv;
      if (originalResetFlag === undefined) {
        delete process.env.ENABLE_MOCK_RESET;
      } else {
        process.env.ENABLE_MOCK_RESET = originalResetFlag;
      }
    }
  });
});
