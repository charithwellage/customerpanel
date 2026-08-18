import React from 'react';
import type { CustomerVehicleSummary } from '@carchief/domain';

export interface VehicleFleetCardProps {
  vehicle: CustomerVehicleSummary;
  onSelect: (vehicle: CustomerVehicleSummary) => void;
}

export const VehicleFleetCard: React.FC<VehicleFleetCardProps> = ({ vehicle, onSelect }) => {
  const isPI = vehicle.status === 'Under Negotiation With PI' || Boolean(vehicle.proformaInvoiceId);
  const isInvoiced = vehicle.status === 'Confirmed' || vehicle.status === 'In Transit' || vehicle.status === 'Delivered' || Boolean(vehicle.commercialBill);
  const isReserved = (vehicle.status === 'Under Negotiation' || (!isPI && !isInvoiced));

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
  const depositReq = vehicle.deposit?.requiredAmountUsd ?? Math.round(price * 0.5);
  const piRefDisplay = vehicle.piRef || (stockDisplay ? `PI-${stockDisplay.replace(/^STK:\s*/i, '')}` : 'PI-63519');

  // Progress Bar Stages
  let middleStage = 'RESERVED';
  let progressPercent = 50;
  let progressTone = 'amber';

  if (isInvoiced) {
    progressTone = 'green';
    if (vehicle.status === 'Delivered') {
      middleStage = 'DELIVERED';
      progressPercent = 100;
    } else if (vehicle.status === 'In Transit') {
      middleStage = 'IN TRANSIT';
      progressPercent = 75;
    } else {
      middleStage = 'INSPECTION';
      progressPercent = 50;
    }
  } else if (isPI) {
    middleStage = 'RESERVED';
    progressPercent = 50;
    progressTone = 'purple';
  } else {
    middleStage = 'RESERVED';
    progressPercent = 50;
    progressTone = 'amber';
  }

  return (
    <article
      className={`cc-cust-fleet-card cc-cust-fleet-card--interactive ${isPI ? 'cc-cust-fleet-card--pi' : ''} ${isInvoiced ? 'cc-cust-fleet-card--invoiced' : ''}`}
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
      {/* Top Image Section */}
      <div className="cc-cust-fleet-card__image-wrap">
        <img
          src={vehicle.primaryImage || fallbackImage}
          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
          className="cc-cust-fleet-card__image"
          loading="lazy"
        />

        {/* Top Badges */}
        <div className="cc-cust-fleet-card__badges-row">
          {isPI && (
            <span className="cc-cust-fleet-badge cc-cust-fleet-badge--pi">
              RESERVED (PI)
            </span>
          )}
          {isInvoiced && (
            <span className="cc-cust-fleet-badge cc-cust-fleet-badge--invoiced">
              INVOICED
            </span>
          )}
          {isReserved && (
            <span className="cc-cust-fleet-badge cc-cust-fleet-badge--reserved">
              <span className="cc-cust-fleet-badge__dot" aria-hidden="true">●</span> ONLINE RESERVED
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
      </div>

      {/* Card Body */}
      <div className="cc-cust-fleet-card__body">
        {/* Title */}
        <h3 className="cc-cust-fleet-card__title">
          {vehicle.year} {vehicle.make.toUpperCase()} {vehicle.model.toUpperCase()}
        </h3>

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
            <span className="cc-cust-fleet-card__spec-label cc-cust-fleet-card__spec-label--fob">FOB Price:</span>
            <span className="cc-cust-fleet-card__spec-value cc-cust-fleet-card__spec-value--fob">
              ${price.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Highlight Summary Box */}
        {isReserved && (
          <div className="cc-cust-fleet-card__highlight cc-cust-fleet-card__highlight--amber">
            <div className="cc-cust-fleet-card__highlight-title cc-cust-fleet-card__highlight-title--amber">
              <svg className="cc-cust-fleet-card__highlight-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              ONLINE RESERVATION
            </div>
            <div className="cc-cust-fleet-card__bill-row">
              <span className="cc-cust-fleet-card__bill-label">Status:</span>
              <span className="cc-cust-fleet-card__bill-val cc-cust-fleet-card__bill-val--danger">ONLINE RESERVED</span>
            </div>
            <div className="cc-cust-fleet-card__bill-divider" />
            <div className="cc-cust-fleet-card__bill-row">
              <span className="cc-cust-fleet-card__bill-label">Deposit (50%):</span>
              <span className="cc-cust-fleet-card__bill-val cc-cust-fleet-card__bill-val--bold">${depositReq.toLocaleString()}</span>
            </div>
          </div>
        )}

        {isPI && (
          <div className="cc-cust-fleet-card__highlight cc-cust-fleet-card__highlight--purple">
            <div className="cc-cust-fleet-card__highlight-title cc-cust-fleet-card__highlight-title--purple">
              <svg className="cc-cust-fleet-card__highlight-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              PROFORMA INVOICE
            </div>
            <div className="cc-cust-fleet-card__bill-row">
              <span className="cc-cust-fleet-card__bill-label">PI Ref:</span>
              <span className="cc-cust-fleet-card__bill-val cc-cust-fleet-card__bill-val--purple">{piRefDisplay}</span>
            </div>
            <div className="cc-cust-fleet-card__bill-divider" />
            <div className="cc-cust-fleet-card__bill-row">
              <span className="cc-cust-fleet-card__bill-label">Deposit (50%):</span>
              <span className="cc-cust-fleet-card__bill-val cc-cust-fleet-card__bill-val--bold">${depositReq.toLocaleString()}</span>
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
              COMMERCIAL BILL
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

        {/* 3-Step Progress Bar */}
        <div className={`cc-cust-fleet-card__progress-wrap cc-cust-fleet-card__progress-wrap--${progressTone}`}>
          <div className="cc-cust-fleet-card__progress-track">
            <div
              className="cc-cust-fleet-card__progress-line"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="cc-cust-fleet-card__progress-labels">
            <span className={`cc-cust-fleet-card__progress-step ${progressPercent <= 35 ? 'cc-cust-fleet-card__progress-step--active' : ''}`}>
              Reserved
            </span>
            <span className={`cc-cust-fleet-card__progress-step ${progressPercent > 35 && progressPercent < 100 ? 'cc-cust-fleet-card__progress-step--active' : ''}`}>
              {middleStage}
            </span>
            <span className={`cc-cust-fleet-card__progress-step ${progressPercent >= 100 ? 'cc-cust-fleet-card__progress-step--active' : ''}`}>
              Delivered
            </span>
          </div>
        </div>

        {/* Track Shipment Action Button */}
        <div className="cc-cust-fleet-card__actions">
          <button
            type="button"
            className="cc-cust-fleet-card__track-btn"
            onClick={() => onSelect(vehicle)}
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
