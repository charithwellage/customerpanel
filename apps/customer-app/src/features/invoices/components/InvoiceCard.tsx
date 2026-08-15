import React from 'react';
import type { CustomerInvoiceSummary } from '@carchief/domain';

export interface InvoiceCardProps {
  invoice: CustomerInvoiceSummary;
  onSelect: (invoice: CustomerInvoiceSummary) => void;
}

export const InvoiceCard: React.FC<InvoiceCardProps> = ({ invoice, onSelect }) => {
  const percentPaid = invoice.totalAmountUsd > 0
    ? Math.min(100, Math.round((invoice.paidAmountUsd / invoice.totalAmountUsd) * 100))
    : 0;

  const isProforma = invoice.type === 'Proforma';
  const formattedTotal = `$${invoice.totalAmountUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formattedPaid = `$${invoice.paidAmountUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formattedOutstanding = `$${invoice.outstandingAmountUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'cc-invoice-badge--paid';
      case 'PartiallyPaid':
        return 'cc-invoice-badge--partial';
      case 'Issued':
        return 'cc-invoice-badge--issued';
      case 'Expired':
        return 'cc-invoice-badge--expired';
      case 'Cancelled':
        return 'cc-invoice-badge--cancelled';
      default:
        return 'cc-invoice-badge--neutral';
    }
  };

  const formattedDate = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      return new Date(isoString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <article
      className="cc-invoice-card"
      data-testid={`invoice-card-${invoice.id}`}
      tabIndex={0}
      role="button"
      aria-label={`View invoice ${invoice.invoiceNumber} for ${invoice.year} ${invoice.make} ${invoice.model}`}
      onClick={() => onSelect(invoice)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(invoice);
        }
      }}
    >
      <div className="cc-invoice-card__top">
        <div className="cc-invoice-card__meta">
          <span className={`cc-invoice-type-pill ${isProforma ? 'cc-invoice-type-pill--pi' : 'cc-invoice-type-pill--comm'}`}>
            {isProforma ? 'Proforma Invoice (PI)' : 'Commercial Invoice'}
          </span>
          <span className={`cc-invoice-badge ${getStatusBadgeClass(invoice.status)}`}>
            {invoice.status}
          </span>
        </div>
        <div className="cc-invoice-card__number-wrap">
          <span className="cc-invoice-card__number">{invoice.invoiceNumber}</span>
        </div>
      </div>

      <div className="cc-invoice-card__vehicle-section">
        <div className="cc-invoice-card__vehicle-title">
          {invoice.year} {invoice.make} {invoice.model}
        </div>
        <div className="cc-invoice-card__vehicle-ref">
          <span className="cc-invoice-card__label">Ref / Chassis:</span>
          <span className="cc-invoice-card__code">{invoice.vehicleId}</span>
        </div>
      </div>

      <div className="cc-invoice-card__financials">
        <div className="cc-invoice-card__amounts-grid">
          <div className="cc-invoice-card__amount-cell">
            <span className="cc-invoice-card__amount-label">Total Amount</span>
            <span className="cc-invoice-card__amount-val cc-invoice-card__amount-val--total">
              {formattedTotal}
            </span>
          </div>

          <div className="cc-invoice-card__amount-cell">
            <span className="cc-invoice-card__amount-label">Paid</span>
            <span className="cc-invoice-card__amount-val cc-invoice-card__amount-val--paid">
              {formattedPaid}
            </span>
          </div>

          <div className="cc-invoice-card__amount-cell">
            <span className="cc-invoice-card__amount-label">Outstanding</span>
            <span
              className={`cc-invoice-card__amount-val ${
                invoice.outstandingAmountUsd > 0
                  ? 'cc-invoice-card__amount-val--outstanding'
                  : 'cc-invoice-card__amount-val--zero'
              }`}
            >
              {formattedOutstanding}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="cc-invoice-card__progress-container">
          <div
            className="cc-invoice-card__progress-bar"
            role="progressbar"
            aria-valuenow={percentPaid}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Payment progress ${percentPaid}%`}
          >
            <div
              className="cc-invoice-card__progress-fill"
              style={{ '--cc-invoice-progress-width': `${percentPaid}%` } as React.CSSProperties}
            />
          </div>
          <span className="cc-invoice-card__progress-text">{percentPaid}% Paid</span>
        </div>
      </div>

      <div className="cc-invoice-card__footer">
        <div className="cc-invoice-card__dates">
          <div className="cc-invoice-card__date-row">
            <span className="cc-invoice-card__date-lbl">Issued:</span>
            <span>{formattedDate(invoice.issuedAt)}</span>
          </div>
          {isProforma ? (
            <div className="cc-invoice-card__date-row cc-invoice-card__date-row--pi">
              <span className="cc-invoice-card__date-lbl">72h Deadline:</span>
              <span className="cc-invoice-card__deadline-val">{formattedDate(invoice.paymentDeadline || invoice.dueDate)}</span>
            </div>
          ) : (
            <div className="cc-invoice-card__date-row">
              <span className="cc-invoice-card__date-lbl">Due Date:</span>
              <span>{formattedDate(invoice.dueDate)}</span>
            </div>
          )}
        </div>

        <div className="cc-invoice-card__actions">
          <button
            type="button"
            className="cc-invoice-card__btn"
            data-testid={`btn-view-invoice-${invoice.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(invoice);
            }}
          >
            View Details & Document →
          </button>
        </div>
      </div>
    </article>
  );
};
