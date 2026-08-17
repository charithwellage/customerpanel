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

          <div className="cc-cust-fleet-card__spec-row">
            <span className="cc-cust-fleet-card__spec-label">FOB Price:</span>
            <span className="cc-cust-fleet-card__spec-value cc-cust-fleet-card__spec-value--fob">
              ${price.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Highlight Summary Box */}
        {isReserved && (
          <div className="cc-cust-fleet-card__highlight cc-cust-fleet-card__highlight--amber">
            <div className="cc-cust-fleet-card__highlight-row">
              <span className="cc-cust-fleet-card__highlight-label">Status / Type:</span>
              <span className="cc-cust-fleet-card__highlight-value cc-cust-fleet-card__highlight-value--danger">
                ONLINE RESERVED
              </span>
            </div>
            <div className="cc-cust-fleet-card__highlight-row">
              <span className="cc-cust-fleet-card__highlight-label">Deposit (50%):</span>
              <span className="cc-cust-fleet-card__highlight-value cc-cust-fleet-card__highlight-value--bold">
                ${depositReq.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {isPI && (
          <div className="cc-cust-fleet-card__highlight cc-cust-fleet-card__highlight--purple">
            <div className="cc-cust-fleet-card__highlight-row">
              <span className="cc-cust-fleet-card__highlight-label">Deposit (50%):</span>
              <span className="cc-cust-fleet-card__highlight-value cc-cust-fleet-card__highlight-value--purple-bold">
                ${depositReq.toLocaleString()}
              </span>
            </div>
            <div className="cc-cust-fleet-card__highlight-row">
              <span className="cc-cust-fleet-card__highlight-label">PI Ref:</span>
              <span className="cc-cust-fleet-card__highlight-value cc-cust-fleet-card__highlight-value--purple">
                {piRefDisplay}
              </span>
            </div>
          </div>
        )}

        {isInvoiced && (
          <div className="cc-cust-fleet-card__highlight cc-cust-fleet-card__highlight--green">
            <div className="cc-cust-fleet-card__highlight-title cc-cust-fleet-card__highlight-title--bill">
              COMMERCIAL BILL
            </div>
            <div className="cc-cust-fleet-card__bill-grid">
              <div className="cc-cust-fleet-card__bill-col">
                <span className="cc-cust-fleet-card__bill-label">Sold:</span>
                <span className="cc-cust-fleet-card__bill-val">
                  ${soldAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="cc-cust-fleet-card__bill-col">
                <span className="cc-cust-fleet-card__bill-label">Paid:</span>
                <span className="cc-cust-fleet-card__bill-val">
                  ${paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="cc-cust-fleet-card__bill-col">
                <span className="cc-cust-fleet-card__bill-label">Bal:</span>
                <span className="cc-cust-fleet-card__bill-val">
                  ${balanceAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
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
            <span className="cc-cust-fleet-card__progress-dot cc-cust-fleet-card__progress-dot--start" />
            <span className={`cc-cust-fleet-card__progress-dot cc-cust-fleet-card__progress-dot--mid ${progressPercent >= 50 ? 'cc-cust-fleet-card__progress-dot--active' : ''}`} />
            <span className={`cc-cust-fleet-card__progress-dot cc-cust-fleet-card__progress-dot--end ${progressPercent >= 100 ? 'cc-cust-fleet-card__progress-dot--active' : ''}`} />
          </div>
          <div className="cc-cust-fleet-card__progress-labels">
            <span className="cc-cust-fleet-card__progress-step cc-cust-fleet-card__progress-step--active">
              Reserved
            </span>
            <span className={`cc-cust-fleet-card__progress-step ${progressPercent >= 50 ? 'cc-cust-fleet-card__progress-step--active' : ''}`}>
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
            <span className="cc-cust-fleet-card__track-icon" aria-hidden="true">⊘</span>
            TRACK SHIPMENT
          </button>
        </div>
      </div>
    </article>
  );
};
