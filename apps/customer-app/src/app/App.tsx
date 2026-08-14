import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AccountGuard, type CustomerSession, HttpClientProvider } from '../features/account/index.js';
import { OfflineGuard } from '../features/pwa/index.js';
import { CustomerShell, useCustomerShell, type CustomerUser } from '../features/shell/index.js';
import { OverviewPage } from '../features/dashboard/index.js';
import { CustomerInventoryPage, CustomerVehicleDetailPage } from '../features/inventory/index.js';
import { CustomerFleetPage, CustomerFleetDetailPage } from '../features/vehicles/index.js';
import { CustomerInvoicesPage, CustomerInvoiceDetailPage } from '../features/invoices/index.js';
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
 * Only fields the demo JWT actually carries are used. `JwtClaims` has no name
 * or company field, so `session.user.name` is whatever
 * `createDemoCustomerSession` derived from the real address and `company` stays
 * undefined rather than being invented.
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

  if (activeRoute === '/invoices') {
    return (
      <CustomerInvoicesPage
        onSelectInvoice={(invoice) => {
          setActiveRoute(`/invoices/${invoice.id}`);
        }}
      />
    );
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
      {(session) => (
        <QueryClientProvider client={queryClient}>
          <HttpClientProvider apiBaseUrl={apiBaseUrl}>
            <CustomerShell
              initialUser={toShellUser(session)}
              initialRoute="/dashboard"
              pageTitle="Customer Portal"
              pageSubtitle="Account access and application shell"
            >
              <AppContent session={session} apiBaseUrl={apiBaseUrl} />
            </CustomerShell>
          </HttpClientProvider>
        </QueryClientProvider>
      )}
    </AccountGuard>
  </OfflineGuard>
);
