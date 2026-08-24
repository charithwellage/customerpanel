import { describe, expect, it } from 'vitest';
import { createStore, DatabaseRequiredError } from '../store.js';

describe('Customer statement persistence boundary', () => {
  it('does not fabricate statement transactions when PostgreSQL is unavailable', async () => {
    await expect(createStore('').getCustomerStatement('cust-123')).rejects.toBeInstanceOf(DatabaseRequiredError);
  });
});
