'use client';

import React, { useState } from 'react';
import type { SearchVehiclesQuery, VehicleFacets } from '@carchief/domain';
import type { UnderstoodToken } from '@carchief/vehicle-search';

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
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onApplyNaturalSearch();
    }
  };

  return (
    <section className="cc-search-filter-panel" aria-label="Vehicle search and filters">
      {/* Search Input & Natural Parsing Bar */}
      <div className="cc-search-input-group">
        <div className="cc-search-input-wrapper">
          <span className="cc-search-input-icon" aria-hidden="true">🔍</span>
          <input
            type="search"
            id="vehicle-search-input"
            className="cc-search-input"
            placeholder="Search make, model, or try 'Toyota SUV under $20k'..."
            value={naturalPhrase}
            onChange={(e) => onNaturalPhraseChange(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Search vehicles by keyword or natural phrase"
          />
        </div>
        <button
          type="button"
          id="search-apply-btn"
          className="cc-search-action-btn"
          onClick={onApplyNaturalSearch}
        >
          Search
        </button>
        <button
          type="button"
          id="filter-toggle-btn"
          className="cc-search-secondary-btn"
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-expanded={isExpanded}
          aria-controls="expanded-filters-section"
        >
          {isExpanded ? 'Hide Filters ▲' : 'Filters ▼'}
        </button>
        <button
          type="button"
          id="reset-filters-btn"
          className="cc-search-secondary-btn"
          onClick={onResetFilters}
        >
          Reset All
        </button>
      </div>

      {/* Understood Natural Tokens Display */}
      {understoodTokens.length > 0 && (
        <div className="cc-understood-tokens" role="region" aria-label="Understood search tokens">
          <span className="cc-understood-token-label">Parsed criteria:</span>
          {understoodTokens.map((token, idx) => (
            <span key={`${token.field}-${idx}`} className="cc-understood-token-chip">
              ✓ {token.label}
            </span>
          ))}
        </div>
      )}

      {/* Expandable Faceted Filters Grid */}
      {isExpanded && (
        <div id="expanded-filters-section" className="cc-filter-grid">
          {/* Make Filter */}
          <div className="cc-filter-field">
            <label htmlFor="filter-make-select" className="cc-filter-label">Make</label>
            <select
              id="filter-make-select"
              className="cc-filter-select"
              value={query.make || ''}
              onChange={(e) => onUpdateQuery({ make: e.target.value || undefined })}
            >
              <option value="">All Makes</option>
              {facets?.makes.map((m) => (
                <option key={m.name} value={m.name}>
                  {m.name} ({m.count})
                </option>
              ))}
            </select>
          </div>

          {/* Body Style Filter */}
          <div className="cc-filter-field">
            <label htmlFor="filter-bodystyle-select" className="cc-filter-label">Body Style</label>
            <select
              id="filter-bodystyle-select"
              className="cc-filter-select"
              value={query.bodyStyle || ''}
              onChange={(e) => onUpdateQuery({ bodyStyle: e.target.value || undefined })}
            >
              <option value="">All Body Styles</option>
              {facets?.bodyStyles.map((b) => (
                <option key={b.name} value={b.name}>
                  {b.name} ({b.count})
                </option>
              ))}
            </select>
          </div>

          {/* Fuel Type Filter */}
          <div className="cc-filter-field">
            <label htmlFor="filter-fuel-select" className="cc-filter-label">Fuel Type</label>
            <select
              id="filter-fuel-select"
              className="cc-filter-select"
              value={query.fuelType || ''}
              onChange={(e) => onUpdateQuery({ fuelType: e.target.value || undefined })}
            >
              <option value="">All Fuel Types</option>
              {facets?.fuelTypes.map((f) => (
                <option key={f.name} value={f.name}>
                  {f.name} ({f.count})
                </option>
              ))}
            </select>
          </div>

          {/* Transmission Filter */}
          <div className="cc-filter-field">
            <label htmlFor="filter-transmission-select" className="cc-filter-label">Transmission</label>
            <select
              id="filter-transmission-select"
              className="cc-filter-select"
              value={query.transmission || ''}
              onChange={(e) => onUpdateQuery({ transmission: e.target.value || undefined })}
            >
              <option value="">All Transmissions</option>
              <option value="Automatic">Automatic</option>
              <option value="Manual">Manual</option>
            </select>
          </div>

          {/* Drive Train Filter */}
          <div className="cc-filter-field">
            <label htmlFor="filter-drivetrain-select" className="cc-filter-label">Drive Train</label>
            <select
              id="filter-drivetrain-select"
              className="cc-filter-select"
              value={query.driveTrain || ''}
              onChange={(e) => onUpdateQuery({ driveTrain: e.target.value || undefined })}
            >
              <option value="">All Drive Trains</option>
              <option value="2WD">2WD</option>
              <option value="4WD">4WD</option>
              <option value="AWD">AWD</option>
            </select>
          </div>

          {/* Location Status Filter */}
          <div className="cc-filter-field">
            <label htmlFor="filter-location-select" className="cc-filter-label">Location</label>
            <select
              id="filter-location-select"
              className="cc-filter-select"
              value={query.locationStatus || ''}
              onChange={(e) => onUpdateQuery({ locationStatus: e.target.value as any || undefined })}
            >
              <option value="">All Locations</option>
              <option value="In Japan">In Japan</option>
              <option value="In Transit">In Transit</option>
              <option value="In Port">In Port</option>
            </select>
          </div>

          {/* Year Min */}
          <div className="cc-filter-field">
            <label htmlFor="filter-yearmin-input" className="cc-filter-label">Min Year</label>
            <input
              type="number"
              id="filter-yearmin-input"
              className="cc-filter-number-input"
              placeholder="e.g. 2018"
              value={query.yearMin || ''}
              onChange={(e) => onUpdateQuery({ yearMin: e.target.value ? Number(e.target.value) : undefined })}
            />
          </div>

          {/* Year Max */}
          <div className="cc-filter-field">
            <label htmlFor="filter-yearmax-input" className="cc-filter-label">Max Year</label>
            <input
              type="number"
              id="filter-yearmax-input"
              className="cc-filter-number-input"
              placeholder="e.g. 2024"
              value={query.yearMax || ''}
              onChange={(e) => onUpdateQuery({ yearMax: e.target.value ? Number(e.target.value) : undefined })}
            />
          </div>

          {/* Price Min */}
          <div className="cc-filter-field">
            <label htmlFor="filter-pricemin-input" className="cc-filter-label">Min Price ($)</label>
            <input
              type="number"
              id="filter-pricemin-input"
              className="cc-filter-number-input"
              placeholder="0"
              value={query.priceMin || ''}
              onChange={(e) => onUpdateQuery({ priceMin: e.target.value ? Number(e.target.value) : undefined })}
            />
          </div>

          {/* Price Max */}
          <div className="cc-filter-field">
            <label htmlFor="filter-pricemax-input" className="cc-filter-label">Max Price ($)</label>
            <input
              type="number"
              id="filter-pricemax-input"
              className="cc-filter-number-input"
              placeholder="e.g. 30000"
              value={query.priceMax || ''}
              onChange={(e) => onUpdateQuery({ priceMax: e.target.value ? Number(e.target.value) : undefined })}
            />
          </div>
        </div>
      )}
    </section>
  );
}
