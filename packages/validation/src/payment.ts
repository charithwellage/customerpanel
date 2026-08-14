import { z } from 'zod';

const MAX_PAYMENT_PROOF_BYTES = 10 * 1024 * 1024;

export const customerPaymentFormSchema = z.object({
  invoiceId: z.string().trim().min(1, 'Invoice ID is required.'),
  reference: z.string().trim().min(3, 'Transfer reference must be at least 3 characters.'),
  bankName: z.string().trim().min(2, 'Bank name is required.'),
  currency: z.literal('USD', { error: 'Only USD TT submissions are supported in this demo.' }),
  amountUsd: z.coerce.number({ error: 'Enter a valid amount.' }).positive('Amount must be greater than zero.'),
  paymentDate: z.string().min(1, 'Transfer date is required.'),
  remarks: z.string().max(500, 'Remarks must be 500 characters or fewer.').optional(),
  proof: z.object({
    fileName: z.string().min(1, 'Proof file is required.'),
    fileType: z.enum(['PDF', 'JPG', 'PNG']),
    sizeBytes: z.number().int().positive().max(MAX_PAYMENT_PROOF_BYTES, 'Proof must be 10 MB or smaller.'),
    scanStatus: z.literal('Pending'),
  }),
  idempotencyKey: z.string().min(1),
});

export type CustomerPaymentFormInput = z.input<typeof customerPaymentFormSchema>;
export type CustomerPaymentFormValues = z.output<typeof customerPaymentFormSchema>;

export { MAX_PAYMENT_PROOF_BYTES };
