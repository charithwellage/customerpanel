export interface StatementSeedRow {
  id: string;
  customerId: string;
  entryDate: string;
  entryType: 'OpeningBalance' | 'Invoice' | 'DebitNote' | 'CreditNote' | 'Payment';
  description: string;
  referenceNo?: string;
  debitUsd: number;
  creditUsd: number;
  openingBalanceUsd?: number;
  isOpeningBalance?: boolean;
  sourceType?: string;
  sourceId?: string;
  createdAt: string;
}

/** Database reset fixtures. These are persisted during reset and are never
 * used as a runtime response fallback. */
export const statementSeedRows: StatementSeedRow[] = [
  { id: 'stmt-opening-cust-123', customerId: 'cust-123', entryDate: '2026-06-01', entryType: 'OpeningBalance', description: 'Opening Balance (Forward from previous cycle)', debitUsd: 0, creditUsd: 0, openingBalanceUsd: 10000, isOpeningBalance: true, createdAt: '2026-06-01T00:00:00.000Z' },
  { id: 'tx-1', customerId: 'cust-123', entryDate: '2026-06-05', entryType: 'Invoice', description: 'Invoice created', referenceNo: 'I-2020', debitUsd: 5000, creditUsd: 0, sourceType: 'invoice', sourceId: 'I-2020', createdAt: '2026-06-05T00:00:00.000Z' },
  { id: 'tx-2', customerId: 'cust-123', entryDate: '2026-06-10', entryType: 'DebitNote', description: 'Debit Note', referenceNo: 'DN2400001', debitUsd: 250, creditUsd: 0, sourceType: 'debit_note', sourceId: 'DN2400001', createdAt: '2026-06-10T00:00:00.000Z' },
  { id: 'tx-3', customerId: 'cust-123', entryDate: '2026-06-20', entryType: 'Payment', description: 'Payment received', referenceNo: 'TT2400002', debitUsd: 0, creditUsd: 16000, sourceType: 'payment', sourceId: 'TT2400002', createdAt: '2026-06-20T00:00:00.000Z' },
  { id: 'tx-4', customerId: 'cust-123', entryDate: '2026-07-05', entryType: 'CreditNote', description: 'Credit Note', referenceNo: 'CR2400005', debitUsd: 0, creditUsd: 400, sourceType: 'credit_note', sourceId: 'CR2400005', createdAt: '2026-07-05T00:00:00.000Z' },
  { id: 'tx-5', customerId: 'cust-123', entryDate: '2026-07-18', entryType: 'Invoice', description: 'Invoice created', referenceNo: 'I-2022', debitUsd: 3400, creditUsd: 0, sourceType: 'invoice', sourceId: 'I-2022', createdAt: '2026-07-18T00:00:00.000Z' },
  { id: 'tx-6', customerId: 'cust-123', entryDate: '2026-08-02', entryType: 'Payment', description: 'Payment received', referenceNo: 'TT2400003', debitUsd: 0, creditUsd: 4000, sourceType: 'payment', sourceId: 'TT2400003', createdAt: '2026-08-02T00:00:00.000Z' },
  { id: 'tx-7', customerId: 'cust-123', entryDate: '2026-08-08', entryType: 'DebitNote', description: 'Debit Note', referenceNo: 'DN2400008', debitUsd: 1000, creditUsd: 0, sourceType: 'debit_note', sourceId: 'DN2400008', createdAt: '2026-08-08T00:00:00.000Z' },
  { id: 'tx-8', customerId: 'cust-123', entryDate: '2026-08-15', entryType: 'Invoice', description: 'Invoice created', referenceNo: 'I-3456', debitUsd: 3500, creditUsd: 0, sourceType: 'invoice', sourceId: 'I-3456', createdAt: '2026-08-15T00:00:00.000Z' },
  { id: 'tx-9', customerId: 'cust-123', entryDate: '2026-08-18', entryType: 'Payment', description: 'Payment received', referenceNo: 'TT-2026-0818-01', debitUsd: 0, creditUsd: 12800, sourceType: 'payment', sourceId: 'TT-2026-0818-01', createdAt: '2026-08-18T00:00:00.000Z' },
  { id: 'tx-10', customerId: 'cust-123', entryDate: '2026-08-20', entryType: 'Invoice', description: 'Invoice created', referenceNo: 'INV-2026-0087', debitUsd: 15400, creditUsd: 0, sourceType: 'invoice', sourceId: 'INV-2026-0087', createdAt: '2026-08-20T00:00:00.000Z' },
  { id: 'tx-11', customerId: 'cust-123', entryDate: '2026-08-22', entryType: 'DebitNote', description: 'Debit Note', referenceNo: 'DN-2026-0012', debitUsd: 325, creditUsd: 0, sourceType: 'debit_note', sourceId: 'DN-2026-0012', createdAt: '2026-08-22T00:00:00.000Z' },
  { id: 'tx-12', customerId: 'cust-123', entryDate: '2026-08-23', entryType: 'Payment', description: 'Payment received', referenceNo: 'TT-2026-0823-01', debitUsd: 0, creditUsd: 8000, sourceType: 'payment', sourceId: 'TT-2026-0823-01', createdAt: '2026-08-23T00:00:00.000Z' },
];
