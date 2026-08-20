import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { Server } from 'node:http';
import { createMockApiApp } from '../server.js';
import { createStore } from '../store.js';
import { issueSessionToken } from '@carchief/domain';

describe('Wishlist API (D02-P13-T002, CUST-36/CUST-37)', () => {
  let store: ReturnType<typeof createStore>;
  let server: Server | undefined;
  let baseUrl: string;

  beforeEach(async () => {
    store = createStore('');
    await store.reset();
    const app = createMockApiApp(store);
    server = await new Promise<Server>((resolve) => {
      const s = app.listen(0, () => resolve(s));
    });
    const port = (server.address() as { port: number }).port;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterEach(async () => {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server!.close((err) => (err ? reject(err) : resolve()));
      });
    }
  });

  it('should list empty wishlist when customer has no wishlisted items', async () => {
    const token = issueSessionToken('CustomerBuyer', 'cust-test-wish', 'wish@test.com');
    const res = await fetch(`${baseUrl}/api/v1/customer/wishlist`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items).toEqual([]);
  });

  it('should add a vehicle to the wishlist (POST)', async () => {
    const token = issueSessionToken('CustomerBuyer', 'cust-test-wish', 'wish@test.com');
    const res = await fetch(`${baseUrl}/api/v1/customer/wishlist`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ vehicleSlug: '2021-toyota-corolla-axio-veh-1' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.wishlisted).toBe(true);
    expect(body.item).toBeDefined();
    expect(body.item.vehicleSlug).toBe('2021-toyota-corolla-axio-veh-1');
  });

  it('should list wishlist items after adding one', async () => {
    const token = issueSessionToken('CustomerBuyer', 'cust-test-wish', 'wish@test.com');

    // Add first
    await fetch(`${baseUrl}/api/v1/customer/wishlist`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ vehicleSlug: '2021-toyota-corolla-axio-veh-1' }),
    });

    // List
    const res = await fetch(`${baseUrl}/api/v1/customer/wishlist`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items.length).toBeGreaterThan(0);
    expect(body.items[0].vehicleSlug).toBe('2021-toyota-corolla-axio-veh-1');
  });

  it('should idempotently toggle wishlist items (remove on re-add)', async () => {
    const token = issueSessionToken('CustomerBuyer', 'cust-toggle-test', 'toggle@test.com');

    // Add
    const addRes = await fetch(`${baseUrl}/api/v1/customer/wishlist`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ vehicleSlug: '2021-toyota-corolla-axio-veh-1' }),
    });
    expect(addRes.status).toBe(200);
    let body = await addRes.json();
    expect(body.wishlisted).toBe(true);

    // Toggle again (should remove)
    const toggleRes = await fetch(`${baseUrl}/api/v1/customer/wishlist`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ vehicleSlug: '2021-toyota-corolla-axio-veh-1' }),
    });
    expect(toggleRes.status).toBe(200);
    body = await toggleRes.json();
    expect(body.wishlisted).toBe(false);
  });

  it('should remove a vehicle from the wishlist via DELETE', async () => {
    const token = issueSessionToken('CustomerBuyer', 'cust-delete-test', 'delete@test.com');

    // Add first
    await fetch(`${baseUrl}/api/v1/customer/wishlist`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ vehicleSlug: '2021-toyota-corolla-axio-veh-1' }),
    });

    // Delete via DELETE
    const res = await fetch(`${baseUrl}/api/v1/customer/wishlist/2021-toyota-corolla-axio-veh-1`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.wishlisted).toBe(false);
  });

  it('should return 200 when deleting a non-present item (idempotent)', async () => {
    const token = issueSessionToken('CustomerBuyer', 'cust-delete-empty-test', 'empty@test.com');
    const res = await fetch(`${baseUrl}/api/v1/customer/wishlist/2021-toyota-corolla-axio-veh-1`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.wishlisted).toBe(false);
  });

  it('should return 404 when trying to add an unknown vehicle slug', async () => {
    const token = issueSessionToken('CustomerBuyer', 'cust-unknown-test', 'unknown@test.com');
    const res = await fetch(`${baseUrl}/api/v1/customer/wishlist`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ vehicleSlug: 'unknown-vehicle-slug-xyz' }),
    });
    expect(res.status).toBe(404);
  });

  it('should isolate wishlist items across customers', async () => {
    const token1 = issueSessionToken('CustomerBuyer', 'cust-iso-1', 'iso1@test.com');
    const token2 = issueSessionToken('CustomerBuyer', 'cust-iso-2', 'iso2@test.com');

    // Customer 1 adds a vehicle
    await fetch(`${baseUrl}/api/v1/customer/wishlist`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token1}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ vehicleSlug: '2021-toyota-corolla-axio-veh-1' }),
    });

    // Customer 2 lists their wishlist (should be empty)
    const res = await fetch(`${baseUrl}/api/v1/customer/wishlist`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token2}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items).toEqual([]);
  });

  it('should be deterministic after reset', async () => {
    const token = issueSessionToken('CustomerBuyer', 'cust-reset-test', 'reset@test.com');

    // Add item
    await fetch(`${baseUrl}/api/v1/customer/wishlist`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ vehicleSlug: '2021-toyota-corolla-axio-veh-1' }),
    });

    // Reset
    await fetch(`${baseUrl}/api/v1/__reset`, { method: 'POST' });

    // After reset, wishlist should be empty
    const res = await fetch(`${baseUrl}/api/v1/customer/wishlist`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items).toEqual([]);
  });
});
