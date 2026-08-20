import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { Server } from 'node:http';
import { createMockApiApp } from '../server.js';
import { createStore } from '../store.js';
import { issueSessionToken } from '@carchief/domain';

describe('Favourites API (D02-P13-T002, CUST-38/CUST-39/CUST-40)', () => {
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

  it('should list empty favourites when customer has none', async () => {
    const token = issueSessionToken('CustomerBuyer', 'cust-test-fav', 'fav@test.com');
    const res = await fetch(`${baseUrl}/api/v1/customer/favourites`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items).toEqual([]);
    expect(body.limit).toBe(25);
  });

  it('should create a favourite with valid criteria', async () => {
    const token = issueSessionToken('CustomerBuyer', 'cust-create-fav', 'create@test.com');
    const res = await fetch(`${baseUrl}/api/v1/customer/favourites`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Affordable Corollas',
        criteria: { make: 'Toyota', model: 'Corolla', priceToUsd: 10000 },
      }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBeDefined();
    expect(body.customerId).toBe('cust-create-fav');
    expect(body.name).toBe('Affordable Corollas');
    expect(body.criteria.make).toBe('Toyota');
    expect(body.createdAt).toBeDefined();
  });

  it('should reject favourite with all-empty criteria', async () => {
    const token = issueSessionToken('CustomerBuyer', 'cust-empty-crit', 'empty@test.com');
    const res = await fetch(`${baseUrl}/api/v1/customer/favourites`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Empty Criteria',
        criteria: {},
      }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.statusCode).toBe(400);
  });

  it('should successfully create up to 25 favourites', async () => {
    const token = issueSessionToken('CustomerBuyer', 'cust-25-cap', 'cap@test.com');

    // Create 25 favourites
    for (let i = 0; i < 25; i++) {
      const res = await fetch(`${baseUrl}/api/v1/customer/favourites`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `Favourite ${i + 1}`,
          criteria: { make: `Make${i}` },
        }),
      });
      expect(res.status).toBe(201);
    }

    // Verify all 25 exist
    const listRes = await fetch(`${baseUrl}/api/v1/customer/favourites`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await listRes.json();
    expect(body.items.length).toBe(25);
  });

  it('should reject the 26th favourite with 409 limit_exceeded', async () => {
    const token = issueSessionToken('CustomerBuyer', 'cust-26-reject', 'reject@test.com');

    // Create 25 favourites
    for (let i = 0; i < 25; i++) {
      await fetch(`${baseUrl}/api/v1/customer/favourites`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `Fav ${i + 1}`,
          criteria: { make: `Make${i}` },
        }),
      });
    }

    // The 26th should fail
    const res = await fetch(`${baseUrl}/api/v1/customer/favourites`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Should Fail',
        criteria: { make: 'Toyota' },
      }),
    });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.reason).toBe('limit_exceeded');
  });

  it('should delete a favourite', async () => {
    const token = issueSessionToken('CustomerBuyer', 'cust-delete-fav', 'delete@test.com');

    // Create a favourite
    const createRes = await fetch(`${baseUrl}/api/v1/customer/favourites`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Delete Me',
        criteria: { make: 'Toyota' },
      }),
    });
    const favourite = await createRes.json();

    // Delete it
    const deleteRes = await fetch(`${baseUrl}/api/v1/customer/favourites/${favourite.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(deleteRes.status).toBe(204);

    // Verify it's deleted
    const listRes = await fetch(`${baseUrl}/api/v1/customer/favourites`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await listRes.json();
    expect(body.items.find((f: any) => f.id === favourite.id)).toBeUndefined();
  });

  it('should return 404 when deleting a non-owned favourite', async () => {
    const token1 = issueSessionToken('CustomerBuyer', 'cust-own-1', 'own1@test.com');
    const token2 = issueSessionToken('CustomerBuyer', 'cust-own-2', 'own2@test.com');

    // Create as customer 1
    const createRes = await fetch(`${baseUrl}/api/v1/customer/favourites`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token1}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'My Favourite',
        criteria: { make: 'Toyota' },
      }),
    });
    const favourite = await createRes.json();

    // Try to delete as customer 2
    const deleteRes = await fetch(`${baseUrl}/api/v1/customer/favourites/${favourite.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token2}` },
    });
    expect(deleteRes.status).toBe(404);
  });

  it('should return distinct facet values from real vehicle data', async () => {
    const res = await fetch(`${baseUrl}/api/v1/customer/favourites/facets`, {
      method: 'GET',
    });
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.makes).toBeDefined();
    expect(Array.isArray(body.makes)).toBe(true);
    expect(body.makes.length).toBeGreaterThan(0);
    expect(body.makes[0]).toHaveProperty('name');
    expect(body.makes[0]).toHaveProperty('count');

    expect(body.models).toBeDefined();
    expect(Array.isArray(body.models)).toBe(true);

    expect(body.fuelTypes).toBeDefined();
    expect(Array.isArray(body.fuelTypes)).toBe(true);

    expect(body.driveTrains).toBeDefined();
    expect(Array.isArray(body.driveTrains)).toBe(true);

    expect(body.transmissions).toBeDefined();
    expect(Array.isArray(body.transmissions)).toBe(true);

    expect(body.yearRange).toBeDefined();
    expect(body.yearRange.min).toBeLessThanOrEqual(body.yearRange.max);

    expect(body.priceRange).toBeDefined();
    expect(body.priceRange.min).toBeLessThanOrEqual(body.priceRange.max);

    expect(body.mileageRange).toBeDefined();
    expect(body.mileageRange.min).toBeLessThanOrEqual(body.mileageRange.max);
  });

  it('should return empty arrays for unbacked fields per D02-ASM-008', async () => {
    const res = await fetch(`${baseUrl}/api/v1/customer/favourites/facets`, {
      method: 'GET',
    });
    expect(res.status).toBe(200);
    const body = await res.json();

    // D02-ASM-008: these four fields have no backing columns
    expect(body.modelCodes).toEqual([]);
    expect(body.engineCcOptions).toEqual([]);
    expect(body.colors).toEqual([]);
    expect(body.steeringOptions).toEqual([]);
  });

  it('should isolate favourites across customers', async () => {
    const token1 = issueSessionToken('CustomerBuyer', 'cust-iso-1', 'iso1@test.com');
    const token2 = issueSessionToken('CustomerBuyer', 'cust-iso-2', 'iso2@test.com');

    // Customer 1 creates a favourite
    const createRes = await fetch(`${baseUrl}/api/v1/customer/favourites`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token1}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Customer 1 Favourite',
        criteria: { make: 'Toyota' },
      }),
    });
    expect(createRes.status).toBe(201);

    // Customer 2 lists favourites (should be empty)
    const listRes = await fetch(`${baseUrl}/api/v1/customer/favourites`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token2}` },
    });
    expect(listRes.status).toBe(200);
    const body = await listRes.json();
    expect(body.items).toEqual([]);
  });

  it('should be deterministic after reset', async () => {
    const token = issueSessionToken('CustomerBuyer', 'cust-reset-test', 'reset@test.com');

    // Create a favourite
    await fetch(`${baseUrl}/api/v1/customer/favourites`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Before Reset',
        criteria: { make: 'Toyota' },
      }),
    });

    // Reset
    await fetch(`${baseUrl}/api/v1/__reset`, { method: 'POST' });

    // After reset, favourites should be empty
    const res = await fetch(`${baseUrl}/api/v1/customer/favourites`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items).toEqual([]);
  });
});
