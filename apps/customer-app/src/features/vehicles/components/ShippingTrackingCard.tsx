import React from 'react';

export interface ShippingTrackingCardProps {
  locationStatus?: 'In Japan' | 'In Transit' | 'In Port';
  destinationPort?: string;
  vesselName?: string;
  billOfLadingNo?: string;
  etd?: string;
  eta?: string;
}

export const ShippingTrackingCard: React.FC<ShippingTrackingCardProps> = ({
  locationStatus = 'In Japan',
  destinationPort = 'Mombasa',
  vesselName,
  billOfLadingNo,
  etd,
  eta,
}) => {
  return (
    <div className="cc-cust-fleet-card cc-cust-fleet-shipping-card" aria-label="Shipping and Logistics Tracking">
      <h3 className="cc-cust-fleet-section-title">Shipping & Logistics Tracking</h3>

      <div className="cc-cust-fleet-shipping-card__grid">
        <div className="cc-cust-fleet-stat">
          <span className="cc-cust-fleet-stat__label">Current Location Status</span>
          <span className="cc-cust-fleet-badge cc-cust-fleet-badge--location">{locationStatus}</span>
        </div>

        <div className="cc-cust-fleet-stat">
          <span className="cc-cust-fleet-stat__label">Destination Port</span>
          <span className="cc-cust-fleet-stat__value">{destinationPort}</span>
        </div>

        {vesselName && (
          <div className="cc-cust-fleet-stat">
            <span className="cc-cust-fleet-stat__label">Vessel Name</span>
            <span className="cc-cust-fleet-stat__value">{vesselName}</span>
          </div>
        )}

        {billOfLadingNo && (
          <div className="cc-cust-fleet-stat">
            <span className="cc-cust-fleet-stat__label">Bill of Lading (B/L)</span>
            <span className="cc-cust-fleet-ref__code">{billOfLadingNo}</span>
          </div>
        )}

        {etd && (
          <div className="cc-cust-fleet-stat">
            <span className="cc-cust-fleet-stat__label">Estimated Departure (ETD)</span>
            <time className="cc-cust-fleet-stat__value" dateTime={etd}>
              {new Date(etd).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </time>
          </div>
        )}

        {eta && (
          <div className="cc-cust-fleet-stat">
            <span className="cc-cust-fleet-stat__label">Estimated Arrival (ETA)</span>
            <time className="cc-cust-fleet-stat__value" dateTime={eta}>
              {new Date(eta).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </time>
          </div>
        )}
      </div>
    </div>
  );
};
