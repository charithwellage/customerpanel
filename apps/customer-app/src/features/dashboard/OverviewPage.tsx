import React, { useState } from 'react';
import type { CustomerVehicleSummary } from '@carchief/domain';
import { useDashboard } from './useDashboard.js';
import { useCustomerShell } from '../shell/index.js';
import { useCustomerVehicles } from '../vehicles/useCustomerVehicles.js';
import { useCustomerInvoices } from '../invoices/useCustomerInvoices.js';
import { useCustomerNotifications } from '../notifications/useCustomerNotifications.js';
import { useCustomerProfile } from '../profile/useCustomerProfile.js';
import { useDocuments } from '../documents/useDocuments.js';
import { VehicleTrackingModal } from '../vehicles/components/VehicleTrackingModal.js';
import {
  SecurityShieldIcon,
  BoughtCarsIcon,
  InTransitShipIcon,
  PortReadyBoxIcon,
  DueBillsClockIcon,
  PendingBalanceDollarIcon,
} from '../../components/Icons.js';

export const OverviewPage: React.FC = () => {
  const { user, setActiveRoute } = useCustomerShell();
  const { data: dashboard, isLoading, error } = useDashboard();
  const { data: vehiclesData, isLoading: isLoadingVehicles } = useCustomerVehicles();
  const { data: invoicesData, isLoading: isLoadingInvoices } = useCustomerInvoices();
  const { data: notificationsData, isLoading: isLoadingNotifications } = useCustomerNotifications('all', '');
  const { data: profile } = useCustomerProfile();
  const { data: documents } = useDocuments();

  const [selectedTrackingVehicle, setSelectedTrackingVehicle] = useState<CustomerVehicleSummary | null>(null);

  const displayName = profile?.name
    ? profile.name.toUpperCase()
    : (user?.name ? user.name.toUpperCase() : (dashboard?.customerId ? dashboard.customerId.toUpperCase() : 'CUSTOMER'));
  const customerId = profile?.customerId || user?.id || dashboard?.customerId || 'N/A';
  const country = profile?.deliveryAddress
    ? profile.deliveryAddress
    : (profile?.companyName || user?.company || 'Kenya');

  // Financial values
  const outstandingBalance = dashboard?.outstandingBalanceUsd ?? (invoicesData?.totals?.totalOutstandingUsd ?? 0);
  const creditLimit = dashboard?.creditLimitUsd ?? 500000;
  const formattedBalance = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(outstandingBalance);
  const formattedCreditLimit = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(creditLimit);

  // Counts from database
  const boughtCarsCount = dashboard
    ? dashboard.vehicleCountReserved + dashboard.vehicleCountInvoiced + dashboard.vehicleCountDelivered
    : (vehiclesData?.items?.length ?? 0);
  const inTransitCount = dashboard?.shipmentStatusSummary?.inTransit ?? (vehiclesData?.items?.filter(v => v.status === 'In Transit' || v.logisticsStatus === 'IN TRANSIT').length ?? 0);
  const portReadyCount = dashboard?.shipmentStatusSummary?.ready ?? (vehiclesData?.items?.filter(v => v.logisticsStatus === 'READY FOR LOADING' || v.logisticsStatus === 'VESSEL BOOKED' || v.logisticsStatus === 'LOADED').length ?? 0);
  const dueBillsCount = invoicesData?.items?.filter(inv => inv.status?.toLowerCase() === 'issued' || inv.status?.toLowerCase() === 'unpaid' || (inv.outstandingAmountUsd && inv.outstandingAmountUsd > 0)).length ?? (dashboard?.vehicleCountInvoiced ?? 0);

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
                href="/vehicles"
                className="cc-dash-card-link"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveRoute('/vehicles');
                }}
              >
                VIEW ALL →
              </a>
            </div>

            <div className="cc-dash-shipment-list">
              {isLoadingVehicles ? (
                <div className="cc-dash-empty-block">Loading active shipments&hellip;</div>
              ) : vehiclesData?.items && vehiclesData.items.length > 0 ? (
                vehiclesData.items.slice(0, 4).map((vehicle) => {
                  const title = `${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''}`.trim() || 'Vehicle';
                  const stockLabel = vehicle.stockNumber || vehicle.vehicleId || vehicle.id;
                  const chassisText = vehicle.chassisNumber
                    ? `Chassis: ${vehicle.chassisNumber} | Stock: ${stockLabel}`
                    : `Stock: ${stockLabel}`;
                  const status = (vehicle.logisticsStatus || vehicle.shippingStage || vehicle.status || 'RESERVED').toUpperCase();
                  const etaText = vehicle.destinationPort ? `Port: ${vehicle.destinationPort}` : (vehicle.locationStatus || 'ETA TBD');
                  const imageUrl = vehicle.primaryImage || '/images/luxury_premium_supercar.jpg';

                  return (
                    <div
                      key={vehicle.id}
                      className="cc-dash-shipment-item"
                      onClick={() => setSelectedTrackingVehicle(vehicle)}
                      role="button"
                      tabIndex={0}
                      title="Click to track shipment timeline"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedTrackingVehicle(vehicle);
                        }
                      }}
                    >
                      <div className="cc-dash-shipment-thumb">
                        <img
                          src={imageUrl}
                          alt={title}
                          className="cc-dash-shipment-img"
                          loading="lazy"
                        />
                      </div>
                      <div className="cc-dash-shipment-info">
                        <h3 className="cc-dash-shipment-name">{title}</h3>
                        <p className="cc-dash-shipment-meta">{chassisText}</p>
                      </div>
                      <div className="cc-dash-shipment-status-wrap">
                        <span className={`cc-dash-status-pill cc-dash-status-pill--${status.toLowerCase().replace(/\s+/g, '-')}`}>
                          {status}
                        </span>
                        <span className="cc-dash-shipment-eta">{etaText}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="cc-dash-empty-block">No active vehicle shipments in tracking queue.</div>
              )}
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
                  {isLoadingInvoices ? (
                    <tr>
                      <td colSpan={6} className="cc-dash-empty-block">Loading billing ledger&hellip;</td>
                    </tr>
                  ) : invoicesData?.items && invoicesData.items.length > 0 ? (
                    invoicesData.items.slice(0, 4).map((inv) => (
                      <tr
                        key={inv.id}
                        className="cc-dash-table-row--interactive"
                        onClick={() => setActiveRoute('/invoices')}
                        title="Click to view in Billed Invoices"
                      >
                        <td className="cc-dash-td-mono cc-dash-td-bold">{inv.invoiceNumber || inv.id}</td>
                        <td className="cc-dash-td-type">{String(inv.type || 'PROFORMA').toUpperCase()}</td>
                        <td>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(inv.totalAmountUsd)}</td>
                        <td className="cc-dash-td-outstanding">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(inv.outstandingAmountUsd)}</td>
                        <td className="cc-dash-td-mono">{inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : 'N/A'}</td>
                        <td>
                          <span className={`cc-dash-status-pill cc-dash-status-pill--${String(inv.status || 'UNPAID').toLowerCase()}`}>
                            {String(inv.status || 'UNPAID').toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="cc-dash-empty-block">
                        No active or outstanding invoices.
                      </td>
                    </tr>
                  )}
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
              <a
                href="/notifications"
                className="cc-dash-badge-inbox"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveRoute('/notifications');
                }}
              >
                INBOX
              </a>
            </div>

            <div className="cc-dash-bulletins-list">
              {isLoadingNotifications ? (
                <div className="cc-dash-empty-block">Loading notifications&hellip;</div>
              ) : notificationsData?.items && notificationsData.items.length > 0 ? (
                notificationsData.items.slice(0, 4).map((item) => (
                  <article
                    key={item.id}
                    className="cc-dash-bulletin-item"
                    onClick={() => setActiveRoute('/notifications')}
                    title="Click to open in Bulletins"
                  >
                    <div className="cc-dash-bulletin-header">
                      <h3 className="cc-dash-bulletin-title">{item.title || `${item.type || 'NOTIFICATION'} UPDATE`}</h3>
                      <span className={`cc-dash-badge-${(item.type || 'high').toLowerCase()}`}>
                        {item.type ? item.type.toUpperCase() : 'UPDATE'}
                      </span>
                    </div>
                    <p className="cc-dash-bulletin-body">{item.message}</p>
                    <time className="cc-dash-bulletin-time">
                      {new Date(item.createdAt).toLocaleDateString('en-GB')}
                    </time>
                  </article>
                ))
              ) : (
                <div className="cc-dash-empty-block">No bulletins at this time.</div>
              )}
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

            {documents && documents.length > 0 ? (
              <div className="cc-dash-vault-list">
                {documents.slice(0, 3).map((doc) => {
                  const categoryName = doc.type === 'Invoice' ? 'Commercial Invoice' : (doc.type === 'ShippingLabel' ? 'Bill of Lading' : doc.type);
                  return (
                    <div
                      key={doc.id}
                      className="cc-dash-vault-item"
                      onClick={() => setActiveRoute('/documents')}
                      title="Click to view in Secure Vault"
                    >
                      <span className="cc-dash-vault-name">{categoryName}</span>
                      <span className="cc-dash-vault-tag">{doc.status === 'Available' ? 'Available' : 'Pending'}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="cc-dash-vault-empty-box">
                <span className="cc-dash-vault-empty-text">No export files uploaded.</span>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Vehicle Tracking Modal on Overview Desk */}
      <VehicleTrackingModal
        isOpen={Boolean(selectedTrackingVehicle)}
        vehicle={selectedTrackingVehicle}
        onClose={() => setSelectedTrackingVehicle(null)}
      />
    </div>
  );
};
