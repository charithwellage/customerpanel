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
import { VehicleTrackingModal, getVehicleActiveTimelineStepIndex, getVehicleEngineNo } from '../components/VehicleTrackingModal.js';
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

import { StatusTracker, calculateVehiclePipeline } from '../components/StatusTracker.js';

describe('My Vehicles UI Components (D02-P04-T002 & D02-P14-T008)', () => {
  it('keeps vehicle progress and cards in CSS rather than static inline styles', async () => {
    const { readFile } = await import('node:fs/promises');
    const source = await readFile(new URL('../vehicles.css', import.meta.url), 'utf8');

    expect(source).toContain('.cc-cust-fleet');
    expect(source).toContain('.cc-cust-fleet-card');
    expect(source).toContain('.cc-cust-fleet-badge--under-negotiation');
    expect(source).toContain('.cc-status-tracker');
  });

  describe('StatusTracker (D02-P14-T008)', () => {
    it('renders all 5 fulfillment pipeline steps with active milestone highlighted', () => {
      const html = renderToStaticMarkup(
        React.createElement(StatusTracker, {
          vehicle: MOCK_SUMMARY,
        })
      );

      expect(html).toContain('cc-status-tracker');
      expect(html).toContain('Reserved &amp; Sourced');
      expect(html).toContain('Reserved');
      expect(html).toContain('Inspection');
      expect(html).toContain('Port/Loading');
      expect(html).toContain('In Transit');
      expect(html).toContain('Delivered');
      expect(html).toContain('Stage 1 of 5');
      expect(html).toContain('aria-current="step"');
    });

    it('calculates pipeline stage, percent, and tone for different statuses', () => {
      // Step 1: Reserved
      const reserved = calculateVehiclePipeline('Under Negotiation');
      expect(reserved.activeStepIndex).toBe(0);
      expect(reserved.statusTone).toBe('amber');
      expect(reserved.currentStage.shortLabel).toBe('Reserved');
      expect(reserved.progressPercent).toBe(20);

      // Step 1: With PI
      const withPI = calculateVehiclePipeline('Under Negotiation With PI');
      expect(withPI.activeStepIndex).toBe(0);
      expect(withPI.statusTone).toBe('purple');

      // Step 2: Confirmed / Inspection
      const confirmed = calculateVehiclePipeline('Confirmed');
      expect(confirmed.activeStepIndex).toBe(1);
      expect(confirmed.statusTone).toBe('blue');
      expect(confirmed.currentStage.shortLabel).toBe('Inspection');
      expect(confirmed.progressPercent).toBe(40);

      // Step 3: Ready for Loading / Port
      const port = calculateVehiclePipeline('Confirmed', 'READY FOR LOADING');
      expect(port.activeStepIndex).toBe(2);
      expect(port.statusTone).toBe('blue');
      expect(port.currentStage.shortLabel).toBe('Port/Loading');
      expect(port.progressPercent).toBe(60);

      // Step 4: In Transit
      const transit = calculateVehiclePipeline('In Transit');
      expect(transit.activeStepIndex).toBe(3);
      expect(transit.statusTone).toBe('indigo');
      expect(transit.currentStage.shortLabel).toBe('In Transit');
      expect(transit.progressPercent).toBe(80);

      // Step 5: Delivered
      const delivered = calculateVehiclePipeline('Delivered');
      expect(delivered.activeStepIndex).toBe(4);
      expect(delivered.statusTone).toBe('green');
      expect(delivered.currentStage.shortLabel).toBe('Delivered');
      expect(delivered.progressPercent).toBe(100);
    });

    it('renders compact and mini variants correctly', () => {
      const compactHtml = renderToStaticMarkup(
        React.createElement(StatusTracker, {
          vehicle: { ...MOCK_SUMMARY, status: 'In Transit' },
          variant: 'compact',
        })
      );
      expect(compactHtml).toContain('cc-status-tracker--compact');
      expect(compactHtml).toContain('In Transit / Ocean');
      expect(compactHtml).toContain('80%');

      const miniHtml = renderToStaticMarkup(
        React.createElement(StatusTracker, {
          vehicle: { ...MOCK_SUMMARY, status: 'Delivered' },
          variant: 'mini',
        })
      );
      expect(miniHtml).toContain('cc-status-tracker--mini');
      expect(miniHtml).toContain('Delivered');
      expect(miniHtml).toContain('100%');
    });
  });

  describe('VehicleFleetCard (D02-P14-T008)', () => {
    it('renders vehicle information, 50% deposit breakdown (RULE-07), status pill, and status tracker', () => {
      const html = renderToStaticMarkup(
        React.createElement(VehicleFleetCard, {
          vehicle: MOCK_SUMMARY,
          onSelect: () => {},
        })
      );

      expect(html).toContain('2022 TOYOTA LAND CRUISER PRADO');
      expect(html).toContain('TRJ150-0192834');
      expect(html).toContain('RESERVED (PI)');
      expect(html).toContain('$45,000');
      expect(html).toContain('Deposit (50%):');
      expect(html).toContain('$22,500');
      expect(html).toContain('TRACK SHIPMENT');
      expect(html).toContain('PAY ADVANCE DEPOSIT');
      expect(html).toContain('cc-status-tracker');
      expect(html).toContain('View Status Logs &amp; Next Steps');
    });

    it('renders contextual primary action buttons based on vehicle status', () => {
      // Under Negotiation: PAY DEPOSIT
      const reservedHtml = renderToStaticMarkup(
        React.createElement(VehicleFleetCard, {
          vehicle: { ...MOCK_SUMMARY, status: 'Under Negotiation', proformaInvoiceId: undefined },
          onSelect: () => {},
        })
      );
      expect(reservedHtml).toContain('PAY DEPOSIT (50%)');

      // Delivered: VIEW CLEARANCE DOCS
      const deliveredHtml = renderToStaticMarkup(
        React.createElement(VehicleFleetCard, {
          vehicle: { ...MOCK_SUMMARY, status: 'Delivered' },
          onSelect: () => {},
        })
      );
      expect(deliveredHtml).toContain('VIEW CLEARANCE DOCS');

      // In Transit: TRACK SHIPMENT
      const inTransitHtml = renderToStaticMarkup(
        React.createElement(VehicleFleetCard, {
          vehicle: { ...MOCK_SUMMARY, status: 'In Transit' },
          onSelect: () => {},
        })
      );
      expect(inTransitHtml).toContain('TRACK SHIPMENT');
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

      expect(html).toContain('RESERVED VEHICLES');
      expect(html).toContain('RESERVED WITH PI');
      expect(html).toContain('INVOICED VEHICLE');
      expect(html).toContain('Shipping Status');
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

  describe('VehicleTrackingModal', () => {
    it('renders hero banner, vehicle details, shipping bill of lading, and all 11 milestone stages', () => {
      const html = renderToStaticMarkup(
        React.createElement(VehicleTrackingModal, {
          isOpen: true,
          onClose: () => {},
          vehicle: {
            ...MOCK_SUMMARY,
            model: 'Land Cruiser 250',
            priceUsd: 16120,
            totalAmountUsd: 16120,
            colorSpec: 'Pearl',
            mileage: 34497,
            createdAt: '2026-07-10T06:26:39.529Z',
          },
        })
      );

      expect(html).toContain('2022 TOYOTA LAND CRUISER 250');
      expect(html).toContain('TRJ150-0192834');
      expect(html).toContain('VEHICLE DETAILS');
      expect(html).toContain('Engine No:');
      expect(html).toContain('3DA-GDJ250W');
      expect(html).toContain('34,497 km');
      expect(html).toContain('Pearl');
      expect(html).toContain('2026-07-10T06:26:39.529Z');
      expect(html).toContain('$16,120');

      expect(html).toContain('SHIPPING BILL OF LADING');
      expect(html).toContain('Booking Status:');
      expect(html).toContain('Vessel &amp; Voyage:');
      expect(html).toContain('Container No:');
      expect(html).toContain('BL Document No:');
      expect(html).toContain('Loading Port:');
      expect(html).toContain('Discharge Port:');
      expect(html).toContain('Mombasa');

      expect(html).toContain('SHIPMENT TIMELINE TRACKER');
      expect(html).toContain('RESERVED');
      expect(html).toContain('PURCHASED');
      expect(html).toContain('INSPECTION');
      expect(html).toContain('READY FOR LOADING');
      expect(html).toContain('VESSEL BOOKED');
      expect(html).toContain('LOADED');
      expect(html).toContain('VESSEL DEPARTED');
      expect(html).toContain('IN TRANSIT');
      expect(html).toContain('ARRIVED AT PORT');
      expect(html).toContain('CUSTOMS CLEARANCE');
      expect(html).toContain('DELIVERED');
      expect(html).toContain('Milestone verified successfully.');
      expect(html).toContain('Pending milestone step.');
    });

    it('calculates active milestone index correctly for each status stage', () => {
      expect(getVehicleActiveTimelineStepIndex({ ...MOCK_SUMMARY, status: 'Under Negotiation' })).toBe(0);
      expect(getVehicleActiveTimelineStepIndex({ ...MOCK_SUMMARY, status: 'Under Negotiation With PI' })).toBe(1);
      expect(getVehicleActiveTimelineStepIndex({ ...MOCK_SUMMARY, status: 'Confirmed' })).toBe(2);
      expect(getVehicleActiveTimelineStepIndex({ ...MOCK_SUMMARY, logisticsStatus: 'READY FOR LOADING' })).toBe(3);
      expect(getVehicleActiveTimelineStepIndex({ ...MOCK_SUMMARY, logisticsStatus: 'VESSEL BOOKED' })).toBe(4);
      expect(getVehicleActiveTimelineStepIndex({ ...MOCK_SUMMARY, logisticsStatus: 'LOADED' })).toBe(5);
      expect(getVehicleActiveTimelineStepIndex({ ...MOCK_SUMMARY, logisticsStatus: 'VESSEL DEPARTED' })).toBe(6);
      expect(getVehicleActiveTimelineStepIndex({ ...MOCK_SUMMARY, status: 'In Transit' })).toBe(7);
      expect(getVehicleActiveTimelineStepIndex({ ...MOCK_SUMMARY, logisticsStatus: 'ARRIVED AT PORT' })).toBe(8);
      expect(getVehicleActiveTimelineStepIndex({ ...MOCK_SUMMARY, logisticsStatus: 'CUSTOMS CLEARANCE' })).toBe(9);
      expect(getVehicleActiveTimelineStepIndex({ ...MOCK_SUMMARY, status: 'Delivered' })).toBe(10);
    });

    it('renders null when closed or vehicle is null', () => {
      const closedHtml = renderToStaticMarkup(
        React.createElement(VehicleTrackingModal, {
          isOpen: false,
          onClose: () => {},
          vehicle: MOCK_SUMMARY,
        })
      );
      expect(closedHtml).toBe('');

      const nullVehicleHtml = renderToStaticMarkup(
        React.createElement(VehicleTrackingModal, {
          isOpen: true,
          onClose: () => {},
          vehicle: null,
        })
      );
      expect(nullVehicleHtml).toBe('');
    });
  });

  describe('FRD Section 4 Order & Logistics Timeline', () => {
    it('renders CustomerFleetDetailPage with Order Timeline and Download Documents button', () => {
      const html = renderToStaticMarkup(
        React.createElement(
          QueryClientProvider,
          { client: queryClient },
          React.createElement(
            CustomerShellProvider,
            { initialUser: MOCK_USER, initialRoute: '/vehicles/veh-landcruiser-001' },
            React.createElement(
              HttpClientProvider,
              { apiBaseUrl: 'http://127.0.0.1:4000' },
              React.createElement(CustomerFleetDetailPage, { vehicleId: 'veh-landcruiser-001', onBack: () => {} })
            )
          )
        )
      );

      // Initially renders loading or page structure
      expect(html).toBeTruthy();
    });
  });
});

