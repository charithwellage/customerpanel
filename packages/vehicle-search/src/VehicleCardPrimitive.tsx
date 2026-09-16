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

const COLOR_STUDIO_IMAGES: Record<string, string> = {
  white: '/images/cars/car-white.jpg',
  pearl: '/images/cars/car-pearl.jpg',
  black: '/images/cars/car-black.jpg',
  red: '/images/cars/car-red.jpg',
  blue: '/images/cars/car-blue.jpg',
  silver: '/images/cars/car-silver.jpg',
  gray: '/images/cars/car-gray.jpg',
  grey: '/images/cars/car-gray.jpg',
  charcoal: '/images/cars/car-gray.jpg',
  gunmetal: '/images/cars/car-gray.jpg',
  green: '/images/cars/car-green.jpg',
};

const STUDIO_CAR_PALETTE = [
  '/images/cars/car-white.jpg',
  '/images/cars/car-silver.jpg',
  '/images/cars/car-blue.jpg',
  '/images/cars/car-red.jpg',
  '/images/cars/car-gray.jpg',
  '/images/cars/car-black.jpg',
  '/images/cars/car-pearl.jpg',
  '/images/cars/car-green.jpg',
];

const DEFAULT_CAR_FALLBACK = '/images/cars/car-white.jpg';

export function resolveVehicleStudioThumbnail(vehicle: VehicleDomainSummary): string {
  // If vehicle already explicitly specifies a white-background studio car image, use it
  if (vehicle.images?.[0] && vehicle.images[0].startsWith('/images/cars/')) {
    return vehicle.images[0];
  }

  // Match by vehicle declared color
  const colorKey = (vehicle.color || '').toLowerCase().trim();
  if (colorKey) {
    for (const [key, path] of Object.entries(COLOR_STUDIO_IMAGES)) {
      if (colorKey.includes(key)) {
        return path;
      }
    }
  }

  // Deterministically rotate through the multi-color white-background studio palette
  const seedStr = vehicle.id || vehicle.chassisNumber || `${vehicle.make} ${vehicle.model}`;
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
  }
  return STUDIO_CAR_PALETTE[seed % STUDIO_CAR_PALETTE.length];
}

export const VehicleCardPrimitive: React.FC<VehicleCardPrimitiveProps> = ({
  vehicle,
  onSelect,
  actionHref,
  showDiscount = true,
}) => {
  const primaryImage = resolveVehicleStudioThumbnail(vehicle);
  const isRequestPrice = Boolean(vehicle.requestPrice || vehicle.priceState === 'request_price' || !vehicle.priceUsd || vehicle.priceUsd <= 0);
  const tierPricing = vehicle.tierPricing;
  const hasTierDiscount = Boolean(showDiscount && tierPricing && tierPricing.tierDiscountPercent > 0);
  const hasRegularDiscount = Boolean(showDiscount && vehicle.discountPercent && vehicle.discountPercent > 0);
  const hasDiscount = hasTierDiscount || hasRegularDiscount;

  const originalPrice = hasTierDiscount ? tierPricing!.originalPriceUsd : vehicle.priceUsd;
  const discountedPrice = hasTierDiscount
    ? tierPricing!.tierPriceUsd
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

  const normalizedStatus = (() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('carchief_48h_reservations');
        if (saved) {
          const list: { vehicleId: string }[] = JSON.parse(saved);
          if (list.some((r) => r.vehicleId === vehicle.id || (vehicle.slug && r.vehicleId === vehicle.slug))) {
            return 'RESERVED';
          }
        }
      } catch {
        // ignore
      }
    }
    const reason = (vehicle.reservationEligibility?.reason as string) || '';
    const raw = (
      vehicle.reservationEligibility && !vehicle.reservationEligibility.eligible &&
      (reason.includes('reserve') || reason.includes('hold'))
        ? 'RESERVED'
        : (vehicle as { statusLabel?: string }).statusLabel || vehicle.status || 'AVAILABLE'
    ).toUpperCase();

    if (raw === 'RESERVEDWITHPI' || raw.includes('RESERV') || raw.includes('HOLD')) {
      return 'RESERVED';
    }
    if (
      raw.includes('SOLD') ||
      raw.includes('ADVANCED') ||
      raw.includes('PURCHASED') ||
      raw.includes('DISPATCHED') ||
      raw.includes('PAID') ||
      raw.includes('INVOIC')
    ) {
      return 'SOLD';
    }
    return 'AVAILABLE';
  })();

  const displayStatus = normalizedStatus;
  const isSold = displayStatus === 'SOLD';
  const statusClass = displayStatus.toLowerCase().replace(/\s+/g, '-');

  const flagIcon = vehicle.stockCountry === 'UK' || vehicle.stockCountry === 'GB' ? '🇬🇧' : '🇯🇵';
  const tierName = 'PREMIUM DEALER';

  return (
    <article
      tabIndex={0}
      role="article"
      aria-label={`${vehicle.year} ${vehicle.make} ${vehicle.model} - ${isRequestPrice ? 'ASK' : `USD ${discountedPrice.toLocaleString()}`}`}
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
              <span className="cc-status-pill__dot">●</span>
              {displayStatus}
            </span>
          </div>

          <button
            type="button"
            className="cc-vehicle-card__fav-btn"
            aria-label="Add to favorites"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        </div>
      </a>

      <div className="cc-vehicle-card__body">
        <div className="cc-vehicle-card__header-row">
          <div className="cc-vehicle-card__meta-row">
            <span className="cc-vehicle-card__eyebrow">
              {vehicle.year} <span className="cc-vehicle-card__flag">{flagIcon}</span>
            </span>
            <span className="cc-vehicle-card__tier-pill">
              {tierName}
            </span>
          </div>
          <div className="cc-vehicle-card__info-col">
            <a href={targetHref} onClick={handleLinkClick} className="cc-vehicle-card__title-link">
              <h3 className="cc-vehicle-card__title">{vehicle.make} {vehicle.model}</h3>
            </a>
          </div>
        </div>

        <div className="cc-vehicle-card__pricing-stack">
          <div className="cc-vehicle-card__price-row">
            {isRequestPrice ? null : (
              <span className="cc-vehicle-card__strikethrough-price">
                ${(originalPrice || Math.round(discountedPrice * 1.15)).toLocaleString()}
              </span>
            )}
            <div className="cc-vehicle-card__price-main-group">
              {isRequestPrice ? (
                <>
                  <span className="cc-vehicle-card__final-price cc-vehicle-card__final-price--request">ASK</span>
                  <span className="cc-vehicle-card__fob-label">FOB</span>
                </>
              ) : (
                <>
                  <span className="cc-vehicle-card__final-price">
                    ${discountedPrice.toLocaleString()}
                  </span>
                  <span className="cc-vehicle-card__fob-label">FOB</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};
