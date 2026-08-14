import React from 'react';
import type { VehicleDomainSummary } from '@carchief/domain';
import { SearchFilterBarPrimitive, VehicleCollectionPrimitive } from '@carchief/vehicle-search';
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
  } = useCustomerInventory({
    apiBaseUrl,
    token,
  });

  const tier = user?.tier || 'Standard';
  const tierDiscountPercent =
    tier === 'Platinum' ? 15 : tier === 'Gold' ? 10 : tier === 'Silver' ? 5 : 0;

  return (
    <div className="cc-cust-inventory-page" data-testid="customer-inventory-page">
      {/* Tier Pricing Status Banner (CUST-05, RULE-06) */}
      <div className="cc-cust-tier-banner" role="region" aria-label="Customer tier pricing status">
        <div className="cc-cust-tier-banner__badge">
          <span className="cc-cust-tier-banner__icon">⭐️</span>
          <span className="cc-cust-tier-banner__tier-name">{tier} Tier Account</span>
        </div>
        <div className="cc-cust-tier-banner__info">
          {tierDiscountPercent > 0 ? (
            <p>
              Your verified account receives a <strong>{tierDiscountPercent}% VIP discount</strong> automatically
              applied to all fixed-price export stock below.
            </p>
          ) : (
            <p>Standard export inventory pricing with real-time stock allocation and 48-hour reservation holds.</p>
          )}
        </div>
      </div>

      {/* Shared Search Filter Bar */}
      <div className="cc-cust-inventory-search-wrap">
        <SearchFilterBarPrimitive
          query={query}
          facets={state.facets}
          naturalPhrase={naturalPhrase}
          understoodTokens={understoodTokens}
          onNaturalPhraseChange={setNaturalPhrase}
          onApplyNaturalSearch={applyNaturalSearch}
          onUpdateQuery={updateQuery}
          onResetFilters={resetFilters}
        />
      </div>

      {/* Results Header */}
      <div className="cc-cust-inventory-meta">
        <span className="cc-cust-inventory-count" data-testid="inventory-total-count">
          Showing {state.items.length} of {state.total} available vehicles
        </span>
      </div>

      {/* Shared Vehicle Collection Grid */}
      <VehicleCollectionPrimitive
        vehicles={state.items}
        isLoading={state.loading}
        error={state.error}
        emptyTitle="No vehicles match your search"
        emptyDescription="Try adjusting your search criteria or resetting filters to browse all export inventory."
        onRetry={refetch}
        onSelectVehicle={onSelectVehicle}
        getVehicleHref={(v) => `/inventory/${v.slug || v.id}`}
      />

      {/* Pagination */}
      {state.totalPages > 1 && (
        <nav className="cc-cust-pagination" aria-label="Inventory pagination">
          <button
            type="button"
            className="cc-cust-pagination__btn"
            disabled={state.page <= 1}
            onClick={() => updateQuery({ page: state.page - 1 })}
          >
            &larr; Previous
          </button>
          <span className="cc-cust-pagination__info">
            Page {state.page} of {state.totalPages}
          </span>
          <button
            type="button"
            className="cc-cust-pagination__btn"
            disabled={state.page >= state.totalPages}
            onClick={() => updateQuery({ page: state.page + 1 })}
          >
            Next &rarr;
          </button>
        </nav>
      )}
    </div>
  );
};
