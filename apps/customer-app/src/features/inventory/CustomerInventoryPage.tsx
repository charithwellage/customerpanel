import React, { useState } from 'react';
import type { VehicleDomainSummary } from '@carchief/domain';
import {
  SearchEmptyState,
  SearchErrorState,
  SearchFilterBar,
  SearchPagination,
  SearchResultsHeader,
  VehicleCollectionPrimitive,
  AiVehicleSearch,
} from '@carchief/vehicle-search';
import { useCustomerShell } from '../shell/index.js';
import { useCustomerProfile } from '../profile/index.js';
import { useCustomerInventory } from './useCustomerInventory.js';
import { useCustomerTierBenefits } from './useCustomerTierBenefits.js';
import { useTranslation } from '../../i18n/index.js';

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
  const { t } = useTranslation();
  const { user } = useCustomerShell();
  const { data: profile } = useCustomerProfile();
  const { data: tierBenefits } = useCustomerTierBenefits();
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
    ai,
  } = useCustomerInventory({
    apiBaseUrl,
    token,
    destinationCountry,
  });

  const tier = user?.tier || 'Standard';
  const tierDiscountPercent = tierBenefits?.discountPercent ?? 0;
  const [tierInfoOpen, setTierInfoOpen] = useState(false);
  const tierDescription = tierBenefits?.description || t('customer.loading', undefined, 'Tier benefits are temporarily unavailable.');
  const tierLabel = tierBenefits?.tier || tier;

  return (
    <div className="cc-cust-inventory-page" data-testid="customer-inventory-page">
      <header className="cc-cust-inventory-header" data-testid="customer-inventory-header">
        <span className="cc-cust-inventory-header__eyebrow">{t('customer.portalInventory', undefined, 'CUSTOMER PORTAL / INVENTORY')}</span>
        <div className="cc-cust-inventory-header__row">
          <div>
            <h1 className="cc-cust-inventory-header__title">{t('customer.vehicleInventory', undefined, 'Vehicle Inventory')}</h1>
            <p className="cc-cust-inventory-header__subtitle">
              {t('customer.inventorySubtitle', undefined, 'Search and compare vehicles available to your account, then enquire or reserve the vehicle that fits your requirements.')}
            </p>
          </div>
          <div
            className="cc-cust-tier-summary"
            data-testid="customer-tier-summary"
            onMouseEnter={() => setTierInfoOpen(true)}
            onMouseLeave={() => setTierInfoOpen(false)}
          >
            <span className="cc-cust-tier-summary__icon" aria-hidden="true">★</span>
            <span className="cc-cust-tier-summary__label">{t('customer.tierAccount', { tier: tierLabel }, `${tierLabel} Tier Account`)}</span>
            <button
              type="button"
              className="cc-cust-tier-summary__info"
              aria-label={t('customer.tierInfo', { tier: tierLabel }, `More information about ${tierLabel} tier pricing`)}
              aria-expanded={tierInfoOpen}
              aria-describedby="customer-tier-description"
              onClick={() => setTierInfoOpen((open) => !open)}
            >
              i
            </button>
            {tierInfoOpen && (
              <span id="customer-tier-description" className="cc-cust-tier-summary__description" role="tooltip">
                <span>{tierDescription}</span>
                <span className="cc-cust-tier-summary__quota">
                  {t('customer.discount', { percent: tierBenefits?.discountPercent ?? 0 }, `Discount: ${tierBenefits?.discountPercent ?? 0}%`)} · {t('customer.reservations', { used: tierBenefits?.activeReservations ?? 0, maximum: tierBenefits?.maxActiveReservations ?? '—', remaining: tierBenefits?.remainingReservations ?? '—' }, `Reservations: ${tierBenefits?.activeReservations ?? 0}/${tierBenefits?.maxActiveReservations ?? '—'} used · ${tierBenefits?.remainingReservations ?? '—'} remaining`)}
                </span>
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="cc-cust-inventory-content">
        <AiVehicleSearch
          id="customer-inventory-ai-search"
          value={ai.prompt}
          onChange={ai.setPrompt}
          onSubmit={() => { void ai.search(); }}
          onClear={ai.clear}
          isLoading={ai.isLoading}
          isActive={ai.isActive}
          unavailable={ai.unavailable}
          error={ai.error}
          summary={ai.result?.interpretation.summary}
          appliedConstraints={ai.result?.interpretation.appliedConstraints}
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
              <SearchResultsHeader total={state.total} itemCount={state.items.length} query={query} onUpdateQuery={updateQuery} />
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
