import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { CustomerPaymentAllocationListResponse } from '@carchief/domain';
import { CustomerShellProvider } from '../../shell/index.js';
import { HttpClientProvider } from '../../account/index.js';

const response: CustomerPaymentAllocationListResponse = {
  items: [{
    id: 'payment-1',
    reference: 'TT-001',
    bankName: 'Demo Bank',
    currency: 'USD',
    amountUsd: 10000,
    paymentDate: '2026-08-20',
    paymentStatus: 'Approved',
    allocationStatus: 'PartiallyAllocated',
    allocatedAmountUsd: 6000,
    unallocatedAmountUsd: 4000,
    allocationPercent: 60,
    vehicleCount: 1,
    allocations: [{
      id: 'allocation-1',
      vehicle: { id: 'vehicle-1', slug: 'demo-vehicle', stockNumber: 'STK-001', chassisNumber: 'CH-001', make: 'Toyota', model: 'Corolla', year: 2021 },
      invoiceId: 'invoice-1',
      invoiceNumber: 'INV-001',
      amountUsd: 6000,
      vehicleTotalAmountUsd: 12000,
      vehicleAllocatedAmountUsd: 6000,
      vehicleBalanceAmountUsd: 6000,
      purpose: 'Advance',
      status: 'Approved',
      allocatedAt: '2026-08-21',
    }],
    invoice: { id: 'invoice-1', invoiceNumber: 'INV-001', issuedAt: '2026-08-21', totalAmountUsd: 12000, paidAmountUsd: 6000, outstandingAmountUsd: 6000, status: 'Issued', vehicleCount: 1, documentAvailable: true },
  }],
  total: 1,
  page: 1,
  limit: 10,
  totals: { totalAmountUsd: 10000, allocatedAmountUsd: 6000, unallocatedAmountUsd: 4000, invoiceCount: 1 },
};

vi.mock('../useCustomerPaymentAllocations.js', () => ({
  useCustomerPaymentAllocations: () => ({ data: response, isLoading: false, error: null }),
}));

vi.mock('../../invoices/useCustomerInvoiceDocument.js', () => ({
  useCustomerInvoiceDocument: () => ({ data: null, isLoading: false }),
}));

const { PaymentAllocationsPage } = await import('../PaymentAllocationsPage.js');

describe('PaymentAllocationsPage table view', () => {
  it('renders TT values in columns and keeps status/bar in the final column', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        QueryClientProvider,
        { client: new QueryClient() },
        React.createElement(
          CustomerShellProvider,
          { initialUser: { id: 'cust-123', name: 'Demo Customer', email: 'demo@example.com', role: 'CUSTOMER' as const }, initialRoute: '/payment-allocations' },
          React.createElement(HttpClientProvider, { apiBaseUrl: 'http://127.0.0.1:4000' }, React.createElement(PaymentAllocationsPage))
        )
      )
    );

    expect(html).toContain('<table class="cc-payment-allocation-table">');
    expect(html).toContain('TT Reference');
    expect(html).toContain('Unallocated Amount');
    expect(html).toContain('Partially Allocated');
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('width:60%');
    expect(html).toContain('$10,000.00');
    expect(html).toContain('$6,000.00');
    expect(html).toContain('$4,000.00');
    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain('cc-payment-allocation-card');
  });
});
