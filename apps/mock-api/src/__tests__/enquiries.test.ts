import { describe, it, expect, beforeEach } from 'vitest';
import type { Server } from 'node:http';
import { createStore } from '../store.js';
import { createMockApiApp } from '../server.js';
import type { EnquiryResponse } from '@carchief/domain';

// PUB-13, PUB-15, D01-P05-T004. The enquiry flow does not depend on
// DEC-PUB-FREIGHT-MODEL/DEC-PUB-CITY-DELIVERY (D01-ASM-001): a visitor can
// submit an enquiry about a vehicle, a shipping destination, or neither, and
// it is persisted with no computed monetary total ever attached (RULE-09).

const VALID_VEHICLE_SLUG = '2021-toyota-corolla-axio-veh-1';

async function startServer(store: ReturnType<typeof createStore>) {
  const app = createMockApiApp(store);
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const port = (server.address() as { port: number }).port;
  return { server, port };
}

describe('Quotation enquiry submission (PUB-13, PUB-15, D01-ASM-001)', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(async () => {
    store = createStore();
    await store.reset();
  });

  describe('DemoStore.createEnquiry', () => {
    it('persists a general enquiry with just contact fields and no vehicle/destination', async () => {
      const result = await store.createEnquiry({
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '+256700111222',
        message: 'I would like more information about your inventory.',
      });
      expect(result.status).toBe('received');
      expect(result.duplicate).toBe(false);
      expect(result.id).toBeTruthy();
      expect(result.receivedAt).toBeTruthy();
      expect(result.vehicleSlug).toBeUndefined();
      expect(result.estimateSnapshot).toBeUndefined();
    });

    it('persists a vehicle enquiry linked by slug', async () => {
      const result = await store.createEnquiry({
        name: 'John Smith',
        email: 'john@example.com',
        phone: '+256700333444',
        message: 'Is this vehicle still available?',
        vehicleSlug: VALID_VEHICLE_SLUG,
      });
      expect(result.vehicleSlug).toBe(VALID_VEHICLE_SLUG);
      expect(result.estimateSnapshot).toBeUndefined();
    });

    it('rejects an unknown vehicle slug with a field-associated 400', async () => {
      await expect(
        store.createEnquiry({
          name: 'John Smith',
          email: 'john@example.com',
          phone: '+256700333444',
          message: 'Is this vehicle still available?',
          vehicleSlug: 'not-a-real-vehicle',
        })
      ).rejects.toMatchObject({ statusCode: 400, field: 'vehicleSlug' });
    });

    it('persists a quotation enquiry linked to a destination/port pair with a server-resolved estimate snapshot', async () => {
      const result = await store.createEnquiry({
        name: 'Amara Okoye',
        email: 'amara@example.com',
        phone: '+256700555666',
        message: 'Please confirm shipping cost to Uganda.',
        vehicleSlug: VALID_VEHICLE_SLUG,
        destinationCode: 'UG',
        portCode: 'MBA',
      });
      expect(result.estimateSnapshot).toBeDefined();
      expect(result.estimateSnapshot?.destinationCode).toBe('UG');
      expect(result.estimateSnapshot?.portCode).toBe('MBA');
      expect(result.estimateSnapshot?.rateStatus).toBe('active');
      // RULE-09: the snapshot is lookup context only — never a monetary total.
      expect(result.estimateSnapshot).not.toHaveProperty('total');
      expect(result.estimateSnapshot).not.toHaveProperty('amount');
      expect(JSON.stringify(result)).not.toContain('950');
    });

    it('rejects destinationCode without portCode as a 400', async () => {
      await expect(
        store.createEnquiry({
          name: 'Amara Okoye',
          email: 'amara@example.com',
          phone: '+256700555666',
          message: 'Please confirm shipping cost to Uganda.',
          destinationCode: 'UG',
        })
      ).rejects.toMatchObject({ statusCode: 400, field: 'portCode' });
    });

    it('rejects an unsupported destination code as a 400', async () => {
      await expect(
        store.createEnquiry({
          name: 'Amara Okoye',
          email: 'amara@example.com',
          phone: '+256700555666',
          message: 'Please confirm shipping cost.',
          destinationCode: 'ZZ',
          portCode: 'MBA',
        })
      ).rejects.toMatchObject({ statusCode: 400, field: 'destinationCode' });
    });

    it('rejects a missing required field with a field-associated 400', async () => {
      await expect(
        store.createEnquiry({
          name: '',
          email: 'amara@example.com',
          phone: '+256700555666',
          message: 'Please confirm shipping cost.',
        })
      ).rejects.toMatchObject({ statusCode: 400, field: 'name' });
    });

    it('rejects an invalid email address as a 400', async () => {
      await expect(
        store.createEnquiry({
          name: 'Amara Okoye',
          email: 'not-an-email',
          phone: '+256700555666',
          message: 'Please confirm shipping cost.',
        })
      ).rejects.toMatchObject({ statusCode: 400, field: 'email' });
    });

    it('collapses an identical resubmission into the original receipt instead of creating a duplicate lead (RULE-08)', async () => {
      const request = {
        name: 'Amara Okoye',
        email: 'amara@example.com',
        phone: '+256700555666',
        message: 'Please confirm shipping cost to Uganda.',
        vehicleSlug: VALID_VEHICLE_SLUG,
        destinationCode: 'UG',
        portCode: 'MBA',
      };
      const first = await store.createEnquiry(request);
      expect(first.duplicate).toBe(false);

      const second = await store.createEnquiry(request);
      expect(second.duplicate).toBe(true);
      expect(second.id).toBe(first.id);
      expect(second.receivedAt).toBe(first.receivedAt);
    });

    it('treats a materially different message from the same visitor as a new enquiry, not a duplicate', async () => {
      const base = {
        name: 'Amara Okoye',
        email: 'amara@example.com',
        phone: '+256700555666',
        vehicleSlug: VALID_VEHICLE_SLUG,
      };
      const first = await store.createEnquiry({ ...base, message: 'First question.' });
      const second = await store.createEnquiry({ ...base, message: 'A completely different question.' });
      expect(second.duplicate).toBe(false);
      expect(second.id).not.toBe(first.id);
    });
  });

  describe('HTTP contract via Express app', () => {
    it('serves POST /api/v1/enquiries returning 201 with a receipt for a valid submission', async () => {
      const { server, port } = await startServer(store);
      try {
        const res = await fetch(`http://localhost:${port}/api/v1/enquiries`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Jane Doe',
            email: 'jane@example.com',
            phone: '+256700111222',
            message: 'I would like more information about your inventory.',
          }),
        });
        expect(res.status).toBe(201);
        const data = (await res.json()) as EnquiryResponse;
        expect(data.status).toBe('received');
        expect(data.duplicate).toBe(false);
        expect(data.id).toBeTruthy();
      } finally {
        await new Promise((resolve) => server.close(resolve));
      }
    });

    it('serves POST /api/v1/enquiries returning 200 with duplicate: true for a resubmission', async () => {
      const { server, port } = await startServer(store);
      try {
        const body = JSON.stringify({
          name: 'Jane Doe',
          email: 'jane@example.com',
          phone: '+256700111222',
          message: 'Same enquiry twice.',
        });
        const first = await fetch(`http://localhost:${port}/api/v1/enquiries`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
        });
        expect(first.status).toBe(201);

        const second = await fetch(`http://localhost:${port}/api/v1/enquiries`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
        });
        expect(second.status).toBe(200);
        const data = (await second.json()) as EnquiryResponse;
        expect(data.duplicate).toBe(true);
      } finally {
        await new Promise((resolve) => server.close(resolve));
      }
    });

    it('serves POST /api/v1/enquiries returning a 400 with a field for a missing required field', async () => {
      const { server, port } = await startServer(store);
      try {
        const res = await fetch(`http://localhost:${port}/api/v1/enquiries`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Jane Doe', email: 'jane@example.com', phone: '' , message: 'Hello' }),
        });
        expect(res.status).toBe(400);
        const data = (await res.json()) as { statusCode: number; message: string; correlationId: string; field?: string };
        expect(data.statusCode).toBe(400);
        expect(data.field).toBe('phone');
        expect(data.correlationId).toBeDefined();
      } finally {
        await new Promise((resolve) => server.close(resolve));
      }
    });

    it('a __reset call clears persisted enquiries so a prior submission is no longer a duplicate', async () => {
      const { server, port } = await startServer(store);
      try {
        const body = JSON.stringify({
          name: 'Jane Doe',
          email: 'jane@example.com',
          phone: '+256700111222',
          message: 'Reset test enquiry.',
        });
        const first = await fetch(`http://localhost:${port}/api/v1/enquiries`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
        });
        expect(first.status).toBe(201);

        const resetRes = await fetch(`http://localhost:${port}/api/v1/__reset`, { method: 'POST' });
        expect(resetRes.status).toBe(200);

        const second = await fetch(`http://localhost:${port}/api/v1/enquiries`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
        });
        expect(second.status).toBe(201);
        const data = (await second.json()) as EnquiryResponse;
        expect(data.duplicate).toBe(false);
      } finally {
        await new Promise((resolve) => server.close(resolve));
      }
    });
  });
});
