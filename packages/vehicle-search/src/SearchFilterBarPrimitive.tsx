import React from 'react';
import type { SearchVehiclesQuery, VehicleFacets } from '@carchief/domain';
import type { UnderstoodToken } from './parser.js';

export interface SearchFilterBarPrimitiveProps {
  query: SearchVehiclesQuery;
  facets?: VehicleFacets;
  naturalPhrase: string;
  understoodTokens: UnderstoodToken[];
  onNaturalPhraseChange: (phrase: string) => void;
  onApplyNaturalSearch: () => void;
  onUpdateQuery: (updates: Partial<SearchVehiclesQuery>) => void;
  onResetFilters: () => void;
}

export function SearchFilterBarPrimitive({
  query,
  facets,
  naturalPhrase,
  understoodTokens,
  onNaturalPhraseChange,
  onApplyNaturalSearch,
  onUpdateQuery,
  onResetFilters,
}: SearchFilterBarPrimitiveProps) {
  return (
    <div className="cc-search-filter-panel">
      <div className="cc-search-input-group">
        <input
          type="search"
          className="cc-search-input"
          placeholder="Search make, model, or try 'Toyota SUV under $20k'..."
          value={naturalPhrase}
          onChange={(e) => onNaturalPhraseChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onApplyNaturalSearch()}
          aria-label="Search vehicles"
        />
        <button type="button" className="cc-search-action-btn" onClick={onApplyNaturalSearch}>
          Search
        </button>
        <button type="button" className="cc-search-secondary-btn" onClick={onResetFilters}>
          Reset All
        </button>
      </div>

      {understoodTokens.length > 0 && (
        <div className="cc-understood-tokens">
          {understoodTokens.map((t, i) => (
            <span key={i} className="cc-understood-token-chip">✓ {t.label}</span>
          ))}
        </div>
      )}
    </div>
  );
}
