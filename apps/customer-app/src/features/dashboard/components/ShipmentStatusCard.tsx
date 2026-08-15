import React from 'react';
import type { CustomerDashboard } from '@carchief/api-client';

export interface ShipmentStatusCardProps {
  dashboard: CustomerDashboard;
}

/**
 * Displays shipment status summary: ready, in transit, delivered and other.
 * Provides a link to drill-down into shipment details.
 */
export const ShipmentStatusCard: React.FC<ShipmentStatusCardProps> = ({ dashboard }) => {
  const total = dashboard.shipmentStatusSummary.ready + dashboard.shipmentStatusSummary.inTransit + dashboard.shipmentStatusSummary.delivered + dashboard.shipmentStatusSummary.other;

  return (
    <article className="cc-cust-card cc-cust-card--shipments">
      <div className="cc-cust-card__header">
        <h2 className="cc-cust-card__title">Shipments</h2>
        <a href="/shipments" className="cc-cust-card__link" aria-label="Go to Shipments">
          View All
        </a>
      </div>

      <div className="cc-cust-card__content">
        <div className="cc-cust-card__status-counts">
          <div className="cc-cust-card__count">
            <dt className="cc-cust-card__label">Total</dt>
            <dd className="cc-cust-card__value">{total}</dd>
          </div>

          <div className="cc-cust-card__count cc-cust-card__count--ready">
            <dt className="cc-cust-card__label">Ready</dt>
            <dd className="cc-cust-card__value">{dashboard.shipmentStatusSummary.ready}</dd>
          </div>

          <div className="cc-cust-card__count cc-cust-card__count--in-transit">
            <dt className="cc-cust-card__label">In Transit</dt>
            <dd className="cc-cust-card__value">{dashboard.shipmentStatusSummary.inTransit}</dd>
          </div>

          <div className="cc-cust-card__count cc-cust-card__count--delivered">
            <dt className="cc-cust-card__label">Delivered</dt>
            <dd className="cc-cust-card__value">{dashboard.shipmentStatusSummary.delivered}</dd>
          </div>

          {dashboard.shipmentStatusSummary.other > 0 && (
            <div className="cc-cust-card__count cc-cust-card__count--other">
              <dt className="cc-cust-card__label">Other</dt>
              <dd className="cc-cust-card__value">{dashboard.shipmentStatusSummary.other}</dd>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};
