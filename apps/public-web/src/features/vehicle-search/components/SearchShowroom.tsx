'use client';

import React from 'react';
import { AiVehicleSearch, VehicleCollectionPrimitive, VehicleSearchHero, SearchFilterBar, SearchResultsHeader, SearchEmptyState, SearchErrorState, SearchPagination } from '@carchief/vehicle-search';
import { useTranslation } from '../../../i18n/I18nContext';
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
  const { t } = useTranslation();
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
    aiPrompt,
    setAiPrompt,
    applyAiSearch,
    clearAiSearch,
    isAiLoading,
    isAiActive,
    isAiUnavailable,
    aiError,
    aiSummary,
    aiConstraints,
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
          <AiVehicleSearch
            id="public-ai-vehicle-search"
            value={aiPrompt}
            onChange={setAiPrompt}
            onSubmit={() => { void applyAiSearch(); }}
            onClear={clearAiSearch}
            isLoading={isAiLoading}
            isActive={isAiActive}
            unavailable={isAiUnavailable}
            error={aiError}
            summary={aiSummary}
            appliedConstraints={aiConstraints}
            copy={{
              label: t('aiSearch.label', undefined, 'AI Search'),
              placeholder: t('aiSearch.placeholder', undefined, 'Ask AI to find a vehicle, e.g. a hybrid SUV under $20,000'),
              submit: t('aiSearch.submit', undefined, 'Search with AI'),
              submitting: t('aiSearch.submitting', undefined, 'Searching…'),
              clear: t('aiSearch.clear', undefined, 'Clear AI search'),
              unavailable: t('aiSearch.unavailable', undefined, 'AI search is not yet available in this environment. Try the regular vehicle search and filters.'),
              resultsLabel: t('aiSearch.results', undefined, 'AI search results'),
            }}
          />
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
