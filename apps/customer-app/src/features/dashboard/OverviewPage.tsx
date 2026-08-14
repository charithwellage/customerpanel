import React from 'react';
import type { CustomerDashboard } from '@carchief/api-client';
import { useDashboard } from './useDashboard.js';
import { CreditUtilisationCard } from './components/CreditUtilisationCard.js';
import { VehicleCountCard } from './components/VehicleCountCard.js';
import { PaymentStatusCard } from './components/PaymentStatusCard.js';
import { ShipmentStatusCard } from './components/ShipmentStatusCard.js';
import { DocumentCard } from './components/DocumentCard.js';
import { NotificationCard } from './components/NotificationCard.js';

/**
 * Customer Overview dashboard page (D02-P02-T002).
 * Displays KPI cards derived from the dashboard aggregate: balance, credit,
 * vehicles, payments, shipments, documents and notifications.
 * Supports loading, empty, partial/stale and error states.
 */
export const OverviewPage: React.FC = () => {
  const { data, isLoading, error } = useDashboard();

  return (
    <div className="cc-cust-overview">
      <header className="cc-cust-overview__header">
        <h1 className="cc-cust-overview__title">Dashboard</h1>
        <p className="cc-cust-overview__subtitle">Your account overview and shipment status</p>
      </header>

      {isLoading && (
        <div className="cc-cust-overview__loading" role="status" aria-live="polite">
          <p>Loading your dashboard...</p>
        </div>
      )}

      {error && (
        <div className="cc-cust-overview__error" role="alert">
          <p>Unable to load dashboard. Please refresh the page.</p>
          <details>
            <summary>Error details</summary>
            <p>{error.message}</p>
          </details>
        </div>
      )}

      {data && (
        <div className="cc-cust-overview__content">
          <div className="cc-cust-overview__grid">
            <CreditUtilisationCard dashboard={data} />
            <VehicleCountCard dashboard={data} />
            <PaymentStatusCard dashboard={data} />
            <ShipmentStatusCard dashboard={data} />
            <DocumentCard dashboard={data} />
            <NotificationCard dashboard={data} />
          </div>

          {data.partialFailureIndicators && Object.values(data.partialFailureIndicators).some((v) => v) && (
            <div className="cc-cust-overview__partial-failure" role="alert">
              <p>Some data is temporarily unavailable. Displaying cached information.</p>
            </div>
          )}

          <p className="cc-cust-overview__updated">
            Last updated: <time dateTime={data.lastUpdated}>{new Date(data.lastUpdated).toLocaleString()}</time>
          </p>
        </div>
      )}
    </div>
  );
};
