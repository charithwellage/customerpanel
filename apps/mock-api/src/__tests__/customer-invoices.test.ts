import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { Server } from 'node:http';
import { createStore } from '../store.js';
import { createMockApiApp } from '../server.js';
import {
  issueSessionToken,
  type CustomerInvoiceListResponse,
  type CustomerInvoiceDetail,
  type CustomerInvoiceDocument,
} from '@carchief/domain';

// D02-P05-T001: Customer PI & Invoice contracts with linked printable fixtures
// Requirements: CUST-02, CUST-14, CUST-15, CUST-16, CUST-21, RULE-01, RULE-04, RULE-08, RULE-10

describe('Customer Invoices & PI Contract (D02-P05-T001)', () => {
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
      const res = await fetch(`${baseUrl}/api/v1/customer/invoices`);
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.statusCode).toBe(401);
      expect(body.message).toMatch(/Unauthenticated/i);
    });

    it('returns 403 Forbidden when role does not have read:customer permission', async () => {
      const publicToken = issueSessionToken('PublicVisitor');
      const res = await fetch(`${baseUrl}/api/v1/customer/invoices`, {
        headers: { Authorization: `Bearer ${publicToken}` },
      });
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.statusCode).toBe(403);
      expect(body.message).toMatch(/Forbidden/i);
    });
  });

  describe('2. Customer Invoice Listing (CUST-02, CUST-14, CUST-15, RULE-04, RULE-08)', () => {
    it('returns customer invoices and proforma invoices with aggregate counts and totals for authenticated customer', async () => {
      const token = issueSessionToken('CustomerBuyer');
      const res = await fetch(`${baseUrl}/api/v1/customer/invoices`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(200);

      const body = (await res.json()) as CustomerInvoiceListResponse;
      expect(body).toHaveProperty('items');
      expect(body).toHaveProperty('total');
      expect(body).toHaveProperty('countsByType');
      expect(body).toHaveProperty('totals');

      // cust-123 has 3 commercial invoices (inv-001, inv-002, inv-003) and 1 proforma invoice (pi-001)
      expect(body.total).toBe(4);
      expect(body.countsByType).toEqual({
        all: 4,
        proforma: 1,
        commercial: 3,
      });

      // Totals check
      expect(body.totals.totalInvoicedUsd).toBe(50100.00); // 8500 + 14200 + 19500 + 7900 = 50100
      expect(body.totals.totalPaidUsd).toBe(12500.00); // 5500 + 7000 = 12500
      expect(body.totals.totalOutstandingUsd).toBe(37600.00); // 50100 - 12500 = 37600

      // All items must belong to cust-123 (RULE-04)
      for (const item of body.items) {
        expect(item.customerId).toBe('cust-123');
        expect(item).toHaveProperty('invoiceNumber');
        expect(item).toHaveProperty('type');
        expect(item).toHaveProperty('totalAmountUsd');
        expect(item).toHaveProperty('paidAmountUsd');
        expect(item).toHaveProperty('outstandingAmountUsd');
        expect(item).toHaveProperty('status');
      }
    });

    it('filters customer invoices by type (Proforma vs Commercial)', async () => {
      const token = issueSessionToken('CustomerBuyer');
      const piRes = await fetch(`${baseUrl}/api/v1/customer/invoices?type=Proforma`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(piRes.status).toBe(200);
      const piBody = (await piRes.json()) as CustomerInvoiceListResponse;
      expect(piBody.total).toBe(1);
      expect(piBody.items[0].type).toBe('Proforma');
      expect(piBody.items[0].id).toBe('pi-001');

      const commRes = await fetch(`${baseUrl}/api/v1/customer/invoices?type=Commercial`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(commRes.status).toBe(200);
      const commBody = (await commRes.json()) as CustomerInvoiceListResponse;
      expect(commBody.total).toBe(3);
      for (const item of commBody.items) {
        expect(item.type).toBe('Commercial');
      }
    });

    it('filters customer invoices by search query keyword', async () => {
      const token = issueSessionToken('CustomerBuyer');
      const res = await fetch(`${baseUrl}/api/v1/customer/invoices?query=HiAce`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as CustomerInvoiceListResponse;
      expect(body.total).toBe(1);
      expect(body.items[0].model).toBe('HiAce Van');
      expect(body.items[0].id).toBe('inv-002');
    });

    it('filters customer invoices by status', async () => {
      const token = issueSessionToken('CustomerBuyer');
      const res = await fetch(`${baseUrl}/api/v1/customer/invoices?status=PartiallyPaid`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as CustomerInvoiceListResponse;
      expect(body.items.length).toBeGreaterThan(0);
      for (const item of body.items) {
        expect(item.status).toBe('PartiallyPaid');
      }
    });
  });

  describe('3. Customer Invoice Detail & Calculations (CUST-14, CUST-15, CUST-16, CUST-21, RULE-04, RULE-07)', () => {
    it('returns full commercial invoice detail with authoritative totals and allocations', async () => {
      const token = issueSessionToken('CustomerBuyer');
      const res = await fetch(`${baseUrl}/api/v1/customer/invoices/inv-001`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(200);

      const body = (await res.json()) as CustomerInvoiceDetail;
      expect(body.id).toBe('inv-001');
      expect(body.invoiceNumber).toBe('INV-0001');
      expect(body.type).toBe('Commercial');
      expect(body.customerId).toBe('cust-123');
      expect(body.totalAmountUsd).toBe(8500.00);
      expect(body.paidAmountUsd).toBe(5500.00);
      expect(body.outstandingAmountUsd).toBe(3000.00);
      expect(body.status).toBe('PartiallyPaid');

      // Vehicle detail
      expect(body.vehicle).toBeDefined();
      expect(body.vehicle.make).toBe('Toyota');
      expect(body.vehicle.model).toBe('Corolla Axio');
      expect(body.vehicle.chassisNumber).toBe('NZE141-1234567');

      // Line items
      expect(body.lineItems).toBeInstanceOf(Array);
      expect(body.lineItems).toEqual([]);

      // Allocations
      expect(body.allocations).toBeInstanceOf(Array);
      expect(body.allocations.length).toBe(2);
      expect(body.allocations[0].amountUsd).toBe(2000.00);
      expect(body.allocations[1].amountUsd).toBe(3500.00);

      // Bank instructions are intentionally unavailable until Finance supplies approved details.
      expect(body.bankDetails).toBeUndefined();
    });

    it('returns full proforma invoice detail with 72h payment deadline and 50% deposit requirement (RULE-07)', async () => {
      const token = issueSessionToken('CustomerBuyer');
      const res = await fetch(`${baseUrl}/api/v1/customer/invoices/pi-001`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-mock-now': '2026-08-10T10:00:00.000Z',
        },
      });
      expect(res.status).toBe(200);

      const body = (await res.json()) as CustomerInvoiceDetail;
      expect(body.id).toBe('pi-001');
      expect(body.invoiceNumber).toBe('PI-0001');
      expect(body.type).toBe('Proforma');
      expect(body.customerId).toBe('cust-123');
      expect(body.totalAmountUsd).toBe(7900.00);
      expect(body.depositRequiredUsd).toBe(3950.00); // 50% of 7900 under RULE-07
      expect(body.paymentDeadline).toBeDefined();
      expect(body.isExpired).toBe(false);

      // Line items
      expect(body.lineItems).toBeInstanceOf(Array);
      expect(body.lineItems).toEqual([]);
    });

    it('enforces IDOR isolation and returns 404 when customer accesses an invoice owned by another customer (RULE-04)', async () => {
      const token = issueSessionToken('CustomerBuyer');
      // inv-004 is owned by cust-exception-001, not cust-123
      const res = await fetch(`${baseUrl}/api/v1/customer/invoices/inv-004`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.statusCode).toBe(404);
    });

    it('returns 404 for a non-existent invoice identifier', async () => {
      const token = issueSessionToken('CustomerBuyer');
      const res = await fetch(`${baseUrl}/api/v1/customer/invoices/inv-non-existent-999`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.statusCode).toBe(404);
    });

    it('correctly projects expired PI status when evaluated past the 72h deadline', async () => {
      const token = issueSessionToken('CustomerBuyer');
      // Send x-mock-now header set to future time past deadline
      const futureISO = '2026-08-25T10:00:00.000Z';
      const res = await fetch(`${baseUrl}/api/v1/customer/invoices/pi-001`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-mock-now': futureISO,
        },
      });
      expect(res.status).toBe(200);

      const body = (await res.json()) as CustomerInvoiceDetail;
      expect(body.id).toBe('pi-001');
      expect(body.isExpired).toBe(true);
      expect(body.status).toBe('Expired');
    });
  });

  describe('4. Printable Document Projections (CUST-16, RULE-04)', () => {
    it('returns authorized printable/downloadable document projection for customer invoice', async () => {
      const token = issueSessionToken('CustomerBuyer');
      const res = await fetch(`${baseUrl}/api/v1/customer/invoices/inv-001/document`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(200);

      const body = (await res.json()) as CustomerInvoiceDocument;
      expect(body.documentId).toBe('doc-inv-001');
      expect(body.invoiceId).toBe('inv-001');
      expect(body.invoiceNumber).toBe('INV-0001');
      expect(body.type).toBe('Commercial');
      expect(body.title).toContain('Commercial Invoice INV-0001');
      expect(body.contentHtml).toContain('CarChief International Co., Ltd.');
      expect(body.contentHtml).toContain('INV-0001');
      expect(body.contentHtml).toContain('Bank instructions are unavailable pending Finance confirmation');
      expect(body.contentHtml).not.toContain('MUFG Bank');
      expect(body.status).toBe('Available');
      expect(body.generatedAt).toBeDefined();
    });

    it('returns 404 for document request of another customer invoice (RULE-04 IDOR)', async () => {
      const token = issueSessionToken('CustomerBuyer');
      const res = await fetch(`${baseUrl}/api/v1/customer/invoices/inv-004/document`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(404);
    });
  });
});
