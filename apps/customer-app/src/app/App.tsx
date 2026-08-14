import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AccountGuard, type CustomerSession, HttpClientProvider } from '../features/account/index.js';
import { OfflineGuard } from '../features/pwa/index.js';
import { CustomerShell, type CustomerUser } from '../features/shell/index.js';
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
  };
}

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
              <PortalPlaceholder signedInAs={session.user.email} />
            </CustomerShell>
          </HttpClientProvider>
        </QueryClientProvider>
      )}
    </AccountGuard>
  </OfflineGuard>
);
