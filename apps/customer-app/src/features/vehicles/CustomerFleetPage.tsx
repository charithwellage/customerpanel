import React, { useState, useMemo } from 'react';
import type { CustomerVehicleSummary } from '@carchief/domain';
import { useCustomerShell } from '../shell/index.js';
import { useCustomerVehicles } from './useCustomerVehicles.js';
import { VehicleFleetCard } from './components/VehicleFleetCard.js';

export interface CustomerFleetPageProps {
  onSelectVehicle: (vehicle: CustomerVehicleSummary) => void;
}

type TabKey = 'all' | 'underNegotiation' | 'underNegotiationWithPI' | 'confirmed' | 'inTransit' | 'delivered';

export const CustomerFleetPage: React.FC<CustomerFleetPageProps> = ({ onSelectVehicle }) => {
  const { setActiveRoute } = useCustomerShell();
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');

  React.useEffect(() => {
    setActiveRoute('/vehicles');
  }, [setActiveRoute]);

  const queryParams = useMemo(() => {
    let statusParam: string | undefined;
    if (activeTab === 'underNegotiation') statusParam = 'Under Negotiation';
    else if (activeTab === 'underNegotiationWithPI') statusParam = 'Under Negotiation With PI';
    else if (activeTab === 'confirmed') statusParam = 'Confirmed';
    else if (activeTab === 'inTransit') statusParam = 'In Transit';
    else if (activeTab === 'delivered') statusParam = 'Delivered';

    return {
      status: statusParam,
      query: searchQuery.trim() || undefined,
    };
  }, [activeTab, searchQuery]);

  const { data, isLoading, error, refetch } = useCustomerVehicles(queryParams);

  const displayedVehicles = useMemo(() => {
    if (!data?.items) return [];
    if (locationFilter === 'all') return data.items;
    return data.items.filter((v) => v.locationStatus === locationFilter);
  }, [data?.items, locationFilter]);

  const counts = data?.countsByStatus || {
    all: 0,
    underNegotiation: 0,
    underNegotiationWithPI: 0,
    confirmed: 0,
    inTransit: 0,
    delivered: 0,
  };

  return (
    <div className="cc-cust-fleet" data-testid="customer-fleet-page">
      <header className="cc-cust-fleet__header">
        <h1 className="cc-cust-fleet__title">My Vehicles</h1>
        <p className="cc-cust-fleet__subtitle">
          Track your vehicle reservations, proforma invoices, shipments, and export documentation
        </p>
      </header>

      {/* Tabs / Status Groupings */}
      <div className="cc-cust-fleet-tabs" role="tablist" aria-label="Vehicle Status Filter" data-testid="fleet-tabs">
        <button
          type="button"
          role="tab"
          data-testid="tab-all"
          aria-selected={activeTab === 'all'}
          className={`cc-cust-fleet-tab ${activeTab === 'all' ? 'cc-cust-fleet-tab--active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Vehicles <span className="cc-cust-fleet-tab__count">{counts.all}</span>
        </button>

        <button
          type="button"
          role="tab"
          data-testid="tab-under-negotiation"
          aria-selected={activeTab === 'underNegotiation'}
          className={`cc-cust-fleet-tab ${activeTab === 'underNegotiation' ? 'cc-cust-fleet-tab--active' : ''}`}
          onClick={() => setActiveTab('underNegotiation')}
        >
          Under Negotiation <span className="cc-cust-fleet-tab__count">{counts.underNegotiation}</span>
        </button>

        <button
          type="button"
          role="tab"
          data-testid="tab-pi-issued"
          aria-selected={activeTab === 'underNegotiationWithPI'}
          className={`cc-cust-fleet-tab ${activeTab === 'underNegotiationWithPI' ? 'cc-cust-fleet-tab--active' : ''}`}
          onClick={() => setActiveTab('underNegotiationWithPI')}
        >
          PI Issued <span className="cc-cust-fleet-tab__count">{counts.underNegotiationWithPI}</span>
        </button>

        <button
          type="button"
          role="tab"
          data-testid="tab-confirmed"
          aria-selected={activeTab === 'confirmed'}
          className={`cc-cust-fleet-tab ${activeTab === 'confirmed' ? 'cc-cust-fleet-tab--active' : ''}`}
          onClick={() => setActiveTab('confirmed')}
        >
          In Stock / Confirmed <span className="cc-cust-fleet-tab__count">{counts.confirmed}</span>
        </button>

        <button
          type="button"
          role="tab"
          data-testid="tab-in-transit"
          aria-selected={activeTab === 'inTransit'}
          className={`cc-cust-fleet-tab ${activeTab === 'inTransit' ? 'cc-cust-fleet-tab--active' : ''}`}
          onClick={() => setActiveTab('inTransit')}
        >
          In Transit <span className="cc-cust-fleet-tab__count">{counts.inTransit}</span>
        </button>

        <button
          type="button"
          role="tab"
          data-testid="tab-delivered"
          aria-selected={activeTab === 'delivered'}
          className={`cc-cust-fleet-tab ${activeTab === 'delivered' ? 'cc-cust-fleet-tab--active' : ''}`}
          onClick={() => setActiveTab('delivered')}
        >
          Delivered <span className="cc-cust-fleet-tab__count">{counts.delivered}</span>
        </button>
      </div>

      {/* Filter and Search Controls */}
      <div className="cc-cust-fleet-controls">
        <div className="cc-cust-fleet-search">
          <label htmlFor="fleet-search-input" className="cc-cust-fleet-search__label">
            Search fleet
          </label>
          <div className="cc-cust-fleet-search__wrap">
            <span className="cc-cust-fleet-search__icon" aria-hidden="true">🔍</span>
            <input
              id="fleet-search-input"
              type="search"
              data-testid="fleet-search-input"
              className="cc-cust-fleet-search__input"
              placeholder="Search by make, model, chassis or year..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                data-testid="fleet-search-clear"
                className="cc-cust-fleet-search__clear"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search query"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="cc-cust-fleet-filter">
          <label htmlFor="fleet-location-select" className="cc-cust-fleet-filter__label">
            Shipping Stage
          </label>
          <select
            id="fleet-location-select"
            data-testid="fleet-location-select"
            className="cc-cust-fleet-filter__select"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
          >
            <option value="all">All Locations</option>
            <option value="In Japan">In Japan</option>
            <option value="In Transit">In Transit</option>
            <option value="In Port">In Port</option>
          </select>
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
            {searchQuery || locationFilter !== 'all' || activeTab !== 'all'
              ? 'No vehicles match your active search or filter criteria.'
              : 'You do not have any vehicles under transaction at this time.'}
          </p>
          {(searchQuery || locationFilter !== 'all' || activeTab !== 'all') && (
            <button
              type="button"
              className="cc-cust-fleet-btn cc-cust-fleet-btn--secondary"
              onClick={() => {
                setActiveTab('all');
                setSearchQuery('');
                setLocationFilter('all');
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      )}

      {!isLoading && !error && displayedVehicles.length > 0 && (
        <div className="cc-cust-fleet-grid">
          {displayedVehicles.map((v) => (
            <VehicleFleetCard key={v.id} vehicle={v} onSelect={onSelectVehicle} />
          ))}
        </div>
      )}
    </div>
  );
};
