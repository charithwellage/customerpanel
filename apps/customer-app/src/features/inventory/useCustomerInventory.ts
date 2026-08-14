import { useState, useEffect, useCallback, useRef } from 'react';
import type { SearchVehiclesQuery, VehicleSearchResult } from '@carchief/domain';
import { parseNaturalSearchQuery } from '@carchief/vehicle-search';
import { HttpClient, VehicleService } from '@carchief/api-client';
import type { CustomerInventoryState } from './types.js';

export interface UseCustomerInventoryOptions {
  apiBaseUrl?: string;
  token?: string;
  initialQuery?: SearchVehiclesQuery;
}

export function useCustomerInventory({
  apiBaseUrl = '',
  token,
  initialQuery = {},
}: UseCustomerInventoryOptions = {}) {
  const [query, setQuery] = useState<SearchVehiclesQuery>(initialQuery);
  const [naturalPhrase, setNaturalPhrase] = useState<string>(initialQuery.searchQuery || '');
  const [state, setState] = useState<CustomerInventoryState>({
    items: [],
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 0,
    facets: undefined,
    loading: true,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchInventory = useCallback(
    async (currentQuery: SearchVehiclesQuery) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const httpClient = new HttpClient({
          baseUrl: apiBaseUrl,
          getAuthToken: () => token,
        });
        const vehicleService = new VehicleService(httpClient);

        const queryWithAudience: SearchVehiclesQuery = {
          ...currentQuery,
          audience: 'customer',
        };

        const result: VehicleSearchResult = await vehicleService.searchVehicles(queryWithAudience);

        if (!controller.signal.aborted) {
          setState({
            items: result.items,
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages,
            facets: result.facets,
            loading: false,
            error: null,
          });
        }
      } catch (err: unknown) {
        if (!controller.signal.aborted) {
          const message = err instanceof Error ? err.message : 'Unable to load customer inventory';
          setState((prev) => ({
            ...prev,
            loading: false,
            error: message,
          }));
        }
      }
    },
    [apiBaseUrl, token]
  );

  useEffect(() => {
    fetchInventory(query);
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchInventory, query]);

  const updateQuery = useCallback((updates: Partial<SearchVehiclesQuery>) => {
    setQuery((prev) => ({ ...prev, ...updates, page: 1 }));
  }, []);

  const handleApplyNaturalSearch = useCallback(() => {
    const parsed = parseNaturalSearchQuery(naturalPhrase);
    setQuery((prev) => ({
      ...prev,
      searchQuery: naturalPhrase || undefined,
      make: parsed.parsedParams.make || undefined,
      bodyStyle: parsed.parsedParams.bodyStyle || undefined,
      priceMax: parsed.parsedParams.priceMax || undefined,
      yearMin: parsed.parsedParams.yearMin || undefined,
      page: 1,
    }));
  }, [naturalPhrase]);

  const handleResetFilters = useCallback(() => {
    setNaturalPhrase('');
    setQuery({ page: 1, limit: 12 });
  }, []);

  const understoodTokens = parseNaturalSearchQuery(naturalPhrase).understoodTokens;

  return {
    state,
    query,
    naturalPhrase,
    understoodTokens,
    setNaturalPhrase,
    applyNaturalSearch: handleApplyNaturalSearch,
    updateQuery,
    resetFilters: handleResetFilters,
    refetch: () => fetchInventory(query),
  };
}
