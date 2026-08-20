import React, { useState } from 'react';
import type { SearchVehiclesQuery, VehicleFacets } from '@carchief/domain';
import type { UnderstoodToken } from './parser.js';

export interface SearchFilterBarProps {
  query: SearchVehiclesQuery;
  facets?: VehicleFacets;
  naturalPhrase: string;
  understoodTokens: UnderstoodToken[];
  onNaturalPhraseChange: (phrase: string) => void;
  onApplyNaturalSearch: () => void;
  onUpdateQuery: (updates: Partial<SearchVehiclesQuery>) => void;
  onResetFilters: () => void;
}

export function SearchFilterBar({
  query,
  facets,
  naturalPhrase,
  understoodTokens,
  onNaturalPhraseChange,
  onApplyNaturalSearch,
  onUpdateQuery,
  onResetFilters,
}: SearchFilterBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const toggleExpanded = () => {
    setIsExpanded((value) => {
      if (value) setShowMore(false);
      return !value;
    });
  };
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      onApplyNaturalSearch();
    }
  };

  return (
    <section className="cc-search-filter-panel" aria-label="Vehicle search and filters">
      <div className="cc-search-input-group">
        <div className="cc-search-input-wrapper">
          <span className="cc-search-input-icon" aria-hidden="true">⌕</span>
          <input
            type="search"
            id="vehicle-search-input"
            className="cc-search-input"
            placeholder="Search by keyword (e.g., Porsche, GT3, Black, V8)..."
            value={naturalPhrase}
            onChange={(event) => onNaturalPhraseChange(event.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Search by keyword"
          />
        </div>
        <button type="button" className="cc-search-filter-toggle-btn" onClick={toggleExpanded} aria-expanded={isExpanded} aria-controls="expanded-filters-section">
          {isExpanded ? 'Minimize Filters ∧' : 'Maximize Filters ∨'}
        </button>
        <button type="button" className="cc-search-reset-btn" onClick={onResetFilters}>Reset All</button>
      </div>

      {understoodTokens.length > 0 && (
        <div className="cc-understood-tokens" role="region" aria-label="Understood search tokens">
          <span className="cc-understood-token-label">Parsed criteria:</span>
          {understoodTokens.map((token, index) => <span key={`${token.field}-${index}`} className="cc-understood-token-chip">✓ {token.label}</span>)}
        </div>
      )}

      {isExpanded && (
        <div id="expanded-filters-section" className="cc-filter-grid">
          <FilterSelect id="filter-make-select" label="Make" value={query.make} options={facets?.makes.map((item) => item.name) ?? []} onChange={(value) => onUpdateQuery({ make: value || undefined })} />
          <FilterSelect id="filter-model-select" label="Model" value={query.model} options={facets?.models.map((item) => item.name) ?? []} onChange={(value) => onUpdateQuery({ model: value || undefined })} />
          <FilterSelect id="filter-fuel-select" label="Fuel Type" value={query.fuelType} options={facets?.fuelTypes.map((item) => item.name) ?? []} onChange={(value) => onUpdateQuery({ fuelType: value || undefined })} />
          <FilterSelect id="filter-bodystyle-select" label="Body Type" value={query.bodyStyle} options={facets?.vehicleTypes.map((item) => item.name) ?? []} onChange={(value) => onUpdateQuery({ bodyStyle: value || undefined })} />
          <FilterSelect id="filter-transmission-select" label="Transmission" value={query.transmission} options={facets?.transmissions.map((item) => item.name) ?? []} onChange={(value) => onUpdateQuery({ transmission: value || undefined })} />
          <RangeInput id="filter-year-min" label="Year From" value={query.yearMin} min={facets?.yearRange.min} max={facets?.yearRange.max} onChange={(value) => onUpdateQuery({ yearMin: value })} />
          <RangeInput id="filter-year-max" label="Year To" value={query.yearMax} min={facets?.yearRange.min} max={facets?.yearRange.max} onChange={(value) => onUpdateQuery({ yearMax: value })} />
          <RangeInput id="filter-price-min" label="Price From (USD)" value={query.priceMin} min={facets?.priceRange.min} max={facets?.priceRange.max} step={100} onChange={(value) => onUpdateQuery({ priceMin: value })} />
          <RangeInput id="filter-price-max" label="Price To (USD)" value={query.priceMax} min={facets?.priceRange.min} max={facets?.priceRange.max} step={100} onChange={(value) => onUpdateQuery({ priceMax: value })} />
          <RangeInput id="filter-mileage-min" label="Mileage From" value={query.mileageMin} min={facets?.mileageRange.min} max={facets?.mileageRange.max} onChange={(value) => onUpdateQuery({ mileageMin: value })} />
          <RangeInput id="filter-mileage-max" label="Mileage To" value={query.mileageMax} min={facets?.mileageRange.min} max={facets?.mileageRange.max} onChange={(value) => onUpdateQuery({ mileageMax: value })} />
          <div className="cc-filter-more-toggle"><button type="button" onClick={() => setShowMore((value) => !value)} aria-expanded={showMore}>{showMore ? 'Hide More Filters' : 'More Filters'}</button></div>
          {showMore && <>
            <FilterSelect id="filter-model-code-select" label="Model Code" value={query.modelCode} options={facets?.modelCodes.map((item) => item.name) ?? []} onChange={(value) => onUpdateQuery({ modelCode: value || undefined })} />
            <FilterSelect id="filter-sub-type-select" label="Sub Type" value={query.vehicleSubType} options={facets?.vehicleSubTypes.map((item) => item.name) ?? []} onChange={(value) => onUpdateQuery({ vehicleSubType: value || undefined })} />
            <FilterSelect id="filter-steering-select" label="Steering" value={query.steering} options={facets?.steerings.map((item) => item.name) ?? []} onChange={(value) => onUpdateQuery({ steering: value || undefined })} />
            <FilterSelect id="filter-drivetrain-select" label="Drivetrain" value={query.driveTrain} options={facets?.driveTrains.map((item) => item.name) ?? []} onChange={(value) => onUpdateQuery({ driveTrain: value || undefined })} />
            <FilterSelect id="filter-stock-country-select" label="Stock Country" value={query.stockCountry} options={facets?.stockCountries.map((item) => item.name) ?? []} onChange={(value) => onUpdateQuery({ stockCountry: value || undefined })} />
            <FilterSelect id="filter-stock-location-select" label="Stock Location" value={query.stockLocation} options={facets?.stockLocations.map((item) => item.name) ?? []} onChange={(value) => onUpdateQuery({ stockLocation: value || undefined })} />
            <FilterSelect id="filter-destination-port-select" label="Destination Port" value={query.destinationPort} options={facets?.destinationPorts.map((item) => item.name) ?? []} onChange={(value) => onUpdateQuery({ destinationPort: value || undefined })} />
            <FilterSelect id="filter-overdrive-select" label="O Drive" value={query.overdrive} options={facets?.overdrives.map((item) => item.name) ?? []} onChange={(value) => onUpdateQuery({ overdrive: value || undefined })} />
            <FilterSelect id="filter-color-select" label="Color" value={query.color} options={facets?.colors.map((item) => item.name) ?? []} onChange={(value) => onUpdateQuery({ color: value || undefined })} />
            <FilterSelect id="filter-exterior-grade-select" label="Ext. Grade" value={query.exteriorGrade} options={facets?.exteriorGrades.map((item) => item.name) ?? []} onChange={(value) => onUpdateQuery({ exteriorGrade: value || undefined })} />
            <RangeInput id="filter-engine-min" label="Engine From (CC)" value={query.engineCcMin} min={facets?.engineCcRange.min} max={facets?.engineCcRange.max} step={100} onChange={(value) => onUpdateQuery({ engineCcMin: value })} />
            <RangeInput id="filter-engine-max" label="Engine To (CC)" value={query.engineCcMax} min={facets?.engineCcRange.min} max={facets?.engineCcRange.max} step={100} onChange={(value) => onUpdateQuery({ engineCcMax: value })} />
            <RangeInput id="filter-seats-min" label="Seats From" value={query.seatsMin} min={facets?.seatsRange.min} max={facets?.seatsRange.max} onChange={(value) => onUpdateQuery({ seatsMin: value })} />
            <RangeInput id="filter-seats-max" label="Seats To" value={query.seatsMax} min={facets?.seatsRange.min} max={facets?.seatsRange.max} onChange={(value) => onUpdateQuery({ seatsMax: value })} />
            <RangeInput id="filter-load-min" label="Load Capacity From" value={query.loadCapacityMin} min={facets?.loadCapacityRange.min} max={facets?.loadCapacityRange.max} onChange={(value) => onUpdateQuery({ loadCapacityMin: value })} />
            <RangeInput id="filter-load-max" label="Load Capacity To" value={query.loadCapacityMax} min={facets?.loadCapacityRange.min} max={facets?.loadCapacityRange.max} onChange={(value) => onUpdateQuery({ loadCapacityMax: value })} />
            <FeatureFilters facets={facets} query={query} onUpdateQuery={onUpdateQuery} />
          </>}
        </div>
      )}
    </section>
  );
}

function RangeInput({ id, label, value, min, max, step = 1, onChange }: { id: string; label: string; value?: number; min?: number; max?: number; step?: number; onChange: (value: number | undefined) => void }) {
  return (
    <div className="cc-filter-field">
      <label htmlFor={id} className="cc-filter-label">{label}</label>
      <input id={id} className="cc-filter-input" type="number" value={value ?? ''} min={min} max={max} step={step} placeholder={min !== undefined && max !== undefined ? `${min}–${max}` : undefined} onChange={(event) => onChange(event.target.value === '' ? undefined : Number(event.target.value))} />
    </div>
  );
}

function FilterSelect({ id, label, value, options, onChange }: { id: string; label: string; value?: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <div className="cc-filter-field">
      <label htmlFor={id} className="cc-filter-label">{label}</label>
      <select id={id} className="cc-filter-select" value={value || ''} onChange={(event) => onChange(event.target.value)}>
        <option value="">All {label}s</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </div>
  );
}

function FeatureFilters({ facets, query, onUpdateQuery }: { facets?: VehicleFacets; query: SearchVehiclesQuery; onUpdateQuery: (updates: Partial<SearchVehiclesQuery>) => void }) {
  const selected = new Set(query.features || []);
  if (!facets?.features.length) return null;
  return <fieldset className="cc-filter-features">
    <legend className="cc-filter-label">Equipment</legend>
    {facets.features.map((feature) => <label key={feature.name} className="cc-filter-checkbox">
      <input type="checkbox" checked={selected.has(feature.name)} onChange={(event) => {
        const next = new Set(selected);
        if (event.target.checked) next.add(feature.name); else next.delete(feature.name);
        onUpdateQuery({ features: Array.from(next) });
      }} />
      <span>{feature.name} ({feature.count})</span>
    </label>)}
  </fieldset>;
}
