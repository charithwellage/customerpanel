import { describe, expect, it } from 'vitest';
import { appRouteFor } from '../NotificationsPage.js';

describe('Customer notifications (D02-P08-T002)', () => {
  it('maps approved linked records to customer application routes', () => {
    expect(appRouteFor({ id: 'n1', customerId: 'cust-123', message: 'vehicle', type: 'Vehicle', isRead: false, createdAt: '2026-01-01', related: { kind: 'Vehicle', id: 'veh-1', href: '/customer/vehicles/veh-1' } })).toBe('/vehicles/veh-1');
    expect(appRouteFor({ id: 'n2', customerId: 'cust-123', message: 'invoice', type: 'Payment', isRead: false, createdAt: '2026-01-01', related: { kind: 'Invoice', id: 'inv-1', href: '/customer/invoices/inv-1' } })).toBe('/invoices/inv-1');
    expect(appRouteFor({ id: 'n3', customerId: 'cust-123', message: 'shipment', type: 'Shipment', isRead: false, createdAt: '2026-01-01', related: { kind: 'Shipment', id: 'ship-1', href: '/customer/shipments/ship-1' } })).toBe('/vehicles');
  });

  it('returns no route for a missing or unsupported target instead of inventing navigation', () => {
    expect(appRouteFor({ id: 'n1', customerId: 'cust-123', message: 'update', type: 'Promotion', isRead: true, createdAt: '2026-01-01' })).toBeNull();
  });

  it('keeps the page free of static inline visual styles', async () => {
    const { readFile } = await import('node:fs/promises');
    const source = await readFile(new URL('../NotificationsPage.tsx', import.meta.url), 'utf8');
    expect(source).not.toContain('style={{');
  });
});
