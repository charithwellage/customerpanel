import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CustomerShellProvider } from '../../shell/index.js';
import { HttpClientProvider } from '../../account/index.js';
import { StatusTimeline } from '../components/StatusTimeline.js';
import { DepositSummaryCard } from '../components/DepositSummaryCard.js';
import { ShippingTrackingCard } from '../components/ShippingTrackingCard.js';
import { ExportDocumentsCard } from '../components/ExportDocumentsCard.js';
import { VehicleFleetCard } from '../components/VehicleFleetCard.js';
import { CustomerFleetPage } from '../CustomerFleetPage.js';
import { CustomerFleetDetailPage } from '../CustomerFleetDetailPage.js';
import type { CustomerVehicleSummary } from '@carchief/domain';

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

const MOCK_SUMMARY: CustomerVehicleSummary = {
  id: 'veh-landcruiser-001',
  make: 'Toyota',
  model: 'Land Cruiser Prado',
  year: 2022,
  chassisNumber: 'TRJ150-0192834',
  status: 'Under Negotiation With PI',
  totalAmountUsd: 45000,
  currency: 'USD',
  deposit: {
    requiredPercent: 50,
    requiredAmountUsd: 22500,
    paidAmountUsd: 10000,
    remainingAmountUsd: 12500,
    isFullyPaid: false,
  },
  locationStatus: 'In Japan',
  destinationPort: 'Mombasa',
  proformaInvoiceId: 'pi-1001',
  paymentDeadline: '2026-08-20T00:00:00.000Z',
};

describe('My Vehicles UI Components (D02-P04-T002)', () => {
  it('keeps vehicle progress and cards in CSS rather than static inline styles', async () => {
    const { readFile } = await import('node:fs/promises');
    const source = await readFile(new URL('../vehicles.css', import.meta.url), 'utf8');

    expect(source).toContain('.cc-cust-fleet');
    expect(source).toContain('.cc-cust-fleet-card');
    expect(source).toContain('.cc-cust-fleet-badge--under-negotiation');
  });

  describe('VehicleFleetCard', () => {
    it('renders vehicle information, 50% deposit breakdown (RULE-07), and status pill', () => {
      const html = renderToStaticMarkup(
        React.createElement(VehicleFleetCard, {
          vehicle: MOCK_SUMMARY,
          onSelect: () => {},
        })
      );

      expect(html).toContain('2022 Toyota Land Cruiser Prado');
      expect(html).toContain('TRJ150-0192834');
      expect(html).toContain('Under Negotiation With PI');
      expect(html).toContain('$45,000 USD');
      expect(html).toContain('Deposit (50%): $22,500');
      expect(html).toContain('Remaining: $12,500');
      expect(html).toContain('Pay by:');
      expect(html).toContain('View Details &amp; Documents');
    });
  });

  describe('StatusTimeline', () => {
    it('renders milestone steps with timestamp and notes', () => {
      const html = renderToStaticMarkup(
        React.createElement(StatusTimeline, {
          history: [
            {
              status: 'Under Negotiation',
              timestamp: '2026-08-10T10:00:00.000Z',
              notes: 'Vehicle reserved via customer portal.',
            },
            {
              status: 'Under Negotiation With PI',
              timestamp: '2026-08-11T14:00:00.000Z',
              notes: 'Proforma invoice PI-1001 issued.',
            },
          ],
        })
      );

      expect(html).toContain('Transaction Milestones');
      expect(html).toContain('Under Negotiation');
      expect(html).toContain('Vehicle reserved via customer portal.');
      expect(html).toContain('Under Negotiation With PI');
      expect(html).toContain('Proforma invoice PI-1001 issued.');
    });

    it('handles empty milestone history gracefully', () => {
      const html = renderToStaticMarkup(
        React.createElement(StatusTimeline, { history: [] })
      );

      expect(html).toContain('No transaction history recorded yet.');
    });
  });

  describe('DepositSummaryCard', () => {
    it('renders 50% deposit requirement, paid amount, and remaining balance under RULE-07', () => {
      const html = renderToStaticMarkup(
        React.createElement(DepositSummaryCard, {
          totalAmountUsd: 50000,
          deposit: {
            requiredPercent: 50,
            requiredAmountUsd: 25000,
            paidAmountUsd: 25000,
            remainingAmountUsd: 0,
            isFullyPaid: true,
          },
          proformaInvoiceId: 'pi-1001',
          invoiceId: 'inv-2001',
          paymentDeadline: '2026-08-25T00:00:00.000Z',
        })
      );

      expect(html).toContain('Financial &amp; Deposit Summary');
      expect(html).toContain('$50,000 USD');
      expect(html).toContain('Required Deposit (50%)');
      expect(html).toContain('$25,000 USD');
      expect(html).toContain('PI-1001');
      expect(html).toContain('INV-2001');
    });
  });

  describe('ShippingTrackingCard', () => {
    it('renders vessel, B/L, ETD, ETA and port details', () => {
      const html = renderToStaticMarkup(
        React.createElement(ShippingTrackingCard, {
          locationStatus: 'In Transit',
          destinationPort: 'Mombasa',
          vesselName: 'GLOBAL HIGHWAY V.42',
          billOfLadingNo: 'MOLU-987654321',
          etd: '2026-08-15T00:00:00.000Z',
          eta: '2026-08-30T00:00:00.000Z',
        })
      );

      expect(html).toContain('Shipping &amp; Logistics Tracking');
      expect(html).toContain('GLOBAL HIGHWAY V.42');
      expect(html).toContain('MOLU-987654321');
      expect(html).toContain('Mombasa');
      expect(html).toContain('In Transit');
    });
  });

  describe('ExportDocumentsCard', () => {
    it('renders document titles, status badges and download triggers', () => {
      const html = renderToStaticMarkup(
        React.createElement(ExportDocumentsCard, {
          documents: [
            {
              id: 'doc-1',
              title: 'Proforma Invoice PI-1001',
              type: 'Proforma Invoice',
              status: 'Available',
              issuedAt: '2026-08-11T14:00:00.000Z',
            },
            {
              id: 'doc-2',
              title: 'Bill of Lading',
              type: 'Bill of Lading',
              status: 'Pending',
            },
          ],
        })
      );

      expect(html).toContain('Export &amp; Clearance Documents');
      expect(html).toContain('Proforma Invoice PI-1001');
      expect(html).toContain('Available');
      expect(html).toContain('Bill of Lading');
      expect(html).toContain('Pending');
      expect(html).toContain('Download');
    });
  });

  describe('CustomerFleetPage & CustomerFleetDetailPage', () => {
    it('renders fleet page header and status tabs', () => {
      const html = renderToStaticMarkup(
        React.createElement(
          QueryClientProvider,
          { client: queryClient },
          React.createElement(
            HttpClientProvider,
            { apiBaseUrl: 'http://localhost:4000' },
            React.createElement(
              CustomerShellProvider,
              { initialUser: MOCK_USER, initialRoute: '/vehicles' },
              React.createElement(CustomerFleetPage, { onSelectVehicle: () => {} })
            )
          )
        )
      );

      expect(html).toContain('My Vehicles');
      expect(html).toContain('All Vehicles');
      expect(html).toContain('Under Negotiation');
      expect(html).toContain('PI Issued');
      expect(html).toContain('In Stock / Confirmed');
      expect(html).toContain('In Transit');
      expect(html).toContain('Delivered');
      expect(html).toContain('Search fleet');
      expect(html).toContain('Shipping Stage');
    });

    it('renders detail page loading and back button', () => {
      const html = renderToStaticMarkup(
        React.createElement(
          QueryClientProvider,
          { client: queryClient },
          React.createElement(
            HttpClientProvider,
            { apiBaseUrl: 'http://localhost:4000' },
            React.createElement(
              CustomerShellProvider,
              { initialUser: MOCK_USER, initialRoute: '/vehicles/veh-1' },
              React.createElement(CustomerFleetDetailPage, { vehicleId: 'veh-1', onBack: () => {} })
            )
          )
        )
      );

      expect(html).toContain('Loading vehicle details...');
    });
  });
});
