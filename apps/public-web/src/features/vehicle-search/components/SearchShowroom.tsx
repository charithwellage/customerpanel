'use client';

import React from 'react';
import { VehicleCollectionPrimitive } from '@carchief/vehicle-search';
import { useVehicleSearchOrchestration, type UseVehicleSearchOrchestrationOptions } from '../hooks/useVehicleSearchOrchestration';
import { SearchFilterBar } from './SearchFilterBar';
import { SearchResultsHeader } from './SearchResultsHeader';
import { SearchEmptyState } from './SearchEmptyState';
import { SearchErrorState } from './SearchErrorState';
import { SearchPagination } from './SearchPagination';
import '../vehicle-search.css';

export interface SearchShowroomProps extends UseVehicleSearchOrchestrationOptions {
  onSelectVehicle?: (vehicleId: string) => void;
  title?: string;
  description?: string;
}

export function SearchShowroom({
  onSelectVehicle,
  title = 'Inventory & Showroom Search',
  description = 'Explore our verified Japan & Overseas inventory with real-time filters and search',
  ...orchestrationOptions
}: SearchShowroomProps) {
  const {
    query,
    result,
    isLoading,
    error,
    understoodTokens,
    naturalPhrase,
    setNaturalPhrase,
    applyNaturalSearch,
    updateQuery,
    resetFilters,
    setPage,
    refetch,
  } = useVehicleSearchOrchestration(orchestrationOptions);

  return (
    <div className="cc-search-container" id="search-showroom-container">
      {/* Page Title & Subtitle */}
      <header className="cc-vehicle-collection__header">
        <h1 className="cc-vehicle-collection__title">{title}</h1>
        {description && <p className="cc-vehicle-collection__description">{description}</p>}
      </header>

      {/* Filter Controls Bar */}
      <SearchFilterBar
        query={query}
        facets={result?.facets}
        naturalPhrase={naturalPhrase}
        understoodTokens={understoodTokens}
        onNaturalPhraseChange={setNaturalPhrase}
        onApplyNaturalSearch={() => applyNaturalSearch()}
        onUpdateQuery={updateQuery}
        onResetFilters={resetFilters}
      />

      {/* Error Feedback State */}
      {error && <SearchErrorState error={error} onRetry={refetch} />}

      {/* Search Results Content */}
      {!error && (
        <>
          <SearchResultsHeader
            total={result?.total || 0}
            itemCount={result?.items.length || 0}
            query={query}
            onUpdateQuery={updateQuery}
          />

          {/* Loading / Empty / Success Grid */}
          {!isLoading && result?.items.length === 0 ? (
            <SearchEmptyState onResetFilters={resetFilters} />
          ) : (
            <VehicleCollectionPrimitive
              vehicles={result?.items || []}
              isLoading={isLoading}
              error={null}
              onSelectVehicle={(v) => onSelectVehicle?.(v.id)}
            />
          )}

          {/* Pagination Controls */}
          {result && (
            <SearchPagination
              page={result.page}
              totalPages={result.totalPages}
              total={result.total}
              limit={result.limit}
              hasNextPage={result.hasNextPage}
              hasPrevPage={result.hasPrevPage}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}
