import { describe, expect, it } from 'vitest';
import { createStore } from '../store.js';

describe('Customer document projections backed by shipment data (D02-P07-T001)', () => {
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
