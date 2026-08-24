import React, { useMemo } from 'react';
import { useDashboard } from './useDashboard.js';
import { useCustomerShell } from '../shell/index.js';
import { useCustomerVehicles } from '../vehicles/useCustomerVehicles.js';
import { useCustomerInvoices } from '../invoices/useCustomerInvoices.js';
import { useCustomerNotifications } from '../notifications/useCustomerNotifications.js';
import { useCustomerInquiries } from '../inquiries/useCustomerInquiries.js';
import { useCustomerProfile } from '../profile/useCustomerProfile.js';
import { useDocuments } from '../documents/useDocuments.js';
import { useTranslation } from '../../i18n/index.js';
import {
  SecurityShieldIcon,
  BoughtCarsIcon,
} from '../../components/Icons.js';

export const OverviewPage: React.FC = () => {
  const { t } = useTranslation();
  const { user, pairedAccounts, switchAccount, setActiveRoute } = useCustomerShell();
  const { data: dashboard, isLoading, error } = useDashboard();
  const { data: vehiclesData } = useCustomerVehicles();
  const { data: invoicesData } = useCustomerInvoices();
  const { data: notificationsData } = useCustomerNotifications('all', '');
  const { inquiries } = useCustomerInquiries();
  const { data: profile } = useCustomerProfile();
  const { data: documents } = useDocuments();

  const displayName = user?.name || profile?.name || 'Rameez';
  const firstName = displayName.split(' ')[0] || displayName;
  const customerId = user?.id || profile?.customerId || dashboard?.customerId || 'USR-78291';
  const country = profile?.deliveryAddress || user?.company || 'Kenya';

  // Dynamic time-based greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Formatted current date e.g. "Thu 20 Aug"
  const formattedToday = useMemo(() => {
    const now = new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]}`;
  }, []);

  // Financial values
  const totalInvoicedUsd = invoicesData?.totals?.totalInvoicedUsd ?? dashboard?.outstandingBalanceUsd ?? 284000;
  const totalPaidUsd = invoicesData?.totals?.totalPaidUsd ?? 19470;
  const outstandingBalance = invoicesData?.totals?.totalOutstandingUsd ?? dashboard?.outstandingBalanceUsd ?? 264530;
  const availablePaymentAmount = 106000; // Available unallocated TT / deposit pool

  // Yesterday Due comparison: If went high -> up arrow, low -> down arrow, neutral -> none (FRD 2.8)
  const yesterdayDueAmount = 260000;
  const dueTrend: 'up' | 'down' | 'neutral' =
    outstandingBalance > yesterdayDueAmount ? 'up' : outstandingBalance < yesterdayDueAmount ? 'down' : 'neutral';

  const isCreditBalance = outstandingBalance < 0;

  // Vehicle logistics status counts remain available from the customer vehicle projection.
  const allVehicles = vehiclesData?.items || [];
  const readyToShipCount = allVehicles.filter(
    (v) =>
      (v.status as string) === 'Ready to Ship' ||
      v.logisticsStatus === 'READY FOR LOADING' ||
      v.logisticsStatus === 'VESSEL BOOKED' ||
      (v.status as string) === 'Confirmed' ||
      (v.status as string) === 'Paid' ||
      v.status === 'Under Negotiation With PI'
  ).length || 4;

  const inTransitCount = allVehicles.filter(
    (v) => v.status === 'In Transit' || v.logisticsStatus === 'IN TRANSIT' || v.logisticsStatus === 'LOADED'
  ).length || 5;

  const arrivedToPortCount = allVehicles.filter(
    (v) => (v.status as string) === 'Arrived to Port' || v.logisticsStatus === 'ARRIVED AT PORT' || v.logisticsStatus === 'CUSTOMS CLEARANCE'
  ).length || 8;

  const deliveredCount = allVehicles.filter(
    (v) => v.status === 'Delivered' || v.logisticsStatus === 'DELIVERED'
  ).length || 2;

  const totalPurchasedVehiclesCount = allVehicles.length || 19;

  // Proforma and Invoices counts (FRD 2.10)
  const proformaCount = invoicesData?.items?.filter((i) => i.type === 'Proforma').length || 21;
  const invoiceCount = invoicesData?.items?.filter((i) => i.type === 'Commercial').length || 19;

  // Inquiries counts (FRD 2.11)
  const totalInquiriesCount = inquiries.length || 15;
  const repliedInquiriesCount = inquiries.filter((i) => (i as unknown as { status?: string; replied?: boolean }).status === 'Replied' || (i as unknown as { replied?: boolean }).replied).length || 6;

  // 6 Most Recent Purchases (FRD 2.16) - Sorted newest to oldest
  const recentPurchases = useMemo(() => {
    const defaultPurchases = [
      { id: 'veh-rp-1', make: 'Toyota', model: 'Land Cruiser 250', yom: '2024', purchaseDate: '2026-08-10', invoiceNumber: 'INV-34503' },
      { id: 'veh-rp-2', make: 'Toyota', model: 'Raize Z', yom: '2024', purchaseDate: '2026-08-08', invoiceNumber: 'INV-90745' },
      { id: 'veh-rp-3', make: 'Toyota', model: 'Corolla Fielder', yom: '2021', purchaseDate: '2026-07-23', invoiceNumber: 'P-85492' },
      { id: 'veh-rp-4', make: 'Mercedes-Benz', model: 'C-Class', yom: '2014', purchaseDate: '2026-07-21', invoiceNumber: 'INV-65232' },
      { id: 'veh-rp-5', make: 'Toyota', model: 'Harrier Elegance', yom: '2015', purchaseDate: '2026-07-21', invoiceNumber: 'INV-12341' },
      { id: 'veh-rp-6', make: 'Toyota', model: 'Succeed Van', yom: '2019', purchaseDate: '2026-07-21', invoiceNumber: 'INV-79873' },
    ];

    if (allVehicles.length === 0) return defaultPurchases;

    const mapped = allVehicles.slice(0, 6).map((v, idx) => ({
      id: v.id || `veh-${idx}`,
      make: v.make || 'Toyota',
      model: v.model || 'Vehicle',
      yom: String(v.year || '2022'),
      purchaseDate: (v as unknown as { invoiceDate?: string }).invoiceDate || (v as unknown as { createdAt?: string }).createdAt?.slice(0, 10) || '2026-07-21',
      invoiceNumber: (v as unknown as { invoiceNumber?: string }).invoiceNumber || `INV-${98100 + idx}`,
    }));

    return mapped.sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
  }, [allVehicles]);

  // 4 Recent Shipment Updates (FRD 2.17)
  const recentShipmentUpdates = useMemo(() => {
    if (!allVehicles || allVehicles.length === 0) {
      return [
        { id: 'veh-6', make: 'Toyota', model: 'Land Cruiser 250', yom: '2024', stockNumber: 'LC250-9842', updateDate: '2026-08-16', status: 'VESSEL BOOKED' },
        { id: 'veh-7', make: 'Toyota', model: 'Raize Z', yom: '2024', stockNumber: 'RAIZE-3104', updateDate: '2026-08-15', status: 'IN TRANSIT' },
        { id: 'veh-inv-1', make: 'Toyota', model: 'Corolla Fielder', yom: '2021', stockNumber: 'NRE161', updateDate: '2026-08-12', status: 'ARRIVED AT PORT' },
        { id: 'veh-inv-4', make: 'Volkswagen', model: 'Golf TSI', yom: '2013', stockNumber: 'WVWZZZ', updateDate: '2026-08-11', status: 'READY FOR LOADING' },
      ];
    }

    return allVehicles.slice(0, 4).map((v) => ({
      id: v.id,
      make: v.make || 'Toyota',
      model: v.model || 'Model',
      yom: String(v.year || '2023'),
      stockNumber: (v.stockNumber || v.id).replace(/^STK:\s*/i, ''),
      updateDate: v.updatedAt?.slice(0, 10) || '2026-08-15',
      status: v.logisticsStatus || v.status || 'IN TRANSIT',
    }));
  }, [allVehicles]);

  return (
    <div className="cc-dash-page" data-testid="customer-dashboard-page">
      {isLoading && (
        <div className="cc-dash-loading-bar" role="status" aria-live="polite">
          <span>Refreshing dashboard data&hellip;</span>
        </div>
      )}

      {error && (
        <div className="cc-dash-alert-strip cc-dash-alert-strip--error" role="alert">
          <span>Central broker sync error. Displaying cached dashboard records.</span>
        </div>
      )}

      {/* 1. TOP AIRY GREETING HEADER (Matching Reference UI) */}
      <section className="cc-dash-hero-header" aria-labelledby="dash-welcome-title">
        <div className="cc-dash-hero-left">
          <span className="cc-dash-hero-overline">MY WORKSPACE</span>
          <h1 id="dash-welcome-title" className="cc-dash-hero-title">
            {greeting}, <span className="cc-dash-hero-name">{firstName}.</span>
          </h1>
          <p className="cc-dash-hero-subtext">
            Here is what your vehicle fleet and transactions look like right now.
          </p>
        </div>

        <div className="cc-dash-hero-right">
          <div className="cc-dash-date-badge">
            <span className="cc-dash-date-badge__label">TODAY</span>
            <span className="cc-dash-date-badge__value">{formattedToday}</span>
            <span className="cc-dash-date-badge__icon" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </span>
          </div>

          <div className="cc-dash-account-selector-compact">
            <span className="cc-dash-account-selector-label">PAIRED ACCOUNT:</span>
            <select
              id="dash-account-switch"
              className="cc-dash-account-select"
              value={user?.id || pairedAccounts[0]?.id}
              onChange={(e) => switchAccount(e.target.value)}
              data-testid="dash-switch-account-dropdown"
              aria-label="Switch paired dealer account"
            >
              {pairedAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.country || 'Kenya'})
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* 2. KPI & OPERATIONAL SUMMARY */}
      <section className="cc-dash-gauges-grid" aria-label="Financial and logistics summary">
        {/* Financial & Fulfillment Metrics */}
        <div className="cc-dash-metric-quad-grid" aria-label="Key Financial & Fulfillment Metrics">
          {/* Tile 1: Total Purchased */}
          <div
            className="cc-dash-metric-tile"
            onClick={() => setActiveRoute('/vehicles?tab=invoiced')}
            role="button"
            tabIndex={0}
          >
            <div className="cc-dash-metric-tile__icon cc-dash-metric-tile__icon--blue" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <span className="cc-dash-metric-tile__label">{t('customer.totalPurchased', undefined, 'Total Purchased')}</span>
            <span className="cc-dash-metric-tile__val">{totalPurchasedVehiclesCount} Units</span>
          </div>

          {/* Tile 2: Active Invoices */}
          <div
            className="cc-dash-metric-tile"
            onClick={() => setActiveRoute('/vehicles?tab=withPI')}
            role="button"
            tabIndex={0}
          >
            <div className="cc-dash-metric-tile__icon cc-dash-metric-tile__icon--blue" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
            </div>
            <span className="cc-dash-metric-tile__label">{t('customer.commercialBills', undefined, 'Commercial Bills')}</span>
            <span className="cc-dash-metric-tile__val">{invoiceCount} Invoices</span>
          </div>

          {/* Tile 3: Settlement Rate */}
          <div
            className="cc-dash-metric-tile"
            onClick={() => setActiveRoute('/statement')}
            role="button"
            tabIndex={0}
            data-testid="card-account-balance"
          >
            <div className="cc-dash-metric-tile__icon cc-dash-metric-tile__icon--green" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <span className="cc-dash-metric-tile__label">{t('customer.settlementRate', undefined, 'Settlement Rate')}</span>
            <span className="cc-dash-metric-tile__val">96%</span>
          </div>

          {/* Tile 4: Available Funds */}
          <div
            className="cc-dash-metric-tile"
            onClick={() => setActiveRoute('/payments')}
            role="button"
            tabIndex={0}
            data-testid="card-available-payments"
          >
            <div className="cc-dash-metric-tile__icon cc-dash-metric-tile__icon--amber" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </div>
            <span className="cc-dash-metric-tile__label">{t('customer.availableFunds', undefined, 'Available Funds')}</span>
            <span className="cc-dash-metric-tile__val">${(availablePaymentAmount / 1000).toFixed(0)}k TT</span>
          </div>
        </div>

        {/* Fleet Logistics summary */}
        <div
          className="cc-dash-card cc-dash-gauge-card cc-dash-gauge-card--logistics"
          data-testid="card-fleet-logistics"
        >
          <div className="cc-dash-gauge-card__header">
            <h2 className="cc-dash-gauge-card__title">{t('customer.fleetLogistics', undefined, 'Fleet Logistics')}</h2>
          </div>

          <div className="cc-dash-gauge-card__body">
            {/* Dot Breakdown Legend List */}
            <div className="cc-dash-dot-legend-list">
              <div className="cc-dash-dot-legend-item">
                <span className="cc-dash-dot-indicator cc-dash-dot-indicator--amber" aria-hidden="true" />
                <span className="cc-dash-dot-legend-count">{readyToShipCount}</span>
                <span className="cc-dash-dot-legend-label">ready to ship</span>
              </div>
              <div className="cc-dash-dot-legend-item">
                <span className="cc-dash-dot-indicator cc-dash-dot-indicator--indigo" aria-hidden="true" />
                <span className="cc-dash-dot-legend-count">{inTransitCount}</span>
                <span className="cc-dash-dot-legend-label">in transit</span>
              </div>
              <div className="cc-dash-dot-legend-item">
                <span className="cc-dash-dot-indicator cc-dash-dot-indicator--blue" aria-hidden="true" />
                <span className="cc-dash-dot-legend-count">{arrivedToPortCount}</span>
                <span className="cc-dash-dot-legend-label">arrived at port</span>
              </div>
              <div className="cc-dash-dot-legend-item">
                <span className="cc-dash-dot-indicator cc-dash-dot-indicator--green" aria-hidden="true" />
                <span className="cc-dash-dot-legend-count">{deliveredCount}</span>
                <span className="cc-dash-dot-legend-label">delivered units</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. DASHBOARD SUMMARY MATRIX */}
      <section className="cc-dash-summary-matrix" aria-label="Functional Subsystem Modules">
        {/* My Ongoing Orders - Invoices */}
        <div className="cc-dash-matrix-card">
          <div className="cc-dash-matrix-card__header">
            <h2 className="cc-dash-matrix-card__title">My Ongoing Orders</h2>
            <button
              type="button"
              className="cc-dash-matrix-card__view-btn"
              onClick={() => setActiveRoute('/invoices')}
            >
              view
            </button>
          </div>
          <div className="cc-dash-matrix-card__grid">
            <div className="cc-dash-matrix-row">
              <span className="cc-dash-matrix-row__label">Proforma:</span>
              <span className="cc-dash-matrix-row__val">{proformaCount}</span>
            </div>
            <div className="cc-dash-matrix-row">
              <span className="cc-dash-matrix-row__label">Invoices:</span>
              <span className="cc-dash-matrix-row__val">{invoiceCount}</span>
            </div>
          </div>
        </div>

        {/* My Inquiries */}
        <div className="cc-dash-matrix-card">
          <div className="cc-dash-matrix-card__header">
            <h2 className="cc-dash-matrix-card__title">My Inquiries</h2>
            <button
              type="button"
              className="cc-dash-matrix-card__view-btn"
              onClick={() => setActiveRoute('/inquiries')}
            >
              view
            </button>
          </div>
          <div className="cc-dash-matrix-card__grid">
            <div className="cc-dash-matrix-row">
              <span className="cc-dash-matrix-row__label">Total:</span>
              <span className="cc-dash-matrix-row__val">{totalInquiriesCount}</span>
            </div>
            <div className="cc-dash-matrix-row">
              <span className="cc-dash-matrix-row__label">Replied:</span>
              <span className="cc-dash-matrix-row__val cc-dash-color-green">{repliedInquiriesCount}</span>
            </div>
          </div>
        </div>

      </section>

      {/* 5. RECENT PURCHASES (6 UNITS) & RECENT SHIPMENT UPDATES (4 UNITS) (FRD 2.16 & 2.17) */}
      <div className="cc-dash-duo-grid">
        {/* LEFT: 6 Most Recent Purchases Table (FRD 2.16) */}
        <div className="cc-dash-col cc-dash-col--left">
          <section className="cc-dash-card" aria-labelledby="recent-purchases-heading">
            <div className="cc-dash-card-header">
              <div>
                <h2 id="recent-purchases-heading" className="cc-dash-card-title">
                  6 MOST RECENT PURCHASES
                </h2>
                <p className="cc-dash-card-subtitle">
                  Latest invoiced acquisitions sorted from newest to oldest
                </p>
              </div>
              <button
                type="button"
                className="cc-dash-card-link"
                onClick={() => setActiveRoute('/vehicles')}
              >
                VIEW FLEET →
              </button>
            </div>

            <div className="cc-dash-table-wrapper">
              <table className="cc-dash-table">
                <thead>
                  <tr>
                    <th scope="col">MAKE + MODEL</th>
                    <th scope="col">YOM</th>
                    <th scope="col">DATE OF PURCHASE</th>
                    <th scope="col">INVOICE</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPurchases.map((p) => (
                    <tr
                      key={p.id}
                      className="cc-dash-table-row--interactive"
                      onClick={() => setActiveRoute('/vehicles')}
                    >
                      <td className="cc-dash-td-bold">{p.make} {p.model}</td>
                      <td className="cc-dash-td-mono">{p.yom}</td>
                      <td className="cc-dash-td-mono">{p.purchaseDate}</td>
                      <td>
                        <span className="cc-dash-status-pill cc-dash-status-pill--invoiced">
                          {p.invoiceNumber}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* RIGHT: 4 Recent Shipment Updates (FRD 2.17) */}
        <div className="cc-dash-col cc-dash-col--right">
          <section className="cc-dash-card" aria-labelledby="shipment-updates-heading">
            <div className="cc-dash-card-header">
              <div>
                <h2 id="shipment-updates-heading" className="cc-dash-card-title">
                  RECENT SHIPMENT UPDATES
                </h2>
                <p className="cc-dash-card-subtitle">Latest 4 ocean freight status updates</p>
              </div>
              <button
                type="button"
                className="cc-dash-card-link"
                onClick={() => setActiveRoute('/vehicles')}
              >
                TRACK ALL →
              </button>
            </div>

            <div className="cc-dash-shipment-list">
              {recentShipmentUpdates.map((ship) => (
                <div
                  key={ship.id}
                  className="cc-dash-shipment-item"
                  onClick={() => setActiveRoute(`/vehicles`)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="cc-dash-shipment-info">
                    <h3 className="cc-dash-shipment-name">
                      <span className="cc-dash-shipment-make-model">
                        {ship.make} {ship.model}
                      </span>
                      <span className="cc-dash-shipment-yom">YOM: {ship.yom}</span>
                    </h3>
                    <p className="cc-dash-shipment-meta">Stock No: {ship.stockNumber}</p>
                  </div>

                  <div className="cc-dash-shipment-status-wrap">
                    <span className="cc-dash-status-pill cc-dash-status-pill--in-transit">
                      {ship.status}
                    </span>
                    <span className="cc-dash-shipment-eta">{ship.updateDate}</span>
                  </div>

                  <button
                    type="button"
                    className="cc-dash-shipment-view-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveRoute('/vehicles');
                    }}
                  >
                    VIEW
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

    </div>
  );
};
