import React from 'react';

export interface AllocationHistoryRecord {
  id: string;
  date: string;
  stockNumber: string;
  amountUsd: number;
}

export interface PaymentAllocationHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  reference: string;
  currency?: string;
  history?: AllocationHistoryRecord[];
}

const DEFAULT_HISTORY: AllocationHistoryRecord[] = [
  { id: 'h-1', date: '2024-09-20', stockNumber: 'J24012345', amountUsd: 3000 },
  { id: 'h-2', date: '2024-09-14', stockNumber: 'J24014521', amountUsd: 2500 },
  { id: 'h-3', date: '2024-09-12', stockNumber: 'J24038765', amountUsd: 2000 },
];

export const PaymentAllocationHistoryModal: React.FC<PaymentAllocationHistoryModalProps> = ({
  isOpen,
  onClose,
  reference,
  currency = 'USD',
  history = DEFAULT_HISTORY,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="cc-pay-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="alloc-history-title"
      data-testid="payment-allocation-history-modal"
    >
      <div className="cc-pay-modal-backdrop" onClick={onClose} />
      <div className="cc-pay-modal-dialog">
        <div className="cc-pay-modal-header">
          <h2 id="alloc-history-title" className="cc-pay-modal-title">
            Allocation History ({reference})
          </h2>
          <button
            type="button"
            className="cc-pay-modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className="cc-pay-modal-body">
          <div className="cc-pay-table-wrap">
            <table className="cc-pay-table">
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Stock Number</th>
                  <th scope="col" className="cc-pay-th--right">Allocated Amount</th>
                </tr>
              </thead>
              <tbody>
                {history.map((row) => (
                  <tr key={row.id} className="cc-pay-tr">
                    <td className="cc-pay-td-mono">{row.date}</td>
                    <td className="cc-pay-td-mono cc-pay-td-bold">{row.stockNumber}</td>
                    <td className="cc-pay-td--right cc-pay-td-mono cc-pay-td-bold cc-pay-color-green">
                      ${row.amountUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
