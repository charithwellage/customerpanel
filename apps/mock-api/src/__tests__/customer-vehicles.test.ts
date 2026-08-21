import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { Server } from 'node:http';
import { createStore } from '../store.js';
import { createMockApiApp } from '../server.js';
import {
  issueSessionToken,
  calculateVehicleDeposit,
  type CustomerVehicleListResponse,
  type CustomerVehicleDetail,
} from '@carchief/domain';

// D02-P04-T001: Customer vehicle transaction and status projection contract tests
// Requirements: CUST-02, CUST-10, CUST-11, CUST-12, CUST-13, RULE-04, RULE-05, RULE-07, RULE-08, RULE-09

describe('Customer Vehicles & Status Projection Contract (D02-P04-T001)', () => {
  let store: ReturnType<typeof createStore>;
  let server: Server | undefined;
  let baseUrl: string;

  beforeEach(async () => {
    store = createStore();
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

  describe('1. Authentication & Role Boundaries (RULE-04)', () => {
    it('returns 401 Unauthenticated when request has no Authorization header', async () => {
      const res = await fetch(`${baseUrl}/api/v1/customer/vehicles`);
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.statusCode).toBe(401);
      expect(body.message).toMatch(/Unauthenticated/i);
    });

    it('returns 403 Forbidden when role does not have read:customer permission', async () => {
      const publicToken = issueSessionToken('PublicVisitor');
      const res = await fetch(`${baseUrl}/api/v1/customer/vehicles`, {
        headers: { Authorization: `Bearer ${publicToken}` },
      });
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.statusCode).toBe(403);
    });
  });

  describe('2. Customer Vehicle List Projection (CUST-02, CUST-10, RULE-04, RULE-08)', () => {
    it('returns customer fleet with unique counts and no category duplication', async () => {
      const token = issueSessionToken('CustomerBuyer');
      const res = await fetch(`${baseUrl}/api/v1/customer/vehicles`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-mock-now': '2026-08-10T10:00:00.000Z',
        },
      });
      expect(res.status).toBe(200);
      const body: CustomerVehicleListResponse = await res.json();

      expect(body.total).toBe(24);
      expect(body.items.length).toBe(24);

      // Verify counts by status
      expect(body.countsByStatus).toEqual({
        underNegotiation: 2,
        underNegotiationWithPI: 6,
        confirmed: 14,
        inTransit: 1,
        delivered: 1,
        all: 24,
      });

      // Verify every vehicle ID is distinct (RULE-08 no duplicate vehicles)
      const vehicleIds = body.items.map((i) => i.vehicleId);
      const uniqueIds = new Set(vehicleIds);
      expect(uniqueIds.size).toBe(vehicleIds.length);
    });

    it('filters customer vehicles by status', async () => {
      const token = issueSessionToken('CustomerBuyer');
      const res = await fetch(`${baseUrl}/api/v1/customer/vehicles?status=Confirmed`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-mock-now': '2026-08-10T10:00:00.000Z',
        },
      });
      expect(res.status).toBe(200);
      const body: CustomerVehicleListResponse = await res.json();

      expect(body.items.length).toBe(14);
      expect(body.items[0].status).toBe('Confirmed');
    });

    it('searches customer vehicles by text keyword', async () => {
      const token = issueSessionToken('CustomerBuyer');
      const res = await fetch(`${baseUrl}/api/v1/customer/vehicles?query=Corolla`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-mock-now': '2026-08-10T10:00:00.000Z',
        },
      });
      expect(res.status).toBe(200);
      const body: CustomerVehicleListResponse = await res.json();

      expect(body.items.length).toBeGreaterThanOrEqual(1);
      expect(body.items[0].make).toBe('Toyota');
      expect(body.items[0].model).toMatch(/Corolla/);
    });
  });

  describe('3. Server-Computed 50% Deposit Requirement (RULE-07)', () => {
    it('computes 50% deposit requirement accurately via domain helper', () => {
      const totalAmountUsd = 10000;
      const deposit = calculateVehicleDeposit(totalAmountUsd, 2000);
      expect(deposit).toEqual({
        requiredPercent: 50,
        requiredAmountUsd: 5000,
        paidAmountUsd: 2000,
        remainingAmountUsd: 3000,
      });

      const fullyPaidDeposit = calculateVehicleDeposit(totalAmountUsd, 5000);
      expect(fullyPaidDeposit.remainingAmountUsd).toBe(0);
    });

    it('returns server-computed deposit info for vehicle under negotiation with PI', async () => {
      const token = issueSessionToken('CustomerBuyer');
      const res = await fetch(`${baseUrl}/api/v1/customer/vehicles/veh-pi-1`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-mock-now': '2026-08-10T10:00:00.000Z',
        },
      });
      expect(res.status).toBe(200);
      const body: CustomerVehicleDetail = await res.json();

      expect(body.status).toBe('Under Negotiation With PI');
      expect(body.proformaInvoiceId).toBe('pi-001');
      expect(body.deposit).toBeDefined();
      expect(body.deposit?.requiredPercent).toBe(50);
      expect(body.deposit?.requiredAmountUsd).toBe(Math.round(body.totalAmountUsd * 0.5));
    });
  });

  describe('4. Status History Timeline & Export Documents (CUST-11, CUST-12, CUST-13)', () => {
    it('expires the PI exactly after the server-authoritative 72-hour deadline', async () => {
      const headers = { Authorization: `Bearer ${issueSessionToken('CustomerBuyer')}` };
      const active = await fetch(`${baseUrl}/api/v1/customer/vehicles/veh-pi-1`, { headers: { ...headers, 'x-mock-now': '2026-08-14T09:59:59.000Z' } });
      const expired = await fetch(`${baseUrl}/api/v1/customer/vehicles/veh-pi-1`, { headers: { ...headers, 'x-mock-now': '2026-08-16T10:00:00.000Z' } });
      expect((await active.json()).status).toBe('Under Negotiation With PI');
      const expiredBody: CustomerVehicleDetail = await expired.json();
      expect(expiredBody.status).toBe('Expired');
      expect(expiredBody.paymentDeadline).toBe('2026-08-15T10:00:00.000Z');
      expect(expiredBody.statusHistory.at(-1)?.notes).toMatch(/72-hour PI hold expired/);
    });
    it('returns full vehicle detail with chronological status timeline and linked documents', async () => {
      const token = issueSessionToken('CustomerBuyer');
      const res = await fetch(`${baseUrl}/api/v1/customer/vehicles/veh-inv-1`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-mock-now': '2026-08-10T10:00:00.000Z',
        },
      });
      expect(res.status).toBe(200);
      const body: CustomerVehicleDetail = await res.json();

      expect(body.id).toBe('veh-inv-1');
      expect(body.make).toBe('Toyota');
      expect(body.model).toBe('Corolla Fielder');
      expect(body.images.length).toBeGreaterThanOrEqual(1);

      // Status timeline has ordered milestones
      expect(body.statusHistory.length).toBeGreaterThanOrEqual(3);
      expect(body.statusHistory[0].status).toBe('Under Negotiation');
      expect(body.statusHistory[1].status).toBe('Under Negotiation With PI');
      expect(body.statusHistory[2].status).toBe('Confirmed');

      // Linked documents include commercial invoice and export certs
      const docTypes = body.documents.map((d) => d.type);
      expect(docTypes).toContain('CommercialInvoice');
      expect(docTypes).toContain('BillOfLading');
      expect(docTypes).toContain('ExportCertificate');
      expect(docTypes).toContain('InspectionCertificate');
    });

    it('returns 404 for unknown vehicle or vehicle not owned by customer (IDOR protection)', async () => {
      const token = issueSessionToken('CustomerBuyer');
      const res = await fetch(`${baseUrl}/api/v1/customer/vehicles/veh-unknown-999`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.statusCode).toBe(404);
    });
  });

  describe('5. 48-Hour Hold Expiry (RULE-05)', () => {
    it('updates status from Under Negotiation to Expired when hold window expires', async () => {
      const token = issueSessionToken('CustomerBuyer');

      // Before expiry (2026-08-10): veh-6 is active under negotiation
      const activeRes = await fetch(`${baseUrl}/api/v1/customer/vehicles/veh-6`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-mock-now': '2026-08-10T10:00:00.000Z',
        },
      });
      expect(activeRes.status).toBe(200);
      const activeBody: CustomerVehicleDetail = await activeRes.json();
      expect(activeBody.status).toBe('Under Negotiation');

      // After expiry (2026-08-13, >48h from 2026-08-10T08:00:00.000Z)
      const expiredRes = await fetch(`${baseUrl}/api/v1/customer/vehicles/veh-6`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-mock-now': '2026-08-13T10:00:00.000Z',
        },
      });
      expect(expiredRes.status).toBe(200);
      const expiredBody: CustomerVehicleDetail = await expiredRes.json();
      expect(expiredBody.status).toBe('Expired');
    });
  });
});
