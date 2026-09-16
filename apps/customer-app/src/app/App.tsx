import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AccountGuard, type CustomerSession, HttpClientProvider } from '../features/account/index.js';
import { OfflineGuard } from '../features/pwa/index.js';
import { CustomerShell, useCustomerShell, type CustomerUser } from '../features/shell/index.js';
import { OverviewPage } from '../features/dashboard/index.js';
import { CustomerStatementPage } from '../features/statement/index.js';
import { CustomerInventoryPage, CustomerVehicleDetailPage } from '../features/inventory/index.js';
import { CustomerFleetPage, CustomerFleetDetailPage, PublicVehicleTrackerPage } from '../features/vehicles/index.js';
import { DocumentsPage } from '../features/documents/index.js';
import { CustomerInvoicesPage, CustomerInvoiceDetailPage } from '../features/invoices/index.js';
import { PaymentsPage } from '../features/payments/index.js';
import { PaymentAllocationsPage } from '../features/payment-allocations/index.js';
import { NotificationsPage } from '../features/notifications/index.js';
import { ProfilePage } from '../features/profile/index.js';
import { CustomerInquiriesPage } from '../features/inquiries/index.js';
import { CustomerWishlistPage } from '../features/wishlist/index.js';
import { CustomerFavouritesPage } from '../features/favourites/index.js';
import { CustomerDemandPage } from '../features/demand/index.js';
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

  if (activeRoute === '/dashboard' || activeRoute.startsWith('/dashboard?') || activeRoute.startsWith('/dashboard#')) {
    return <OverviewPage />;
  }

  if (activeRoute === '/statement') {
    return <CustomerStatementPage />;
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

  if (activeRoute.startsWith('/wishlist/')) {
    const rawPath = activeRoute.substring('/wishlist/'.length);
    const [slug] = rawPath.split('?');
    return (
      <CustomerVehicleDetailPage
        slug={slug}
        apiBaseUrl={apiBaseUrl}
        token={session.token}
        backLabel="Back to Wishlist"
        onBack={() => {
          setActiveRoute('/wishlist');
        }}
      />
    );
  }

  if (activeRoute.startsWith('/inventory/')) {
    const rawPath = activeRoute.substring('/inventory/'.length);
    const [slug, query] = rawPath.split('?');
    const params = new URLSearchParams(query || '');
    const isFromWishlist = params.get('from') === 'wishlist' || activeRoute.includes('from=wishlist');
    const isFromDashboard =
      params.get('from') === 'dashboard' ||
      params.get('from') === 'dashboard_personalized' ||
      activeRoute.includes('from=dashboard') ||
      activeRoute.includes('section=personalized_vehicles');
    const isFromOrdersReserved =
      params.get('from') === 'orders_reserved' ||
      params.get('from') === 'reserved' ||
      params.get('tab') === 'reservedVehicles' ||
      activeRoute.includes('from=orders_reserved');
    const isFromOrdersPurchased =
      params.get('from') === 'orders_purchased' ||
      params.get('from') === 'purchased' ||
      params.get('tab') === 'purchasedVehicles' ||
      activeRoute.includes('from=orders_purchased');
    const isFromInquiries =
      params.get('from') === 'inquiries' ||
      params.get('from') === 'inquiry' ||
      activeRoute.includes('from=inquiries');

    let backLabel = 'Back to Inventory';
    if (isFromInquiries) {
      backLabel = 'Back to Inquiries & Quotes';
    } else if (isFromWishlist) {
      backLabel = 'Back to Wishlist';
    } else if (isFromDashboard) {
      backLabel = 'Back to Recommended Vehicles';
    } else if (isFromOrdersReserved) {
      backLabel = 'Back to Reserved Vehicles';
    } else if (isFromOrdersPurchased) {
      backLabel = 'Back to Purchased Vehicles';
    }

    return (
      <CustomerVehicleDetailPage
        slug={slug}
        apiBaseUrl={apiBaseUrl}
        token={session.token}
        backLabel={backLabel}
        onBack={() => {
          if (isFromInquiries) {
            setActiveRoute('/inquiries');
          } else if (isFromWishlist) {
            setActiveRoute('/wishlist');
          } else if (isFromDashboard) {
            setActiveRoute('/dashboard?section=personalized_vehicles');
          } else if (isFromOrdersReserved) {
            setActiveRoute('/vehicles?tab=reservedVehicles');
          } else if (isFromOrdersPurchased) {
            setActiveRoute('/vehicles?tab=purchasedVehicles');
          } else {
            setActiveRoute('/inventory');
          }
        }}
      />
    );
  }

  if (activeRoute.startsWith('/dashboard/vehicle/') || activeRoute.startsWith('/dashboard/recommended/')) {
    const rawPath = activeRoute.startsWith('/dashboard/vehicle/')
      ? activeRoute.substring('/dashboard/vehicle/'.length)
      : activeRoute.substring('/dashboard/recommended/'.length);
    const [slug] = rawPath.split('?');
    return (
      <CustomerVehicleDetailPage
        slug={slug}
        apiBaseUrl={apiBaseUrl}
        token={session.token}
        backLabel="Back to Recommended Vehicles"
        onBack={() => {
          setActiveRoute('/dashboard?section=personalized_vehicles');
        }}
      />
    );
  }

  if (activeRoute === '/demand' || activeRoute.startsWith('/demand?')) {
    return <CustomerDemandPage />;
  }

  if (activeRoute === '/inquiries') {
    return <CustomerInquiriesPage />;
  }

  if (activeRoute === '/wishlist' || activeRoute.startsWith('/wishlist?') || activeRoute.startsWith('/wishlist#')) {
    return <CustomerWishlistPage />;
  }

  if (activeRoute === '/favourites') {
    return <CustomerFavouritesPage />;
  }

  if (activeRoute === '/vehicles' || activeRoute.startsWith('/vehicles?')) {
    const tab = new URLSearchParams(activeRoute.split('?')[1] || '').get('tab');
    const initialOrdersTab =
      tab === 'reservedVehicles' || tab === 'purchasedVehicles' || tab === 'proforma' || tab === 'invoice'
        ? tab
        : tab === 'reserved'
        ? 'reservedVehicles'
        : tab === 'withPI'
        ? 'proforma'
        : tab === 'invoiced'
        ? 'invoice'
        : undefined;
    const initialTab = tab === 'reserved' || tab === 'withPI' || tab === 'invoiced' ? tab : undefined;

    return (
      <CustomerFleetPage
        initialTab={initialTab}
        initialOrdersTab={initialOrdersTab}
        onSelectVehicle={(vehicle) => {
          setActiveRoute(`/inventory/${vehicle.slug || vehicle.id}?from=orders_purchased`);
        }}
      />
    );
  }

  if (activeRoute.startsWith('/vehicles/')) {
    const rawPath = activeRoute.substring('/vehicles/'.length);
    const [idOrSlug, query] = rawPath.split('?');
    const params = new URLSearchParams(query || '');
    if (params.get('from') === 'inquiries' || activeRoute.includes('from=inquiries')) {
      return (
        <CustomerVehicleDetailPage
          slug={idOrSlug}
          apiBaseUrl={apiBaseUrl}
          token={session.token}
          backLabel="Back to Inquiries & Quotes"
          onBack={() => {
            setActiveRoute('/inquiries');
          }}
        />
      );
    }
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

  if (activeRoute === '/payments' || activeRoute.startsWith('/payments?') || activeRoute.startsWith('/payments#') || activeRoute === '/payment-allocations') {
    return <PaymentsPage />;
  }

  /* Section PAYMENT ALLOCATIONS hidden and commented from both web and mobile
  if (activeRoute === '/payment-allocations') {
    return <PaymentAllocationsPage />;
  }
  */

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

export const isPublicTrackerUrl = (): boolean => {
  if (typeof window === 'undefined') return false;
  const rawPath = window.location.pathname.toLowerCase().replace(/\/+$/, '');
  const isTrackerPath =
    rawPath === '/track' ||
    rawPath === '/tracker' ||
    rawPath.startsWith('/track/') ||
    rawPath.startsWith('/tracker/') ||
    rawPath.startsWith('/car-tracker') ||
    rawPath.startsWith('/vehicle-tracker') ||
    rawPath.startsWith('/shipment-tracker') ||
    rawPath.startsWith('/shipping-tracker');
  if (isTrackerPath) return true;

  const search = new URLSearchParams(window.location.search);
  const hasTrackerSearchParam = Boolean(
    search.get('chassis') ||
    search.get('tr_stock_no') ||
    search.get('stock') ||
    search.get('stockNumber') ||
    search.get('stockNo') ||
    search.get('vin') ||
    search.get('track') ||
    search.get('tracker')
  );
  if (hasTrackerSearchParam) return true;

  if (window.location.hash) {
    const hashLower = window.location.hash.toLowerCase();
    if (
      hashLower.includes('track') ||
      hashLower.includes('chassis') ||
      hashLower.includes('vin') ||
      hashLower.includes('stock')
    ) {
      return true;
    }
  }

  return false;
};

export const App: React.FC<AppProps> = ({ apiBaseUrl = '' }) => {
  const isTrackerRoute = isPublicTrackerUrl();

  if (isTrackerRoute) {
    return (
      <OfflineGuard>
        <QueryClientProvider client={queryClient}>
          <PublicVehicleTrackerPage apiBaseUrl={apiBaseUrl} />
        </QueryClientProvider>
      </OfflineGuard>
    );
  }

  return (
    <OfflineGuard>
      <AccountGuard apiBaseUrl={apiBaseUrl}>
        {(session, actions) => (
          <QueryClientProvider client={queryClient}>
            <HttpClientProvider
              apiBaseUrl={apiBaseUrl}
              onUnauthorized={() => {
                queryClient.clear();
                if (typeof window !== 'undefined') {
                  try {
                    window.history.replaceState(null, '', '/');
                  } catch {
                    // Ignore
                  }
                }
                actions.signOut();
              }}
            >
              <CustomerShell
                initialUser={toShellUser(session)}
                onSignOut={() => {
                  // The guard clears the session and Service Worker caches;
                  // this app also discards any cached query data so no
                  // authenticated response outlives the session (T005 contract:
                  // "any cached query data is discarded" on sign-out).
                  queryClient.clear();
                  if (typeof window !== 'undefined') {
                    try {
                      window.history.replaceState(null, '', '/');
                    } catch {
                      // Ignore
                    }
                  }
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
};
