import React from 'react';
import type { CustomerInvoiceAllocationItem } from '@carchief/domain';
import { formatInvoiceDate, formatUsdAmount } from '../formatters.js';

export interface PaymentAllocationsTableProps {
  allocations: CustomerInvoiceAllocationItem[];
  paidAmountUsd: number;
}

export const PaymentAllocationsTable: React.FC<PaymentAllocationsTableProps> = ({
  allocations,
  paidAmountUsd,
}) => {
  if (!allocations || allocations.length === 0) {
    return (
      <div className="cc-invoice-allocations-card" data-testid="invoice-allocations-card">
        <h3 className="cc-invoice-allocations-card__title">Payment Allocations (T/T Receipts)</h3>
        <div className="cc-invoice-allocations-card__empty" data-testid="allocations-empty">
          No wire transfer payments have been allocated to this invoice yet.
        </div>
      </div>
    );
  }

  return (
    <div className="cc-invoice-allocations-card" data-testid="invoice-allocations-card">
      <div className="cc-invoice-allocations-card__header">
        <h3 className="cc-invoice-allocations-card__title">Payment Allocations (T/T Receipts)</h3>
        <span className="cc-invoice-allocations-card__count">
          {allocations.length} {allocations.length === 1 ? 'Allocation' : 'Allocations'}
        </span>
      </div>

      <div className="cc-invoice-allocations-table-wrap">
        <table className="cc-invoice-allocations-table" data-testid="invoice-allocations-table">
          <thead>
            <tr>
              <th scope="col" className="cc-alloc-th">Allocation Ref</th>
              <th scope="col" className="cc-alloc-th">Payment Reference</th>
              <th scope="col" className="cc-alloc-th">Allocated Date</th>
              <th scope="col" className="cc-alloc-th cc-alloc-th--amount">Amount (USD)</th>
              <th scope="col" className="cc-alloc-th cc-alloc-th--status">Status</th>
            </tr>
          </thead>
          <tbody>
            {allocations.map((alloc) => (
              <tr key={alloc.id} className="cc-alloc-tr">
                <td className="cc-alloc-td">
                  <span className="cc-alloc-id">{alloc.id}</span>
                </td>
                <td className="cc-alloc-td">
                  <span className="cc-alloc-pay-id">{alloc.paymentId}</span>
                </td>
                <td className="cc-alloc-td">{formatInvoiceDate(alloc.allocatedAt)}</td>
                <td className="cc-alloc-td cc-alloc-td--amount">
                  +{formatUsdAmount(alloc.amountUsd)}
                </td>
                <td className="cc-alloc-td cc-alloc-td--status">
                  <span className="cc-alloc-status-badge cc-alloc-status-badge--approved">
                    {alloc.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="cc-alloc-tfoot-tr">
              <td colSpan={3} className="cc-alloc-tfoot-lbl">Total Confirmed Payments:</td>
              <td className="cc-alloc-tfoot-val" data-testid="allocations-total-amount">
                {formatUsdAmount(paidAmountUsd)}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
