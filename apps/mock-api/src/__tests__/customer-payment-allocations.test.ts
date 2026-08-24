import { describe, expect, it } from 'vitest';
import { createStore } from '../store.js';

describe('Customer TT payment allocation contract', () => {
  const store = createStore('');

  it('shows a bulk TT allocation, its vehicles, and its single invoice', async () => {
    const response = await store.listCustomerPaymentAllocations('cust-123', { query: 'BULK' });
    const bulk = response.items.find((item) => item.id === 'pay-bulk-001');
    expect(bulk).toMatchObject({ allocationStatus: 'FullyAllocated', vehicleCount: 2 });
    expect(bulk?.allocations).toHaveLength(2);
    expect(bulk?.invoice?.vehicleCount).toBe(2);
  });

  it('shows the additional fully allocated multi-vehicle TT fixture', async () => {
    const payment = await store.getCustomerPaymentAllocation('cust-123', 'pay-bulk-002');
    expect(payment).toMatchObject({
      allocationStatus: 'FullyAllocated',
      allocatedAmountUsd: 18000,
      unallocatedAmountUsd: 0,
      vehicleCount: 2,
    });
    expect(payment?.allocations[0]).toMatchObject({
      vehicleTotalAmountUsd: 10800,
      vehicleAllocatedAmountUsd: 9000,
      vehicleBalanceAmountUsd: 1800,
    });
    expect(payment?.allocations.map((line) => line.vehicle.id)).toEqual(['veh-inv-7', 'veh-inv-9']);
  });

  it('shows the additional partially allocated multi-vehicle TT fixture', async () => {
    const payment = await store.getCustomerPaymentAllocation('cust-123', 'pay-partial-002');
    expect(payment).toMatchObject({
      allocationStatus: 'PartiallyAllocated',
      allocatedAmountUsd: 12000,
      unallocatedAmountUsd: 12000,
      vehicleCount: 2,
    });
    expect(payment?.allocations[0]).toMatchObject({
      vehicleTotalAmountUsd: 9440,
      vehicleAllocatedAmountUsd: 8000,
      vehicleBalanceAmountUsd: 1440,
    });
    expect(payment?.allocations.map((line) => line.vehicle.id)).toEqual(['veh-inv-10', 'veh-inv-15']);
  });

  it('shows a partially allocated TT balance and filters it', async () => {
    const response = await store.listCustomerPaymentAllocations('cust-123', { allocationStatus: 'PartiallyAllocated' });
    const partial = response.items.find((item) => item.id === 'pay-partial-001');
    expect(partial).toMatchObject({ allocatedAmountUsd: 2000, unallocatedAmountUsd: 4000, allocationStatus: 'PartiallyAllocated' });
  });

  it('does not return another customer’s TT allocation', async () => {
    expect(await store.getCustomerPaymentAllocation('cust-exception-001', 'pay-bulk-001')).toBeNull();
  });

  it('includes every bulk-payment vehicle in the printable invoice projection', async () => {
    const document = await store.getCustomerInvoiceDocument('cust-123', 'inv-bulk-001');
    expect(document?.contentHtml).toContain('Corolla Fielder');
    expect(document?.contentHtml).toContain('Mazda Demio');
  });
});
