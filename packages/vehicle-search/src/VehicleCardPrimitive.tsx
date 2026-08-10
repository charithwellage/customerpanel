import React from 'react';
import type { VehicleDomainSummary } from '@carchief/domain';
import { getStatusBadgeCssClass } from '@carchief/ui';

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
  actionLabel = 'View vehicle',
  showDiscount = true,
}) => {
  const primaryImage = vehicle.images?.[0];
  const hasDiscount = Boolean(showDiscount && vehicle.discountPercent && vehicle.discountPercent > 0);
  const discountedPrice = hasDiscount ? Math.round(vehicle.priceUsd * (1 - vehicle.discountPercent! / 100)) : vehicle.priceUsd;
  const isClickable = Boolean(onSelect && !actionHref);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if ((event.key === 'Enter' || event.key === ' ') && onSelect) {
      event.preventDefault();
      onSelect(vehicle);
    }
  };

  return (
    <article
      tabIndex={isClickable ? 0 : undefined}
      role={isClickable ? 'button' : undefined}
      aria-label={isClickable ? `${vehicle.year} ${vehicle.make} ${vehicle.model} - USD ${vehicle.priceUsd.toLocaleString()}` : undefined}
      onClick={isClickable ? () => onSelect?.(vehicle) : undefined}
      onKeyDown={isClickable ? handleKeyDown : undefined}
      data-vehicle-id={vehicle.id}
      className={`cc-vehicle-card${isClickable ? ' cc-vehicle-card--interactive' : ''}`}
    >
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
          <span className="cc-vehicle-card__image-fallback">
            {vehicle.make} {vehicle.model}
          </span>
        )}
        <div className="cc-vehicle-card__status">
          <span className={getStatusBadgeCssClass(vehicle.status === 'Available' ? 'success' : vehicle.status === 'Sold' ? 'error' : 'warning')}>
            {vehicle.status}
          </span>
        </div>
        {vehicle.locationStatus && <span className="cc-vehicle-card__location">{vehicle.locationStatus}</span>}
      </div>

      <div className="cc-vehicle-card__body">
        <div>
          <span className="cc-vehicle-card__eyebrow">
            {vehicle.year} {vehicle.make}
          </span>
          <h3 className="cc-vehicle-card__title">{vehicle.model}</h3>
          {hasDiscount && <span className="cc-vehicle-card__discount">-{vehicle.discountPercent}% discount</span>}
        </div>

        <div className="cc-vehicle-card__footer">
          <div>
            <span className="cc-vehicle-card__price-label">Price</span>
            {hasDiscount ? (
              <div className="cc-vehicle-card__price-pair">
                <span className="cc-vehicle-card__price--original">${vehicle.priceUsd.toLocaleString()}</span>
                <span className="cc-vehicle-card__price cc-vehicle-card__price--discounted">${discountedPrice.toLocaleString()}</span>
              </div>
            ) : (
              <span className="cc-vehicle-card__price">${vehicle.priceUsd.toLocaleString()}</span>
            )}
          </div>

          {actionHref && (
            <a href={actionHref} className="cc-vehicle-card__action">
              {actionLabel}
            </a>
          )}
        </div>
      </div>
    </article>
  );
};
