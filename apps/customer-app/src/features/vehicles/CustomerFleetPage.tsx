import React, { useState, useMemo, useEffect } from 'react';
import type { CustomerVehicleSummary } from '@carchief/domain';
import { AiVehicleSearchService } from '@carchief/api-client';
import { AiVehicleSearch, useAiVehicleSearch } from '@carchief/vehicle-search';
import { useCustomerShell } from '../shell/index.js';
import { useHttpClient } from '../account/index.js';
import { useCustomerVehicles } from './useCustomerVehicles.js';
import { VehicleFleetCard } from './components/VehicleFleetCard.js';
import { VehicleTrackingModal } from './components/VehicleTrackingModal.js';
import { ViewModeToggle, type ViewMode } from '../../components/ViewModeToggle.js';
import { useTranslation } from '../../i18n/index.js';

export interface CustomerFleetPageProps {
  onSelectVehicle: (vehicle: CustomerVehicleSummary) => void;
  initialTab?: FleetTabKey;
}

export type FleetTabKey = 'reserved' | 'withPI' | 'invoiced' | 'all' | 'underNegotiation' | 'underNegotiationWithPI' | 'confirmed' | 'inTransit' | 'delivered';

export const CustomerFleetPage: React.FC<CustomerFleetPageProps> = ({ onSelectVehicle, initialTab = 'invoiced' }) => {
  const { t } = useTranslation();
  const { setActiveRoute } = useCustomerShell();
  const httpClient = useHttpClient();
  const [activeTab, setActiveTab] = useState<FleetTabKey>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [shippingStatusFilter, setShippingStatusFilter] = useState('all');
  const [selectedTrackingVehicle, setSelectedTrackingVehicle] = useState<CustomerVehicleSummary | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;
  const aiService = useMemo(() => httpClient ? new AiVehicleSearchService(httpClient) : null, [httpClient]);

  React.useEffect(() => {
    setActiveRoute('/vehicles');
  }, [setActiveRoute]);

  const queryParams = useMemo(() => {
    let statusParam: string | undefined;
    if (activeTab === 'reserved' || activeTab === 'underNegotiation') {
      statusParam = 'Under Negotiation';
    } else if (activeTab === 'withPI' || activeTab === 'underNegotiationWithPI') {
      statusParam = 'Under Negotiation With PI';
    } else if (activeTab === 'invoiced') {
      statusParam = 'invoiced';
    } else if (activeTab === 'confirmed') {
      statusParam = 'Confirmed';
    } else if (activeTab === 'inTransit') {
      statusParam = 'In Transit';
    } else if (activeTab === 'delivered') {
      statusParam = 'Delivered';
    }

    return {
      status: statusParam,
      query: searchQuery.trim() || undefined,
      limit: 100,
    };
  }, [activeTab, searchQuery]);

  const { data, isLoading, error, refetch } = useCustomerVehicles(queryParams);
  const ai = useAiVehicleSearch({
    service: aiService,
    request: {
      scope: 'customerFleet',
      page: currentPage,
      limit: pageSize,
      filters: { searchQuery: searchQuery || undefined },
      constraints: {
        activeTab,
        ...(queryParams.status ? { status: queryParams.status } : {}),
        ...(shippingStatusFilter !== 'all' ? { shippingStatus: shippingStatusFilter } : {}),
      },
    },
  });

  const sourceVehicles = ai.result?.scope === 'customerFleet'
    ? ai.result.items as CustomerVehicleSummary[]
    : data?.items;

  const displayedVehicles = useMemo(() => {
    if (!sourceVehicles) return [];
    if (shippingStatusFilter === 'all' || ai.isActive) return sourceVehicles;
    return sourceVehicles.filter((v) => {
      const stage = (v.shippingStage || v.logisticsStatus || v.locationStatus || '').toLowerCase();
      const filterLower = shippingStatusFilter.toLowerCase();
      return stage.includes(filterLower);
    });
  }, [ai.isActive, shippingStatusFilter, sourceVehicles]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, shippingStatusFilter]);

  const totalPages = ai.isActive ? Math.max(1, ai.result?.totalPages || 1) : Math.max(1, Math.ceil(displayedVehicles.length / pageSize));
  const pagedVehicles = ai.isActive ? displayedVehicles : displayedVehicles.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const counts = data?.countsByStatus || {
    all: 0,
    underNegotiation: 0,
    underNegotiationWithPI: 0,
    confirmed: 0,
    inTransit: 0,
    delivered: 0,
  };

  const reservedCount = counts.underNegotiation;
  const withPICount = counts.underNegotiationWithPI;
  const invoicedCount = counts.confirmed + counts.inTransit + counts.delivered;
  const reservedStatus = data?.statusDefinitions?.find((definition) => definition.code === 'Reserved');
  const advancedPaidStatus = data?.statusDefinitions?.find((definition) => definition.code === 'ReservedWithPI');
  const purchasedStatus = data?.statusDefinitions?.find((definition) => definition.code === 'Invoiced');
  const reservedVehiclesLabel = reservedStatus?.pluralLabel || '';
  const advancedPaidVehiclesLabel = advancedPaidStatus?.pluralLabel || '';
  const purchasedVehiclesLabel = purchasedStatus?.pluralLabel || '';

  return (
    <div className="cc-cust-fleet" data-testid="customer-fleet-page">
      {/* Top 3 KPI Summary Cards */}
      <section className="cc-cust-kpi-grid" aria-label="Fleet Overview Summary" data-testid="fleet-kpi-summary">
        {/* KPI 1: Reserved Vehicles */}
        <div
          role="button"
          tabIndex={0}
          data-testid="kpi-reserved"
          className={`cc-cust-kpi-card cc-cust-kpi-card--reserved ${activeTab === 'reserved' || activeTab === 'underNegotiation' ? 'cc-cust-kpi-card--active-amber' : ''}`}
          onClick={() => { ai.clear(); setActiveTab('reserved'); }}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ai.clear(); setActiveTab('reserved'); } }}
        >
          <div className="cc-cust-kpi-card__content">
            <div className="cc-cust-kpi-card__header-row">
              <span className="cc-cust-kpi-card__title">{reservedVehiclesLabel.toUpperCase()}</span>
            </div>
            <div className="cc-cust-kpi-card__count">{reservedCount} Units</div>
            <p className="cc-cust-kpi-card__subtitle">Active vehicle reservations</p>
          </div>
          <div className="cc-cust-kpi-card__icon-wrap cc-cust-kpi-card__icon-wrap--amber">
            <span className="cc-cust-kpi-card__icon" aria-hidden="true">⏱</span>
          </div>
        </div>

        {/* KPI 2: Advanced Paid Vehicles */}
        <div
          role="button"
          tabIndex={0}
          data-testid="kpi-with-pi"
          className={`cc-cust-kpi-card cc-cust-kpi-card--with-pi ${activeTab === 'withPI' || activeTab === 'underNegotiationWithPI' ? 'cc-cust-kpi-card--active-purple' : ''}`}
          onClick={() => { ai.clear(); setActiveTab('withPI'); }}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ai.clear(); setActiveTab('withPI'); } }}
        >
          <div className="cc-cust-kpi-card__content">
            <div className="cc-cust-kpi-card__header-row">
              <span className="cc-cust-kpi-card__title">{advancedPaidVehiclesLabel.toUpperCase()}</span>
            </div>
            <div className="cc-cust-kpi-card__count">{withPICount} Units</div>
            <p className="cc-cust-kpi-card__subtitle">Advance payment confirmed</p>
          </div>
          <div className="cc-cust-kpi-card__icon-wrap cc-cust-kpi-card__icon-wrap--purple">
            <span className="cc-cust-kpi-card__icon" aria-hidden="true">📄</span>
          </div>
        </div>

        {/* KPI 3: Purchased Vehicles */}
        <div
          role="button"
          tabIndex={0}
          data-testid="kpi-invoiced"
          className={`cc-cust-kpi-card cc-cust-kpi-card--invoiced ${activeTab === 'invoiced' || activeTab === 'confirmed' || activeTab === 'inTransit' || activeTab === 'delivered' ? 'cc-cust-kpi-card--active-green' : ''}`}
          onClick={() => { ai.clear(); setActiveTab('invoiced'); }}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ai.clear(); setActiveTab('invoiced'); } }}
        >
          <div className="cc-cust-kpi-card__content">
            <div className="cc-cust-kpi-card__header-row">
              <span className="cc-cust-kpi-card__title">{purchasedVehiclesLabel.toUpperCase()}</span>
            </div>
            <div className="cc-cust-kpi-card__count">{invoicedCount} Units</div>
            <p className="cc-cust-kpi-card__subtitle">Fully purchased &amp; invoiced fleet</p>
          </div>
          <div className="cc-cust-kpi-card__icon-wrap cc-cust-kpi-card__icon-wrap--green">
            <span className="cc-cust-kpi-card__icon" aria-hidden="true">✓</span>
          </div>
        </div>
      </section>

      <AiVehicleSearch
        id="customer-fleet-ai-search"
        value={ai.prompt}
        onChange={ai.setPrompt}
        onSubmit={() => { void ai.search({ page: 1 }); setCurrentPage(1); }}
        onClear={ai.clear}
        isLoading={ai.isLoading}
        isActive={ai.isActive}
        unavailable={ai.unavailable}
        error={ai.error}
        summary={ai.result?.interpretation.summary}
        appliedConstraints={ai.result?.interpretation.appliedConstraints}
        copy={{
          label: t('aiSearch.label', undefined, 'AI Search'),
          placeholder: t('aiSearch.fleetPlaceholder', undefined, 'Ask AI to search your vehicles by status, model, payment, or logistics stage'),
          submit: t('aiSearch.submit', undefined, 'Search with AI'),
          submitting: t('aiSearch.submitting', undefined, 'Searching…'),
          clear: t('aiSearch.clear', undefined, 'Clear AI search'),
          unavailable: t('aiSearch.unavailable', undefined, 'AI search is not yet available in this environment. Try the regular vehicle search and filters.'),
          resultsLabel: t('aiSearch.results', undefined, 'AI search results'),
        }}
      />

      {/* Filter Bar: Search & Shipping Status dropdown */}
      <div className="cc-cust-fleet-filter-bar" data-testid="fleet-tabs">
        {/* Search & Shipping Status Dropdown */}
        <div className="cc-cust-fleet-search-group">
          <div className="cc-search-input-wrapper cc-cust-fleet-search-input-wrap">
            <span className="cc-search-input-icon" aria-hidden="true">⌕</span>
            <input
              id="fleet-search-input"
              type="search"
              data-testid="fleet-search-input"
              className="cc-search-input"
              placeholder="Search make, model, chassis"
              value={searchQuery}
              onChange={(e) => { ai.clear(); setSearchQuery(e.target.value); }}
            />
            {searchQuery && (
              <button
                type="button"
                data-testid="fleet-search-clear"
                className="cc-cust-fleet-search-clear"
                onClick={() => { ai.clear(); setSearchQuery(''); }}
                aria-label="Clear search query"
              >
                ✕
              </button>
            )}
          </div>

          <div className="cc-cust-fleet-select-wrap">
            <select
              id="fleet-shipping-status-select"
              data-testid="fleet-shipping-status-select"
              className="cc-filter-select"
              value={shippingStatusFilter}
              onChange={(e) => { ai.clear(); setShippingStatusFilter(e.target.value); }}
              aria-label="Shipping Status"
            >
              <option value="all">Shipping Status</option>
              <option value="Reserved">Reserved</option>
              <option value="Inspection">Inspection</option>
              <option value="Ready">Ready</option>
              <option value="In Transit">In Transit</option>
              <option value="Delivered">Delivered</option>
            </select>
          </div>
          <ViewModeToggle value={viewMode} onChange={setViewMode} label={t('customer.myVehicles', undefined, 'My vehicles view')} />
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="cc-cust-fleet-loading" role="status" aria-live="polite">
          <p>Loading your vehicles...</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="cc-cust-fleet-error" role="alert">
          <p>Failed to load customer vehicles. Please try again.</p>
          <button
            type="button"
            className="cc-cust-fleet-btn cc-cust-fleet-btn--secondary"
            onClick={() => refetch()}
          >
            Retry
          </button>
        </div>
      )}

      {/* Vehicle Grid or Empty state */}
      {!isLoading && !error && displayedVehicles.length === 0 && (
        <div className="cc-cust-fleet-empty">
          <div className="cc-cust-fleet-empty__icon" aria-hidden="true">🚗</div>
          <h3 className="cc-cust-fleet-empty__title">No vehicles found</h3>
          <p className="cc-cust-fleet-empty__text">
            {searchQuery || shippingStatusFilter !== 'all'
              ? 'No vehicles match your active search or filter criteria.'
              : 'You do not have any vehicles under transaction in this category.'}
          </p>
          {(searchQuery || shippingStatusFilter !== 'all') && (
            <button
              type="button"
              className="cc-cust-fleet-btn cc-cust-fleet-btn--secondary"
              onClick={() => {
                setSearchQuery('');
                setShippingStatusFilter('all');
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      )}

      {/* Vehicle 5-column Grid */}
      {!isLoading && !error && displayedVehicles.length > 0 && (
        <div className={`cc-cust-fleet-grid cc-cust-fleet-grid--${viewMode}`} data-testid="fleet-vehicles-grid">
          {pagedVehicles.map((v) => (
            <VehicleFleetCard
              key={v.id}
              vehicle={v}
              onSelect={onSelectVehicle}
              onTrackShipment={(vehicle) => setSelectedTrackingVehicle(vehicle)}
              onPayDeposit={() => setActiveRoute('/payments')}
            />
          ))}
        </div>
      )}

      {!isLoading && !error && displayedVehicles.length > 0 && (
        <nav className="cc-cust-fleet-pagination" aria-label="My vehicle pages">
          <button
            type="button"
            className="cc-cust-fleet-pagination__button"
            onClick={() => {
              const page = Math.max(1, currentPage - 1);
              setCurrentPage(page);
              if (ai.isActive) void ai.search({ page });
            }}
            disabled={currentPage === 1}
          >
            {t('customer.previous', undefined, 'Previous')}
          </button>
          <span className="cc-cust-fleet-pagination__status" aria-live="polite">
            {t('customer.pageOf', { page: currentPage, total: totalPages }, `Page ${currentPage} of ${totalPages}`)} · {t('customer.vehiclesCount', { count: ai.isActive ? ai.result?.total || 0 : displayedVehicles.length }, `${ai.isActive ? ai.result?.total || 0 : displayedVehicles.length} vehicles`)}
          </span>
          <button
            type="button"
            className="cc-cust-fleet-pagination__button"
            onClick={() => {
              const page = Math.min(totalPages, currentPage + 1);
              setCurrentPage(page);
              if (ai.isActive) void ai.search({ page });
            }}
            disabled={currentPage === totalPages}
          >
            {t('customer.next', undefined, 'Next')}
          </button>
        </nav>
      )}

      {/* Vehicle Logistics & Shipment Timeline Tracking Modal */}
      <VehicleTrackingModal
        isOpen={Boolean(selectedTrackingVehicle)}
        vehicle={selectedTrackingVehicle}
        onClose={() => setSelectedTrackingVehicle(null)}
      />
    </div>
  );
};
