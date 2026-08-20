import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { CustomerPayment, CustomerPaymentNotification } from '@carchief/domain';
import { CustomerShellProvider } from '../../shell/index.js';
import { HttpClientProvider } from '../../account/index.js';
import { getCustomerPaymentStatus, PaymentsPage } from '../PaymentsPage.js';
import { PaymentDetailModal } from '../components/PaymentDetailModal.js';
import { PaymentAllocationHistoryModal } from '../components/PaymentAllocationHistoryModal.js';
import { DebitCreditRefundTab, SEED_DEBIT_CREDIT_RECORDS } from '../components/DebitCreditRefundTab.js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const MOCK_USER = {
  id: 'cust-123',
  name: 'Charith Wellage',
  email: 'charith.wellage@carchief.com',
  role: 'CUSTOMER' as const,
};

const payment: CustomerPayment = {
  id: 'pay-test',
  customerId: 'cust-123',
  invoiceId: 'inv-003',
  reference: 'TT-TEST',
  bankName: 'Customer bank',
  currency: 'USD',
  amountUsd: 500,
  paymentDate: '2026-08-14',
  status: 'Pending',
  idempotencyKey: 'idem-test',
  createdAt: '2026-08-14T00:00:00.000Z',
};

const event = (name: CustomerPaymentNotification['event']): CustomerPaymentNotification => ({
  id: `event-${name}`,
  customerId: 'cust-123',
  paymentId: 'pay-test',
  invoiceId: 'inv-003',
  event: name,
  deliveryStatus: 'Queued',
  createdAt: '2026-08-14T00:00:00.000Z',
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

describe('FRD Phase 4: My Payments & Debit/Credit Components', () => {
  it('renders PaymentsPage with sub-tabs, KPI cards, and TT Remittance table', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(
          CustomerShellProvider,
          { initialUser: MOCK_USER, initialRoute: '/payments' },
          React.createElement(
            HttpClientProvider,
            { apiBaseUrl: 'http://127.0.0.1:4000' },
            React.createElement(PaymentsPage)
          )
        )
      )
    );

    expect(html).toContain('data-testid="customer-payments-page"');
    expect(html).toContain('data-testid="tab-payments"');
    expect(html).toContain('data-testid="tab-debit-credit"');
    expect(html).toContain('TOTAL TT AMOUNT');
    expect(html).toContain('TOTAL ALLOCATED');
    expect(html).toContain('TOTAL AVAILABLE');
    expect(html).toContain('CUSTOMER TT REMITTANCE JOURNAL');
    expect(html).toContain('data-testid="btn-detail-TT2400005"');
    expect(html).toContain('data-testid="btn-history-TT2400005"');
  });

  it('renders PaymentDetailModal (Eye icon pop up) with full banking metadata and downloads', () => {
    const html = renderToStaticMarkup(
      React.createElement(PaymentDetailModal, {
        isOpen: true,
        onClose: () => {},
        payment: {
          id: 'pay-detail-1',
          reference: 'TT2400005',
          createdDate: '2024-10-20',
          receivingBank: 'Mizuho Bank Tokyo',
          depositorName: 'Depositor1',
          customerName: 'Charith Wellage',
          currency: 'USD',
          ttAmount: 100000,
          approvedDate: '2024-10-20',
        },
      })
    );

    expect(html).toContain('data-testid="payment-detail-modal"');
    expect(html).toContain('TT2400005');
    expect(html).toContain('Mizuho Bank Tokyo');
    expect(html).toContain('Charith Wellage');
    expect(html).toContain('$100,000.00 USD');
  });

  it('renders PaymentAllocationHistoryModal (History icon pop up) with allocated stock list', () => {
    const html = renderToStaticMarkup(
      React.createElement(PaymentAllocationHistoryModal, {
        isOpen: true,
        onClose: () => {},
        reference: 'TT2400005',
      })
    );

    expect(html).toContain('data-testid="payment-allocation-history-modal"');
    expect(html).toContain('Allocation History (TT2400005)');
    expect(html).toContain('J24012345');
    expect(html).toContain('$3,000.00 USD');
  });

  it('renders DebitCreditRefundTab with Total Debits, Credits, Refunds and multi-filter table', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(
          HttpClientProvider,
          { apiBaseUrl: 'http://127.0.0.1:4000' },
          React.createElement(DebitCreditRefundTab)
        )
      )
    );

    expect(html).toContain('data-testid="debit-credit-tab"');
    expect(html).toContain('TOTAL DEBITS:');
    expect(html).toContain('TOTAL CREDITS:');
    expect(html).toContain('TOTAL REFUNDS:');
    expect(html).toContain('DN2400008');
    expect(html).toContain('RF2400006');
    expect(html).toContain('CR2400008');
    expect(html).toContain('Paid in Cash');
  });
});
