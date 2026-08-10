import React from 'react';
import type { VehicleDomainSummary } from '@carchief/domain';
import { VehicleCardPrimitive } from './VehicleCardPrimitive.js';

export interface VehicleCollectionPrimitiveProps {
  title?: string;
  description?: string;
  vehicles: VehicleDomainSummary[];
  isLoading?: boolean;
  error?: string | null;
  emptyTitle?: string;
  emptyDescription?: string;
  onRetry?: () => void;
  onSelectVehicle?: (vehicle: VehicleDomainSummary) => void;
  getVehicleHref?: (vehicle: VehicleDomainSummary) => string;
}

export const VehicleCollectionPrimitive: React.FC<VehicleCollectionPrimitiveProps> = ({
  title,
  description,
  vehicles,
  isLoading = false,
  error = null,
  emptyTitle = 'No vehicles found',
  emptyDescription = 'No available stock matches the selected collection or market criteria.',
  onRetry,
  onSelectVehicle,
  getVehicleHref,
}) => {
  return (
    <section aria-labelledby={title ? 'collection-title' : undefined} style={{ width: '100%' }}>
      {title && (
        <div style={{ marginBottom: '1.25rem' }}>
          <h2
            id="collection-title"
            style={{
              fontFamily: 'var(--cc-font-display, sans-serif)',
              fontSize: 'var(--cc-font-size-xl, 1.25rem)',
              fontWeight: 700,
              margin: 0,
            }}
          >
            {title}
          </h2>
          {description && (
            <p
              style={{
                color: 'var(--cc-color-text-secondary, #525252)',
                fontSize: 'var(--cc-font-size-sm, 0.875rem)',
                margin: '0.25rem 0 0 0',
              }}
            >
              {description}
            </p>
          )}
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div
          role="status"
          aria-live="polite"
          style={{
            padding: '2rem',
            textAlign: 'center',
            backgroundColor: 'var(--cc-color-surface, #ffffff)',
            borderRadius: 'var(--cc-radius-md, 0.5rem)',
            border: '1px solid var(--cc-color-border, #e5e5e5)',
          }}
        >
          <span style={{ fontWeight: 600, color: 'var(--cc-color-text-secondary, #525252)' }}>Loading vehicle collection...</span>
        </div>
      )}

      {/* Error state */}
      {!isLoading && error && (
        <div
          role="alert"
          style={{
            padding: '1rem 1.25rem',
            backgroundColor: 'var(--cc-color-error-surface, #fee2e2)',
            color: 'var(--cc-color-error, #b91c1c)',
            borderRadius: 'var(--cc-radius-md, 0.5rem)',
            border: '1px solid var(--cc-color-border, #e5e5e5)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          <strong>Error loading inventory:</strong>
          <span>{error}</span>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              style={{
                alignSelf: 'flex-start',
                marginTop: '0.5rem',
                padding: '0.35rem 0.75rem',
                backgroundColor: 'var(--cc-color-error, #b91c1c)',
                color: 'var(--cc-color-text-on-primary, #ffffff)',
                border: 'none',
                borderRadius: 'var(--cc-radius-sm, 0.375rem)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* Honest Empty State per RULE-09 */}
      {!isLoading && !error && vehicles.length === 0 && (
        <div
          role="region"
          aria-label="Empty vehicle collection"
          style={{
            padding: '3rem 1.5rem',
            textAlign: 'center',
            backgroundColor: 'var(--cc-color-surface, #ffffff)',
            borderRadius: 'var(--cc-radius-md, 0.5rem)',
            border: '1px dashed var(--cc-color-border, #e5e5e5)',
          }}
        >
          <h3
            style={{
              fontFamily: 'var(--cc-font-display, sans-serif)',
              fontSize: '1.1rem',
              fontWeight: 700,
              margin: '0 0 0.5rem 0',
            }}
          >
            {emptyTitle}
          </h3>
          <p
            style={{
              color: 'var(--cc-color-text-secondary, #525252)',
              fontSize: '0.9rem',
              margin: 0,
            }}
          >
            {emptyDescription}
          </p>
        </div>
      )}

      {/* Vehicle Grid */}
      {!isLoading && !error && vehicles.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {vehicles.map((v) => (
            <VehicleCardPrimitive
              key={v.id}
              vehicle={v}
              onSelect={onSelectVehicle}
              actionHref={getVehicleHref ? getVehicleHref(v) : undefined}
            />
          ))}
        </div>
      )}
    </section>
  );
};
