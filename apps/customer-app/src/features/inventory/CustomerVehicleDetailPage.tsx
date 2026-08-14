import React from 'react';
import { VehicleGalleryPrimitive, formatVehicleTitle, getVisibleGalleryImages } from '@carchief/vehicle-detail';
import { useCustomerShell } from '../shell/index.js';
import { useCustomerVehicleDetail } from './useCustomerVehicleDetail.js';

export interface CustomerVehicleDetailPageProps {
  slug: string;
  apiBaseUrl?: string;
  token?: string;
  onBack?: () => void;
}

export const CustomerVehicleDetailPage: React.FC<CustomerVehicleDetailPageProps> = ({
  slug,
  apiBaseUrl = '',
  token,
  onBack,
}) => {
  const { user } = useCustomerShell();
  const { state, refetch, reserveVehicle } = useCustomerVehicleDetail({
    idOrSlug: slug,
    apiBaseUrl,
    token,
  });

  const { vehicle, loading, error, reserving, reserveSuccess, reserveError, holdExpiresAt } = state;

  if (loading) {
    return (
      <div className="cc-cust-detail-state" role="status" aria-live="polite">
        <div className="cc-cust-shell-spinner" aria-hidden="true" />
        <p>Loading vehicle details...</p>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="cc-cust-detail-state cc-cust-detail-state--error" role="alert">
        <h2>Unable to load vehicle</h2>
        <p>{error || 'Vehicle not found'}</p>
        <div className="cc-cust-detail-state__actions">
          {onBack && (
            <button type="button" className="cc-cust-btn cc-cust-btn--secondary" onClick={onBack}>
              &larr; Back to Inventory
            </button>
          )}
          <button type="button" className="cc-cust-btn cc-cust-btn--primary" onClick={refetch}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const title = formatVehicleTitle(vehicle);
  const images = vehicle.media ? getVisibleGalleryImages(vehicle.media) : [];
  const tierPricing = vehicle.tierPricing;
  const isRequestPrice = Boolean(vehicle.requestPrice || vehicle.priceState === 'request_price' || !vehicle.priceUsd);
  const eligibility = vehicle.reservationEligibility;

  const originalPrice = tierPricing ? tierPricing.originalPriceUsd : (vehicle.priceUsd ?? 0);
  const finalPrice = tierPricing
    ? tierPricing.tierPriceUsd
    : (vehicle.discountedPriceUsd ?? vehicle.priceUsd ?? 0);

  const displayExpiry = holdExpiresAt || eligibility?.holdExpiresAt;
  const formattedExpiry = displayExpiry ? new Date(displayExpiry).toLocaleString() : '';

  return (
    <div className="cc-cust-detail-page" data-testid="customer-vehicle-detail-page">
      {/* Back Button */}
      {onBack && (
        <div className="cc-cust-detail-nav">
          <button
            type="button"
            className="cc-cust-back-btn"
            onClick={onBack}
            aria-label="Return to inventory"
            data-testid="back-to-inventory-btn"
          >
            &larr; Back to Inventory
          </button>
        </div>
      )}

      <div className="cc-cust-detail-grid">
        {/* Gallery Section */}
        <div className="cc-cust-detail-gallery-col">
          <VehicleGalleryPrimitive images={images} title={title} />
        </div>

        {/* Info & Action Section */}
        <div className="cc-cust-detail-info-col">
          <header className="cc-cust-detail-header">
            <span className="cc-cust-detail-eyebrow">
              {vehicle.year} {vehicle.make}
            </span>
            <h1 className="cc-cust-detail-title">{vehicle.model}</h1>
            <div className="cc-cust-detail-meta-tags">
              <span className="cc-cust-tag cc-cust-tag--chassis">{vehicle.chassisNumber}</span>
              {vehicle.locationStatus && (
                <span className="cc-cust-tag cc-cust-tag--location">{vehicle.locationStatus}</span>
              )}
              {vehicle.destinationPort && (
                <span className="cc-cust-tag cc-cust-tag--port">Port: {vehicle.destinationPort}</span>
              )}
            </div>
          </header>

          {/* Pricing Card */}
          <div className="cc-cust-price-card" data-testid="vehicle-pricing-card">
            <h2 className="cc-cust-price-card__heading">Export Pricing</h2>
            {isRequestPrice ? (
              <div className="cc-cust-price-card__request">
                <span className="cc-cust-price-card__amount">Request Price</span>
                <p className="cc-cust-price-card__note">
                  Price is provided upon enquiry tailored to your destination port.
                </p>
              </div>
            ) : (
              <div className="cc-cust-price-card__breakdown">
                {tierPricing && tierPricing.tierDiscountPercent > 0 && (
                  <div className="cc-cust-price-card__tier-info">
                    <span className="cc-cust-tier-badge">
                      ⭐️ {tierPricing.tier} Tier Member (-{tierPricing.tierDiscountPercent}%)
                    </span>
                    <span className="cc-cust-price-card__original">
                      Original Price: ${originalPrice.toLocaleString()} USD
                    </span>
                  </div>
                )}
                <div className="cc-cust-price-card__final-row">
                  <span className="cc-cust-price-card__label">Your Account Price:</span>
                  <span className="cc-cust-price-card__final-price" data-testid="vehicle-final-price">
                    ${finalPrice.toLocaleString()} <span className="cc-cust-price-card__currency">USD</span>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Reservation Card (RULE-05, RULE-08, RULE-10, PUB-23) */}
          <div className="cc-cust-reservation-card" data-testid="vehicle-reservation-card">
            <h2 className="cc-cust-reservation-card__heading">Vehicle Allocation & Reservation</h2>

            {reserveSuccess || eligibility?.isOwnHold ? (
              <div className="cc-cust-reservation-status cc-cust-reservation-status--own-hold" role="status">
                <div className="cc-cust-status-banner cc-cust-status-banner--success">
                  <span className="cc-cust-status-banner__icon">✓</span>
                  <div>
                    <strong>You have an active 48-hour reservation hold</strong>
                    <p>Hold expires at: <strong>{formattedExpiry}</strong></p>
                    <p className="cc-cust-status-banner__sub">
                      Our export desk is preparing your pro-forma invoice.
                    </p>
                  </div>
                </div>
              </div>
            ) : eligibility?.reason === 'reserved_by_other' ? (
              <div className="cc-cust-reservation-status cc-cust-reservation-status--held" role="status">
                <div className="cc-cust-status-banner cc-cust-status-banner--warning">
                  <span className="cc-cust-status-banner__icon">⏳</span>
                  <div>
                    <strong>Vehicle Currently Reserved</strong>
                    <p>
                      Another customer has an active 48-hour hold on this vehicle expiring at{' '}
                      <strong>{formattedExpiry}</strong>. If not finalized, stock will automatically return to sale.
                    </p>
                  </div>
                </div>
              </div>
            ) : isRequestPrice ? (
              <div className="cc-cust-reservation-status cc-cust-reservation-status--info" role="status">
                <div className="cc-cust-status-banner cc-cust-status-banner--info">
                  <span className="cc-cust-status-banner__icon">ℹ️</span>
                  <div>
                    <strong>Price Upon Request</strong>
                    <p>Please request quotation to confirm export costs before reserving.</p>
                  </div>
                </div>
              </div>
            ) : eligibility?.eligible ? (
              <div className="cc-cust-reservation-action">
                <p className="cc-cust-reservation-terms">
                  Placing a reservation locks this vehicle exclusively for your account for{' '}
                  <strong>48 hours</strong> with zero upfront payment commitment.
                </p>
                {reserveError && (
                  <div className="cc-cust-reservation-error" role="alert">
                    <p>{reserveError}</p>
                  </div>
                )}
                <button
                  type="button"
                  className="cc-cust-btn cc-cust-btn--primary cc-cust-btn--large cc-cust-reserve-btn"
                  onClick={reserveVehicle}
                  disabled={reserving}
                  data-testid="reserve-vehicle-btn"
                >
                  {reserving ? 'Placing 48h Hold...' : 'Reserve Vehicle (48h Hold)'}
                </button>
              </div>
            ) : (
              <div className="cc-cust-reservation-status cc-cust-reservation-status--unavailable" role="status">
                <p>This vehicle is currently not available for reservation.</p>
              </div>
            )}
          </div>

          {/* Specifications Table */}
          <div className="cc-cust-specs-card">
            <h2 className="cc-cust-specs-card__heading">Vehicle Specifications</h2>
            <dl className="cc-cust-specs-list">
              <div className="cc-cust-specs-item">
                <dt>Chassis No.</dt>
                <dd>{vehicle.chassisNumber}</dd>
              </div>
              <div className="cc-cust-specs-item">
                <dt>Year</dt>
                <dd>{vehicle.year}</dd>
              </div>
              <div className="cc-cust-specs-item">
                <dt>Make</dt>
                <dd>{vehicle.make}</dd>
              </div>
              <div className="cc-cust-specs-item">
                <dt>Model</dt>
                <dd>{vehicle.model}</dd>
              </div>
              {vehicle.bodyStyle && (
                <div className="cc-cust-specs-item">
                  <dt>Body Style</dt>
                  <dd>{vehicle.bodyStyle}</dd>
                </div>
              )}
              {vehicle.fuelType && (
                <div className="cc-cust-specs-item">
                  <dt>Fuel Type</dt>
                  <dd>{vehicle.fuelType}</dd>
                </div>
              )}
              {vehicle.transmission && (
                <div className="cc-cust-specs-item">
                  <dt>Transmission</dt>
                  <dd>{vehicle.transmission}</dd>
                </div>
              )}
              {vehicle.driveTrain && (
                <div className="cc-cust-specs-item">
                  <dt>Drive Train</dt>
                  <dd>{vehicle.driveTrain}</dd>
                </div>
              )}
              {vehicle.mileage !== undefined && (
                <div className="cc-cust-specs-item">
                  <dt>Mileage</dt>
                  <dd>{vehicle.mileage.toLocaleString()} km</dd>
                </div>
              )}
              {vehicle.stockType && (
                <div className="cc-cust-specs-item">
                  <dt>Stock Type</dt>
                  <dd>{vehicle.stockType === 'J' ? 'Japan Stock' : vehicle.stockType === 'CRFO' ? 'Cross-Regional Stock' : vehicle.stockType}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};
