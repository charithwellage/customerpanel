import React from 'react';
import type { CustomerDashboard } from '@carchief/api-client';

export interface PaymentStatusCardProps {
  dashboard: CustomerDashboard;
}

/**
 * Displays payment status summary: approved, pending and rejected payments.
 * Provides a link to drill-down into payment details.
 */
export const PaymentStatusCard: React.FC<PaymentStatusCardProps> = ({ dashboard }) => {
  const total = dashboard.paymentStatusSummary.approved + dashboard.paymentStatusSummary.pending + dashboard.paymentStatusSummary.rejected;

  return (
    <article className="cc-cust-card cc-cust-card--payments">
      <div className="cc-cust-card__header">
        <h2 className="cc-cust-card__title">Payments</h2>
        <a href="/payments" className="cc-cust-card__link" aria-label="Go to Payments">
          View All
        </a>
      </div>

      <div className="cc-cust-card__content">
        <div className="cc-cust-card__status-counts">
          <div className="cc-cust-card__count">
            <dt className="cc-cust-card__label">Total</dt>
            <dd className="cc-cust-card__value">{total}</dd>
          </div>

          <div className="cc-cust-card__count cc-cust-card__count--approved">
            <dt className="cc-cust-card__label">Approved</dt>
            <dd className="cc-cust-card__value">{dashboard.paymentStatusSummary.approved}</dd>
          </div>

          <div className="cc-cust-card__count cc-cust-card__count--pending">
            <dt className="cc-cust-card__label">Pending</dt>
            <dd className="cc-cust-card__value">{dashboard.paymentStatusSummary.pending}</dd>
          </div>

          <div className="cc-cust-card__count cc-cust-card__count--rejected">
            <dt className="cc-cust-card__label">Rejected</dt>
            <dd className="cc-cust-card__value">{dashboard.paymentStatusSummary.rejected}</dd>
          </div>
        </div>
      </div>
    </article>
  );
};
