import React from 'react';
import type { CustomerInvoiceLineItem } from '@carchief/domain';

export interface InvoiceLineItemsTableProps {
  lineItems: CustomerInvoiceLineItem[];
  totalAmountUsd: number;
  paidAmountUsd?: number;
  outstandingAmountUsd?: number;
}

export const InvoiceLineItemsTable: React.FC<InvoiceLineItemsTableProps> = ({
  lineItems,
  totalAmountUsd,
  paidAmountUsd = 0,
  outstandingAmountUsd = 0,
}) => {
  return (
    <div className="cc-invoice-items-card" data-testid="invoice-line-items-card">
      <h3 className="cc-invoice-items-card__title">Itemized Invoice Charges</h3>
      <div className="cc-invoice-items-table-wrap">
        <table className="cc-invoice-items-table" data-testid="invoice-line-items-table">
          <thead>
            <tr>
              <th scope="col" className="cc-invoice-items-th cc-invoice-items-th--desc">Description</th>
              <th scope="col" className="cc-invoice-items-th cc-invoice-items-th--qty">Qty</th>
              <th scope="col" className="cc-invoice-items-th cc-invoice-items-th--unit">Unit Price (USD)</th>
              <th scope="col" className="cc-invoice-items-th cc-invoice-items-th--total">Amount (USD)</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, idx) => (
              <tr key={item.id || `item-${idx}`} className="cc-invoice-items-tr">
                <td className="cc-invoice-items-td cc-invoice-items-td--desc">{item.description}</td>
                <td className="cc-invoice-items-td cc-invoice-items-td--qty">{item.quantity}</td>
                <td className="cc-invoice-items-td cc-invoice-items-td--unit">
                  ${item.unitPriceUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="cc-invoice-items-td cc-invoice-items-td--total">
                  ${item.amountUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="cc-invoice-items-tfoot-tr cc-invoice-items-tfoot-tr--total">
              <td colSpan={3} className="cc-invoice-items-tfoot-lbl">Total Invoice Amount:</td>
              <td className="cc-invoice-items-tfoot-val" data-testid="line-items-total">
                ${totalAmountUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>
            {paidAmountUsd > 0 && (
              <tr className="cc-invoice-items-tfoot-tr cc-invoice-items-tfoot-tr--paid">
                <td colSpan={3} className="cc-invoice-items-tfoot-lbl">Less Paid / Allocated Amount:</td>
                <td className="cc-invoice-items-tfoot-val cc-invoice-items-tfoot-val--paid" data-testid="line-items-paid">
                  -${paidAmountUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            )}
            <tr className="cc-invoice-items-tfoot-tr cc-invoice-items-tfoot-tr--balance">
              <td colSpan={3} className="cc-invoice-items-tfoot-lbl">Balance Outstanding:</td>
              <td
                className={`cc-invoice-items-tfoot-val ${
                  outstandingAmountUsd > 0 ? 'cc-invoice-items-tfoot-val--outstanding' : 'cc-invoice-items-tfoot-val--zero'
                }`}
                data-testid="line-items-outstanding"
              >
                ${outstandingAmountUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
