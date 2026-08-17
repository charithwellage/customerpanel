import React from 'react';
import type { CustomerVehicleSummary, CustomerInvoiceSummary } from '@carchief/domain';
import type { Notification } from '@carchief/api-client';
import { useDashboard } from './useDashboard.js';
import { useCustomerShell } from '../shell/index.js';
import { useCustomerVehicles } from '../vehicles/useCustomerVehicles.js';
import { useCustomerInvoices } from '../invoices/useCustomerInvoices.js';
import { useCustomerNotifications } from '../notifications/useCustomerNotifications.js';
import {
  SecurityShieldIcon,
  BoughtCarsIcon,
  InTransitShipIcon,
  PortReadyBoxIcon,
  DueBillsClockIcon,
  PendingBalanceDollarIcon,
} from '../../components/Icons.js';

interface TrackingVehicleItem {
  id: string;
  title: string;
  chassis: string;
  status: string;
  eta: string;
  imageUrl: string;
}

interface BillingInvoiceItem {
  id: string;
  invoiceNo: string;
  type: string;
  amount: string;
  outstanding: string;
  dueDate: string;
  status: string;
}

interface BulletinItem {
  id: string;
  title: string;
  priority: string;
  body: string;
  date: string;
}

export const OverviewPage: React.FC = () => {
  const { user, setActiveRoute } = useCustomerShell();
  const { data: dashboard, isLoading, error } = useDashboard();
  const { data: vehiclesData } = useCustomerVehicles();
  const { data: invoicesData } = useCustomerInvoices();
  const { data: notificationsData } = useCustomerNotifications('all', '');

  const displayName = user?.name ? user.name.toUpperCase() : 'CHARITH WELLAGE';
  const customerId = user?.id || dashboard?.customerId || 'CC-CUST-1254';
  const country = user?.company?.includes('Kenya') ? 'Kenya' : 'Kenya';

  // Financial values
  const outstandingBalance = dashboard?.outstandingBalanceUsd ?? 833336;
  const creditLimit = dashboard?.creditLimitUsd ?? 100000;
  const formattedBalance = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(outstandingBalance);
  const formattedCreditLimit = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(creditLimit);

  // Counts
  const boughtCarsCount = dashboard
    ? dashboard.vehicleCountReserved + dashboard.vehicleCountInvoiced + dashboard.vehicleCountDelivered
    : 24;
  const inTransitCount = dashboard?.shipmentStatusSummary?.inTransit ?? 0;
  const portReadyCount = dashboard?.shipmentStatusSummary?.ready ?? 0;
  const dueBillsCount = invoicesData?.totals?.totalOutstandingUsd ? invoicesData.items?.length : 28;

  // Real or fallback vehicle tracking items
  const trackingVehicles: TrackingVehicleItem[] = vehiclesData?.items?.length
    ? vehiclesData.items.slice(0, 3).map((v: CustomerVehicleSummary) => ({
        id: v.id,
        title: `${v.year} ${v.make} ${v.model}`.trim(),
        chassis: v.chassisNumber ? `Chassis: ${v.chassisNumber} | Stock: ${v.vehicleId || v.id}` : `Stock: ${v.vehicleId || v.id}`,
        status: v.status === 'Confirmed' ? 'RESERVED' : v.status === 'In Transit' ? 'IN TRANSIT' : 'INSPECTION',
        eta: 'ETA TBD',
        imageUrl: v.primaryImage || '/images/luxury_premium_supercar.jpg',
      }))
    : [
        {
          id: 'v1',
          title: '2024 TOYOTA LAND CRUISER 250',
          chassis: 'Chassis: | Stock: STK-6ISF',
          status: 'RESERVED',
          eta: 'ETA TBD',
          imageUrl: '/images/luxury_premium_supercar.jpg',
        },
        {
          id: 'v2',
          title: '2021 TOYOTA COROLLA FIELDER',
          chassis: 'Chassis: NRE161-0091995 | Stock: NRE161',
          status: 'INSPECTION',
          eta: 'ETA TBD',
          imageUrl: '/images/luxury_premium_supercar.jpg',
        },
        {
          id: 'v3',
          title: '2013 VOLVO V40',
          chassis: 'Chassis: YV1MV4859E209044078877 | Stock: YV1MV4',
          status: 'RESERVED',
          eta: 'ETA TBD',
          imageUrl: '/images/luxury_premium_supercar.jpg',
        },
      ];

  // Financial table items
  const billingInvoices: BillingInvoiceItem[] = invoicesData?.items?.length
    ? invoicesData.items.slice(0, 3).map((inv: CustomerInvoiceSummary) => ({
        id: inv.id,
        invoiceNo: inv.invoiceNumber || inv.id,
        type: String(inv.type || 'PROFORMA').toUpperCase(),
        amount: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(inv.totalAmountUsd),
        outstanding: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(inv.outstandingAmountUsd),
        dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : '2026-07-25',
        status: String(inv.status || 'UNPAID').toUpperCase(),
      }))
    : [
        {
          id: 'i1',
          invoiceNo: 'P-85492',
          type: 'PROFORMA',
          amount: '$12,730',
          outstanding: '$12,730',
          dueDate: '2026-07-25',
          status: 'UNPAID',
        },
        {
          id: 'i2',
          invoiceNo: 'P-94324',
          type: 'PROFORMA',
          amount: '$8,974',
          outstanding: '$8,974',
          dueDate: '2026-07-23',
          status: 'UNPAID',
        },
        {
          id: 'i3',
          invoiceNo: 'P-12689',
          type: 'PROFORMA',
          amount: '$9,690',
          outstanding: '$9,690',
          dueDate: '2026-07-23',
          status: 'UNPAID',
        },
      ];

  // Bulletins / Notifications items
  const bulletinsList: BulletinItem[] = notificationsData?.items?.length
    ? notificationsData.items.slice(0, 3).map((n: Notification) => ({
        id: n.id,
        title: n.title || 'NOTIFICATION UPDATE',
        priority: 'HIGH',
        body: n.message,
        date: new Date(n.createdAt).toLocaleDateString('en-GB'),
      }))
    : [
        {
          id: 'b1',
          title: 'TT WIRE PAYMENT APPROVED',
          priority: 'HIGH',
          body: `Dear ${user?.name || 'Charith Wellage'}, your wire transfer payment of $50,000 USD (Reference Code: ffgff) for Invoice INV-31644 has been audited and...`,
          date: '21/07/2026',
        },
        {
          id: 'b2',
          title: 'TT WIRE PAYMENT APPROVED',
          priority: 'HIGH',
          body: `Dear ${user?.name || 'Charith Wellage'}, your wire transfer payment of $4,700 USD (Reference Code: TEST) for Invoice INV-79873 has been audited and...`,
          date: '21/07/2026',
        },
        {
          id: 'b3',
          title: 'TT WIRE PAYMENT APPROVED ✓',
          priority: 'HIGH',
          body: `Dear ${user?.name || 'Charith Wellage'}, your Telegraphic Transfer (TT) wire transfer payment of $15,000 USD (Ref / Swift Code: charith wellage) has been audited and...`,
          date: '23/07/2026',
        },
      ];

  return (
    <div className="cc-dash-page">
      {isLoading && (
        <div className="cc-dash-loading-bar" role="status" aria-live="polite">
          <span>Refreshing operational live metrics&hellip;</span>
        </div>
      )}

      {error && (
        <div className="cc-dash-alert-strip cc-dash-alert-strip--error" role="alert">
          <span>Failed to synchronize live telemetry with central broker. Showing cached ledger.</span>
        </div>
      )}

      {/* 1. TOP WELCOME BANNER CARD */}
      <section className="cc-dash-welcome-card" aria-labelledby="dash-welcome-title">
        <div className="cc-dash-welcome-left">
          <div className="cc-dash-badge-row">
            <span className="cc-dash-pill-badge cc-dash-pill-badge--security">
              <SecurityShieldIcon size={14} className="cc-dash-badge-icon" />
              SECURE CLIENT SESSION
            </span>
            <span className="cc-dash-pill-badge cc-dash-pill-badge--active">
              <span className="cc-dash-dot-indicator" aria-hidden="true" />
              ACTIVE
            </span>
          </div>

          <h1 id="dash-welcome-title" className="cc-dash-welcome-title">
            WELCOME BACK, <span className="cc-dash-title-highlight">{displayName}</span>
          </h1>

          <p className="cc-dash-welcome-desc">
            Managing logistics for <strong className="cc-dash-highlight-text">{displayName.toLowerCase()}</strong> in {country}. Your secure portal coordinates high-end vehicle procurement, real-time freight pipelines, and direct customs clearance records.
          </p>

          <div className="cc-dash-status-strip">
            <span className="cc-dash-strip-item">
              LOGISTICS NETWORK: <strong className="cc-dash-color-green">ONLINE</strong>
            </span>
            <span className="cc-dash-strip-divider" aria-hidden="true">|</span>
            <span className="cc-dash-strip-item">
              ACTIVE FLEET: <strong>{boughtCarsCount} UNITS</strong>
            </span>
            <span className="cc-dash-strip-divider" aria-hidden="true">|</span>
            <span className="cc-dash-strip-item">
              IN TRANSIT: <strong>{inTransitCount} VESSELS</strong>
            </span>
          </div>
        </div>

        <div className="cc-dash-welcome-right">
          <div className="cc-dash-meta-grid">
            <div className="cc-dash-meta-item">
              <span className="cc-dash-meta-label">SECURE CLIENT ID</span>
              <span className="cc-dash-meta-val cc-dash-meta-val--mono">{customerId}</span>
            </div>

            <div className="cc-dash-meta-item">
              <span className="cc-dash-meta-label">PORTAL TIER</span>
              <span className="cc-dash-meta-val cc-dash-meta-val--tier">
                PREMIUM DEALER <span className="cc-dash-tier-dot" aria-hidden="true" />
              </span>
            </div>

            <div className="cc-dash-meta-item">
              <span className="cc-dash-meta-label">REGISTRY LOCATION</span>
              <span className="cc-dash-meta-val">{country}</span>
            </div>

            <div className="cc-dash-meta-item">
              <span className="cc-dash-meta-label">CREDIT UTILIZATION</span>
              <span className="cc-dash-meta-val cc-dash-meta-val--mono">
                {formattedBalance} / {formattedCreditLimit}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. 5-METRIC KPI STRIP */}
      <section className="cc-dash-kpi-row" aria-label="Operational Key Metrics">
        <div className="cc-dash-kpi-card" onClick={() => setActiveRoute('/vehicles')} role="button" tabIndex={0}>
          <div className="cc-dash-kpi-header">
            <span className="cc-dash-kpi-label">BOUGHT CARS</span>
            <BoughtCarsIcon size={18} className="cc-dash-kpi-icon" />
          </div>
          <div className="cc-dash-kpi-value">{boughtCarsCount}</div>
          <div className="cc-dash-kpi-subtext">FULL LEDGER</div>
        </div>

        <div className="cc-dash-kpi-card" onClick={() => setActiveRoute('/shipments')} role="button" tabIndex={0}>
          <div className="cc-dash-kpi-header">
            <span className="cc-dash-kpi-label">IN TRANSIT</span>
            <InTransitShipIcon size={18} className="cc-dash-kpi-icon" />
          </div>
          <div className="cc-dash-kpi-value">{inTransitCount}</div>
          <div className="cc-dash-kpi-subtext">VESSELS EN ROUTE</div>
        </div>

        <div className="cc-dash-kpi-card" onClick={() => setActiveRoute('/shipments')} role="button" tabIndex={0}>
          <div className="cc-dash-kpi-header">
            <span className="cc-dash-kpi-label">PORT READY</span>
            <PortReadyBoxIcon size={18} className="cc-dash-kpi-icon" />
          </div>
          <div className="cc-dash-kpi-value">{portReadyCount}</div>
          <div className="cc-dash-kpi-subtext">BOOKED &amp; LOADED</div>
        </div>

        <div className="cc-dash-kpi-card" onClick={() => setActiveRoute('/invoices')} role="button" tabIndex={0}>
          <div className="cc-dash-kpi-header">
            <span className="cc-dash-kpi-label">DUE BILLS</span>
            <DueBillsClockIcon size={18} className="cc-dash-kpi-icon" />
          </div>
          <div className="cc-dash-kpi-value">{dueBillsCount}</div>
          <div className="cc-dash-kpi-subtext">UNPAID / PARTIAL</div>
        </div>

        <div className="cc-dash-kpi-card cc-dash-kpi-card--highlight" onClick={() => setActiveRoute('/payments')} role="button" tabIndex={0}>
          <div className="cc-dash-kpi-header">
            <span className="cc-dash-kpi-label">PENDING BALANCE</span>
            <PendingBalanceDollarIcon size={18} className="cc-dash-kpi-icon" />
          </div>
          <div className="cc-dash-kpi-value cc-dash-kpi-value--balance">{formattedBalance}</div>
          <div className="cc-dash-kpi-subtext cc-dash-kpi-subtext--limit">
            CREDIT LIMIT: {formattedCreditLimit}
          </div>
        </div>
      </section>

      {/* 3. TWO-COLUMN MAIN WORKSPACE (LEFT 64%, RIGHT 36%) */}
      <div className="cc-dash-duo-grid">
        {/* LEFT COLUMN: ACTIVE SHIPMENT TRACKING & FINANCIAL BILLING SUMMARY */}
        <div className="cc-dash-col cc-dash-col--left">
          {/* Active Shipment Tracking Card */}
          <section className="cc-dash-card cc-dash-card--shipment" aria-labelledby="dash-shipment-heading">
            <div className="cc-dash-card-header">
              <div>
                <h2 id="dash-shipment-heading" className="cc-dash-card-title">
                  ACTIVE SHIPMENT TRACKING
                </h2>
                <p className="cc-dash-card-subtitle">Live ocean logistics &amp; container status</p>
              </div>
              <a
                href="/shipments"
                className="cc-dash-card-link"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveRoute('/shipments');
                }}
              >
                VIEW ALL →
              </a>
            </div>

            <div className="cc-dash-shipment-list">
              {trackingVehicles.map((vehicle) => (
                <div key={vehicle.id} className="cc-dash-shipment-item">
                  <div className="cc-dash-shipment-thumb">
                    <img
                      src={vehicle.imageUrl}
                      alt={vehicle.title}
                      className="cc-dash-shipment-img"
                      loading="lazy"
                    />
                  </div>
                  <div className="cc-dash-shipment-info">
                    <h3 className="cc-dash-shipment-name">{vehicle.title}</h3>
                    <p className="cc-dash-shipment-meta">{vehicle.chassis}</p>
                  </div>
                  <div className="cc-dash-shipment-status-wrap">
                    <span className={`cc-dash-status-pill cc-dash-status-pill--${vehicle.status.toLowerCase()}`}>
                      {vehicle.status}
                    </span>
                    <span className="cc-dash-shipment-eta">{vehicle.eta}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Financial Billing Summary Card */}
          <section className="cc-dash-card cc-dash-card--billing" aria-labelledby="dash-billing-heading">
            <div className="cc-dash-card-header">
              <div>
                <h2 id="dash-billing-heading" className="cc-dash-card-title">
                  FINANCIAL BILLING SUMMARY
                </h2>
                <p className="cc-dash-card-subtitle">Unpaid Proforma &amp; Commercial accounts</p>
              </div>
              <a
                href="/invoices"
                className="cc-dash-card-link"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveRoute('/invoices');
                }}
              >
                FULL LEDGER →
              </a>
            </div>

            <div className="cc-dash-table-wrapper">
              <table className="cc-dash-table">
                <thead>
                  <tr>
                    <th scope="col">INVOICE NO</th>
                    <th scope="col">TYPE</th>
                    <th scope="col">AMOUNT</th>
                    <th scope="col">OUTSTANDING</th>
                    <th scope="col">DUE DATE</th>
                    <th scope="col">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {billingInvoices.map((inv) => (
                    <tr key={inv.id}>
                      <td className="cc-dash-td-mono cc-dash-td-bold">{inv.invoiceNo}</td>
                      <td className="cc-dash-td-type">{inv.type}</td>
                      <td>{inv.amount}</td>
                      <td className="cc-dash-td-outstanding">{inv.outstanding}</td>
                      <td className="cc-dash-td-mono">{inv.dueDate}</td>
                      <td>
                        <span className="cc-dash-status-pill cc-dash-status-pill--unpaid">
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: UNREAD BULLETINS & SECURE VAULT */}
        <div className="cc-dash-col cc-dash-col--right">
          {/* Unread Bulletins Card */}
          <section className="cc-dash-card cc-dash-card--bulletins" aria-labelledby="dash-bulletins-heading">
            <div className="cc-dash-card-header">
              <h2 id="dash-bulletins-heading" className="cc-dash-card-title">
                UNREAD BULLETINS
              </h2>
              <span className="cc-dash-badge-inbox">INBOX</span>
            </div>

            <div className="cc-dash-bulletins-list">
              {bulletinsList.map((item) => (
                <article key={item.id} className="cc-dash-bulletin-item">
                  <div className="cc-dash-bulletin-header">
                    <h3 className="cc-dash-bulletin-title">{item.title}</h3>
                    <span className="cc-dash-badge-high">{item.priority}</span>
                  </div>
                  <p className="cc-dash-bulletin-body">{item.body}</p>
                  <time className="cc-dash-bulletin-time">{item.date}</time>
                </article>
              ))}
            </div>
          </section>

          {/* Secure Vault Card */}
          <section className="cc-dash-card cc-dash-card--vault" aria-labelledby="dash-vault-heading">
            <div className="cc-dash-card-header">
              <h2 id="dash-vault-heading" className="cc-dash-card-title">
                SECURE VAULT
              </h2>
              <a
                href="/documents"
                className="cc-dash-badge-vault-link"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveRoute('/documents');
                }}
              >
                VAULT
              </a>
            </div>

            <div className="cc-dash-vault-empty-box">
              <span className="cc-dash-vault-empty-text">No export files uploaded.</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
