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
import { useCustomerProfile } from '../profile/index.js';
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
  const { data: profile } = useCustomerProfile();
  const destinationCountry = profile?.deliveryAddress || user?.company || 'Kenya';

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
    destinationCountry,
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

        <div className="cc-cust-compliance-banner" role="region" aria-label="Country import compliance localization" data-testid="compliance-localization-banner">
          <div className="cc-cust-compliance-banner__badge">
            <span className="cc-cust-compliance-banner__icon">📍</span>
            <div>
              <span className="cc-cust-compliance-banner__tier-name">
                {query.complianceOnly !== false
                  ? `Import Compliance: ${destinationCountry}`
                  : `Global Stock (${destinationCountry} Filter Off)`}
              </span>
              <p className="cc-cust-compliance-banner__subtitle">
                {query.complianceOnly !== false
                  ? `Showing vehicles compliant with ${destinationCountry} import regulations (YOM age & steering verified).`
                  : `Showing all worldwide inventory without destination country restrictions.`}
              </p>
            </div>
          </div>
          <div className="cc-cust-compliance-banner__actions">
            <button
              type="button"
              className="cc-cust-compliance-banner__btn"
              onClick={() => updateQuery({ complianceOnly: query.complianceOnly === false ? true : false })}
              aria-pressed={query.complianceOnly !== false}
              data-testid="compliance-toggle-btn"
            >
              {query.complianceOnly !== false ? 'Show All Global Stock' : `Filter for ${destinationCountry} Only`}
            </button>
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
