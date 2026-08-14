import React from 'react';
import type { CustomerDashboard } from '@carchief/api-client';

export interface DocumentCardProps {
  dashboard: CustomerDashboard;
}

/**
 * Displays document availability summary: available, pending and unavailable documents.
 * Provides a link to drill-down into document vault.
 */
export const DocumentCard: React.FC<DocumentCardProps> = ({ dashboard }) => {
  const total = dashboard.documentAvailabilityCount.available + dashboard.documentAvailabilityCount.pending + dashboard.documentAvailabilityCount.unavailable;

  return (
    <article className="cc-cust-card cc-cust-card--documents">
      <div className="cc-cust-card__header">
        <h2 className="cc-cust-card__title">Documents</h2>
        <a href="/documents" className="cc-cust-card__link" aria-label="Go to Documents">
          View All
        </a>
      </div>

      <div className="cc-cust-card__content">
        <div className="cc-cust-card__status-counts">
          <div className="cc-cust-card__count">
            <dt className="cc-cust-card__label">Total</dt>
            <dd className="cc-cust-card__value">{total}</dd>
          </div>

          <div className="cc-cust-card__count cc-cust-card__count--available">
            <dt className="cc-cust-card__label">Available</dt>
            <dd className="cc-cust-card__value">{dashboard.documentAvailabilityCount.available}</dd>
          </div>

          <div className="cc-cust-card__count cc-cust-card__count--pending">
            <dt className="cc-cust-card__label">Pending</dt>
            <dd className="cc-cust-card__value">{dashboard.documentAvailabilityCount.pending}</dd>
          </div>

          {dashboard.documentAvailabilityCount.unavailable > 0 && (
            <div className="cc-cust-card__count cc-cust-card__count--unavailable">
              <dt className="cc-cust-card__label">Unavailable</dt>
              <dd className="cc-cust-card__value">{dashboard.documentAvailabilityCount.unavailable}</dd>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};
