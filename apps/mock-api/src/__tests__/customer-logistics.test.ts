import { describe, expect, it } from 'vitest';
import { createStore } from '../store.js';

describe('Customer shipment and document projections (D02-P07-T001)', () => {
  it('returns ordered shipment stages and freshness without staff details', async () => {
    const shipments = await createStore().listCustomerShipments('cust-123');
    expect(shipments).toHaveLength(3);
    expect(shipments.map((shipment) => shipment.stage)).toEqual(['Ready', 'In Transit', 'Delivered']);
    expect(shipments[1].freshness).toBe('fresh');
    expect(shipments[0]).not.toHaveProperty('customerId');
    expect(shipments[0]).not.toHaveProperty('erpCheckpoint');
  });

  it('enforces customer ownership for shipment details', async () => {
    const store = createStore();
    expect(await store.getCustomerShipment('cust-123', 'ship-004')).toBeNull();
    expect(await store.getCustomerShipment('cust-exception-001', 'ship-004')).not.toBeNull();
  });

  it('returns only documents approved for release and visible to the customer', async () => {
    const store = createStore();
    const documents = await store.listCustomerDocuments('cust-123');
    expect(documents.map((document) => document.id)).toEqual(['doc-001', 'doc-004']);
    expect(await store.getCustomerDocument('cust-123', 'doc-003')).toBeNull();
    expect(await store.getCustomerDocument('cust-123', 'doc-001')).not.toBeNull();
  });

  it('does not leak another customer document by identifier', async () => {
    const store = createStore();
    expect(await store.getCustomerDocument('cust-123', 'doc-005')).toBeNull();
  });

});
