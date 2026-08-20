import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CustomerShellProvider } from '../../shell/index.js';
import { HttpClientProvider } from '../../account/index.js';
import { InvoiceSummaryKpiCards } from '../components/InvoiceSummaryKpiCards.js';
import { InvoiceCard } from '../components/InvoiceCard.js';
import { BankWireInstructionsCard } from '../components/BankWireInstructionsCard.js';
import { InvoiceLineItemsTable } from '../components/InvoiceLineItemsTable.js';
import { PaymentAllocationsTable } from '../components/PaymentAllocationsTable.js';
import { PrintableInvoiceModal } from '../components/PrintableInvoiceModal.js';
import { InvoiceLedgerModal } from '../components/InvoiceLedgerModal.js';
import { CustomerInvoicesPage } from '../CustomerInvoicesPage.js';
import { CustomerInvoiceDetailPage } from '../CustomerInvoiceDetailPage.js';
import { formatInvoiceDate, formatUsdAmount, getInvoiceStatusBadgeClass } from '../formatters.js';
import type { CustomerInvoiceSummary } from '@carchief/domain';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const MOCK_USER = {
  id: 'cust-123',
  name: 'Demo Customer',
  email: 'customer@example.com',
  role: 'CUSTOMER' as const,
};

const MOCK_PI_SUMMARY: CustomerInvoiceSummary = {
  id: 'pi-001',
  invoiceNumber: 'PI-0001',
  type: 'Proforma',
  customerId: 'cust-123',
  vehicleId: 'veh-landcruiser-001',
  vehicleSlug: '2022-toyota-land-cruiser-prado-veh-1',
  make: 'Toyota',
  model: 'Land Cruiser Prado',
  year: 2022,
  totalAmountUsd: 45000,
  paidAmountUsd: 0,
  outstandingAmountUsd: 45000,
  status: 'Issued',
  issuedAt: '2026-08-10T10:00:00.000Z',
  dueDate: '2026-08-13T10:00:00.000Z',
  paymentDeadline: '2026-08-13T10:00:00.000Z',
  depositRequiredUsd: 22500,
  isExpired: false,
  documentStatus: 'Available',
  currency: 'USD',
};

const MOCK_COMM_SUMMARY: CustomerInvoiceSummary = {
  id: 'inv-001',
  invoiceNumber: 'INV-0001',
  type: 'Commercial',
  customerId: 'cust-123',
  vehicleId: 'veh-corolla-001',
  vehicleSlug: '2021-toyota-corolla-axio-veh-1',
  make: 'Toyota',
  model: 'Corolla Axio',
  year: 2021,
  totalAmountUsd: 8500,
  paidAmountUsd: 5500,
  outstandingAmountUsd: 3000,
  status: 'PartiallyPaid',
  issuedAt: '2026-08-10T10:00:00.000Z',
  dueDate: '2026-08-17T10:00:00.000Z',
  documentStatus: 'Available',
  currency: 'USD',
};

describe('Customer Invoices UI Components (D02-P05-T002)', () => {
  it('reuses deterministic invoice presentation formatters', () => {
    expect(formatUsdAmount(1234.5)).toBe('$1,234.50');
    expect(formatInvoiceDate()).toBe('—');
    expect(formatInvoiceDate('not-a-date')).toBe('not-a-date');
    expect(getInvoiceStatusBadgeClass('Paid')).toBe('cc-invoice-badge--paid');
    expect(getInvoiceStatusBadgeClass('Unknown')).toBe('cc-invoice-badge--neutral');
  });

  it('keeps invoice styling in CSS rather than static inline styles', async () => {
    const { readFile } = await import('node:fs/promises');
    const source = await readFile(new URL('../invoices.css', import.meta.url), 'utf8');
    const cardSource = await readFile(new URL('../components/InvoiceCard.tsx', import.meta.url), 'utf8');

    expect(source).toContain('.cc-cust-invoices-page');
    expect(source).toContain('.cc-invoice-card');
    expect(source).toContain('.cc-invoice-kpi-grid');
    expect(source).toContain('.cc-bank-wire-card');
    expect(source).toContain('.cc-invoice-modal-dialog');
    expect(source).toContain('--cc-invoice-progress-width');
    expect(cardSource).not.toContain('style={{ width:');
    expect(cardSource).toContain('--cc-invoice-progress-width');
  });

  describe('InvoiceSummaryKpiCards', () => {
    it('renders total invoiced, total paid, and outstanding balance', () => {
      const html = renderToStaticMarkup(
        React.createElement(InvoiceSummaryKpiCards, {
          totalInvoicedUsd: 50100,
          totalPaidUsd: 12500,
          totalOutstandingUsd: 37600,
        })
      );

      expect(html).toContain('Total Invoiced');
      expect(html).toContain('$50,100.00');
      expect(html).toContain('Total Paid');
      expect(html).toContain('$12,500.00');
      expect(html).toContain('Outstanding Balance');
      expect(html).toContain('$37,600.00');
      expect(html).toContain('data-testid="kpi-total-outstanding"');
    });
  });

  describe('InvoiceCard', () => {
    it('renders Proforma Invoice card with 72h deadline and PI pill', () => {
      const html = renderToStaticMarkup(
        React.createElement(InvoiceCard, {
          invoice: MOCK_PI_SUMMARY,
          onSelect: () => {},
        })
      );

      expect(html).toContain('Proforma Invoice (PI)');
      expect(html).toContain('PI-0001');
      expect(html).toContain('Toyota');
      expect(html).toContain('Land Cruiser Prado');
      expect(html).toContain('$45,000.00');
      expect(html).toContain('72h Deadline:');
      expect(html).toContain('data-testid="invoice-card-pi-001"');
    });

    it('renders Commercial Invoice card with payment progress and outstanding balance', () => {
      const html = renderToStaticMarkup(
        React.createElement(InvoiceCard, {
          invoice: MOCK_COMM_SUMMARY,
          onSelect: () => {},
        })
      );

      expect(html).toContain('Commercial Invoice');
      expect(html).toContain('INV-0001');
      expect(html).toContain('Corolla Axio');
      expect(html).toContain('$8,500.00');
      expect(html).toContain('$5,500.00');
      expect(html).toContain('$3,000.00');
      expect(html).toContain('65% Paid');
      expect(html).toContain('PartiallyPaid');
    });
  });

  describe('BankWireInstructionsCard', () => {
    it('renders an honest unavailable state when Finance has not supplied bank instructions', () => {
      const html = renderToStaticMarkup(
        React.createElement(BankWireInstructionsCard, {
          referenceFallback: 'INV-0001',
          depositRequiredUsd: 3950,
          isProforma: true,
        })
      );

      expect(html).toContain('Bank instructions are unavailable pending Finance confirmation');
      expect(html).not.toContain('MUFG');
      expect(html).not.toContain('SWIFT');
    });
  });

  describe('InvoiceLineItemsTable', () => {
    it('renders an honest unavailable state when no approved breakdown exists', () => {
      const html = renderToStaticMarkup(React.createElement(InvoiceLineItemsTable, {
        lineItems: [], totalAmountUsd: 8500, paidAmountUsd: 5500, outstandingAmountUsd: 3000,
      }));
      expect(html).toContain('Itemized charges are unavailable pending an approved invoice breakdown');
    });
    it('renders itemized charges, subtotals, paid deductions, and balance due', () => {
      const html = renderToStaticMarkup(
        React.createElement(InvoiceLineItemsTable, {
          lineItems: [
            { id: 'li-1', description: 'FOB Vehicle Price', quantity: 1, unitPriceUsd: 7000, amountUsd: 7000 },
            { id: 'li-2', description: 'Ocean Freight', quantity: 1, unitPriceUsd: 1500, amountUsd: 1500 },
          ],
          totalAmountUsd: 8500,
          paidAmountUsd: 5500,
          outstandingAmountUsd: 3000,
        })
      );

      expect(html).toContain('FOB Vehicle Price');
      expect(html).toContain('$7,000.00');
      expect(html).toContain('Ocean Freight');
      expect(html).toContain('$1,500.00');
      expect(html).toContain('$8,500.00');
      expect(html).toContain('-$5,500.00');
      expect(html).toContain('$3,000.00');
    });
  });

  describe('PaymentAllocationsTable', () => {
    it('renders confirmed payment allocations and total allocated amount', () => {
      const html = renderToStaticMarkup(
        React.createElement(PaymentAllocationsTable, {
          allocations: [
            { id: 'alloc-1', paymentId: 'pay-1', amountUsd: 2000, allocatedAt: '2026-08-11T10:00:00.000Z', status: 'Approved' },
            { id: 'alloc-2', paymentId: 'pay-2', amountUsd: 3500, allocatedAt: '2026-08-12T10:00:00.000Z', status: 'Approved' },
          ],
          paidAmountUsd: 5500,
        })
      );

      expect(html).toContain('alloc-1');
      expect(html).toContain('pay-1');
      expect(html).toContain('+$2,000.00');
      expect(html).toContain('+$3,500.00');
      expect(html).toContain('$5,500.00');
      expect(html).toContain('Approved');
    });

    it('renders empty allocation notice when no payments are allocated', () => {
      const html = renderToStaticMarkup(
        React.createElement(PaymentAllocationsTable, { allocations: [], paidAmountUsd: 0 })
      );

      expect(html).toContain('No wire transfer payments have been allocated to this invoice yet');
    });
  });

  describe('PrintableInvoiceModal', () => {
    it('renders printable document dialog with CarChief letterhead projection', () => {
      const html = renderToStaticMarkup(
        React.createElement(PrintableInvoiceModal, {
          isOpen: true,
          isLoading: false,
          document: {
            documentId: 'doc-inv-001',
            invoiceId: 'inv-001',
            invoiceNumber: 'INV-0001',
            type: 'Commercial',
            title: 'Commercial Invoice INV-0001',
            contentHtml: '<div class="carchief-doc"><h1>CarChief Commercial Invoice</h1></div>',
            status: 'Available',
            generatedAt: '2026-08-10T10:00:00.000Z',
          },
          onClose: () => {},
        })
      );

      expect(html).toContain('Commercial Invoice INV-0001');
      expect(html).toContain('CarChief Commercial Invoice');
      expect(html).toContain('🖨️ Print / Save as PDF');
      expect(html).toContain('data-testid="printable-invoice-modal"');
    });
  });

  describe('InvoiceLedgerModal', () => {
    it('renders official CarChief accounts department popup with ledger sheet and sourced vehicle line items', () => {
      const html = renderToStaticMarkup(
        React.createElement(InvoiceLedgerModal, {
          isOpen: true,
          onClose: () => {},
          ledgerEntry: {
            id: 'inv-row-1',
            invoiceNumber: 'P-85492',
            type: 'PROFORMA',
            issueDate: '23/07/2026',
            totalAmountUsd: 12730,
            paidAmountUsd: 0,
            outstandingAmountUsd: 12730,
            dueDate: '2026-07-25',
          },
          clientName: 'Charith Wellage',
          clientCompany: 'charith wellage',
          clientAddress: 'gampaha, sri lanka, Kenya',
          clientPhone: '+94715991619',
          vehicles: [
            {
              id: 'veh-1',
              stockNumber: 'STK: NRE161',
              chassisNumber: 'CHASSIS: NRE161-0091995',
              title: '2021 TOYOTA COROLLA FIELDER',
              engine: 'DBA-NRE161G',
              vesselVoyage: 'TBD',
              destinationPort: 'Mombasa',
              soldAmountUsd: 17360,
              paidAmountUsd: 0,
              balanceAmountUsd: 17360,
              imageUrl: '',
            },
          ],
        })
      );

      expect(html).toContain('CAR CHIEF ACCOUNTS DEPT');
      expect(html).toContain('P-85492');
      expect(html).toContain('PROFORMA INVOICE');
      expect(html).toContain('Charith Wellage');
      expect(html).toContain('2026-07-25');
      expect(html).toContain('2021 TOYOTA COROLLA FIELDER');
      expect(html).toContain('NRE161-0091995');
      expect(html).toContain('$17,360.00');
      expect(html).toContain('data-testid="invoice-ledger-modal"');
    });

    it('returns null when isOpen is false', () => {
      const html = renderToStaticMarkup(
        React.createElement(InvoiceLedgerModal, {
          isOpen: false,
          onClose: () => {},
          ledgerEntry: null,
        })
      );

      expect(html).toBe('');
    });
  });

  describe('CustomerInvoicesPage & CustomerInvoiceDetailPage integration', () => {
    it('renders invoices list page skeleton in test shell provider', () => {
      const html = renderToStaticMarkup(
        React.createElement(
          QueryClientProvider,
          { client: queryClient },
          React.createElement(
            CustomerShellProvider,
            { initialUser: MOCK_USER, initialRoute: '/invoices' },
            React.createElement(
              HttpClientProvider,
              { apiBaseUrl: 'http://127.0.0.1:4000' },
              React.createElement(CustomerInvoicesPage, { onSelectInvoice: () => {} })
            )
          )
        )
      );

      expect(html).toContain('Invoices &amp; Customer Ledger');
      expect(html).toContain('data-testid="customer-invoices-page"');
      expect(html).toContain('data-testid="invoice-type-tabs"');
      expect(html).toContain('data-testid="invoice-search-input"');
      expect(html).toContain('data-testid="invoice-status-filter"');
    });

    it('renders invoice detail page in test shell provider', () => {
      const html = renderToStaticMarkup(
        React.createElement(
          QueryClientProvider,
          { client: queryClient },
          React.createElement(
            CustomerShellProvider,
            { initialUser: MOCK_USER, initialRoute: '/invoices/inv-001' },
            React.createElement(
              HttpClientProvider,
              { apiBaseUrl: 'http://127.0.0.1:4000' },
              React.createElement(CustomerInvoiceDetailPage, { invoiceId: 'inv-001', onBack: () => {} })
            )
          )
        )
      );

      expect(html).toContain('data-testid="invoice-detail-loading"');
    });
  });

  describe('FRD Phase 3 Modals (Email, Payments, Courier)', () => {
    it('renders EmailDocumentModal with locked sender and required receiver field', async () => {
      const { EmailDocumentModal } = await import('../components/EmailDocumentModal.js');
      const html = renderToStaticMarkup(
        React.createElement(EmailDocumentModal, {
          isOpen: true,
          onClose: () => {},
          documentNumber: 'P-85492',
          documentType: 'PROFORMA',
          senderEmail: 'charith.wellage@carchief.com',
        })
      );

      expect(html).toContain('data-testid="email-document-modal"');
      expect(html).toContain('charith.wellage@carchief.com');
      expect(html).toContain('data-testid="email-recipient-input"');
      expect(html).toContain('data-testid="email-send-button"');
    });

    it('renders InvoicePaymentDetailsModal with allocations table and TT download link', async () => {
      const { InvoicePaymentDetailsModal } = await import('../components/InvoicePaymentDetailsModal.js');
      const html = renderToStaticMarkup(
        React.createElement(InvoicePaymentDetailsModal, {
          isOpen: true,
          onClose: () => {},
          invoiceNumber: 'INV-85492',
        })
      );

      expect(html).toContain('data-testid="invoice-payment-details-modal"');
      expect(html).toContain('TT10001');
      expect(html).toContain('$2,300.00 USD');
      expect(html).toContain('Click to download');
    });

    it('renders CourierRemarksModal with dispatch notes and tracking number', async () => {
      const { CourierRemarksModal } = await import('../components/CourierRemarksModal.js');
      const html = renderToStaticMarkup(
        React.createElement(CourierRemarksModal, {
          isOpen: true,
          onClose: () => {},
          stockNumber: 'J24012345',
          courierCompany: 'DHL Express',
          trackingNumber: '0010019284',
        })
      );

      expect(html).toContain('data-testid="courier-remarks-modal"');
      expect(html).toContain('DHL Express');
      expect(html).toContain('0010019284');
      expect(html).toContain('Customs manifest');
    });
  });
});

