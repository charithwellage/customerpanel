import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AccountGuard, type CustomerSession, HttpClientProvider } from '../features/account/index.js';
import { OfflineGuard } from '../features/pwa/index.js';
import { CustomerShell, useCustomerShell, type CustomerUser } from '../features/shell/index.js';
import { OverviewPage } from '../features/dashboard/index.js';
import { CustomerInventoryPage, CustomerVehicleDetailPage } from '../features/inventory/index.js';
import { CustomerFleetPage, CustomerFleetDetailPage } from '../features/vehicles/index.js';
import { DocumentsPage } from '../features/documents/index.js';
import { CustomerInvoicesPage, CustomerInvoiceDetailPage } from '../features/invoices/index.js';
import { PaymentsPage } from '../features/payments/index.js';
import { NotificationsPage } from '../features/notifications/index.js';
import { ShipmentPage } from '../features/shipments/index.js';
import { ProfilePage } from '../features/profile/index.js';
import { PortalPlaceholder } from './PortalPlaceholder.js';

const queryClient = new QueryClient();

export interface AppProps {
  /**
   * Empty string means "same origin": the browser calls `/api/v1/*` on the
   * customer app's own origin and the dev/preview server proxies it to the Mock
   * API. See `vite.config.ts`.
   */
  apiBaseUrl?: string;
}

/**
 * Maps the verified session onto the shell's display user.
 *
 * Only fields the session token actually carries are used. `JwtClaims` has no
 * name or company field, so `session.user.name` is whatever the sign-in
 * response derived from the real address and `company` stays undefined
 * rather than being invented.
 */
function toShellUser(session: CustomerSession): CustomerUser {
  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    company: session.user.company,
    role: 'CUSTOMER',
    tier: session.user.tier,
  };
}

const AppContent: React.FC<{ session: CustomerSession; apiBaseUrl: string }> = ({
  session,
  apiBaseUrl,
}) => {
  const { activeRoute, setActiveRoute } = useCustomerShell();

  if (activeRoute === '/dashboard') {
    return <OverviewPage />;
  }

  if (activeRoute === '/inventory') {
    return (
      <CustomerInventoryPage
        apiBaseUrl={apiBaseUrl}
        token={session.token}
        onSelectVehicle={(vehicle) => {
          setActiveRoute(`/inventory/${vehicle.slug || vehicle.id}`);
        }}
      />
    );
  }

  if (activeRoute.startsWith('/inventory/')) {
    const slug = activeRoute.substring('/inventory/'.length);
    return (
      <CustomerVehicleDetailPage
        slug={slug}
        apiBaseUrl={apiBaseUrl}
        token={session.token}
        onBack={() => {
          setActiveRoute('/inventory');
        }}
      />
    );
  }

  if (activeRoute === '/vehicles') {
    return (
      <CustomerFleetPage
        onSelectVehicle={(vehicle) => {
          setActiveRoute(`/vehicles/${vehicle.id || vehicle.slug}`);
        }}
      />
    );
  }

  if (activeRoute.startsWith('/vehicles/')) {
    const idOrSlug = activeRoute.substring('/vehicles/'.length);
    return (
      <CustomerFleetDetailPage
        vehicleId={idOrSlug}
        onBack={() => {
          setActiveRoute('/vehicles');
        }}
      />
    );
  }

  if (activeRoute === '/documents') {
    return <DocumentsPage />;
  }

  if (activeRoute === '/invoices') {
    return (
      <CustomerInvoicesPage
        onSelectInvoice={(invoice) => {
          setActiveRoute(`/invoices/${invoice.id}`);
        }}
      />
    );
  }

  if (activeRoute === '/payments') {
    return <PaymentsPage />;
  }

  if (activeRoute === '/shipments') {
    return <ShipmentPage />;
  }

  if (activeRoute === '/notifications') {
    return <NotificationsPage />;
  }

  if (activeRoute === '/profile') {
    return <ProfilePage />;
  }

  if (activeRoute.startsWith('/invoices/')) {
    const invoiceId = activeRoute.substring('/invoices/'.length);
    return (
      <CustomerInvoiceDetailPage
        invoiceId={invoiceId}
        onBack={() => {
          setActiveRoute('/invoices');
        }}
      />
    );
  }

  return <PortalPlaceholder signedInAs={session.user.email} />;
};

export const App: React.FC<AppProps> = ({ apiBaseUrl = '' }) => (
  <OfflineGuard>
    <AccountGuard apiBaseUrl={apiBaseUrl}>
      {(session, actions) => (
        <QueryClientProvider client={queryClient}>
          <HttpClientProvider apiBaseUrl={apiBaseUrl}>
            <CustomerShell
              initialUser={toShellUser(session)}
              pageTitle="Customer Portal"
              pageSubtitle="Account access and application shell"
              onSignOut={() => {
                // The guard clears the session and Service Worker caches;
                // this app also discards any cached query data so no
                // authenticated response outlives the session (T005 contract:
                // "any cached query data is discarded" on sign-out).
                queryClient.clear();
                actions.signOut();
              }}
            >
              <AppContent session={session} apiBaseUrl={apiBaseUrl} />
            </CustomerShell>
          </HttpClientProvider>
        </QueryClientProvider>
      )}
    </AccountGuard>
  </OfflineGuard>
);
