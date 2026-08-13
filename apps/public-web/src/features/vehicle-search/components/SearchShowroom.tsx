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
  title = 'ALL STOCK INVENTORY',
  description = 'Search and dynamically filter our entire live container-logistics fleet. Instantly reserve models or calculate customized shipping quotes.',
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
    <div className="cc-search-wrapper" id="search-showroom-container">
      {/* Dark Hero Header Banner */}
      <section className="cc-allstock-hero">
        <div className="cc-allstock-hero__badge">
          FULL INVENTORY CATALOG
        </div>
        <h1 className="cc-allstock-hero__title">{title}</h1>
        <p className="cc-allstock-hero__description">{description}</p>
      </section>

      <div className="cc-search-container">
        {/* Floating Filter Controls Bar */}
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
              onForceSync={refetch}
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
    </div>
  );
}

