import { describe, it, expect, beforeEach } from 'vitest';
import type { Server } from 'node:http';
import { createStore } from '../store.js';
import { createMockApiApp } from '../server.js';
import type { ReservationResponse } from '@carchief/domain';
import { issueSessionToken, generateVehicleSlug, RESERVATION_HOLD_HOURS } from '@carchief/domain';

// PUB-23, RULE-05, RULE-08, RULE-10, D01-P06-T004. A reservation is a
// transactional 48-hour hold on one vehicle for one authenticated demo
// customer. DEC-PUB-RESERVATION-EXPIRY-ACTION is OPEN (automatic vs. manual
// release unconfirmed): `status`/eligibility are always recomputed live from
// `expiresAt`, never claimed as an automatic action (RULE-10).

const VEHICLE_SLUG_1 = generateVehicleSlug(2021, 'Toyota', 'Corolla Axio', 'veh-1');
const VEHICLE_SLUG_3 = generateVehicleSlug(2022, 'Nissan', 'X-Trail', 'veh-3');
const VEHICLE_SLUG_4 = generateVehicleSlug(2019, 'Subaru', 'Forester', 'veh-4');
const VEHICLE_SLUG_5 = generateVehicleSlug(2021, 'Honda', 'Fit Hybrid', 'veh-5');
const VEHICLE_SLUG_7 = generateVehicleSlug(2024, 'Toyota', 'Raize', 'veh-7');
const VEHICLE_SLUG_SOLD = generateVehicleSlug(2019, 'Mazda', 'CX-5', 'veh-sold');

const CUSTOMER_A_TOKEN = issueSessionToken('CustomerBuyer', 'customer-a', 'a@example.com');
const CUSTOMER_PLATINUM_TOKEN = issueSessionToken('CustomerBuyer', 'cust-platinum-345', 'platinum@example.com', 'Platinum');
const CUSTOMER_B_TOKEN = issueSessionToken('CustomerBuyer', 'customer-b', 'b@example.com');
const SALESPERSON_TOKEN = issueSessionToken('Salesperson', 'staff-1', 'staff@example.com');

async function startServer(store: ReturnType<typeof createStore>) {
  const app = createMockApiApp(store);
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const port = (server.address() as { port: number }).port;
  return { server, port };
}

describe('Transactional reservation eligibility and hold (PUB-23, RULE-05, RULE-08, RULE-10, D01-P06-T004)', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(async () => {
    store = createStore();
    await store.reset();
  });

  describe('DemoStore.createReservation', () => {
    it('creates an active reservation with a 48-hour expiry from the request instant', async () => {
      const nowISO = '2026-08-11T09:00:00.000Z';
      const reservation = await store.createReservation('customer-a', 'a@example.com', { vehicleSlug: VEHICLE_SLUG_1 }, nowISO);
      expect(reservation.status).toBe('active');
      expect(reservation.vehicleSlug).toBe(VEHICLE_SLUG_1);
      expect(reservation.customerId).toBe('customer-a');
      expect(reservation.holdHours).toBe(RESERVATION_HOLD_HOURS);
      expect(reservation.createdAt).toBe(nowISO);
      expect(reservation.expiresAt).toBe('2026-08-13T09:00:00.000Z');
    });

    it('marks the underlying vehicle as Reserved once the hold is created (RULE-08 — reflected everywhere)', async () => {
      await store.createReservation('customer-a', 'a@example.com', { vehicleSlug: VEHICLE_SLUG_1 });
      const detail = await store.getVehicleDetail(VEHICLE_SLUG_1);
      expect(detail?.status).toBe('Reserved');
    });

    it('rejects a missing vehicleSlug as a field-associated 400', async () => {
      await expect(store.createReservation('customer-a', 'a@example.com', { vehicleSlug: '' })).rejects.toMatchObject({
        statusCode: 400,
        field: 'vehicleSlug',
      });
    });

    it('rejects an unknown vehicle with reason vehicle_not_found (404)', async () => {
      await expect(store.createReservation('customer-a', 'a@example.com', { vehicleSlug: 'not-a-real-vehicle' })).rejects.toMatchObject({
        statusCode: 404,
        reason: 'vehicle_not_found',
      });
    });

    it('rejects a vehicle whose status is not eligible with reason vehicle_unavailable (409)', async () => {
      await expect(store.createReservation('customer-a', 'a@example.com', { vehicleSlug: VEHICLE_SLUG_SOLD })).rejects.toMatchObject({
        statusCode: 409,
        reason: 'vehicle_unavailable',
      });
    });

    it('rejects a conflicting attempt by a different customer on an actively held vehicle with reason conflict (409)', async () => {
      await store.createReservation('customer-a', 'a@example.com', { vehicleSlug: VEHICLE_SLUG_1 });
      await expect(store.createReservation('customer-b', 'b@example.com', { vehicleSlug: VEHICLE_SLUG_1 })).rejects.toMatchObject({
        statusCode: 409,
        reason: 'conflict',
      });
    });

    it('rejects a duplicate attempt by the same customer on the same vehicle with reason duplicate (409)', async () => {
      await store.createReservation('customer-a', 'a@example.com', { vehicleSlug: VEHICLE_SLUG_1 });
      await expect(store.createReservation('customer-a', 'a@example.com', { vehicleSlug: VEHICLE_SLUG_1 })).rejects.toMatchObject({
        statusCode: 409,
        reason: 'duplicate',
      });
    });

    it('rejects a new reservation once the customer already holds the maximum number of active reservations, with reason limit_exceeded (409)', async () => {
      const slugs = [VEHICLE_SLUG_1, VEHICLE_SLUG_3, VEHICLE_SLUG_4];
      expect(slugs.length).toBe(3);
      for (const vehicleSlug of slugs) {
        await store.createReservation('cust-platinum-345', 'platinum@example.com', { vehicleSlug });
      }
      await expect(store.createReservation('cust-platinum-345', 'platinum@example.com', { vehicleSlug: VEHICLE_SLUG_5 })).rejects.toMatchObject({
        statusCode: 409,
        reason: 'limit_exceeded',
      });
    });

    it('allows a new reservation on a vehicle whose prior hold has expired, and does not count the expired hold against the limit', async () => {
      const earlyNow = '2026-08-01T00:00:00.000Z';
      await store.createReservation('customer-a', 'a@example.com', { vehicleSlug: VEHICLE_SLUG_1 }, earlyNow);

      const afterExpiry = '2026-08-04T00:00:00.000Z'; // > 48h after earlyNow
      const secondReservation = await store.createReservation('customer-b', 'b@example.com', { vehicleSlug: VEHICLE_SLUG_1 }, afterExpiry);
      expect(secondReservation.customerId).toBe('customer-b');
      expect(secondReservation.status).toBe('active');
    });

    it('reports an existing hold as expired once its 48-hour window has passed (recomputed live, never a stored flip)', async () => {
      const createdAt = '2026-08-01T00:00:00.000Z';
      const reservation = await store.createReservation('customer-a', 'a@example.com', { vehicleSlug: VEHICLE_SLUG_1 }, createdAt);
      const fetched = await store.getReservationById(reservation.id);
      // Real "now" (2026+) is well past the fixed createdAt + 48h window used above.
      expect(fetched?.status).toBe('expired');
      expect(fetched?.expiresAt).toBe(reservation.expiresAt);
    });
  });

  describe('DemoStore.getReservationById', () => {
    it('returns null for an unknown reservation id', async () => {
      expect(await store.getReservationById('res-missing')).toBeNull();
    });

    it('makes a created reservation retrievable by id through the service boundary', async () => {
      const created = await store.createReservation('customer-a', 'a@example.com', { vehicleSlug: VEHICLE_SLUG_7 });
      const fetched = await store.getReservationById(created.id);
      expect(fetched).not.toBeNull();
      expect(fetched?.vehicleSlug).toBe(VEHICLE_SLUG_7);
      expect(fetched?.customerId).toBe('customer-a');
    });
  });

  describe('Concurrency: two attempts on one vehicle must not both succeed', () => {
    it('accepts exactly one of two concurrent create attempts by different customers for the same vehicle', async () => {
      const [resultA, resultB] = await Promise.allSettled([
        store.createReservation('customer-a', 'a@example.com', { vehicleSlug: VEHICLE_SLUG_1 }),
        store.createReservation('customer-b', 'b@example.com', { vehicleSlug: VEHICLE_SLUG_1 }),
      ]);
      const outcomes = [resultA, resultB];
      const fulfilled = outcomes.filter((r) => r.status === 'fulfilled');
      const rejected = outcomes.filter((r) => r.status === 'rejected');
      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);
      expect((rejected[0] as PromiseRejectedResult).reason).toMatchObject({ statusCode: 409, reason: 'conflict' });
    });
  });

  describe('HTTP contract via Express app', () => {
    it('returns 401 for POST /api/v1/reservations without an authenticated identity (reason: unauthenticated)', async () => {
      const { server, port } = await startServer(store);
      try {
        const res = await fetch(`http://localhost:${port}/api/v1/reservations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vehicleSlug: VEHICLE_SLUG_1 }),
        });
        expect(res.status).toBe(401);
        const data = await res.json();
        expect(data.reason).toBe('unauthenticated');
      } finally {
        await new Promise((resolve) => server.close(resolve));
      }
    });

    it('returns 403 for POST /api/v1/reservations when authenticated as a role without create:reservation (reason: forbidden)', async () => {
      const { server, port } = await startServer(store);
      try {
        const res = await fetch(`http://localhost:${port}/api/v1/reservations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SALESPERSON_TOKEN}` },
          body: JSON.stringify({ vehicleSlug: VEHICLE_SLUG_1 }),
        });
        expect(res.status).toBe(403);
        const data = await res.json();
        expect(data.reason).toBe('forbidden');
      } finally {
        await new Promise((resolve) => server.close(resolve));
      }
    });

    it('returns 201 with the reservation for an authenticated CustomerBuyer', async () => {
      const { server, port } = await startServer(store);
      try {
        const res = await fetch(`http://localhost:${port}/api/v1/reservations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${CUSTOMER_A_TOKEN}` },
          body: JSON.stringify({ vehicleSlug: VEHICLE_SLUG_1 }),
        });
        expect(res.status).toBe(201);
        const data = (await res.json()) as ReservationResponse;
        expect(data.status).toBe('active');
        expect(data.customerId).toBe('customer-a');
        expect(data.holdHours).toBe(RESERVATION_HOLD_HOURS);
      } finally {
        await new Promise((resolve) => server.close(resolve));
      }
    });

    it('returns 404 with reason vehicle_not_found for an unknown vehicleSlug', async () => {
      const { server, port } = await startServer(store);
      try {
        const res = await fetch(`http://localhost:${port}/api/v1/reservations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${CUSTOMER_A_TOKEN}` },
          body: JSON.stringify({ vehicleSlug: 'not-a-real-vehicle' }),
        });
        expect(res.status).toBe(404);
        const data = await res.json();
        expect(data.reason).toBe('vehicle_not_found');
      } finally {
        await new Promise((resolve) => server.close(resolve));
      }
    });

    it('returns 409 with reason conflict when a different customer already holds an active reservation', async () => {
      const { server, port } = await startServer(store);
      try {
        const first = await fetch(`http://localhost:${port}/api/v1/reservations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${CUSTOMER_A_TOKEN}` },
          body: JSON.stringify({ vehicleSlug: VEHICLE_SLUG_1 }),
        });
        expect(first.status).toBe(201);

        const second = await fetch(`http://localhost:${port}/api/v1/reservations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${CUSTOMER_B_TOKEN}` },
          body: JSON.stringify({ vehicleSlug: VEHICLE_SLUG_1 }),
        });
        expect(second.status).toBe(409);
        const data = await second.json();
        expect(data.reason).toBe('conflict');
      } finally {
        await new Promise((resolve) => server.close(resolve));
      }
    });

    it('returns 409 with reason duplicate for a repeat attempt by the same customer on the same vehicle', async () => {
      const { server, port } = await startServer(store);
      try {
        const first = await fetch(`http://localhost:${port}/api/v1/reservations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${CUSTOMER_A_TOKEN}` },
          body: JSON.stringify({ vehicleSlug: VEHICLE_SLUG_1 }),
        });
        expect(first.status).toBe(201);

        const second = await fetch(`http://localhost:${port}/api/v1/reservations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${CUSTOMER_A_TOKEN}` },
          body: JSON.stringify({ vehicleSlug: VEHICLE_SLUG_1 }),
        });
        expect(second.status).toBe(409);
        const data = await second.json();
        expect(data.reason).toBe('duplicate');
      } finally {
        await new Promise((resolve) => server.close(resolve));
      }
    });

    it('returns 409 with reason vehicle_unavailable for an ineligible vehicle status', async () => {
      const { server, port } = await startServer(store);
      try {
        const res = await fetch(`http://localhost:${port}/api/v1/reservations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${CUSTOMER_A_TOKEN}` },
          body: JSON.stringify({ vehicleSlug: VEHICLE_SLUG_SOLD }),
        });
        expect(res.status).toBe(409);
        const data = await res.json();
        expect(data.reason).toBe('vehicle_unavailable');
      } finally {
        await new Promise((resolve) => server.close(resolve));
      }
    });

    it('returns 409 with reason limit_exceeded once the per-customer active-reservation ceiling is reached', async () => {
      const { server, port } = await startServer(store);
      try {
        const slugs = [VEHICLE_SLUG_1, VEHICLE_SLUG_3, VEHICLE_SLUG_4];
        for (const vehicleSlug of slugs) {
          const res = await fetch(`http://localhost:${port}/api/v1/reservations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${CUSTOMER_PLATINUM_TOKEN}` },
            body: JSON.stringify({ vehicleSlug }),
          });
          expect(res.status).toBe(201);
        }
        const overLimit = await fetch(`http://localhost:${port}/api/v1/reservations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${CUSTOMER_PLATINUM_TOKEN}` },
          body: JSON.stringify({ vehicleSlug: VEHICLE_SLUG_5 }),
        });
        expect(overLimit.status).toBe(409);
        const data = await overLimit.json();
        expect(data.reason).toBe('limit_exceeded');
      } finally {
        await new Promise((resolve) => server.close(resolve));
      }
    });

    it('accepts exactly one of two concurrent HTTP create requests for the same vehicle by different customers', async () => {
      const { server, port } = await startServer(store);
      try {
        const [resA, resB] = await Promise.all([
          fetch(`http://localhost:${port}/api/v1/reservations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${CUSTOMER_A_TOKEN}` },
            body: JSON.stringify({ vehicleSlug: VEHICLE_SLUG_1 }),
          }),
          fetch(`http://localhost:${port}/api/v1/reservations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${CUSTOMER_B_TOKEN}` },
            body: JSON.stringify({ vehicleSlug: VEHICLE_SLUG_1 }),
          }),
        ]);
        const statuses = [resA.status, resB.status].sort();
        expect(statuses).toEqual([201, 409]);
      } finally {
        await new Promise((resolve) => server.close(resolve));
      }
    });

    it('serves GET /api/v1/reservations/:id for the owning customer', async () => {
      const { server, port } = await startServer(store);
      try {
        const created = await fetch(`http://localhost:${port}/api/v1/reservations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${CUSTOMER_A_TOKEN}` },
          body: JSON.stringify({ vehicleSlug: VEHICLE_SLUG_1 }),
        });
        const { id } = (await created.json()) as ReservationResponse;

        const res = await fetch(`http://localhost:${port}/api/v1/reservations/${id}`, {
          headers: { Authorization: `Bearer ${CUSTOMER_A_TOKEN}` },
        });
        expect(res.status).toBe(200);
        const data = (await res.json()) as ReservationResponse;
        expect(data.id).toBe(id);
      } finally {
        await new Promise((resolve) => server.close(resolve));
      }
    });

    it('serves GET /api/v1/reservations/:id for a staff identity with read:leads', async () => {
      const { server, port } = await startServer(store);
      try {
        const created = await fetch(`http://localhost:${port}/api/v1/reservations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${CUSTOMER_A_TOKEN}` },
          body: JSON.stringify({ vehicleSlug: VEHICLE_SLUG_1 }),
        });
        const { id } = (await created.json()) as ReservationResponse;

        const res = await fetch(`http://localhost:${port}/api/v1/reservations/${id}`, {
          headers: { Authorization: `Bearer ${SALESPERSON_TOKEN}` },
        });
        expect(res.status).toBe(200);
      } finally {
        await new Promise((resolve) => server.close(resolve));
      }
    });

    it('returns 403 for GET /api/v1/reservations/:id when neither the owner nor staff', async () => {
      const { server, port } = await startServer(store);
      try {
        const created = await fetch(`http://localhost:${port}/api/v1/reservations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${CUSTOMER_A_TOKEN}` },
          body: JSON.stringify({ vehicleSlug: VEHICLE_SLUG_1 }),
        });
        const { id } = (await created.json()) as ReservationResponse;

        const res = await fetch(`http://localhost:${port}/api/v1/reservations/${id}`, {
          headers: { Authorization: `Bearer ${CUSTOMER_B_TOKEN}` },
        });
        expect(res.status).toBe(403);
      } finally {
        await new Promise((resolve) => server.close(resolve));
      }
    });

    it('returns 401 for GET /api/v1/reservations/:id without an authenticated identity', async () => {
      const { server, port } = await startServer(store);
      try {
        const created = await fetch(`http://localhost:${port}/api/v1/reservations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${CUSTOMER_A_TOKEN}` },
          body: JSON.stringify({ vehicleSlug: VEHICLE_SLUG_1 }),
        });
        const { id } = (await created.json()) as ReservationResponse;

        const res = await fetch(`http://localhost:${port}/api/v1/reservations/${id}`);
        expect(res.status).toBe(401);
      } finally {
        await new Promise((resolve) => server.close(resolve));
      }
    });

    it('returns 404 for GET /api/v1/reservations/:id with an unknown id', async () => {
      const { server, port } = await startServer(store);
      try {
        const res = await fetch(`http://localhost:${port}/api/v1/reservations/res-missing`, {
          headers: { Authorization: `Bearer ${CUSTOMER_A_TOKEN}` },
        });
        expect(res.status).toBe(404);
      } finally {
        await new Promise((resolve) => server.close(resolve));
      }
    });

    it('a __reset call clears reservations and the vehicle status so the vehicle can be reserved again', async () => {
      const { server, port } = await startServer(store);
      try {
        const first = await fetch(`http://localhost:${port}/api/v1/reservations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${CUSTOMER_A_TOKEN}` },
          body: JSON.stringify({ vehicleSlug: VEHICLE_SLUG_1 }),
        });
        expect(first.status).toBe(201);

        const resetRes = await fetch(`http://localhost:${port}/api/v1/__reset`, { method: 'POST' });
        expect(resetRes.status).toBe(200);

        const second = await fetch(`http://localhost:${port}/api/v1/reservations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${CUSTOMER_B_TOKEN}` },
          body: JSON.stringify({ vehicleSlug: VEHICLE_SLUG_1 }),
        });
        expect(second.status).toBe(201);
      } finally {
        await new Promise((resolve) => server.close(resolve));
      }
    });
  });
});
