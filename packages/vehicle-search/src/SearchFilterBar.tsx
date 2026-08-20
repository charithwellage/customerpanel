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
        <button type="button" className="cc-search-filter-toggle-btn" onClick={() => setIsExpanded((value) => !value)} aria-expanded={isExpanded} aria-controls="expanded-filters-section">
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
          <FilterSelect id="filter-bodystyle-select" label="Body Style" value={query.bodyStyle} options={facets?.bodyStyles.map((item) => item.name) ?? []} onChange={(value) => onUpdateQuery({ bodyStyle: value || undefined })} />
          <FilterSelect id="filter-fuel-select" label="Fuel Type" value={query.fuelType} options={facets?.fuelTypes.map((item) => item.name) ?? []} onChange={(value) => onUpdateQuery({ fuelType: value || undefined })} />
          <FilterSelect id="filter-transmission-select" label="Transmission" value={query.transmission} options={facets?.transmissions.map((item) => item.name) ?? []} onChange={(value) => onUpdateQuery({ transmission: value || undefined })} />
          <FilterSelect id="filter-drivetrain-select" label="Drive Train" value={query.driveTrain} options={facets?.driveTrains.map((item) => item.name) ?? []} onChange={(value) => onUpdateQuery({ driveTrain: value || undefined })} />
        </div>
      )}
    </section>
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
