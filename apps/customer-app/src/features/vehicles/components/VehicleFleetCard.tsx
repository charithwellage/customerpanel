import React, { useState } from 'react';
import type { CustomerVehicleSummary } from '@carchief/domain';
import { StatusTracker } from './StatusTracker.js';

export interface VehicleFleetCardProps {
  vehicle: CustomerVehicleSummary;
  onSelect: (vehicle: CustomerVehicleSummary) => void;
  onTrackShipment?: (vehicle: CustomerVehicleSummary) => void;
  onPayDeposit?: (vehicle: CustomerVehicleSummary) => void;
}

export interface ContextualAction {
  id: string;
  label: string;
  variant: 'primary' | 'secondary' | 'outline';
  icon: string;
  onClick: (e: React.MouseEvent) => void;
}

export const VehicleFleetCard: React.FC<VehicleFleetCardProps> = ({
  vehicle,
  onSelect,
  onTrackShipment,
  onPayDeposit,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const isPI = vehicle.status === 'Under Negotiation With PI' || Boolean(vehicle.proformaInvoiceId);
  const isInvoiced = vehicle.status === 'Confirmed' || vehicle.status === 'In Transit' || vehicle.status === 'Delivered' || Boolean(vehicle.commercialBill);
  const isReserved = vehicle.status === 'Under Negotiation' || (!isPI && !isInvoiced);

  const fallbackImage = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400';
  const stockDisplay = vehicle.stockNumber || `STK: ${vehicle.chassisNumber.slice(0, 6)}`;
  const price = vehicle.priceUsd || vehicle.totalAmountUsd || 0;
  const colorSpec = vehicle.colorSpec || vehicle.color || 'Silver';
  const mileageDisplay = vehicle.mileage !== undefined ? `${vehicle.mileage.toLocaleString()} km` : '113,000 km';
  const logisticsLabel = vehicle.logisticsStatus || (vehicle.status === 'Delivered' ? 'DELIVERED' : vehicle.status === 'In Transit' ? 'IN TRANSIT' : vehicle.status === 'Confirmed' ? 'INSPECTION' : 'RESERVED');

  // Commercial bill stats
  const soldAmount = vehicle.commercialBill?.soldAmountUsd ?? vehicle.totalAmountUsd ?? price;
  const paidAmount = vehicle.commercialBill?.paidAmountUsd ?? vehicle.deposit?.paidAmountUsd ?? 0;
  const balanceAmount = vehicle.commercialBill?.balanceAmountUsd ?? Math.max(0, soldAmount - paidAmount);

  // Deposit calculation
  const depositReq = vehicle.deposit?.requiredAmountUsd;
  const piRefDisplay = vehicle.piRef || (stockDisplay ? `PI-${stockDisplay.replace(/^STK:\s*/i, '')}` : 'PI-63519');

  // Contextual actions calculation
  const handleTrackClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onTrackShipment) {
      onTrackShipment(vehicle);
    } else {
      onSelect(vehicle);
    }
  };

  const handlePayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPayDeposit) {
      onPayDeposit(vehicle);
    } else if (onTrackShipment) {
      onTrackShipment(vehicle);
    } else {
      onSelect(vehicle);
    }
  };

  const nextActionDescription = isReserved
    ? 'Awaiting initial deposit wire remittance to finalize sourcing reservation.'
    : isPI
    ? `Proforma invoice ${piRefDisplay} issued. Complete remittance to initiate export prep.`
    : vehicle.status === 'Confirmed'
    ? 'Vehicle secured at Yokohama yard. Export inspection in progress.'
    : vehicle.status === 'In Transit'
    ? `Ocean transit active to ${vehicle.destinationPort || 'Mombasa'}. Track live voyage.`
    : vehicle.status === 'Delivered'
    ? 'Vehicle delivered to discharge port. Complete final customs clearance.'
    : 'Transaction active. Review fulfillment milestones below.';

  return (
    <article
      className={`cc-cust-fleet-card cc-cust-fleet-card--interactive ${isPI ? 'cc-cust-fleet-card--pi' : ''} ${isInvoiced ? 'cc-cust-fleet-card--invoiced' : ''} ${isExpanded ? 'cc-cust-fleet-card--expanded' : ''}`}
      tabIndex={0}
      role="region"
      aria-label={`${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.statusLabel})`}
      onClick={() => onSelect(vehicle)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(vehicle);
        }
      }}
      data-testid={`fleet-vehicle-card-${vehicle.id || vehicle.chassisNumber}`}
    >
      {/* Top Image Section */}
      <div className="cc-cust-fleet-card__image-wrap">
        <img
          src={vehicle.primaryImage || fallbackImage}
          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
          className="cc-cust-fleet-card__image"
          loading="lazy"
          onError={(event) => {
            if (event.currentTarget.src !== fallbackImage) {
              event.currentTarget.src = fallbackImage;
            }
          }}
        />

        {/* Top Badges */}
        <div className="cc-cust-fleet-card__badges-row">
          {isPI && (
            <span className="cc-cust-fleet-badge cc-cust-fleet-badge--pi">
              <span className="cc-cust-fleet-badge__dot cc-cust-fleet-badge__dot--pulse" aria-hidden="true">●</span> {vehicle.statusLabel}
            </span>
          )}
          {isInvoiced && (
            <span className="cc-cust-fleet-badge cc-cust-fleet-badge--invoiced">
              <span className="cc-cust-fleet-badge__dot" aria-hidden="true">✓</span> {vehicle.statusLabel}
            </span>
          )}
          {isReserved && (
            <span className="cc-cust-fleet-badge cc-cust-fleet-badge--reserved">
              <span className="cc-cust-fleet-badge__dot cc-cust-fleet-badge__dot--pulse" aria-hidden="true">●</span> {vehicle.statusLabel}
            </span>
          )}

          <span className="cc-cust-fleet-badge cc-cust-fleet-badge--stock">
            {stockDisplay}
          </span>
        </div>

        {/* Bottom Logistics Banner on Image */}
        <div className="cc-cust-fleet-card__logistics-banner">
          LOGISTICS: {logisticsLabel}
        </div>

        <div className="cc-cust-fleet-card__list-price" aria-label={`Price ${price.toLocaleString()} dollars`}>
          <span>PRICE</span>
          <strong>${price.toLocaleString()}</strong>
        </div>

        <div className="cc-cust-fleet-card__list-meta">
          <div><span>Mileage</span><strong>{mileageDisplay}</strong></div>
        </div>

      </div>

      {/* Card Body */}
      <div className="cc-cust-fleet-card__body">
        {/* Title */}
        <div className="cc-cust-fleet-card__header-row">
          <h3 className="cc-cust-fleet-card__title">
            {vehicle.year} {vehicle.make.toUpperCase()} {vehicle.model.toUpperCase()}
          </h3>
          <span className="cc-cust-fleet-card__price-badge">
            ${price.toLocaleString()}
          </span>
        </div>

        {isInvoiced && (
          <div className="cc-cust-fleet-card__list-commercial-bill" aria-label="Purchased commercial bill summary">
            <div className="cc-cust-fleet-card__list-commercial-bill-title">✓ Purchased Commercial Bill</div>
            <div><span>Sold</span><strong>${soldAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div>
            <div><span>Paid</span><strong className="cc-cust-fleet-card__list-commercial-bill-paid">${paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div>
            <div><span>Balance</span><strong className="cc-cust-fleet-card__list-commercial-bill-balance">${balanceAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div>
          </div>
        )}

        {/* Prominent Visual Status Tracker */}
        <div className="cc-cust-fleet-card__status-tracker-container">
          <StatusTracker vehicle={vehicle} variant="stepper" />
        </div>

        {/* Specs Table */}
        <div className="cc-cust-fleet-card__specs-table">
          <div className="cc-cust-fleet-card__spec-row">
            <span className="cc-cust-fleet-card__spec-label">Chassis No:</span>
            <span className="cc-cust-fleet-card__spec-value cc-cust-fleet-card__spec-value--mono">
              {vehicle.chassisNumber}
            </span>
          </div>

          <div className="cc-cust-fleet-card__spec-row">
            <span className="cc-cust-fleet-card__spec-label">Color / Spec:</span>
            <span className="cc-cust-fleet-card__spec-value" title={colorSpec}>
              {colorSpec}
            </span>
          </div>

          <div className="cc-cust-fleet-card__spec-row">
            <span className="cc-cust-fleet-card__spec-label">Mileage:</span>
            <span className="cc-cust-fleet-card__spec-value">
              {mileageDisplay}
            </span>
          </div>

          <div className="cc-cust-fleet-card__spec-divider" />

          <div className="cc-cust-fleet-card__spec-row">
            <span className="cc-cust-fleet-card__spec-label cc-cust-fleet-card__spec-label--fob">Selling Price:</span>
            <span className="cc-cust-fleet-card__spec-value cc-cust-fleet-card__spec-value--fob">
              ${price.toLocaleString()}
            </span>
          </div>
        </div>

        {isPI && (
          <div className="cc-cust-fleet-card__highlight cc-cust-fleet-card__highlight--purple">
            <div className="cc-cust-fleet-card__highlight-title cc-cust-fleet-card__highlight-title--purple">
              <svg className="cc-cust-fleet-card__highlight-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              ADVANCE PAYMENT (PI)
            </div>
            <div className="cc-cust-fleet-card__bill-row">
              <span className="cc-cust-fleet-card__bill-label">PI Ref:</span>
              <span className="cc-cust-fleet-card__bill-val cc-cust-fleet-card__bill-val--purple">{piRefDisplay}</span>
            </div>
            <div className="cc-cust-fleet-card__bill-divider" />
            <div className="cc-cust-fleet-card__bill-row">
              <span className="cc-cust-fleet-card__bill-label">Deposit ({vehicle.deposit?.requiredPercent ?? '—'}%):</span>
              <span className="cc-cust-fleet-card__bill-val cc-cust-fleet-card__bill-val--bold">
                {depositReq !== undefined ? `$${depositReq.toLocaleString()}` : '—'}
              </span>
            </div>
          </div>
        )}

        {isInvoiced && (
          <div className="cc-cust-fleet-card__highlight cc-cust-fleet-card__highlight--green">
            <div className="cc-cust-fleet-card__highlight-title cc-cust-fleet-card__highlight-title--bill">
              <svg className="cc-cust-fleet-card__highlight-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
              PURCHASED COMMERCIAL BILL
            </div>
            <div className="cc-cust-fleet-card__bill-row">
              <span className="cc-cust-fleet-card__bill-label">Sold:</span>
              <span className="cc-cust-fleet-card__bill-val cc-cust-fleet-card__bill-val--sold">
                ${soldAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="cc-cust-fleet-card__bill-row">
              <span className="cc-cust-fleet-card__bill-label">Paid:</span>
              <span className="cc-cust-fleet-card__bill-val cc-cust-fleet-card__bill-val--paid">
                ${paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="cc-cust-fleet-card__bill-divider" />
            <div className="cc-cust-fleet-card__bill-row">
              <span className="cc-cust-fleet-card__bill-label">Bal:</span>
              <span className="cc-cust-fleet-card__bill-val cc-cust-fleet-card__bill-val--bal">
                ${balanceAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        )}

        {/* Expandable Quick View Toggle */}
        <button
          type="button"
          className="cc-cust-fleet-card__expand-toggle"
          aria-expanded={isExpanded}
          aria-controls={`fleet-details-panel-${vehicle.id || vehicle.chassisNumber}`}
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          data-testid={`fleet-card-expand-btn-${vehicle.id || vehicle.chassisNumber}`}
        >
          <span>{isExpanded ? 'Hide Status & Next Steps' : 'View Status Logs & Next Steps'}</span>
          <svg
            className={`cc-cust-fleet-card__expand-chevron ${isExpanded ? 'cc-cust-fleet-card__expand-chevron--open' : ''}`}
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {/* Expandable Panel for Detailed Status Logs & Next Steps */}
        {isExpanded && (
          <div
            id={`fleet-details-panel-${vehicle.id || vehicle.chassisNumber}`}
            className="cc-cust-fleet-card__expanded-panel"
            data-testid={`fleet-card-expanded-panel-${vehicle.id || vehicle.chassisNumber}`}
          >
            <div className="cc-cust-fleet-card__next-step-box">
              <div className="cc-cust-fleet-card__next-step-header">
                <span className="cc-cust-fleet-card__next-step-icon" aria-hidden="true">💡</span>
                <span className="cc-cust-fleet-card__next-step-title">NEXT STEP GUIDANCE</span>
              </div>
              <p className="cc-cust-fleet-card__next-step-text">{nextActionDescription}</p>
            </div>

            <div className="cc-cust-fleet-card__quick-info-grid">
              <div className="cc-cust-fleet-card__quick-info-item">
                <span className="cc-cust-fleet-card__quick-info-label">Destination Port</span>
                <span className="cc-cust-fleet-card__quick-info-value">{vehicle.destinationPort || 'Mombasa'}</span>
              </div>
              <div className="cc-cust-fleet-card__quick-info-item">
                <span className="cc-cust-fleet-card__quick-info-label">Location Status</span>
                <span className="cc-cust-fleet-card__quick-info-value">{vehicle.locationStatus || 'In Japan'}</span>
              </div>
              {vehicle.paymentDeadline && (
                <div className="cc-cust-fleet-card__quick-info-item">
                  <span className="cc-cust-fleet-card__quick-info-label">Payment Due</span>
                  <span className="cc-cust-fleet-card__quick-info-value cc-cust-fleet-card__quick-info-value--alert">
                    {new Date(vehicle.paymentDeadline).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contextual Action Buttons */}
        <div className="cc-cust-fleet-card__actions">
          {/* Primary Action Button based on Status */}
          {isReserved && (
            <button
              type="button"
              className="cc-cust-fleet-card__action-btn cc-cust-fleet-card__action-btn--primary cc-cust-fleet-card__action-btn--amber"
              data-testid={`fleet-card-primary-cta-${vehicle.id || vehicle.chassisNumber}`}
              onClick={handlePayClick}
              aria-label={`Pay 30 percent deposit for ${vehicle.year} ${vehicle.make} ${vehicle.model}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
              PAY DEPOSIT (30%)
            </button>
          )}

          {isPI && (
            <button
              type="button"
              className="cc-cust-fleet-card__action-btn cc-cust-fleet-card__action-btn--primary cc-cust-fleet-card__action-btn--purple"
              data-testid={`fleet-card-primary-cta-${vehicle.id || vehicle.chassisNumber}`}
              onClick={handlePayClick}
              aria-label={`Make a payment for ${vehicle.year} ${vehicle.make} ${vehicle.model}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              MAKE A PAYMENT
            </button>
          )}

          {/* Track / Details Action */}
          <button
            type="button"
            className="cc-cust-fleet-card__track-btn"
            data-testid={`fleet-card-track-btn-${vehicle.id || vehicle.chassisNumber}`}
            onClick={handleTrackClick}
            aria-label={`Track shipment for ${vehicle.year} ${vehicle.make} ${vehicle.model}`}
          >
            <svg className="cc-cust-fleet-card__track-svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
            </svg>
            TRACK SHIPMENT
          </button>
        </div>
      </div>
    </article>
  );
};
