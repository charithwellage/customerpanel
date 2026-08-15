import React from 'react';
import type { SearchVehiclesQuery } from '@carchief/domain';

export interface SearchResultsHeaderProps {
  total: number;
  itemCount: number;
  query: SearchVehiclesQuery;
  onUpdateQuery: (updates: Partial<SearchVehiclesQuery>) => void;
  onForceSync?: () => void;
}

export function SearchResultsHeader({ total, itemCount, query, onUpdateQuery, onForceSync }: SearchResultsHeaderProps) {
  const chips: Array<{ key: keyof SearchVehiclesQuery; label: string }> = [];
  if (query.make) chips.push({ key: 'make', label: `Make: ${query.make}` });
  if (query.bodyStyle) chips.push({ key: 'bodyStyle', label: `Body: ${query.bodyStyle}` });
  if (query.fuelType) chips.push({ key: 'fuelType', label: `Fuel: ${query.fuelType}` });
  if (query.transmission) chips.push({ key: 'transmission', label: `Transmission: ${query.transmission}` });
  if (query.driveTrain) chips.push({ key: 'driveTrain', label: `Drive: ${query.driveTrain}` });
  if (query.locationStatus) chips.push({ key: 'locationStatus', label: `Location: ${query.locationStatus}` });

  return (
    <div className="cc-results-header">
      <div>
        <div className="cc-results-count">Showing {itemCount} of {total} Vehicles</div>
        {chips.length > 0 && <div className="cc-active-chips" aria-label="Active filter chips">
          {chips.map((chip) => <button key={chip.key} type="button" className="cc-chip-remove" onClick={() => onUpdateQuery({ [chip.key]: undefined })}>{chip.label} ✕</button>)}
        </div>}
      </div>
      <div className="cc-results-header__actions">
        <div className="cc-filter-field cc-results-sort-field">
          <label htmlFor="sort-by-select" className="sr-only">Sort vehicles by</label>
          <select id="sort-by-select" className="cc-filter-select" value={query.sortBy || 'newest'} onChange={(event) => onUpdateQuery({ sortBy: event.target.value as SearchVehiclesQuery['sortBy'] })}>
            <option value="newest">Sort: Newest Arrival</option>
            <option value="price_asc">Sort: Price (Low to High)</option>
            <option value="price_desc">Sort: Price (High to Low)</option>
            <option value="year_desc">Sort: Year (Newest First)</option>
            <option value="year_asc">Sort: Year (Oldest First)</option>
            <option value="mileage_asc">Sort: Mileage (Lowest First)</option>
          </select>
        </div>
        {onForceSync && <button type="button" className="cc-force-sync-btn" onClick={onForceSync}>↻ FORCE SYNC</button>}
      </div>
    </div>
  );
}
