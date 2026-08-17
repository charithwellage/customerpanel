import React, { useState, useMemo } from 'react';
import type { CustomerVehicleSummary } from '@carchief/domain';
import { useCustomerShell } from '../shell/index.js';
import { useCustomerVehicles } from './useCustomerVehicles.js';
import { VehicleFleetCard } from './components/VehicleFleetCard.js';

export interface CustomerFleetPageProps {
  onSelectVehicle: (vehicle: CustomerVehicleSummary) => void;
}

export type FleetTabKey = 'reserved' | 'withPI' | 'invoiced' | 'all' | 'underNegotiation' | 'underNegotiationWithPI' | 'confirmed' | 'inTransit' | 'delivered';

export const CustomerFleetPage: React.FC<CustomerFleetPageProps> = ({ onSelectVehicle }) => {
  const { setActiveRoute } = useCustomerShell();
  const [activeTab, setActiveTab] = useState<FleetTabKey>('withPI');
  const [searchQuery, setSearchQuery] = useState('');
  const [shippingStatusFilter, setShippingStatusFilter] = useState('all');

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

  const displayedVehicles = useMemo(() => {
    if (!data?.items) return [];
    if (shippingStatusFilter === 'all') return data.items;
    return data.items.filter((v) => {
      const stage = (v.shippingStage || v.logisticsStatus || v.locationStatus || '').toLowerCase();
      const filterLower = shippingStatusFilter.toLowerCase();
      return stage.includes(filterLower);
    });
  }, [data?.items, shippingStatusFilter]);

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

  return (
    <div className="cc-cust-fleet" data-testid="customer-fleet-page">
      {/* Top 3 KPI Summary Cards */}
      <section className="cc-cust-kpi-grid" aria-label="Fleet Overview Summary" data-testid="fleet-kpi-summary">
        {/* KPI 1: Reserved */}
        <div
          role="button"
          tabIndex={0}
          data-testid="kpi-reserved"
          className={`cc-cust-kpi-card cc-cust-kpi-card--reserved ${activeTab === 'reserved' || activeTab === 'underNegotiation' ? 'cc-cust-kpi-card--active-amber' : ''}`}
          onClick={() => setActiveTab('reserved')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveTab('reserved'); } }}
        >
          <div className="cc-cust-kpi-card__content">
            <div className="cc-cust-kpi-card__header-row">
              <span className="cc-cust-kpi-card__title">RESERVED VEHICLES</span>
            </div>
            <div className="cc-cust-kpi-card__count">{reservedCount} Units</div>
            <p className="cc-cust-kpi-card__subtitle">Reserved active inventory</p>
          </div>
          <div className="cc-cust-kpi-card__icon-wrap cc-cust-kpi-card__icon-wrap--amber">
            <span className="cc-cust-kpi-card__icon" aria-hidden="true">⏱</span>
          </div>
        </div>

        {/* KPI 2: Reserved With PI */}
        <div
          role="button"
          tabIndex={0}
          data-testid="kpi-with-pi"
          className={`cc-cust-kpi-card cc-cust-kpi-card--with-pi ${activeTab === 'withPI' || activeTab === 'underNegotiationWithPI' ? 'cc-cust-kpi-card--active-purple' : ''}`}
          onClick={() => setActiveTab('withPI')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveTab('withPI'); } }}
        >
          <div className="cc-cust-kpi-card__content">
            <div className="cc-cust-kpi-card__header-row">
              <span className="cc-cust-kpi-card__title">RESERVED WITH PI</span>
            </div>
            <div className="cc-cust-kpi-card__count">{withPICount} Units</div>
            <p className="cc-cust-kpi-card__subtitle">Proforma Invoice issued</p>
          </div>
          <div className="cc-cust-kpi-card__icon-wrap cc-cust-kpi-card__icon-wrap--purple">
            <span className="cc-cust-kpi-card__icon" aria-hidden="true">📄</span>
          </div>
        </div>

        {/* KPI 3: Invoiced Vehicles */}
        <div
          role="button"
          tabIndex={0}
          data-testid="kpi-invoiced"
          className={`cc-cust-kpi-card cc-cust-kpi-card--invoiced ${activeTab === 'invoiced' || activeTab === 'confirmed' || activeTab === 'inTransit' || activeTab === 'delivered' ? 'cc-cust-kpi-card--active-green' : ''}`}
          onClick={() => setActiveTab('invoiced')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveTab('invoiced'); } }}
        >
          <div className="cc-cust-kpi-card__content">
            <div className="cc-cust-kpi-card__header-row">
              <span className="cc-cust-kpi-card__title">INVOICED VEHICLE</span>
            </div>
            <div className="cc-cust-kpi-card__count">{invoicedCount} Units</div>
            <p className="cc-cust-kpi-card__subtitle">Fully billed &amp; invoiced fleet</p>
          </div>
          <div className="cc-cust-kpi-card__icon-wrap cc-cust-kpi-card__icon-wrap--green">
            <span className="cc-cust-kpi-card__icon" aria-hidden="true">✓</span>
          </div>
        </div>
      </section>

      {/* Filter Bar: Status Pills on left, Search & Shipping Status dropdown on right */}
      <div className="cc-cust-fleet-filter-bar" data-testid="fleet-tabs">
        {/* Status filter pills */}
        <div className="cc-cust-fleet-pills" role="tablist" aria-label="Vehicle Status Filter">
          <button
            type="button"
            role="tab"
            data-testid="tab-reserved"
            aria-selected={activeTab === 'reserved' || activeTab === 'underNegotiation'}
            className={`cc-cust-fleet-pill cc-cust-fleet-pill--amber ${activeTab === 'reserved' || activeTab === 'underNegotiation' ? 'cc-cust-fleet-pill--active' : ''}`}
            onClick={() => setActiveTab('reserved')}
          >
            <span className="cc-cust-fleet-pill__icon" aria-hidden="true">⏱</span> RESERVED ({reservedCount})
          </button>

          <button
            type="button"
            role="tab"
            data-testid="tab-with-pi"
            aria-selected={activeTab === 'withPI' || activeTab === 'underNegotiationWithPI'}
            className={`cc-cust-fleet-pill cc-cust-fleet-pill--purple ${activeTab === 'withPI' || activeTab === 'underNegotiationWithPI' ? 'cc-cust-fleet-pill--active' : ''}`}
            onClick={() => setActiveTab('withPI')}
          >
            <span className="cc-cust-fleet-pill__icon" aria-hidden="true">📄</span> WITH PI ({withPICount})
          </button>

          <button
            type="button"
            role="tab"
            data-testid="tab-invoiced"
            aria-selected={activeTab === 'invoiced' || activeTab === 'confirmed' || activeTab === 'inTransit' || activeTab === 'delivered'}
            className={`cc-cust-fleet-pill cc-cust-fleet-pill--green ${activeTab === 'invoiced' || activeTab === 'confirmed' || activeTab === 'inTransit' || activeTab === 'delivered' ? 'cc-cust-fleet-pill--active' : ''}`}
            onClick={() => setActiveTab('invoiced')}
          >
            <span className="cc-cust-fleet-pill__icon" aria-hidden="true">✓</span> INVOICED ({invoicedCount})
          </button>

          {activeTab === 'all' && (
            <button
              type="button"
              role="tab"
              data-testid="tab-all"
              aria-selected={activeTab === 'all'}
              className="cc-cust-fleet-pill cc-cust-fleet-pill--active"
              onClick={() => setActiveTab('all')}
            >
              ALL ({counts.all})
            </button>
          )}
        </div>

        {/* Search & Shipping Status Dropdown */}
        <div className="cc-cust-fleet-search-group">
          <div className="cc-cust-fleet-search-input-wrap">
            <span className="cc-cust-fleet-search-icon" aria-hidden="true">🔍</span>
            <input
              id="fleet-search-input"
              type="search"
              data-testid="fleet-search-input"
              className="cc-cust-fleet-search-input"
              placeholder="Search make, model, chassis"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                data-testid="fleet-search-clear"
                className="cc-cust-fleet-search-clear"
                onClick={() => setSearchQuery('')}
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
              className="cc-cust-fleet-select"
              value={shippingStatusFilter}
              onChange={(e) => setShippingStatusFilter(e.target.value)}
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
        <div className="cc-cust-fleet-grid" data-testid="fleet-vehicles-grid">
          {displayedVehicles.map((v) => (
            <VehicleFleetCard key={v.id} vehicle={v} onSelect={onSelectVehicle} />
          ))}
        </div>
      )}
    </div>
  );
};
