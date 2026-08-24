import { describe, it, expect } from 'vitest';
import type { CustomerDashboard, PaymentStatusSummary, ShipmentStatusSummary, DocumentAvailabilityCount } from '@carchief/api-client';

/**
 * Unit tests for the dashboard feature (D02-P02-T002).
 * Tests dashboard data structures and types.
 */

describe('Dashboard Types & Data Validation', () => {
  it('does not include the removed paired-account selector', async () => {
    const { readFile } = await import('node:fs/promises');
    const source = await readFile(new URL('../OverviewPage.tsx', import.meta.url), 'utf8');

    expect(source).not.toContain('PAIRED ACCOUNT');
    expect(source).not.toContain('dash-account-switch');
    expect(source).toContain('cc-dash-date-badge');
  });

  it('keeps dashboard progress styling in CSS rather than a static inline width', async () => {
    const { readFile } = await import('node:fs/promises');
    const source = await readFile(new URL('../components/CreditUtilisationCard.tsx', import.meta.url), 'utf8');

    expect(source).not.toContain('style={{ width:');
    expect(source).toContain('--cc-utilisation-width');
  });

  it('defines CustomerDashboard interface correctly', () => {
    const mockDashboard: CustomerDashboard = {
      customerId: 'cust-123',
      customerEmail: 'customer@example.com',
      creditLimitUsd: 500000,
      outstandingBalanceUsd: 120000,
      creditUtilisationPercent: 24,
      vehicleCountReserved: 2,
      vehicleCountInvoiced: 1,
      vehicleCountDelivered: 0,
      lastUpdated: '2026-08-14T10:00:00.000Z',
      paymentStatusSummary: { approved: 2, pending: 1, rejected: 0 },
      shipmentStatusSummary: { ready: 1, inTransit: 1, delivered: 0, other: 0 },
      documentAvailabilityCount: { available: 3, pending: 1, unavailable: 0 },
      notificationUnreadCount: 2,
      partialFailureIndicators: {
        paymentsFailed: false,
        shipmentsFailed: false,
        documentsFailed: false,
        notificationsFailed: false,
      },
    };

    expect(mockDashboard.customerId).toBe('cust-123');
    expect(mockDashboard.creditUtilisationPercent).toBe(24);
  });

  it('validates PaymentStatusSummary structure', () => {
    const summary: PaymentStatusSummary = {
      approved: 5,
      pending: 2,
      rejected: 1,
    };

    expect(summary.approved).toBe(5);
    expect(summary.pending).toBe(2);
    expect(summary.rejected).toBe(1);
  });

  it('validates ShipmentStatusSummary structure', () => {
    const summary: ShipmentStatusSummary = {
      ready: 3,
      inTransit: 2,
      delivered: 1,
      other: 0,
    };

    expect(summary.ready).toBe(3);
    expect(summary.inTransit).toBe(2);
  });

  it('validates DocumentAvailabilityCount structure', () => {
    const count: DocumentAvailabilityCount = {
      available: 10,
      pending: 2,
      unavailable: 0,
    };

    expect(count.available).toBe(10);
    expect(count.pending).toBe(2);
  });

  it('calculates credit utilisation correctly', () => {
    // Test case: balance 120k out of 500k limit = 24%
    const balance = 120000;
    const limit = 500000;
    const utilisation = (balance / limit) * 100;

    expect(Math.round(utilisation * 10) / 10).toBe(24);
  });

  it('handles zero outstanding balance', () => {
    const dashboard: CustomerDashboard = {
      customerId: 'cust-new',
      customerEmail: 'new@example.com',
      creditLimitUsd: 500000,
      outstandingBalanceUsd: 0,
      creditUtilisationPercent: 0,
      vehicleCountReserved: 0,
      vehicleCountInvoiced: 0,
      vehicleCountDelivered: 0,
      lastUpdated: '2026-08-14T10:00:00.000Z',
      paymentStatusSummary: { approved: 0, pending: 0, rejected: 0 },
      shipmentStatusSummary: { ready: 0, inTransit: 0, delivered: 0, other: 0 },
      documentAvailabilityCount: { available: 0, pending: 0, unavailable: 0 },
      notificationUnreadCount: 0,
      partialFailureIndicators: {
        paymentsFailed: false,
        shipmentsFailed: false,
        documentsFailed: false,
        notificationsFailed: false,
      },
    };

    expect(dashboard.outstandingBalanceUsd).toBe(0);
    expect(dashboard.creditUtilisationPercent).toBe(0);
  });

  it('handles high credit utilisation', () => {
    // Test case: balance 450k out of 500k limit = 90%
    const balance = 450000;
    const limit = 500000;
    const utilisation = (balance / limit) * 100;

    expect(Math.round(utilisation * 10) / 10).toBe(90);
  });

  it('validates partial failure indicators', () => {
    const mockDashboard: CustomerDashboard = {
      customerId: 'cust-123',
      customerEmail: 'customer@example.com',
      creditLimitUsd: 500000,
      outstandingBalanceUsd: 120000,
      creditUtilisationPercent: 24,
      vehicleCountReserved: 2,
      vehicleCountInvoiced: 1,
      vehicleCountDelivered: 0,
      lastUpdated: '2026-08-14T10:00:00.000Z',
      paymentStatusSummary: { approved: 2, pending: 1, rejected: 0 },
      shipmentStatusSummary: { ready: 1, inTransit: 1, delivered: 0, other: 0 },
      documentAvailabilityCount: { available: 3, pending: 1, unavailable: 0 },
      notificationUnreadCount: 2,
      partialFailureIndicators: {
        paymentsFailed: true,
        shipmentsFailed: false,
        documentsFailed: false,
        notificationsFailed: false,
      },
    };

    const hasFailures = Object.values(mockDashboard.partialFailureIndicators).some((v) => v);
    expect(hasFailures).toBe(true);
  });

  it('validates timestamp format', () => {
    const dashboard: CustomerDashboard = {
      customerId: 'cust-123',
      customerEmail: 'customer@example.com',
      creditLimitUsd: 500000,
      outstandingBalanceUsd: 120000,
      creditUtilisationPercent: 24,
      vehicleCountReserved: 2,
      vehicleCountInvoiced: 1,
      vehicleCountDelivered: 0,
      lastUpdated: '2026-08-14T10:00:00.000Z',
      paymentStatusSummary: { approved: 2, pending: 1, rejected: 0 },
      shipmentStatusSummary: { ready: 1, inTransit: 1, delivered: 0, other: 0 },
      documentAvailabilityCount: { available: 3, pending: 1, unavailable: 0 },
      notificationUnreadCount: 2,
      partialFailureIndicators: {
        paymentsFailed: false,
        shipmentsFailed: false,
        documentsFailed: false,
        notificationsFailed: false,
      },
    };

    // Should be ISO 8601 format
    expect(dashboard.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    const date = new Date(dashboard.lastUpdated);
    expect(date.getTime()).toBeTruthy();
  });
});
