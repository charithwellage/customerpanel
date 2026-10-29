import React, { useState, useEffect } from 'react';
import type { VehicleDomainSummary } from '@carchief/domain';
import {
  SearchEmptyState,
  SearchErrorState,
  SearchFilterBar,
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
  const { user, setActiveRoute } = useCustomerShell();
  const { data: profile } = useCustomerProfile();
  const { data: tierBenefits } = useCustomerTierBenefits();
  const destinationCountry = profile?.deliveryAddress || user?.company || 'Kenya';

  const [isMobile, setIsMobile] = useState<boolean>(() => {
    return typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;
  });
  const perPageSizes = isMobile ? [8, 20, 50, 100] : [20, 50, 100];

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
    handleAiSearch,
    handleAiClear,
  } = useCustomerInventory({
    apiBaseUrl,
    token,
    destinationCountry,
    initialQuery: {
      page: 1,
      limit: isMobile ? 8 : 20,
      sortBy: 'newest',
    },
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 767px)');
    setIsMobile(mq.matches);
    if (mq.matches && query.limit === 20) {
      updateQuery({ limit: 8, page: 1 });
    }
    const onChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
      if (e.matches && query.limit === 20) {
        updateQuery({ limit: 8, page: 1 });
      }
    };
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, [updateQuery, query.limit]);

  const tier = user?.tier || 'Standard';
  const tierDiscountPercent = tierBenefits?.discountPercent ?? 0;


  return (
    <div className="cc-cust-inventory-page" data-testid="customer-inventory-page">
      {/* Unified All Inventory & Fleet Procurement Master Tile View */}
      <section className="cc-cust-inventory-master-tile cc-cust-inventory-hero" data-testid="customer-inventory-header">
        <div className="cc-cust-inventory-tile__header">
          <div className="cc-cust-inventory-tile__title-group">
            <div className="cc-dash-hero-badges">
              <span className="cc-dash-pill-badge cc-dash-pill-badge--shield">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" />
                </svg>
                CARCHIEF ALL INVENTORY
              </span>
              <span className="cc-dash-pill-badge cc-dash-pill-badge--active">
                <span className="cc-dash-dot cc-dash-dot--emerald" />
                LIVE CATALOGUE
              </span>
            </div>

            <h1 className="cc-cust-inventory-hero__title">
              ALL INVENTORY &amp; <span className="cc-dash-user-highlight">FLEET PROCUREMENT</span>
            </h1>
          </div>

          <div className="cc-cust-inventory-hero__tier">
            <div
              className="cc-cust-tier-summary cc-cust-tier-summary--premium"
              data-testid="customer-tier-summary"
            >
              <div className="cc-cust-tier-premium-crown" aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="cc-cust-tier-premium-svg">
                  <defs>
                    <linearGradient id="vipGoldGradient" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#f59e0b" />
                      <stop offset="0.5" stopColor="#d97706" />
                      <stop offset="1" stopColor="#b45309" />
                    </linearGradient>
                    <linearGradient id="vipShine" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#fffbeb" />
                      <stop offset="1" stopColor="#fef3c7" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M12 2L4.5 5.5V11.5C4.5 16.2 7.7 20.6 12 21.8C16.3 20.6 19.5 16.2 19.5 11.5V5.5L12 2Z"
                    fill="url(#vipShine)"
                    stroke="url(#vipGoldGradient)"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8 14.5L7 9.5L10 11L12 7.5L14 11L17 9.5L16 14.5H8Z"
                    fill="url(#vipGoldGradient)"
                  />
                  <circle cx="12" cy="6.8" r="0.9" fill="#b45309" />
                  <circle cx="7" cy="8.8" r="0.8" fill="#b45309" />
                  <circle cx="17" cy="8.8" r="0.8" fill="#b45309" />
                  <rect x="7.5" y="15.2" width="9" height="1.5" rx="0.75" fill="#b45309" />
                </svg>
              </div>
              <div className="cc-cust-tier-premium-text">
                <span className="cc-cust-tier-premium-sub">VIP FLEET ACCOUNT</span>
                <div className="cc-cust-tier-premium-main-row">
                  <span className="cc-cust-tier-summary__label">PREMIUM DEALER</span>
                  <span className="cc-cust-tier-premium-badge">10% OFF FOB</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Advanced Filter Controls (AI Search, Keyword, Sort, Advanced Filters, Reset) */}
        <div className="cc-cust-inventory-tile__search">
          <SearchFilterBar
            query={query}
            facets={state.facets}
            naturalPhrase={naturalPhrase}
            understoodTokens={understoodTokens}
            onNaturalPhraseChange={setNaturalPhrase}
            onApplyNaturalSearch={applyNaturalSearch}
            onUpdateQuery={updateQuery}
            onResetFilters={resetFilters}
            aiValue={ai.prompt}
            onAiChange={ai.setPrompt}
            onAiSubmit={handleAiSearch}
            onAiClear={handleAiClear}
            isAiLoading={ai.isLoading}
            isAiActive={ai.isActive}
            aiId="customer-inventory-ai-search"
          />
        </div>

        {/* Top Results Count & Per-Page Controls */}
        {state.total > 0 && (
          <div className="cc-cust-top-pagination-bar" data-testid="inventory-top-pagination">
            <div className="cc-cust-pagination-info">
              Showing <span className="cc-cust-pagination-highlight">{(state.page - 1) * state.limit + 1}–{Math.min(state.page * state.limit, state.total)}</span> of <span className="cc-cust-pagination-highlight">{state.total}</span> vehicles
            </div>

            <div className="cc-cust-top-pagination-actions">
              <div className="cc-cust-per-page-selector">
                <span className="cc-cust-per-page-label">Per page:</span>
                {perPageSizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    className={`cc-cust-per-page-btn ${state.limit === size ? 'cc-cust-per-page-btn--active' : ''}`}
                    onClick={() => updateQuery({ limit: size })}
                  >
                    {size}
                  </button>
                ))}
              </div>

              {state.totalPages > 1 && (
                <div className="cc-cust-top-page-nav">
                  <button
                    type="button"
                    className="cc-cust-page-btn cc-cust-page-btn--sm"
                    disabled={state.page <= 1}
                    onClick={() => setPage(state.page - 1)}
                    aria-label="Previous Page"
                  >
                    ←
                  </button>
                  <span className="cc-cust-top-page-indicator">
                    {state.page} / {state.totalPages}
                  </span>
                  <button
                    type="button"
                    className="cc-cust-page-btn cc-cust-page-btn--sm"
                    disabled={state.page >= state.totalPages}
                    onClick={() => setPage(state.page + 1)}
                    aria-label="Next Page"
                  >
                    →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Main Results Content (Errors, Empty, or Vehicle Grid) */}
      <div className="cc-cust-inventory-content">
        {state.error ? <SearchErrorState error={state.error} onRetry={refetch} /> : (() => {
          const items = Array.isArray(state?.items) ? state.items : [];
          return (
            <>
              {!state.loading && items.length === 0 ? (
                <div className="cc-inventory-empty-demand-wrap">
                  <SearchEmptyState onResetFilters={resetFilters} />
                  <div className="cc-inventory-demand-prompt-card">
                    <div className="cc-inventory-demand-prompt-left">
                      <span className="cc-inventory-demand-prompt-icon">🎯</span>
                      <div>
                        <h4 className="cc-inventory-demand-prompt-title">Couldn't find the vehicle you're looking for?</h4>
                        <p className="cc-inventory-demand-prompt-desc">
                          Our Japan procurement team monitors 130+ daily auctions (USS, TAA, CAA, JU). Post a demand with your exact specifications, and we'll source it directly for you.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="cc-inventory-demand-prompt-btn"
                      onClick={() => setActiveRoute('/demand')}
                    >
                      Post Demand Request →
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <VehicleCollectionPrimitive
                    vehicles={items}
                    isLoading={state.loading}
                    error={null}
                    onSelectVehicle={onSelectVehicle}
                    getVehicleHref={(v) => `/inventory/${v.slug || v.id}`}
                  />

                {/* Rich Pagination Bar with 4-Row (8) & Show All Toggle and Page Navigation */}
                {state.total > 0 && (
                  <nav className="cc-cust-pagination-wrap" aria-label="Inventory pagination navigation">
                    <div className="cc-cust-pagination-top-row">
                      <div className="cc-cust-pagination-info">
                        Showing <span className="cc-cust-pagination-highlight">{(state.page - 1) * state.limit + 1}–{Math.min(state.page * state.limit, state.total)}</span> of <span className="cc-cust-pagination-highlight">{state.total}</span> vehicles
                      </div>

                      {/* Show All Toggle for Quick Navigation */}
                      {state.total > (isMobile ? 8 : 20) && (
                        <div className="cc-cust-pagination-show-all-wrap">
                          {state.limit < state.total ? (
                            <button
                              type="button"
                              className="cc-cust-show-all-btn"
                              onClick={() => updateQuery({ limit: Math.max(state.total, 100), page: 1 })}
                              title={`Display all ${state.total} vehicles`}
                            >
                              <span>Show All</span>
                              <span className="cc-cust-show-all-btn__badge">{state.total}</span>
                              <svg className="cc-cust-show-all-btn__icon" viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="m4 6 4 4 4-4" />
                              </svg>
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="cc-cust-show-all-btn cc-cust-show-all-btn--active"
                              onClick={() => updateQuery({ limit: isMobile ? 8 : 20, page: 1 })}
                              title={`Switch to paginated view (${isMobile ? 8 : 20} per page)`}
                            >
                              <span>Show Pages</span>
                              <span className="cc-cust-show-all-btn__badge">{isMobile ? 8 : 20}</span>
                              <svg className="cc-cust-show-all-btn__icon" viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="m4 10 4-4 4 4" />
                              </svg>
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="cc-cust-pagination-controls">
                      <button
                        type="button"
                        className="cc-cust-page-btn cc-cust-page-btn--nav"
                        disabled={state.page <= 1}
                        onClick={() => setPage(state.page - 1)}
                        aria-label="Previous Page"
                      >
                        ← Prev
                      </button>

                      {(() => {
                        const pages: (number | string)[] = [];
                        const totalPages = state.totalPages;
                        const cur = state.page;
                        if (totalPages <= 7) {
                          for (let i = 1; i <= totalPages; i++) pages.push(i);
                        } else if (cur <= 4) {
                          pages.push(1, 2, 3, 4, 5, '...', totalPages);
                        } else if (cur >= totalPages - 3) {
                          pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
                        } else {
                          pages.push(1, '...', cur - 1, cur, cur + 1, '...', totalPages);
                        }

                        return pages.map((p, idx) => {
                          if (typeof p === 'string') {
                            return <span key={`ellipsis-${idx}`} className="cc-cust-page-ellipsis">…</span>;
                          }
                          return (
                            <button
                              key={p}
                              type="button"
                              className={`cc-cust-page-btn ${p === cur ? 'cc-cust-page-btn--active' : ''}`}
                              onClick={() => setPage(p)}
                              aria-current={p === cur ? 'page' : undefined}
                            >
                              {p}
                            </button>
                          );
                        });
                      })()}

                      <button
                        type="button"
                        className="cc-cust-page-btn cc-cust-page-btn--nav"
                        disabled={state.page >= state.totalPages}
                        onClick={() => setPage(state.page + 1)}
                        aria-label="Next Page"
                      >
                        Next →
                      </button>
                    </div>

                    <div className="cc-cust-per-page-selector">
                      <span className="cc-cust-per-page-label">Per page:</span>
                      {perPageSizes.map((size) => (
                        <button
                          key={size}
                          type="button"
                          className={`cc-cust-per-page-btn ${state.limit === size ? 'cc-cust-per-page-btn--active' : ''}`}
                          onClick={() => updateQuery({ limit: size, page: 1 })}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </nav>
                )}

                {/* Sourcing Prompt Strip below live inventory & pagination */}
                <div className="cc-inventory-demand-footer-strip">
                  <div className="cc-inventory-demand-footer-text">
                    <span className="cc-inventory-demand-footer-title">🎯 Looking for a specific car or planning a future purchase?</span>
                    <p className="cc-inventory-demand-footer-desc">Post a Demand Request — our Tokyo desk will scan daily Japan auctions to match your exact model and budget.</p>
                  </div>
                  <button
                    type="button"
                    className="cc-inventory-demand-footer-btn"
                    onClick={() => setActiveRoute('/demand')}
                  >
                    Go to Demand Management →
                  </button>
                </div>
              </>
            )}
          </>
        );
      })()}
    </div>
  </div>
);
};
