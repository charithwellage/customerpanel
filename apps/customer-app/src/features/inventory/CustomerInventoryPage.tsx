import React, { useState } from 'react';
import type { VehicleDomainSummary } from '@carchief/domain';
import {
  SearchEmptyState,
  SearchErrorState,
  SearchFilterBar,
  SearchPagination,
  SearchResultsHeader,
  VehicleCollectionPrimitive,
} from '@carchief/vehicle-search';
import { useCustomerShell } from '../shell/index.js';
import { useCustomerProfile } from '../profile/index.js';
import { useCustomerInventory } from './useCustomerInventory.js';
import { useCustomerInventoryConfig } from './useCustomerInventoryConfig.js';

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
  const { data: publicConfig } = useCustomerInventoryConfig();
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
  const [tierInfoOpen, setTierInfoOpen] = useState(false);
  const tierDescription = publicConfig?.tierDescriptions?.[tier as keyof NonNullable<typeof publicConfig.tierDescriptions>]
    || (tierDiscountPercent > 0
      ? `Your verified account receives a ${tierDiscountPercent}% VIP discount on fixed-price export stock.`
      : 'Standard export inventory pricing with real-time stock allocation and 48-hour reservation holds.');

  return (
    <div className="cc-cust-inventory-page" data-testid="customer-inventory-page">
      <header className="cc-cust-inventory-header" data-testid="customer-inventory-header">
        <span className="cc-cust-inventory-header__eyebrow">CUSTOMER PORTAL / INVENTORY</span>
        <div className="cc-cust-inventory-header__row">
          <div>
            <h1 className="cc-cust-inventory-header__title">Vehicle Inventory</h1>
            <p className="cc-cust-inventory-header__subtitle">
              Search and compare vehicles available to your account, then enquire or reserve the vehicle that fits your requirements.
            </p>
          </div>
          <div
            className="cc-cust-tier-summary"
            data-testid="customer-tier-summary"
            onMouseEnter={() => setTierInfoOpen(true)}
            onMouseLeave={() => setTierInfoOpen(false)}
          >
            <span className="cc-cust-tier-summary__icon" aria-hidden="true">★</span>
            <span className="cc-cust-tier-summary__label">{tier} Tier Account</span>
            <button
              type="button"
              className="cc-cust-tier-summary__info"
              aria-label={`More information about ${tier} tier pricing`}
              aria-expanded={tierInfoOpen}
              aria-describedby="customer-tier-description"
              onClick={() => setTierInfoOpen((open) => !open)}
            >
              i
            </button>
            {tierInfoOpen && (
              <span id="customer-tier-description" className="cc-cust-tier-summary__description" role="tooltip">
                {tierDescription}
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="cc-cust-inventory-content">
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
