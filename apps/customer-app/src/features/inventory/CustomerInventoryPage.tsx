import React from 'react';
import type { VehicleDomainSummary } from '@carchief/domain';
import {
  SearchEmptyState,
  SearchErrorState,
  SearchFilterBar,
  SearchPagination,
  SearchResultsHeader,
  VehicleCollectionPrimitive,
  VehicleSearchHero,
} from '@carchief/vehicle-search';
import { useCustomerShell } from '../shell/index.js';
import { useCustomerInventory } from './useCustomerInventory.js';

export interface CustomerInventoryPageProps {
  apiBaseUrl?: string;
  token?: string;
  onSelectVehicle?: (vehicle: VehicleDomainSummary) => void;
}

export const CustomerInventoryPage: React.FC<CustomerInventoryPageProps> = ({
  apiBaseUrl = '',
  token,
  onSelectVehicle,
}) => {
  const { user } = useCustomerShell();
  const {
    state,
    query,
    naturalPhrase,
    understoodTokens,
    setNaturalPhrase,
    applyNaturalSearch,
    updateQuery,
    resetFilters,
    refetch,
    setPage,
  } = useCustomerInventory({
    apiBaseUrl,
    token,
  });

  const tier = user?.tier || 'Standard';
  const tierDiscountPercent =
    tier === 'Platinum' ? 15 : tier === 'Gold' ? 10 : tier === 'Silver' ? 5 : 0;

  return (
    <div className="cc-search-wrapper" data-testid="customer-inventory-page">
      <VehicleSearchHero
        title="CarChief Inventory Search"
        description="Browse the complete live vehicle inventory available to customer accounts, then filter by the details that matter to you."
      />
      <div className="cc-search-container">
        <div className="cc-cust-tier-banner" role="region" aria-label="Customer tier pricing status">
          <div className="cc-cust-tier-banner__badge">
            <span className="cc-cust-tier-banner__icon">⭐️</span>
            <span className="cc-cust-tier-banner__tier-name">{tier} Tier Account</span>
          </div>
          <div className="cc-cust-tier-banner__info">
            {tierDiscountPercent > 0 ? (
              <p>Your verified account receives a <strong>{tierDiscountPercent}% VIP discount</strong> on fixed-price export stock.</p>
            ) : (
              <p>Standard export inventory pricing with real-time stock allocation and 48-hour reservation holds.</p>
            )}
          </div>
        </div>
        <SearchFilterBar
          query={query}
          facets={state.facets}
          naturalPhrase={naturalPhrase}
          understoodTokens={understoodTokens}
          onNaturalPhraseChange={setNaturalPhrase}
          onApplyNaturalSearch={applyNaturalSearch}
          onUpdateQuery={updateQuery}
          onResetFilters={resetFilters}
        />
        {state.error ? <SearchErrorState error={state.error} onRetry={refetch} /> : (
          <>
            <div data-testid="inventory-total-count">
              <SearchResultsHeader total={state.total} itemCount={state.items.length} query={query} onUpdateQuery={updateQuery} onForceSync={refetch} />
            </div>
            {!state.loading && state.items.length === 0 ? <SearchEmptyState onResetFilters={resetFilters} /> : (
              <VehicleCollectionPrimitive
                vehicles={state.items}
                isLoading={state.loading}
                error={null}
                onSelectVehicle={onSelectVehicle}
                getVehicleHref={(v) => `/inventory/${v.slug || v.id}`}
              />
            )}
            <SearchPagination
              page={state.page}
              totalPages={state.totalPages}
              total={state.total}
              limit={state.limit}
              hasNextPage={state.page < state.totalPages}
              hasPrevPage={state.page > 1}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </div>
  );
};
