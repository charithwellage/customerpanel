'use client';

import React from 'react';
import type { VehicleDomainSummary } from '@carchief/domain';

export interface VehicleCardPrimitiveProps {
  vehicle: VehicleDomainSummary;
  onSelect?: (vehicle: VehicleDomainSummary) => void;
  actionHref?: string;
  actionLabel?: string;
  showDiscount?: boolean;
}

const DEFAULT_CAR_FALLBACK = 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800&auto=format&fit=crop&q=80';

export const VehicleCardPrimitive: React.FC<VehicleCardPrimitiveProps> = ({
  vehicle,
  onSelect,
  actionHref,
  showDiscount = true,
}) => {
  const primaryImage = vehicle.images?.[0] || DEFAULT_CAR_FALLBACK;
  const isRequestPrice = Boolean(vehicle.requestPrice || vehicle.priceState === 'request_price' || !vehicle.priceUsd || vehicle.priceUsd <= 0);
  const tierPricing = vehicle.tierPricing;
  const hasTierDiscount = Boolean(showDiscount && tierPricing && tierPricing.tierDiscountPercent > 0);
  const hasRegularDiscount = Boolean(showDiscount && vehicle.discountPercent && vehicle.discountPercent > 0);
  const hasDiscount = hasTierDiscount || hasRegularDiscount;

  const originalPrice = tierPricing ? tierPricing.originalPriceUsd : vehicle.priceUsd;
  const discountedPrice = tierPricing
    ? tierPricing.tierPriceUsd
    : hasRegularDiscount
      ? Math.round(vehicle.priceUsd * (1 - vehicle.discountPercent! / 100))
      : vehicle.priceUsd;

  const targetHref = actionHref || `/allstock/${vehicle.slug || vehicle.id}`;

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(vehicle);
    }
  };

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onSelect) {
      e.preventDefault();
      onSelect(vehicle);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      if (onSelect) {
        event.preventDefault();
        onSelect(vehicle);
      }
    }
  };

  let rawStatus = vehicle.reservationEligibility && !vehicle.reservationEligibility.eligible
    ? vehicle.reservationEligibility.isOwnHold
      ? 'YOUR HOLD'
      : vehicle.reservationEligibility.reason === 'reserved_by_other'
        ? 'RESERVED'
        : vehicle.status.toUpperCase()
    : (vehicle.status || 'Available').toUpperCase();

  if (rawStatus === 'RESERVEDWITHPI') {
    rawStatus = 'RESERVED';
  }

  const displayStatus = rawStatus;
  const isSold = displayStatus === 'SOLD';
  const statusClass = displayStatus.toLowerCase().replace(/\s+/g, '-');

  return (
    <article
      tabIndex={0}
      role="article"
      aria-label={`${vehicle.year} ${vehicle.make} ${vehicle.model} - ${isRequestPrice ? 'Price on Request' : `USD ${discountedPrice.toLocaleString()}`}`}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      data-vehicle-id={vehicle.id}
      className="cc-vehicle-card cc-vehicle-card--interactive"
    >
      <a href={targetHref} onClick={handleLinkClick} className="cc-vehicle-card__media-link" aria-label={`View details for ${vehicle.year} ${vehicle.make} ${vehicle.model}`}>
        <div className="cc-vehicle-card__media">
          <img
            className="cc-vehicle-card__image"
            src={primaryImage}
            alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
            loading="lazy"
            decoding="async"
            onError={(e) => {
              const target = e.currentTarget;
              if (target.src !== DEFAULT_CAR_FALLBACK) {
                target.src = DEFAULT_CAR_FALLBACK;
              }
            }}
          />
          <div className="cc-vehicle-card__status">
            <span className={`cc-status-pill cc-status-pill--${statusClass}`}>
              {!isSold && <span className="cc-status-pill__dot">●</span>}
              {displayStatus}
            </span>
          </div>
        </div>
      </a>

      <div className="cc-vehicle-card__body">
        <a href={targetHref} onClick={handleLinkClick} className="cc-vehicle-card__title-link">
          <span className="cc-vehicle-card__eyebrow">
            {vehicle.year} {vehicle.make}
          </span>
          <h3 className="cc-vehicle-card__title">{vehicle.model}</h3>
        </a>

        {hasTierDiscount && (
          <span className="cc-vehicle-card__discount">{tierPricing!.tier} (-{tierPricing!.tierDiscountPercent}%)</span>
        )}
        {!hasTierDiscount && hasRegularDiscount && (
          <span className="cc-vehicle-card__discount">-{vehicle.discountPercent}% discount</span>
        )}

        {vehicle.compliance && (
          <div className="cc-vehicle-card__compliance">
            {vehicle.compliance.isCompliant ? (
              <span className="cc-compliance-badge cc-compliance-badge--pass" title={vehicle.compliance.passedCriteria.join('; ')}>
                <span className="cc-compliance-badge__dot">✓</span> Compliant for {vehicle.compliance.countryName}
              </span>
            ) : (
              <span className="cc-compliance-badge cc-compliance-badge--fail" title={vehicle.compliance.failedCriteria.join('; ')}>
                <span className="cc-compliance-badge__dot">⚠️</span> {vehicle.compliance.countryName} Restricted
              </span>
            )}
          </div>
        )}

        <div className="cc-vehicle-card__footer">
          <span className="cc-vehicle-card__price-label">RETAIL PRICE</span>
          <div className="cc-vehicle-card__price-wrapper">
            {isRequestPrice ? (
              <span className="cc-vehicle-card__price cc-vehicle-card__price--request">Request Price</span>
            ) : hasDiscount ? (
              <div className="cc-vehicle-card__price-pair">
                <span className="cc-vehicle-card__price--original">${originalPrice.toLocaleString()}</span>
                <span className="cc-vehicle-card__price cc-vehicle-card__price--discounted">${discountedPrice.toLocaleString()}</span>
              </div>
            ) : (
              <span className="cc-vehicle-card__price">${vehicle.priceUsd.toLocaleString()}</span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};
