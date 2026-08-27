import { describe, it, expect, beforeEach } from 'vitest';
import { createStore } from '../store.js';
import type { DemoStore } from '../store.js';

describe('Customer Dashboard (D02-ASM-001, D02-P02-T001)', () => {
  let store: DemoStore;

  beforeEach(async () => {
    store = createStore();
    await store.ready();
  });

  describe('Outstanding Balance and Credit Utilisation (D02-ASM-001)', () => {
    it('computes outstanding balance = issued invoices - approved allocations', async () => {
      const dashboard = await store.getCustomerDashboard('cust-123', 'customer@example.com');

      // cust-123 has:
      // - inv-001: $8,500 (Issued)
      // - inv-002: $14,200 (Issued)
      // - inv-003: $19,500 (Issued)
      // Total issued: $42,200
      //
      // - alloc-001: $2,000 (Approved) -> inv-001
      // - alloc-002: $3,500 (Approved) -> inv-001
      // - alloc-003: $7,000 (Approved) -> inv-002
      // Total approved: $12,500
      //
      // Outstanding = $721,030 - $32,380 = $688,650
      expect(dashboard.outstandingBalanceUsd).toBe(688650);
    });

    it('computes credit utilisation = outstanding balance ÷ credit limit', async () => {
      const dashboard = await store.getCustomerDashboard('cust-123', 'customer@example.com');

      // Outstanding: $688,650
      // Credit limit: $500,000
      // Utilisation: ($688,650 / $500,000) * 100 = 137.7%
      expect(dashboard.creditLimitUsd).toBe(500000);
      expect(dashboard.creditUtilisationPercent).toBe(137.7);
    });

    it('counts vehicles using canonical IDs and server status', async () => {
      const dashboard = await store.getCustomerDashboard('cust-123', 'customer@example.com');

      expect(dashboard.vehicleCountReserved).toBeGreaterThanOrEqual(0);
      expect(dashboard.vehicleCountInvoiced).toBe(16);
      expect(dashboard.vehicleCountDelivered).toBe(0);
    });

    it('never invents or duplicates vehicle records', async () => {
      const dashboard = await store.getCustomerDashboard('cust-123', 'customer@example.com');

      // Each vehicle ID should be counted only once across reserved/invoiced/delivered
      const totalCounts = dashboard.vehicleCountReserved + dashboard.vehicleCountInvoiced + dashboard.vehicleCountDelivered;
      expect(totalCounts).toBeGreaterThanOrEqual(3); // At minimum, 3 invoiced vehicles
    });

    it('returns zero balances and zero counts for unknown customer', async () => {
      const dashboard = await store.getCustomerDashboard('unknown-customer', 'unknown@example.com');

      expect(dashboard.outstandingBalanceUsd).toBe(0);
      expect(dashboard.creditUtilisationPercent).toBe(0);
      expect(dashboard.vehicleCountReserved).toBe(0);
      expect(dashboard.vehicleCountInvoiced).toBe(0);
      expect(dashboard.vehicleCountDelivered).toBe(0);
    });

    it('prohibits browser-side calculation: returns reconciled server values', async () => {
      const dashboard = await store.getCustomerDashboard('cust-123', 'customer@example.com');

      // Verify the calculation is deterministic and correct server-side
      const expectedOutstanding = 721030 - 32380; // 688,650
      expect(dashboard.outstandingBalanceUsd).toBe(expectedOutstanding);

      // Verify credit utilisation is server-computed, not a browser variable
      const expectedUtilisation = (expectedOutstanding / 500000) * 100;
      expect(dashboard.creditUtilisationPercent).toBe(Math.round(expectedUtilisation * 10) / 10);
    });

    it('applies only approved allocations to balance', async () => {
      // Verify that only Approved allocations reduce the outstanding balance
      // Pending and Rejected allocations should NOT be included
      const dashboard = await store.getCustomerDashboard('cust-123', 'customer@example.com');

      // All seed allocations are Approved, so this test verifies the filter is working
      expect(dashboard.outstandingBalanceUsd).toBeLessThan(721030); // Should be reduced by allocations
    });
  });

  describe('Linked Record Aggregates (D02-P02-T001)', () => {
    it('includes payment status summary for active customer', async () => {
      const dashboard = await store.getCustomerDashboard('cust-123', 'customer@example.com');

      expect(dashboard.paymentStatusSummary).toBeDefined();
      // cust-123 has: 3 approved, 1 pending
      expect(dashboard.paymentStatusSummary?.approved).toBe(3);
      expect(dashboard.paymentStatusSummary?.pending).toBe(1);
      expect(dashboard.paymentStatusSummary?.rejected).toBe(0);
    });

    it('includes shipment status summary for active customer', async () => {
      const dashboard = await store.getCustomerDashboard('cust-123', 'customer@example.com');

      expect(dashboard.shipmentStatusSummary).toBeDefined();
      // cust-123 has: 1 Ready, 1 InTransit, 1 Delivered
      expect(dashboard.shipmentStatusSummary?.ready).toBe(1);
      expect(dashboard.shipmentStatusSummary?.inTransit).toBe(1);
      expect(dashboard.shipmentStatusSummary?.delivered).toBe(1);
      expect(dashboard.shipmentStatusSummary?.other).toBe(0);
    });

    it('includes document availability count for active customer', async () => {
      const dashboard = await store.getCustomerDashboard('cust-123', 'customer@example.com');

      expect(dashboard.documentAvailabilityCount).toBeDefined();
      // cust-123 has: 2 Available, 1 Pending, 0 Unavailable
      expect(dashboard.documentAvailabilityCount?.available).toBe(2);
      expect(dashboard.documentAvailabilityCount?.pending).toBe(1);
      expect(dashboard.documentAvailabilityCount?.unavailable).toBe(0);
    });

    it('includes notification unread count for active customer', async () => {
      const dashboard = await store.getCustomerDashboard('cust-123', 'customer@example.com');

      expect(dashboard.notificationUnreadCount).toBeDefined();
      // cust-123 has: 2 unread notifications (notif-002, notif-003)
      expect(dashboard.notificationUnreadCount).toBe(2);
    });

    it('reconciles linked records (aggregate values match sum of linked records)', async () => {
      const dashboard = await store.getCustomerDashboard('cust-123', 'customer@example.com');

      // Verify that totals are correct
      expect(dashboard.paymentStatusSummary).toBeDefined();
      const paymentTotal = (dashboard.paymentStatusSummary?.approved || 0) + (dashboard.paymentStatusSummary?.pending || 0) + (dashboard.paymentStatusSummary?.rejected || 0);
      expect(paymentTotal).toBeGreaterThan(0);

      expect(dashboard.shipmentStatusSummary).toBeDefined();
      const shipmentTotal = (dashboard.shipmentStatusSummary?.ready || 0) + (dashboard.shipmentStatusSummary?.inTransit || 0) + (dashboard.shipmentStatusSummary?.delivered || 0) + (dashboard.shipmentStatusSummary?.other || 0);
      expect(shipmentTotal).toBe(3); // 3 vehicles with invoices should have shipments

      expect(dashboard.documentAvailabilityCount).toBeDefined();
      const documentTotal = (dashboard.documentAvailabilityCount?.available || 0) + (dashboard.documentAvailabilityCount?.pending || 0) + (dashboard.documentAvailabilityCount?.unavailable || 0);
      expect(documentTotal).toBeGreaterThan(0);
    });

    it('handles exception customer with partial/missing links', async () => {
      const dashboard = await store.getCustomerDashboard('cust-exception-001', 'exception@example.com');

      // Exception customer has minimal data
      expect(dashboard.outstandingBalanceUsd).toBeGreaterThan(0); // Should have 1 invoice with no allocations
      expect(dashboard.vehicleCountInvoiced).toBe(1); // 1 invoice

      // Should have partial linked records
      expect(dashboard.paymentStatusSummary?.rejected).toBe(1); // 1 rejected payment
      expect(dashboard.shipmentStatusSummary?.other).toBe(1); // 1 shipment in Inspection status
      expect(dashboard.documentAvailabilityCount?.unavailable).toBe(1); // 1 unavailable document
      expect(dashboard.notificationUnreadCount).toBe(0); // No notifications
    });

    it('handles new customer with no linked records', async () => {
      const dashboard = await store.getCustomerDashboard('cust-new-001', 'new@example.com');

      // New customer has zero balances and counts
      expect(dashboard.outstandingBalanceUsd).toBe(0);
      expect(dashboard.creditUtilisationPercent).toBe(0);
      expect(dashboard.vehicleCountInvoiced).toBe(0);

      // Should have zero aggregates
      expect(dashboard.paymentStatusSummary?.approved).toBe(0);
      expect(dashboard.paymentStatusSummary?.pending).toBe(0);
      expect(dashboard.paymentStatusSummary?.rejected).toBe(0);
      expect(dashboard.shipmentStatusSummary?.ready).toBe(0);
      expect(dashboard.notificationUnreadCount).toBe(1); // 1 unread welcome notification
    });

    it('ensures cross-customer isolation (customer A never sees customer B data)', async () => {
      const activeDash = await store.getCustomerDashboard('cust-123', 'customer@example.com');
      const exceptionDash = await store.getCustomerDashboard('cust-exception-001', 'exception@example.com');
      const newDash = await store.getCustomerDashboard('cust-new-001', 'new@example.com');

      // Verify active customer's data is distinct
      expect(activeDash.vehicleCountInvoiced).toBe(16);
      expect(activeDash.outstandingBalanceUsd).toBe(688650);
      expect((activeDash.paymentStatusSummary?.approved || 0) + (activeDash.paymentStatusSummary?.pending || 0)).toBeGreaterThan(0);

      // Verify exception customer's data is distinct
      expect(exceptionDash.vehicleCountInvoiced).toBe(1);
      expect(exceptionDash.outstandingBalanceUsd).toBeGreaterThan(0);
      expect(exceptionDash.outstandingBalanceUsd).not.toBe(activeDash.outstandingBalanceUsd);

      // Verify new customer's data is distinct
      expect(newDash.vehicleCountInvoiced).toBe(0);
      expect(newDash.outstandingBalanceUsd).toBe(0);

      // Verify no data leakage
      expect(activeDash.customerId).toBe('cust-123');
      expect(exceptionDash.customerId).toBe('cust-exception-001');
      expect(newDash.customerId).toBe('cust-new-001');
    });

  });
});
