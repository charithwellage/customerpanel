import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Server } from 'node:http';
import { issueSessionToken } from '@carchief/domain';
import { createMockApiApp } from '../server.js';
import { createStore } from '../store.js';

describe('Customer TT payment journal contract (D02-P06-T001)', () => {
  let server: Server | undefined;
  let baseUrl: string;
  const token = () => issueSessionToken('CustomerBuyer');
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

  it('returns distinct review, held, approved, and rejected payment statuses', async () => {
    const response = await fetch(`${baseUrl}/api/v1/customer/payments`, { headers: { Authorization: `Bearer ${token()}` } });
    const body = await response.json();
    const statuses = new Set(body.items.map((item: { status: string }) => item.status));
    expect(statuses).toEqual(new Set(['Approved', 'Pending', 'Held', 'Rejected']));
    expect(body.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ status: 'Held', financeNote: expect.stringContaining('beneficiary bank confirmation') }),
      expect.objectContaining({ status: 'Rejected', financeNote: expect.stringContaining('verifiable bank reference') }),
    ]));
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
      expect.objectContaining({ paymentId: 'pay-004', event: 'FinanceReviewRequested' }),
    ]));

    const customerAttempt = await fetch(`${baseUrl}/api/v1/finance/customer-payments/pay-004/notifications`, {
      method: 'POST', headers: { ...customerHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ event: 'PaymentHeld' }),
    });
    expect(customerAttempt.status).toBe(403);

    const financeHeaders = { Authorization: `Bearer ${issueSessionToken('FinanceManager')}`, 'Content-Type': 'application/json' };
    const missingReason = await fetch(`${baseUrl}/api/v1/finance/customer-payments/pay-004/notifications`, {
      method: 'POST', headers: financeHeaders, body: JSON.stringify({ event: 'PaymentHeld' }),
    });
    expect(missingReason.status).toBe(400);
    const first = await fetch(`${baseUrl}/api/v1/finance/customer-payments/pay-004/notifications`, {
      method: 'POST', headers: financeHeaders, body: JSON.stringify({ event: 'PaymentHeld', reason: 'Proof image is unreadable' }),
    });
    const second = await fetch(`${baseUrl}/api/v1/finance/customer-payments/pay-004/notifications`, {
      method: 'POST', headers: financeHeaders, body: JSON.stringify({ event: 'PaymentHeld', reason: 'Proof image is unreadable' }),
    });
    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect((await first.json()).id).toBe((await second.json()).id);
  });

  it('supports owner-only resubmission and idempotent approval/allocation with reconciled balances', async () => {
    const customerHeaders = { Authorization: `Bearer ${token()}` };
    const financeHeaders = { Authorization: `Bearer ${issueSessionToken('FinanceManager')}`, 'Content-Type': 'application/json' };
    const hold = await fetch(`${baseUrl}/api/v1/finance/customer-payments/pay-004/notifications`, { method: 'POST', headers: financeHeaders, body: JSON.stringify({ event: 'PaymentHeld', reason: 'Awaiting bank confirmation' }) });
    expect(hold.status).toBe(201);
    const otherCustomer = await fetch(`${baseUrl}/api/v1/customer/payments/pay-004/resubmit`, { method: 'POST', headers: { Authorization: `Bearer ${issueSessionToken('CustomerBuyer', 'cust-999')}` } });
    expect(otherCustomer.status).toBe(404);
    const resubmit = await fetch(`${baseUrl}/api/v1/customer/payments/pay-004/resubmit`, { method: 'POST', headers: customerHeaders });
    const repeated = await fetch(`${baseUrl}/api/v1/customer/payments/pay-004/resubmit`, { method: 'POST', headers: customerHeaders });
    expect(resubmit.status).toBe(200);
    expect(repeated.status).toBe(200);
    expect((await resubmit.json()).status).toBe('Resubmitted');
    expect((await repeated.json()).status).toBe('Resubmitted');

    const approved = await fetch(`${baseUrl}/api/v1/finance/customer-payments/pay-004/notifications`, { method: 'POST', headers: financeHeaders, body: JSON.stringify({ event: 'PaymentApproved' }) });
    const allocated = await fetch(`${baseUrl}/api/v1/finance/customer-payments/pay-004/notifications`, { method: 'POST', headers: financeHeaders, body: JSON.stringify({ event: 'PaymentAllocated', allocationAmountUsd: 1000 }) });
    const allocatedAgain = await fetch(`${baseUrl}/api/v1/finance/customer-payments/pay-004/notifications`, { method: 'POST', headers: financeHeaders, body: JSON.stringify({ event: 'PaymentAllocated', allocationAmountUsd: 1000 }) });
    expect(approved.status).toBe(201);
    expect(allocated.status).toBe(201);
    expect(allocatedAgain.status).toBe(201);
    expect((await allocated.json()).id).toBe((await allocatedAgain.json()).id);
    const payment = await (await fetch(`${baseUrl}/api/v1/customer/payments/pay-004`, { headers: customerHeaders })).json();
    expect(payment.status).toBe('Approved');
    expect(payment.allocatedAmountUsd).toBe(1000);
    expect(payment.remainingBalanceUsd).toBe(8690);
    const events = await (await fetch(`${baseUrl}/api/v1/customer/payment-notifications?paymentId=pay-004`, { headers: customerHeaders })).json();
    expect(events.items.filter((item: { event: string }) => item.event === 'PaymentAllocated')).toHaveLength(1);
  });
});
