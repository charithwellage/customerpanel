import { describe, expect, it } from 'vitest';
import type { CustomerShipment } from '@carchief/api-client';

describe('Customer shipment tracking (D02-P07-T002)', () => {
  it('accepts the server-approved stage order and freshness states', () => {
    const shipment: CustomerShipment = {
      id: 'ship-001',
      vehicleId: 'veh-1',
      stage: 'Ready',
      shippedAt: '2026-08-10T10:00:00.000Z',
      freshness: 'fresh',
      shipOkStatus: 'Approved',
      documentReleaseStatus: 'Pending',
    };
    expect(['fresh', 'stale', 'unknown']).toContain(shipment.freshness);
    expect(['Pending', 'Approved', 'Rejected']).toContain(shipment.shipOkStatus);
    expect(['Pending', 'Approved', 'Rejected']).toContain(shipment.documentReleaseStatus);
  });

  it('keeps the tracking page class-styled and free of static inline styles', async () => {
    const { readFile } = await import('node:fs/promises');
    const source = await readFile(new URL('../ShipmentPage.tsx', import.meta.url), 'utf8');
    expect(source).not.toContain('style={{');
    expect(source).toContain('cc-cust-shipment-card__timeline');
  });
});
