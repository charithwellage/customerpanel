import React from 'react';
import type { CustomerVehicleSummary } from '@carchief/domain';

export interface VehicleFleetCardProps {
  vehicle: CustomerVehicleSummary;
  onSelect: (vehicle: CustomerVehicleSummary) => void;
}

export const VehicleFleetCard: React.FC<VehicleFleetCardProps> = ({ vehicle, onSelect }) => {
  const statusSlug = vehicle.status.toLowerCase().replace(/\s+/g, '-');
  const fallbackImage = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400';

  return (
    <article
      className="cc-cust-fleet-card cc-cust-fleet-card--interactive"
      tabIndex={0}
      role="region"
      aria-label={`${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.status})`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(vehicle);
        }
      }}
    >
      <div className="cc-cust-fleet-card__image-wrap">
        <img
          src={vehicle.primaryImage || fallbackImage}
          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
          className="cc-cust-fleet-card__image"
          loading="lazy"
        />
        <span className={`cc-cust-fleet-badge cc-cust-fleet-badge--status cc-cust-fleet-badge--${statusSlug}`}>
          {vehicle.status}
        </span>
      </div>

      <div className="cc-cust-fleet-card__body">
        <div className="cc-cust-fleet-card__title-row">
          <h3 className="cc-cust-fleet-card__title">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h3>
          <span className="cc-cust-fleet-card__chassis">{vehicle.chassisNumber}</span>
        </div>

        <div className="cc-cust-fleet-card__price-row">
          <div className="cc-cust-fleet-card__price-block">
            <span className="cc-cust-fleet-card__price-label">Vehicle Price</span>
            <span className="cc-cust-fleet-card__price">${vehicle.totalAmountUsd.toLocaleString()} USD</span>
          </div>

          {vehicle.deposit && (
            <div className="cc-cust-fleet-card__deposit-block">
              <span className="cc-cust-fleet-card__deposit-label">
                Deposit (50%): ${vehicle.deposit.requiredAmountUsd.toLocaleString()}
              </span>
              <span className="cc-cust-fleet-card__deposit-status">
                {vehicle.deposit.isFullyPaid ? 'Paid' : `Remaining: $${vehicle.deposit.remainingAmountUsd.toLocaleString()}`}
              </span>
            </div>
          )}
        </div>

        <div className="cc-cust-fleet-card__meta-row">
          {vehicle.locationStatus && (
            <span className="cc-cust-fleet-meta-tag">📍 {vehicle.locationStatus} ({vehicle.destinationPort || 'Mombasa'})</span>
          )}

          {vehicle.reservationExpiresAt && vehicle.status === 'Under Negotiation' && (
            <span className="cc-cust-fleet-meta-tag cc-cust-fleet-meta-tag--warning">
              ⏱ Hold expires: {new Date(vehicle.reservationExpiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}

          {vehicle.paymentDeadline && vehicle.status === 'Under Negotiation With PI' && (
            <span className="cc-cust-fleet-meta-tag cc-cust-fleet-meta-tag--accent">
              📅 Pay by: {new Date(vehicle.paymentDeadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>

        <div className="cc-cust-fleet-card__actions">
          <button
            type="button"
            className="cc-cust-fleet-btn cc-cust-fleet-btn--primary"
            onClick={() => onSelect(vehicle)}
            aria-label={`View details for ${vehicle.year} ${vehicle.make} ${vehicle.model}`}
          >
            View Details & Documents
          </button>
        </div>
      </div>
    </article>
  );
};
