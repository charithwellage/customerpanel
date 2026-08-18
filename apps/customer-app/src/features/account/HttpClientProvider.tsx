import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { HttpClient, type HttpClientConfig } from '@carchief/api-client';
import { loadCustomerSession } from './accountState.js';

interface HttpClientContextValue {
  httpClient: HttpClient | null;
}

const HttpClientContext = createContext<HttpClientContextValue | undefined>(undefined);

export interface HttpClientProviderProps {
  children: ReactNode;
  apiBaseUrl?: string;
}

/**
 * Provides the HttpClient to all descendant features.
 * Reads the auth token from session storage and passes it to the HttpClient.
 */
export const HttpClientProvider: React.FC<HttpClientProviderProps> = ({
  children,
  apiBaseUrl = '',
}) => {
  const httpClient = useMemo(() => {
    const baseUrl = apiBaseUrl || (() => {
      if (typeof window === 'undefined') return '';
      return `${window.location.origin}/api/v1`;
    })();

    if (!baseUrl) {
      return null;
    }

    const config: HttpClientConfig = {
      baseUrl,
      timeoutMs: 10000,
      getAuthToken: () => {
        const session = loadCustomerSession();
        return session?.token || null;
      },
    };

    return new HttpClient(config);
  }, [apiBaseUrl]);

  return (
    <HttpClientContext.Provider value={{ httpClient }}>
      {children}
    </HttpClientContext.Provider>
  );
};

export function useHttpClient(): HttpClient | null {
  const context = useContext(HttpClientContext);
  return context ? context.httpClient : null;
}
