import { describe, expect, it } from 'vitest';
import type { CustomerPayment, CustomerPaymentNotification } from '@carchief/domain';
import { getCustomerPaymentStatus } from '../PaymentsPage.js';

const payment: CustomerPayment = {
  id: 'pay-test', customerId: 'cust-123', invoiceId: 'inv-003', reference: 'TT-TEST', bankName: 'Customer bank', currency: 'USD',
  amountUsd: 500, paymentDate: '2026-08-14', status: 'Pending', idempotencyKey: 'idem-test', createdAt: '2026-08-14T00:00:00.000Z',
};

const event = (name: CustomerPaymentNotification['event']): CustomerPaymentNotification => ({
  id: `event-${name}`, customerId: 'cust-123', paymentId: 'pay-test', invoiceId: 'inv-003', event: name, deliveryStatus: 'Queued', createdAt: '2026-08-14T00:00:00.000Z',
});

describe('customer payment status projection', () => {
  it('maps server events to held, resubmitted, approved and allocated states', () => {
    expect(getCustomerPaymentStatus(payment, [event('PaymentHeld')])).toBe('Held');
    expect(getCustomerPaymentStatus(payment, [event('PaymentResubmitted')])).toBe('Resubmitted');
    expect(getCustomerPaymentStatus(payment, [event('PaymentApproved')])).toBe('Approved');
    expect(getCustomerPaymentStatus(payment, [event('PaymentAllocated')])).toBe('Allocated');
  });

  it('does not expose an event belonging to another payment', () => {
    expect(getCustomerPaymentStatus(payment, [{ ...event('PaymentHeld'), paymentId: 'pay-other' }])).toBe('Pending');
  });
});
