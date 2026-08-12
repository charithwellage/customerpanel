import { describe, it, expect, beforeEach } from 'vitest';
import type { Server } from 'node:http';
import { createStore } from '../store.js';
import { createMockApiApp } from '../server.js';
import type { EnquiryResponse, LeadRecord, LeadListResponse } from '@carchief/domain';
import { createDemoJwtToken } from '@carchief/domain';

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
        consent: true,
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
        consent: true,
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
          consent: true,
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
        consent: true,
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
          consent: true,
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
          consent: true,
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
          consent: true,
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
          consent: true,
          email: 'not-an-email',
          phone: '+256700555666',
          message: 'Please confirm shipping cost.',
        })
      ).rejects.toMatchObject({ statusCode: 400, field: 'email' });
    });

    it('collapses an identical resubmission into the original receipt instead of creating a duplicate lead (RULE-08)', async () => {
      const request = {
        name: 'Amara Okoye',
        consent: true,
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
        consent: true,
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
            consent: true,
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
          consent: true,
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
          consent: true,
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

  // Phase 1.6 (D01-P06-T001): enquiry type / contact-source metadata (PUB-28,
  // PUB-34) and the staff-facing lead read-by-ID/list proof operation
  // (PUB-16) — the explicit regression fix for the POC disconnected-lead
  // defect.
  describe('Lead and enquiry contracts (PUB-13, PUB-14, PUB-16, PUB-28, PUB-34, D01-P06-T001)', () => {
    describe('enquiryType / source persistence', () => {
      it('defaults enquiryType to general and source to form when omitted', async () => {
        const result = await store.createEnquiry({
          name: 'Jane Doe',
          consent: true,
          email: 'jane@example.com',
          phone: '+256700111222',
          message: 'General enquiry about your inventory.',
        });
        expect(result.enquiryType).toBe('general');
        expect(result.source).toBe('form');
      });

      it('defaults enquiryType to vehicle when a vehicleSlug is supplied without an explicit type', async () => {
        const result = await store.createEnquiry({
          name: 'John Smith',
          consent: true,
          email: 'john@example.com',
          phone: '+256700333444',
          message: 'Is this vehicle still available?',
          vehicleSlug: VALID_VEHICLE_SLUG,
        });
        expect(result.enquiryType).toBe('vehicle');
      });

      it('preserves an explicit price-request enquiryType and whatsapp source', async () => {
        const result = await store.createEnquiry({
          name: 'Amara Okoye',
          consent: true,
          email: 'amara@example.com',
          phone: '+256700555666',
          message: 'What is the best price for this vehicle?',
          vehicleSlug: VALID_VEHICLE_SLUG,
          enquiryType: 'price-request',
          source: 'whatsapp',
        });
        expect(result.enquiryType).toBe('price-request');
        expect(result.source).toBe('whatsapp');
      });

      it('preserves an explicit premium-vehicle enquiryType (PUB-34)', async () => {
        const result = await store.createEnquiry({
          name: 'Amara Okoye',
          consent: true,
          email: 'amara+premium@example.com',
          phone: '+256700555666',
          message: 'Please tell me more about this Premium Stock vehicle.',
          vehicleSlug: VALID_VEHICLE_SLUG,
          enquiryType: 'premium-vehicle',
        });
        expect(result.enquiryType).toBe('premium-vehicle');
      });

      it('rejects an unsupported enquiryType as a field-associated 400', async () => {
        await expect(
          store.createEnquiry({
            name: 'Amara Okoye',
            consent: true,
            email: 'amara@example.com',
            phone: '+256700555666',
            message: 'Hello',
            // @ts-expect-error deliberately invalid for the validation test
            enquiryType: 'not-a-real-type',
          })
        ).rejects.toMatchObject({ statusCode: 400, field: 'enquiryType' });
      });

      it('rejects an unsupported source as a field-associated 400', async () => {
        await expect(
          store.createEnquiry({
            name: 'Amara Okoye',
            consent: true,
            email: 'amara@example.com',
            phone: '+256700555666',
            message: 'Hello',
            // @ts-expect-error deliberately invalid for the validation test
            source: 'carrier-pigeon',
          })
        ).rejects.toMatchObject({ statusCode: 400, field: 'source' });
      });

      it('treats an otherwise-identical enquiry with a different enquiryType as a distinct lead, not a duplicate', async () => {
        const base = {
          name: 'Amara Okoye',
          consent: true,
          email: 'amara@example.com',
          phone: '+256700555666',
          message: 'Please confirm shipping cost to Uganda.',
          vehicleSlug: VALID_VEHICLE_SLUG,
        };
        const first = await store.createEnquiry({ ...base, enquiryType: 'vehicle' });
        const second = await store.createEnquiry({ ...base, enquiryType: 'price-request' });
        expect(second.duplicate).toBe(false);
        expect(second.id).not.toBe(first.id);
      });
    });

    // D01-P06-T002 (PUB-14): consent validated beyond a browser's own native
    // checkbox check — the server rejects any submission that does not
    // explicitly agree, never inferring or defaulting it.
    describe('consent (D01-P06-T002, PUB-14)', () => {
      it('rejects a submission with consent omitted as a field-associated 400', async () => {
        await expect(
          store.createEnquiry({
            name: 'Jane Doe',
            email: 'jane@example.com',
            phone: '+256700111222',
            message: 'General enquiry.',
          } as never)
        ).rejects.toMatchObject({ statusCode: 400, field: 'consent' });
      });

      it('rejects a submission with consent explicitly false as a field-associated 400', async () => {
        await expect(
          store.createEnquiry({
            name: 'Jane Doe',
            consent: false,
            email: 'jane@example.com',
            phone: '+256700111222',
            message: 'General enquiry.',
          } as never)
        ).rejects.toMatchObject({ statusCode: 400, field: 'consent' });
      });

      it('accepts a submission with consent explicitly true and persists it on the staff-visible lead', async () => {
        const receipt = await store.createEnquiry({
          name: 'Jane Doe',
          consent: true,
          email: 'jane@example.com',
          phone: '+256700111222',
          message: 'General enquiry.',
        });
        const lead = await store.getLeadById(receipt.id);
        expect((lead as LeadRecord).consent).toBe(true);
      });
    });

    // D01-P06-T002 "In scope": optional vehicle-preference capture for a
    // visitor with no specific vehicle in mind yet. Informal intent only —
    // never inferred, never a saved search or matching guarantee.
    describe('vehicle-preference capture (D01-P06-T002)', () => {
      it('persists an optional vehicle preference on the staff-visible lead', async () => {
        const receipt = await store.createEnquiry({
          name: 'Jane Doe',
          consent: true,
          email: 'jane@example.com',
          phone: '+256700111222',
          message: 'Looking for a specific type of vehicle.',
          preferredMake: 'Toyota',
          preferredModel: 'Corolla',
          preferredDriveSide: 'right',
          preferredYear: 2021,
          targetPriceUsd: 12000,
        });
        const lead = await store.getLeadById(receipt.id);
        expect((lead as LeadRecord).preferredMake).toBe('Toyota');
        expect((lead as LeadRecord).preferredModel).toBe('Corolla');
        expect((lead as LeadRecord).preferredDriveSide).toBe('right');
        expect((lead as LeadRecord).preferredYear).toBe(2021);
        expect((lead as LeadRecord).targetPriceUsd).toBe(12000);
      });

      it('omits vehicle-preference fields entirely when not supplied, never fabricating a default', async () => {
        const receipt = await store.createEnquiry({
          name: 'Jane Doe',
          consent: true,
          email: 'jane@example.com',
          phone: '+256700111222',
          message: 'General enquiry.',
        });
        const lead = await store.getLeadById(receipt.id);
        expect((lead as LeadRecord).preferredMake).toBeUndefined();
        expect((lead as LeadRecord).preferredYear).toBeUndefined();
        expect((lead as LeadRecord).targetPriceUsd).toBeUndefined();
      });

      it('rejects an unsupported preferredDriveSide as a field-associated 400', async () => {
        await expect(
          store.createEnquiry({
            name: 'Jane Doe',
            consent: true,
            email: 'jane@example.com',
            phone: '+256700111222',
            message: 'General enquiry.',
            // @ts-expect-error deliberately invalid for the validation test
            preferredDriveSide: 'center',
          })
        ).rejects.toMatchObject({ statusCode: 400, field: 'preferredDriveSide' });
      });

      it('rejects a preferredYear outside the sane range as a field-associated 400', async () => {
        await expect(
          store.createEnquiry({
            name: 'Jane Doe',
            consent: true,
            email: 'jane@example.com',
            phone: '+256700111222',
            message: 'General enquiry.',
            preferredYear: 1899,
          })
        ).rejects.toMatchObject({ statusCode: 400, field: 'preferredYear' });
      });

      it('rejects a negative targetPriceUsd as a field-associated 400', async () => {
        await expect(
          store.createEnquiry({
            name: 'Jane Doe',
            consent: true,
            email: 'jane@example.com',
            phone: '+256700111222',
            message: 'General enquiry.',
            targetPriceUsd: -100,
          })
        ).rejects.toMatchObject({ statusCode: 400, field: 'targetPriceUsd' });
      });

      it('two otherwise-identical enquiries with different target prices are distinct leads, not deduped', async () => {
        const base = {
          name: 'Jane Doe',
          consent: true,
          email: 'jane@example.com',
          phone: '+256700111222',
          message: 'Looking for a specific type of vehicle.',
        };
        const first = await store.createEnquiry({ ...base, targetPriceUsd: 10000 });
        const second = await store.createEnquiry({ ...base, targetPriceUsd: 15000 });
        expect(second.duplicate).toBe(false);
        expect(second.id).not.toBe(first.id);
      });
    });

    describe('DemoStore.getLeadById / listLeads (PUB-16 staff-boundary regression)', () => {
      it('returns null for an unknown lead id', async () => {
        const lead = await store.getLeadById('not-a-real-id');
        expect(lead).toBeNull();
      });

      it('makes a submitted enquiry retrievable by id through the staff-facing lead boundary, carrying full contact fields', async () => {
        const receipt = await store.createEnquiry({
          name: 'Jane Doe',
          consent: true,
          email: 'jane@example.com',
          phone: '+256700111222',
          message: 'General enquiry about your inventory.',
        });
        const lead = await store.getLeadById(receipt.id);
        expect(lead).not.toBeNull();
        expect((lead as LeadRecord).id).toBe(receipt.id);
        expect((lead as LeadRecord).name).toBe('Jane Doe');
        expect((lead as LeadRecord).email).toBe('jane@example.com');
        expect((lead as LeadRecord).status).toBe('New');
        expect((lead as LeadRecord).duplicateResubmissionCount).toBe(0);
      });

      it('lists every persisted lead and increments duplicateResubmissionCount on an identical resubmission (audit/activity intent)', async () => {
        const request = {
          name: 'Amara Okoye',
          consent: true,
          email: 'amara@example.com',
          phone: '+256700555666',
          message: 'Please confirm shipping cost to Uganda.',
        };
        const first = await store.createEnquiry(request);
        await store.createEnquiry(request);
        await store.createEnquiry(request);

        const list = await store.listLeads();
        expect(list.total).toBe(1);
        expect(list.items).toHaveLength(1);
        expect(list.items[0].id).toBe(first.id);
        expect(list.items[0].duplicateResubmissionCount).toBe(2);
      });

      it('lists multiple distinct leads', async () => {
        await store.createEnquiry({ name: 'A', email: 'a@example.com', phone: '+256700000001', message: 'First enquiry.', consent: true });
        await store.createEnquiry({ name: 'B', email: 'b@example.com', phone: '+256700000002', message: 'Second enquiry.', consent: true });
        const list = await store.listLeads();
        expect(list.total).toBe(2);
      });
    });

    describe('HTTP contract: staff-facing GET /api/v1/enquiries and /api/v1/enquiries/:id', () => {
      it('returns 401 for GET /api/v1/enquiries without an authenticated identity', async () => {
        const { server, port } = await startServer(store);
        try {
          const res = await fetch(`http://localhost:${port}/api/v1/enquiries`);
          expect(res.status).toBe(401);
        } finally {
          await new Promise((resolve) => server.close(resolve));
        }
      });

      it('returns 403 for GET /api/v1/enquiries when authenticated as a role without read:leads', async () => {
        const { server, port } = await startServer(store);
        try {
          const token = createDemoJwtToken('CustomerBuyer');
          const res = await fetch(`http://localhost:${port}/api/v1/enquiries`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          expect(res.status).toBe(403);
        } finally {
          await new Promise((resolve) => server.close(resolve));
        }
      });

      it('returns 200 with the full lead list for an authenticated Salesperson (read:leads)', async () => {
        const { server, port } = await startServer(store);
        try {
          await fetch(`http://localhost:${port}/api/v1/enquiries`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: 'Jane Doe',
              consent: true,
              email: 'jane@example.com',
              phone: '+256700111222',
              message: 'General enquiry about your inventory.',
            }),
          });

          const token = createDemoJwtToken('Salesperson');
          const res = await fetch(`http://localhost:${port}/api/v1/enquiries`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          expect(res.status).toBe(200);
          const data = (await res.json()) as LeadListResponse;
          expect(data.total).toBe(1);
          expect(data.items[0].name).toBe('Jane Doe');
        } finally {
          await new Promise((resolve) => server.close(resolve));
        }
      });

      it('serves GET /api/v1/enquiries/:id returning the submitted enquiry through the staff boundary (POC disconnected-lead regression)', async () => {
        const { server, port } = await startServer(store);
        try {
          const createRes = await fetch(`http://localhost:${port}/api/v1/enquiries`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: 'John Smith',
              consent: true,
              email: 'john@example.com',
              phone: '+256700333444',
              message: 'Is this vehicle still available?',
              vehicleSlug: VALID_VEHICLE_SLUG,
            }),
          });
          const created = (await createRes.json()) as EnquiryResponse;

          const token = createDemoJwtToken('Salesperson');
          const res = await fetch(`http://localhost:${port}/api/v1/enquiries/${created.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          expect(res.status).toBe(200);
          const lead = (await res.json()) as LeadRecord;
          expect(lead.id).toBe(created.id);
          expect(lead.vehicleSlug).toBe(VALID_VEHICLE_SLUG);
          expect(lead.email).toBe('john@example.com');
        } finally {
          await new Promise((resolve) => server.close(resolve));
        }
      });

      it('returns 404 for GET /api/v1/enquiries/:id with an unknown id', async () => {
        const { server, port } = await startServer(store);
        try {
          const token = createDemoJwtToken('Salesperson');
          const res = await fetch(`http://localhost:${port}/api/v1/enquiries/not-a-real-id`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          expect(res.status).toBe(404);
        } finally {
          await new Promise((resolve) => server.close(resolve));
        }
      });

      it('a __reset call clears leads so the staff-facing list returns empty', async () => {
        const { server, port } = await startServer(store);
        try {
          await fetch(`http://localhost:${port}/api/v1/enquiries`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: 'Jane Doe',
              consent: true,
              email: 'jane@example.com',
              phone: '+256700111222',
              message: 'General enquiry about your inventory.',
            }),
          });

          const resetRes = await fetch(`http://localhost:${port}/api/v1/__reset`, { method: 'POST' });
          expect(resetRes.status).toBe(200);

          const token = createDemoJwtToken('Salesperson');
          const res = await fetch(`http://localhost:${port}/api/v1/enquiries`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = (await res.json()) as LeadListResponse;
          expect(data.total).toBe(0);
        } finally {
          await new Promise((resolve) => server.close(resolve));
        }
      });
    });
  });
});
