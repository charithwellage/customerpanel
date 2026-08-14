import React, { useState, useMemo, useEffect } from 'react';
import type { CustomerInvoiceSummary, CustomerInvoiceType } from '@carchief/domain';
import { useCustomerShell } from '../shell/index.js';
import { useCustomerInvoices } from './useCustomerInvoices.js';
import { InvoiceSummaryKpiCards } from './components/InvoiceSummaryKpiCards.js';
import { InvoiceCard } from './components/InvoiceCard.js';

export interface CustomerInvoicesPageProps {
  onSelectInvoice: (invoice: CustomerInvoiceSummary) => void;
}

type TabType = 'all' | 'proforma' | 'commercial';

export const CustomerInvoicesPage: React.FC<CustomerInvoicesPageProps> = ({ onSelectInvoice }) => {
  const { setActiveRoute } = useCustomerShell();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    setActiveRoute('/invoices');
  }, [setActiveRoute]);

  const queryParams = useMemo(() => {
    let typeParam: CustomerInvoiceType | undefined;
    if (activeTab === 'proforma') typeParam = 'Proforma';
    else if (activeTab === 'commercial') typeParam = 'Commercial';

    return {
      type: typeParam,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      query: searchQuery.trim() || undefined,
    };
  }, [activeTab, statusFilter, searchQuery]);

  const { data, isLoading, error, refetch } = useCustomerInvoices(queryParams);

  const counts = data?.countsByType || {
    all: 0,
    proforma: 0,
    commercial: 0,
  };

  const totals = data?.totals || {
    totalInvoicedUsd: 0,
    totalPaidUsd: 0,
    totalOutstandingUsd: 0,
  };

  const items = data?.items || [];

  return (
    <div className="cc-cust-invoices-page" data-testid="customer-invoices-page">
      <header className="cc-cust-invoices-header">
        <h1 className="cc-cust-invoices-title">Invoices & Customer Ledger</h1>
        <p className="cc-cust-invoices-subtitle">
          Review your proforma invoices, commercial invoices, wire transfer allocations, and outstanding ledger balances
        </p>
      </header>

      {/* KPI Cards */}
      <InvoiceSummaryKpiCards
        totalInvoicedUsd={totals.totalInvoicedUsd}
        totalPaidUsd={totals.totalPaidUsd}
        totalOutstandingUsd={totals.totalOutstandingUsd}
      />

      {/* Tabs */}
      <div className="cc-cust-invoices-tabs" role="tablist" aria-label="Invoice Type Tabs" data-testid="invoice-type-tabs">
        <button
          type="button"
          role="tab"
          data-testid="tab-all-invoices"
          aria-selected={activeTab === 'all'}
          className={`cc-cust-invoices-tab ${activeTab === 'all' ? 'cc-cust-invoices-tab--active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Invoices <span className="cc-cust-invoices-tab__count">{counts.all}</span>
        </button>

        <button
          type="button"
          role="tab"
          data-testid="tab-proforma-invoices"
          aria-selected={activeTab === 'proforma'}
          className={`cc-cust-invoices-tab ${activeTab === 'proforma' ? 'cc-cust-invoices-tab--active' : ''}`}
          onClick={() => setActiveTab('proforma')}
        >
          Proforma Invoices (PI) <span className="cc-cust-invoices-tab__count">{counts.proforma}</span>
        </button>

        <button
          type="button"
          role="tab"
          data-testid="tab-commercial-invoices"
          aria-selected={activeTab === 'commercial'}
          className={`cc-cust-invoices-tab ${activeTab === 'commercial' ? 'cc-cust-invoices-tab--active' : ''}`}
          onClick={() => setActiveTab('commercial')}
        >
          Commercial Invoices <span className="cc-cust-invoices-tab__count">{counts.commercial}</span>
        </button>
      </div>

      {/* Search & Filter Controls */}
      <div className="cc-cust-invoices-controls" data-testid="invoice-controls">
        <div className="cc-cust-invoices-search">
          <label htmlFor="invoice-search-input" className="cc-cust-invoices-label">Search Invoices</label>
          <div className="cc-cust-invoices-search-input-wrap">
            <span className="cc-cust-invoices-search-icon" aria-hidden="true">🔍</span>
            <input
              id="invoice-search-input"
              type="search"
              data-testid="invoice-search-input"
              className="cc-cust-invoices-input"
              placeholder="Search by invoice number, vehicle make, model, chassis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="cc-cust-invoices-search-clear"
                data-testid="clear-search-btn"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="cc-cust-invoices-filter">
          <label htmlFor="invoice-status-select" className="cc-cust-invoices-label">Status</label>
          <select
            id="invoice-status-select"
            data-testid="invoice-status-filter"
            className="cc-cust-invoices-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="Issued">Issued</option>
            <option value="PartiallyPaid">Partially Paid</option>
            <option value="Paid">Fully Paid</option>
            <option value="Expired">Expired</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Content Area */}
      <div className="cc-cust-invoices-content" data-testid="invoice-content-area">
        {isLoading && (
          <div className="cc-cust-invoices-loading" data-testid="invoices-loading">
            <div className="cc-invoice-spinner" />
            <p>Loading your invoices & ledger details...</p>
          </div>
        )}

        {error && (
          <div className="cc-cust-invoices-error" data-testid="invoices-error" role="alert">
            <span className="cc-cust-invoices-error-icon" aria-hidden="true">⚠️</span>
            <div className="cc-cust-invoices-error-text">
              <h3>Unable to load invoices</h3>
              <p>{error.message || 'An unexpected error occurred while fetching customer invoices.'}</p>
            </div>
            <button
              type="button"
              className="cc-cust-invoices-retry-btn"
              data-testid="retry-invoices-btn"
              onClick={() => refetch()}
            >
              Retry
            </button>
          </div>
        )}

        {!isLoading && !error && items.length === 0 && (
          <div className="cc-cust-invoices-empty" data-testid="invoices-empty">
            <span className="cc-cust-invoices-empty-icon" aria-hidden="true">📂</span>
            <h3>No invoices found</h3>
            <p>
              {searchQuery || statusFilter !== 'all' || activeTab !== 'all'
                ? 'Try adjusting your search criteria or filters to see more results.'
                : 'You have no invoices issued yet. Browse inventory to reserve your next vehicle.'}
            </p>
            {(searchQuery || statusFilter !== 'all' || activeTab !== 'all') && (
              <button
                type="button"
                className="cc-cust-invoices-reset-filters-btn"
                data-testid="reset-invoice-filters-btn"
                onClick={() => {
                  setActiveTab('all');
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
              >
                Reset All Filters
              </button>
            )}
          </div>
        )}

        {!isLoading && !error && items.length > 0 && (
          <div className="cc-cust-invoices-grid" data-testid="invoices-grid">
            {items.map((invoice) => (
              <InvoiceCard
                key={invoice.id}
                invoice={invoice}
                onSelect={onSelectInvoice}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
