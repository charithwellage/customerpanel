import { describe, expect, it } from 'vitest';
import { customerPaymentFormSchema, MAX_PAYMENT_PROOF_BYTES } from '../payment.js';

const valid = {
  invoiceId: 'inv-003', reference: 'TT-2026-001', bankName: 'Customer Bank', currency: 'USD', amountUsd: '500',
  paymentDate: '2026-08-14', remarks: '',
  proof: { fileName: 'receipt.pdf', fileType: 'PDF', sizeBytes: 1200, scanStatus: 'Pending' },
  idempotencyKey: 'idem-2026-001',
};

describe('customer TT payment form validation (D02-P06-T003)', () => {
  it('coerces the amount and accepts supported proof metadata only', () => {
    const result = customerPaymentFormSchema.parse(valid);
    expect(result.amountUsd).toBe(500);
    expect(result.proof).toEqual(expect.objectContaining({ fileType: 'PDF', scanStatus: 'Pending' }));
  });

  it('rejects invalid references, currencies and oversized proof metadata', () => {
    expect(() => customerPaymentFormSchema.parse({ ...valid, reference: 'x' })).toThrow();
    expect(() => customerPaymentFormSchema.parse({ ...valid, currency: 'EUR' })).toThrow();
    expect(() => customerPaymentFormSchema.parse({ ...valid, proof: { ...valid.proof, sizeBytes: MAX_PAYMENT_PROOF_BYTES + 1 } })).toThrow();
  });
});
