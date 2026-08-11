'use client';

import React from 'react';
import type { SearchVehiclesQuery } from '@carchief/domain';

export interface SearchResultsHeaderProps {
  total: number;
  itemCount: number;
  query: SearchVehiclesQuery;
  onUpdateQuery: (updates: Partial<SearchVehiclesQuery>) => void;
}

export function SearchResultsHeader({
  total,
  itemCount,
  query,
  onUpdateQuery,
}: SearchResultsHeaderProps) {
  // Collect active filters for removable chips
  const activeChips: Array<{ key: keyof SearchVehiclesQuery; label: string }> = [];

  if (query.make) activeChips.push({ key: 'make', label: `Make: ${query.make}` });
  if (query.bodyStyle) activeChips.push({ key: 'bodyStyle', label: `Body: ${query.bodyStyle}` });
  if (query.fuelType) activeChips.push({ key: 'fuelType', label: `Fuel: ${query.fuelType}` });
  if (query.transmission) activeChips.push({ key: 'transmission', label: `Transmission: ${query.transmission}` });
  if (query.driveTrain) activeChips.push({ key: 'driveTrain', label: `Drive: ${query.driveTrain}` });
  if (query.locationStatus) activeChips.push({ key: 'locationStatus', label: `Location: ${query.locationStatus}` });
  if (query.yearMin) activeChips.push({ key: 'yearMin', label: `From ${query.yearMin}` });
  if (query.yearMax) activeChips.push({ key: 'yearMax', label: `To ${query.yearMax}` });
  if (query.priceMin) activeChips.push({ key: 'priceMin', label: `Min $${query.priceMin.toLocaleString()}` });
  if (query.priceMax) activeChips.push({ key: 'priceMax', label: `Max $${query.priceMax.toLocaleString()}` });

  return (
    <div className="cc-results-header">
      {/* Result Count */}
      <div className="cc-results-count">
        Showing {itemCount} of {total} {total === 1 ? 'Vehicle' : 'Vehicles'}
      </div>

      {/* Active Chips */}
      {activeChips.length > 0 && (
        <div className="cc-active-chips" aria-label="Active filter chips">
          {activeChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              className="cc-chip-remove"
              onClick={() => onUpdateQuery({ [chip.key]: undefined })}
              title={`Remove filter ${chip.label}`}
            >
              {chip.label} ✕
            </button>
          ))}
        </div>
      )}

      {/* Sort Select Dropdown */}
      <div className="cc-filter-field" style={{ width: 'auto', minWidth: '11rem' }}>
        <label htmlFor="sort-by-select" className="sr-only">Sort vehicles by</label>
        <select
          id="sort-by-select"
          className="cc-filter-select"
          value={query.sortBy || 'newest'}
          onChange={(e) => onUpdateQuery({ sortBy: e.target.value as any })}
        >
          <option value="newest">Sort: Newest Arrival</option>
          <option value="price_asc">Sort: Price (Low to High)</option>
          <option value="price_desc">Sort: Price (High to Low)</option>
          <option value="year_desc">Sort: Year (Newest First)</option>
          <option value="year_asc">Sort: Year (Oldest First)</option>
          <option value="mileage_asc">Sort: Mileage (Lowest First)</option>
        </select>
      </div>
    </div>
  );
}
