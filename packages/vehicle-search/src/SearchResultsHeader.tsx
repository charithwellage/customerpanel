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
  if (query.model) chips.push({ key: 'model', label: `Model: ${query.model}` });
  if (query.modelCode) chips.push({ key: 'modelCode', label: `Model Code: ${query.modelCode}` });
  if (query.vehicleSubType) chips.push({ key: 'vehicleSubType', label: `Sub Type: ${query.vehicleSubType}` });
  if (query.overdrive) chips.push({ key: 'overdrive', label: `O Drive: ${query.overdrive}` });
  if (query.color) chips.push({ key: 'color', label: `Color: ${query.color}` });
  if (query.exteriorGrade) chips.push({ key: 'exteriorGrade', label: `Ext. Grade: ${query.exteriorGrade}` });
  if (query.destinationPort) chips.push({ key: 'destinationPort', label: `Port: ${query.destinationPort}` });
  if (query.yearMin !== undefined) chips.push({ key: 'yearMin', label: `Year from: ${query.yearMin}` });
  if (query.yearMax !== undefined) chips.push({ key: 'yearMax', label: `Year to: ${query.yearMax}` });
  if (query.priceMin !== undefined) chips.push({ key: 'priceMin', label: `Price from: $${query.priceMin.toLocaleString()}` });
  if (query.priceMax !== undefined) chips.push({ key: 'priceMax', label: `Price to: $${query.priceMax.toLocaleString()}` });
  if (query.mileageMin !== undefined) chips.push({ key: 'mileageMin', label: `Mileage from: ${query.mileageMin.toLocaleString()}` });
  if (query.mileageMax !== undefined) chips.push({ key: 'mileageMax', label: `Mileage to: ${query.mileageMax.toLocaleString()}` });
  if (query.engineCcMin !== undefined) chips.push({ key: 'engineCcMin', label: `Engine from: ${query.engineCcMin.toLocaleString()} cc` });
  if (query.engineCcMax !== undefined) chips.push({ key: 'engineCcMax', label: `Engine to: ${query.engineCcMax.toLocaleString()} cc` });

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
