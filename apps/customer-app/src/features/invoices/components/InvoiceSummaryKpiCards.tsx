import React from 'react';
import { formatUsdAmount } from '../formatters.js';

export interface InvoiceSummaryKpiCardsProps {
  totalInvoicedUsd: number;
  totalPaidUsd: number;
  totalOutstandingUsd: number;
}

export const InvoiceSummaryKpiCards: React.FC<InvoiceSummaryKpiCardsProps> = ({
  totalInvoicedUsd,
  totalPaidUsd,
  totalOutstandingUsd,
}) => {
  const formattedInvoiced = formatUsdAmount(totalInvoicedUsd);
  const formattedPaid = formatUsdAmount(totalPaidUsd);
  const formattedOutstanding = formatUsdAmount(totalOutstandingUsd);

  return (
    <div className="cc-invoice-kpi-grid" data-testid="invoice-kpi-grid">
      <div className="cc-invoice-kpi-card cc-invoice-kpi-card--invoiced" data-testid="kpi-total-invoiced">
        <div className="cc-invoice-kpi-card__header">
          <span className="cc-invoice-kpi-card__icon" aria-hidden="true">📑</span>
          <span className="cc-invoice-kpi-card__title">Total Invoiced</span>
        </div>
        <div className="cc-invoice-kpi-card__value">{formattedInvoiced}</div>
        <div className="cc-invoice-kpi-card__subtext">All issued proforma & commercial invoices</div>
      </div>

      <div className="cc-invoice-kpi-card cc-invoice-kpi-card--paid" data-testid="kpi-total-paid">
        <div className="cc-invoice-kpi-card__header">
          <span className="cc-invoice-kpi-card__icon" aria-hidden="true">💳</span>
          <span className="cc-invoice-kpi-card__title">Total Paid</span>
        </div>
        <div className="cc-invoice-kpi-card__value">{formattedPaid}</div>
        <div className="cc-invoice-kpi-card__subtext">Confirmed wire transfer payment allocations</div>
      </div>

      <div
        className={`cc-invoice-kpi-card ${totalOutstandingUsd > 0 ? 'cc-invoice-kpi-card--outstanding' : 'cc-invoice-kpi-card--settled'}`}
        data-testid="kpi-total-outstanding"
      >
        <div className="cc-invoice-kpi-card__header">
          <span className="cc-invoice-kpi-card__icon" aria-hidden="true">⏳</span>
          <span className="cc-invoice-kpi-card__title">Outstanding Balance</span>
        </div>
        <div className="cc-invoice-kpi-card__value">{formattedOutstanding}</div>
        <div className="cc-invoice-kpi-card__subtext">
          {totalOutstandingUsd > 0 ? 'Due across active vehicle purchases' : 'All invoices fully settled'}
        </div>
      </div>
    </div>
  );
};
