import React, { useId } from 'react';
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
  const autoId = useId();
  const headingId = title
    ? `collection-heading-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${autoId.replace(/[^a-z0-9_-]/gi, '')}`
    : undefined;

  return (
    <section aria-labelledby={headingId} className="cc-vehicle-collection">
      {title && (
        <header className="cc-vehicle-collection__header">
          <h2 id={headingId} className="cc-vehicle-collection__title">
            {title}
          </h2>
          {description && <p className="cc-vehicle-collection__description">{description}</p>}
        </header>
      )}

      {isLoading && (
        <div role="status" aria-live="polite" className="cc-vehicle-collection__state">
          Loading vehicle collection...
        </div>
      )}

      {!isLoading && error && (
        <div role="alert" className="cc-vehicle-collection__state cc-vehicle-collection__state--error">
          <strong>Error loading inventory:</strong>
          <span>{error}</span>
          {onRetry && (
            <button type="button" onClick={onRetry} className="cc-vehicle-collection__retry">
              Retry
            </button>
          )}
        </div>
      )}

      {!isLoading && !error && vehicles.length === 0 && (
        <div role="region" aria-label="Empty vehicle collection" className="cc-vehicle-collection__state cc-vehicle-collection__state--empty">
          <h3>{emptyTitle}</h3>
          <p>{emptyDescription}</p>
        </div>
      )}

      {!isLoading && !error && vehicles.length > 0 && (
        <div className="cc-vehicle-collection__grid">
          {vehicles.map((vehicle) => (
            <VehicleCardPrimitive
              key={vehicle.id}
              vehicle={vehicle}
              onSelect={onSelectVehicle}
              actionHref={getVehicleHref?.(vehicle)}
            />
          ))}
        </div>
      )}
    </section>
  );
};
