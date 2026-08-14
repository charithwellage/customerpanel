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

export const VehicleCardPrimitive: React.FC<VehicleCardPrimitiveProps> = ({
  vehicle,
  onSelect,
  actionHref,
  actionLabel = 'VIEW DETAILS',
  showDiscount = true,
}) => {
  const primaryImage = vehicle.images?.[0];
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

  const handleCardClick = (e: React.MouseEvent<HTMLElement>) => {
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

  const displayStatus = vehicle.reservationEligibility && !vehicle.reservationEligibility.eligible
    ? vehicle.reservationEligibility.isOwnHold
      ? 'YOUR HOLD'
      : vehicle.reservationEligibility.reason === 'reserved_by_other'
        ? 'RESERVED'
        : vehicle.status.toUpperCase()
    : (vehicle.status || 'Available').toUpperCase();

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
          {primaryImage ? (
            <img
              className="cc-vehicle-card__image"
              src={primaryImage}
              alt={`${vehicle.make} ${vehicle.model}`}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="cc-vehicle-card__image-fallback">
              <span className="cc-vehicle-card__fallback-title">{vehicle.make} {vehicle.model}</span>
            </div>
          )}
          <div className="cc-vehicle-card__status">
            <span className={`cc-status-pill cc-status-pill--${statusClass}`}>
              <span className="cc-status-pill__dot">●</span> {displayStatus}
            </span>
          </div>
          {vehicle.locationStatus && <span className="cc-vehicle-card__location">{vehicle.locationStatus}</span>}
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

        <div className="cc-vehicle-card__footer">
          <div className="cc-vehicle-card__price-wrapper">
            <span className="cc-vehicle-card__price-label">Price</span>
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

          <a href={targetHref} onClick={handleLinkClick} className="cc-vehicle-card__action-btn">
            <span>{actionLabel}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </a>
        </div>
      </div>
    </article>
  );
};
