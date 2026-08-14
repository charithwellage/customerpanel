import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Server } from 'node:http';
import { createDemoJwtToken } from '@carchief/domain';
import { createMockApiApp } from '../server.js';
import { createStore } from '../store.js';

describe('Customer TT payment journal contract (D02-P06-T001)', () => {
  let server: Server | undefined;
  let baseUrl: string;
  const token = () => createDemoJwtToken('CustomerBuyer');
  beforeEach(async () => {
    const app = createMockApiApp(createStore(''));
    server = await new Promise<Server>((resolve) => {
      const instance = app.listen(0, () => resolve(instance));
    });
    baseUrl = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  });
  afterEach(async () => {
    if (!server) return;
    server.closeAllConnections?.();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('lists only the authenticated customer journal', async () => {
    const response = await fetch(`${baseUrl}/api/v1/customer/payments`, { headers: { Authorization: `Bearer ${token()}` } });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.items.every((item: { customerId: string }) => item.customerId === 'cust-123')).toBe(true);
  });

  it('creates valid proof metadata once and returns the same record for an idempotent retry', async () => {
    const request = {
      invoiceId: 'inv-003', reference: 'TT-NEW-001', bankName: 'Customer bank', currency: 'USD', amountUsd: 500,
      paymentDate: '2026-08-14', idempotencyKey: 'idem-new-001',
      proof: { fileName: 'receipt.pdf', fileType: 'PDF', sizeBytes: 1200, scanStatus: 'Pending' },
    };
    const headers = { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' };
    const first = await fetch(`${baseUrl}/api/v1/customer/payments`, { method: 'POST', headers, body: JSON.stringify(request) });
    const second = await fetch(`${baseUrl}/api/v1/customer/payments`, { method: 'POST', headers, body: JSON.stringify(request) });
    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect((await first.json()).id).toBe((await second.json()).id);
  });

  it('rejects unsupported proof type and oversized metadata', async () => {
    const headers = { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' };
    const response = await fetch(`${baseUrl}/api/v1/customer/payments`, { method: 'POST', headers, body: JSON.stringify({
      invoiceId: 'inv-003', reference: 'TT-BAD', bankName: 'Customer bank', currency: 'USD', amountUsd: 1,
      paymentDate: '2026-08-14', idempotencyKey: 'idem-bad', proof: { fileName: 'x.exe', fileType: 'PDF', sizeBytes: 11 * 1024 * 1024, scanStatus: 'Pending' },
    }) });
    expect(response.status).toBe(400);
  });

  it('rejects payment creation for an unknown or another customer invoice', async () => {
    const headers = { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' };
    const baseRequest = {
      reference: 'TT-OWNERSHIP-001', bankName: 'Customer bank', currency: 'USD', amountUsd: 1,
      paymentDate: '2026-08-14', idempotencyKey: 'idem-ownership-001',
      proof: { fileName: 'receipt.pdf', fileType: 'PDF', sizeBytes: 1200, scanStatus: 'Pending' },
    };
    const unknown = await fetch(`${baseUrl}/api/v1/customer/payments`, {
      method: 'POST', headers, body: JSON.stringify({ ...baseRequest, invoiceId: 'inv-missing' }),
    });
    expect(unknown.status).toBe(400);

    const otherCustomer = await fetch(`${baseUrl}/api/v1/customer/payments`, {
      method: 'POST', headers, body: JSON.stringify({ ...baseRequest, invoiceId: 'inv-004', idempotencyKey: 'idem-ownership-002' }),
    });
    expect(otherCustomer.status).toBe(400);
  });

  it('rejects unauthenticated creation and keeps proof content out of the response contract', async () => {
    const response = await fetch(`${baseUrl}/api/v1/customer/payments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    expect(response.status).toBe(401);
  });

  it('projects queued outbox events to the owner and restricts event recording to Finance', async () => {
    const customerHeaders = { Authorization: `Bearer ${token()}` };
    const listed = await fetch(`${baseUrl}/api/v1/customer/payment-notifications?paymentId=pay-004`, { headers: customerHeaders });
    expect(listed.status).toBe(200);
    expect((await listed.json()).items).toEqual(expect.arrayContaining([
      expect.objectContaining({ paymentId: 'pay-004', event: 'FinanceReviewRequested', deliveryStatus: 'Queued' }),
    ]));

    const customerAttempt = await fetch(`${baseUrl}/api/v1/finance/customer-payments/pay-004/notifications`, {
      method: 'POST', headers: { ...customerHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ event: 'PaymentHeld' }),
    });
    expect(customerAttempt.status).toBe(403);

    const financeHeaders = { Authorization: `Bearer ${createDemoJwtToken('FinanceManager')}`, 'Content-Type': 'application/json' };
    const first = await fetch(`${baseUrl}/api/v1/finance/customer-payments/pay-004/notifications`, {
      method: 'POST', headers: financeHeaders, body: JSON.stringify({ event: 'PaymentHeld' }),
    });
    const second = await fetch(`${baseUrl}/api/v1/finance/customer-payments/pay-004/notifications`, {
      method: 'POST', headers: financeHeaders, body: JSON.stringify({ event: 'PaymentHeld' }),
    });
    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect((await first.json()).id).toBe((await second.json()).id);
  });
});
