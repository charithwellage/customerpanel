'use client';

import React from 'react';
import type { SearchVehiclesQuery } from '@carchief/domain';

export interface SearchResultsHeaderProps {
  total: number;
  itemCount: number;
  query: SearchVehiclesQuery;
  onUpdateQuery: (updates: Partial<SearchVehiclesQuery>) => void;
  onForceSync?: () => void;
}

export function SearchResultsHeader({
  total,
  itemCount,
  query,
  onUpdateQuery,
  onForceSync,
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
        Showing {itemCount} of {total} Vehicles (<span className="cc-results-count__bold">{total > 0 ? total : 45}</span> premium models available)
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

      <div className="cc-results-header__actions">
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

        {/* Force Sync Action */}
        <button
          type="button"
          className="cc-force-sync-btn"
          onClick={onForceSync}
          aria-label="Force sync inventory"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ marginRight: '5px' }}>
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3L21.5 8M22 12.5a10 10 0 0 1-18.8 4.3L2.5 16" />
          </svg>
          FORCE SYNC
        </button>
      </div>
    </div>
  );
}
