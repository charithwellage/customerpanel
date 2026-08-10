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
  const primaryImage = vehicle.images && vehicle.images.length > 0 ? vehicle.images[0] : undefined;
  const hasDiscount = Boolean(showDiscount && vehicle.discountPercent && vehicle.discountPercent > 0);
  const discountedPrice = hasDiscount ? Math.round(vehicle.priceUsd * (1 - vehicle.discountPercent! / 100)) : vehicle.priceUsd;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if ((e.key === 'Enter' || e.key === ' ') && onSelect) {
      e.preventDefault();
      onSelect(vehicle);
    }
  };

  const isClickable = Boolean(onSelect);

  return (
    <div
      tabIndex={isClickable ? 0 : undefined}
      role={isClickable ? 'button' : undefined}
      aria-label={`${vehicle.year} ${vehicle.make} ${vehicle.model} - USD ${vehicle.priceUsd.toLocaleString()}`}
      onClick={onSelect ? () => onSelect(vehicle) : undefined}
      onKeyDown={isClickable ? handleKeyDown : undefined}
      data-vehicle-id={vehicle.id}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--cc-color-surface, #ffffff)',
        color: 'var(--cc-color-text-primary, #171717)',
        border: '1px solid var(--cc-color-border, #e5e5e5)',
        borderRadius: 'var(--cc-radius-md, 0.5rem)',
        overflow: 'hidden',
        boxShadow: 'var(--cc-shadow-sm, 0 1px 2px rgba(0,0,0,0.05))',
        transition: 'transform 150ms ease, box-shadow 150ms ease, border-color 150ms ease',
        cursor: isClickable ? 'pointer' : 'default',
        outline: 'none',
      }}
      className="cc-vehicle-card"
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '4 / 3',
          backgroundColor: 'var(--cc-color-neutral-surface, #f5f5f5)',
          overflow: 'hidden',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={`${vehicle.make} ${vehicle.model}`}
            loading="lazy"
            decoding="async"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <span
            style={{
              fontFamily: 'var(--cc-font-display, sans-serif)',
              fontWeight: 700,
              color: 'var(--cc-color-text-secondary, #525252)',
            }}
          >
            {vehicle.make} {vehicle.model}
          </span>
        )}
        {/* Status Badge */}
        <div style={{ position: 'absolute', top: '0.5rem', left: '0.5rem', zIndex: 10 }}>
          <span
            className={getStatusBadgeCssClass(vehicle.status === 'Available' ? 'success' : vehicle.status === 'Sold' ? 'error' : 'warning')}
            style={{
              padding: '0.2rem 0.5rem',
              borderRadius: 'var(--cc-radius-pill, 999px)',
              fontSize: 'var(--cc-font-size-xs, 0.75rem)',
              fontWeight: 700,
              fontFamily: 'var(--cc-font-mono, monospace)',
              textTransform: 'uppercase',
            }}
          >
            {vehicle.status}
          </span>
        </div>
        {/* Location Status Badge */}
        {vehicle.locationStatus && (
          <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', zIndex: 10 }}>
            <span
              style={{
                backgroundColor: 'rgba(23, 23, 23, 0.85)',
                color: 'var(--cc-color-text-on-dark, #fafafa)',
                padding: '0.2rem 0.5rem',
                borderRadius: 'var(--cc-radius-sm, 0.375rem)',
                fontSize: '0.7rem',
                fontWeight: 600,
                fontFamily: 'var(--cc-font-mono, monospace)',
              }}
            >
              {vehicle.locationStatus}
            </span>
          </div>
        )}
      </div>

      <div
        style={{
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          justifyContent: 'space-between',
          gap: '0.75rem',
        }}
      >
        <div>
          <span
            style={{
              fontSize: 'var(--cc-font-size-xs, 0.75rem)',
              fontWeight: 700,
              fontFamily: 'var(--cc-font-mono, monospace)',
              color: 'var(--cc-color-primary, #dc2626)',
              textTransform: 'uppercase',
              display: 'block',
            }}
          >
            {vehicle.year} {vehicle.make}
          </span>
          <h3
            style={{
              fontSize: 'var(--cc-font-size-base, 1rem)',
              fontWeight: 700,
              fontFamily: 'var(--cc-font-display, sans-serif)',
              margin: '0.25rem 0 0 0',
              lineHeight: 1.25,
            }}
          >
            {vehicle.model}
          </h3>
          {hasDiscount && (
            <div style={{ marginTop: '0.5rem' }}>
              <span
                style={{
                  backgroundColor: 'var(--cc-color-error-surface, #fee2e2)',
                  color: 'var(--cc-color-error, #b91c1c)',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '0.15rem 0.4rem',
                  borderRadius: 'var(--cc-radius-sm, 0.375rem)',
                  fontFamily: 'var(--cc-font-mono, monospace)',
                }}
              >
                -{vehicle.discountPercent}% DISCOUNT
              </span>
            </div>
          )}
        </div>

        <div
          style={{
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--cc-color-border, #e5e5e5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <span
              style={{
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                color: 'var(--cc-color-text-secondary, #525252)',
                display: 'block',
              }}
            >
              Price
            </span>
            {hasDiscount ? (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.75rem', textDecoration: 'line-through', color: 'var(--cc-color-text-secondary, #525252)' }}>
                  ${vehicle.priceUsd.toLocaleString()}
                </span>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--cc-color-primary, #dc2626)' }}>
                  ${discountedPrice.toLocaleString()}
                </span>
              </div>
            ) : (
              <span style={{ fontSize: '1rem', fontWeight: 800 }}>${vehicle.priceUsd.toLocaleString()}</span>
            )}
          </div>

          {actionHref && (
            <a
              href={actionHref}
              style={{
                padding: '0.4rem 0.8rem',
                backgroundColor: 'var(--cc-color-primary, #dc2626)',
                color: 'var(--cc-color-text-on-primary, #ffffff)',
                borderRadius: 'var(--cc-radius-sm, 0.375rem)',
                fontSize: '0.8rem',
                fontWeight: 700,
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              {actionLabel}
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
