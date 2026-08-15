import React from 'react';
import type { CustomerDashboard } from '@carchief/api-client';

export interface CreditUtilisationCardProps {
  dashboard: CustomerDashboard;
}

/**
 * Displays credit limit, outstanding balance and credit utilisation percentage.
 * Shows the customer's financial tier and current exposure against the credit limit.
 */
export const CreditUtilisationCard: React.FC<CreditUtilisationCardProps> = ({ dashboard }) => {
  const balanceFormatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(dashboard.outstandingBalanceUsd);

  const limitFormatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(dashboard.creditLimitUsd);

  const utilisation = Math.round(dashboard.creditUtilisationPercent * 10) / 10;
  const utilisationClass = utilisation > 80 ? 'high' : utilisation > 50 ? 'medium' : 'low';

  return (
    <article className="cc-cust-card cc-cust-card--credit">
      <h2 className="cc-cust-card__title">Credit & Balance</h2>

      <div className="cc-cust-card__content">
        <div className="cc-cust-card__stat">
          <dt className="cc-cust-card__label">Outstanding Balance</dt>
          <dd className="cc-cust-card__value">{balanceFormatted}</dd>
        </div>

        <div className="cc-cust-card__stat">
          <dt className="cc-cust-card__label">Credit Limit</dt>
          <dd className="cc-cust-card__value">{limitFormatted}</dd>
        </div>

        <div className="cc-cust-card__stat">
          <dt className="cc-cust-card__label">Utilisation</dt>
          <dd className={`cc-cust-card__value cc-cust-card__value--${utilisationClass}`}>
            {utilisation}%
          </dd>
        </div>

        <div className="cc-cust-card__progress" aria-label={`Credit utilisation: ${utilisation}%`}>
          <div
            className={`cc-cust-card__progress-bar cc-cust-card__progress-bar--${utilisationClass}`}
            // Runtime-only width is passed through the documented CSS custom-property exception.
            style={{ '--cc-utilisation-width': `${Math.min(utilisation, 100)}%` } as React.CSSProperties}
          />
        </div>
      </div>
    </article>
  );
};
