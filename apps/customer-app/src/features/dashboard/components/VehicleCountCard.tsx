import React from 'react';
import type { CustomerDashboard } from '@carchief/api-client';

export interface VehicleCountCardProps {
  dashboard: CustomerDashboard;
}

/**
 * Displays vehicle counts by status: reserved, invoiced and delivered.
 * Provides a link to drill-down into the vehicle details.
 */
export const VehicleCountCard: React.FC<VehicleCountCardProps> = ({ dashboard }) => {
  const totalVehicles = dashboard.vehicleCountReserved + dashboard.vehicleCountInvoiced + dashboard.vehicleCountDelivered;

  return (
    <article className="cc-cust-card cc-cust-card--vehicles">
      <div className="cc-cust-card__header">
        <h2 className="cc-cust-card__title">Vehicles</h2>
        <a href="/vehicles" className="cc-cust-card__link" aria-label="Go to My Vehicles">
          View All
        </a>
      </div>

      <div className="cc-cust-card__content">
        <div className="cc-cust-card__vehicle-counts">
          <div className="cc-cust-card__count">
            <dt className="cc-cust-card__label">Total</dt>
            <dd className="cc-cust-card__value">{totalVehicles}</dd>
          </div>

          <div className="cc-cust-card__count">
            <dt className="cc-cust-card__label">Reserved</dt>
            <dd className="cc-cust-card__value">{dashboard.vehicleCountReserved}</dd>
          </div>

          <div className="cc-cust-card__count">
            <dt className="cc-cust-card__label">Invoiced</dt>
            <dd className="cc-cust-card__value">{dashboard.vehicleCountInvoiced}</dd>
          </div>

          <div className="cc-cust-card__count">
            <dt className="cc-cust-card__label">Delivered</dt>
            <dd className="cc-cust-card__value">{dashboard.vehicleCountDelivered}</dd>
          </div>
        </div>
      </div>
    </article>
  );
};
