'use client';

import React from 'react';
import { VehicleCollectionPrimitive, VehicleSearchHero, SearchFilterBar, SearchResultsHeader, SearchEmptyState, SearchErrorState, SearchPagination } from '@carchief/vehicle-search';
import { useVehicleSearchOrchestration, type UseVehicleSearchOrchestrationOptions } from '../hooks/useVehicleSearchOrchestration';

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
      <VehicleSearchHero title={title} description={description} />

      <div className="cc-search-container cc-search-layout">
        <aside className="cc-search-sidebar">
          <SearchFilterBar
            layout="sidebar"
            query={query}
            facets={result?.facets}
            naturalPhrase={naturalPhrase}
            understoodTokens={understoodTokens}
            onNaturalPhraseChange={setNaturalPhrase}
            onApplyNaturalSearch={() => applyNaturalSearch()}
            onUpdateQuery={updateQuery}
            onResetFilters={resetFilters}
          />
        </aside>

        <main className="cc-search-results-column" aria-label="Vehicle search results">
          {error && <SearchErrorState error={error} onRetry={refetch} />}

          {!error && (
            <>
              <SearchResultsHeader
                total={result?.total || 0}
                itemCount={result?.items.length || 0}
                query={query}
                facets={result?.facets}
                onUpdateQuery={updateQuery}
              />

              {!isLoading && result?.items.length === 0 ? (
                <SearchEmptyState onResetFilters={resetFilters} />
              ) : (
                <VehicleCollectionPrimitive
                  vehicles={result?.items || []}
                  isLoading={isLoading}
                  error={null}
                  onSelectVehicle={onSelectVehicle ? (v) => onSelectVehicle(v.id) : undefined}
                />
              )}

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
        </main>
      </div>
    </div>
  );
}
