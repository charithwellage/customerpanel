'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import type { SearchVehiclesQuery, VehicleSearchResult } from '@carchief/domain';
import { VehicleService, HttpClient } from '@carchief/api-client';
import {
  parseNaturalSearchQuery,
  parseUrlSearchQuery,
  serializeSearchQuery,
  type UnderstoodToken,
  type ParsedNaturalQueryResult,
} from '@carchief/vehicle-search';

export interface UseVehicleSearchOrchestrationOptions {
  service?: VehicleService;
  baseUrl?: string;
  initialQuery?: SearchVehiclesQuery;
}

export interface UseVehicleSearchOrchestrationReturn {
  query: SearchVehiclesQuery;
  result: VehicleSearchResult | null;
  isLoading: boolean;
  isPending: boolean;
  error: string | null;
  understoodTokens: UnderstoodToken[];
  naturalPhrase: string;
  setNaturalPhrase: (phrase: string) => void;
  applyNaturalSearch: (phrase?: string) => ParsedNaturalQueryResult;
  updateQuery: (updates: Partial<SearchVehiclesQuery>) => void;
  resetFilters: () => void;
  setPage: (page: number) => void;
  setSortBy: (sortBy: SearchVehiclesQuery['sortBy']) => void;
  refetch: () => Promise<void>;
}

export function useVehicleSearchOrchestration(
  options: UseVehicleSearchOrchestrationOptions = {}
): UseVehicleSearchOrchestrationReturn {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [service] = useState<VehicleService>(
    () =>
      options.service ||
      new VehicleService(new HttpClient({ baseUrl: options.baseUrl || 'http://127.0.0.1:4000' }))
  );

  const [query, setQuery] = useState<SearchVehiclesQuery>(() => {
    const urlQuery = searchParams ? parseUrlSearchQuery(searchParams) : {};
    return { ...options.initialQuery, ...urlQuery };
  });

  const [result, setResult] = useState<VehicleSearchResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [naturalPhrase, setNaturalPhrase] = useState<string>(query.searchQuery || '');
  const [understoodTokens, setUnderstoodTokens] = useState<UnderstoodToken[]>([]);

  // Sync state with URL search parameters
  useEffect(() => {
    if (searchParams) {
      const parsed = parseUrlSearchQuery(searchParams);
      setQuery((prev) => {
        if (JSON.stringify(prev) === JSON.stringify(parsed)) return prev;
        return parsed;
      });
      if (parsed.searchQuery) {
        setNaturalPhrase(parsed.searchQuery);
      }
    }
  }, [searchParams]);

  // Execute vehicle search request
  const fetchSearchResults = useCallback(
    async (activeQuery: SearchVehiclesQuery) => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await service.searchVehicles(activeQuery);
        setResult(data);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to search vehicles. Please try again.';
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [service]
  );

  useEffect(() => {
    fetchSearchResults(query);
  }, [query, fetchSearchResults]);

  // Update URL search parameters
  const updateUrl = useCallback(
    (newQuery: SearchVehiclesQuery) => {
      const serialized = serializeSearchQuery(newQuery, searchParams || undefined);
      const url = `${pathname || '/vehicles'}?${serialized.toString()}`;
      startTransition(() => {
        router.push(url);
      });
    },
    [router, pathname, searchParams]
  );

  const updateQuery = useCallback(
    (updates: Partial<SearchVehiclesQuery>) => {
      const updated = { ...query, ...updates, page: updates.page ?? 1 };
      setQuery(updated);
      updateUrl(updated);
    },
    [query, updateUrl]
  );

  const applyNaturalSearch = useCallback(
    (phrase?: string): ParsedNaturalQueryResult => {
      const targetPhrase = phrase !== undefined ? phrase : naturalPhrase;
      const parsed = parseNaturalSearchQuery(targetPhrase);

      setUnderstoodTokens(parsed.understoodTokens);

      const updatedQuery: SearchVehiclesQuery = {
        ...query,
        ...parsed.parsedParams,
        page: 1,
      };

      setQuery(updatedQuery);
      updateUrl(updatedQuery);

      return parsed;
    },
    [naturalPhrase, query, updateUrl]
  );

  const resetFilters = useCallback(() => {
    // Preserve market, destinationPort and collection context during reset
    const resetState: SearchVehiclesQuery = {
      market: query.market,
      destinationPort: query.destinationPort,
      page: 1,
      limit: 12,
      sortBy: 'newest',
    };
    setNaturalPhrase('');
    setUnderstoodTokens([]);
    setQuery(resetState);
    updateUrl(resetState);
  }, [query.market, query.destinationPort, updateUrl]);

  const setPage = useCallback(
    (page: number) => {
      updateQuery({ page });
    },
    [updateQuery]
  );

  const setSortBy = useCallback(
    (sortBy: SearchVehiclesQuery['sortBy']) => {
      updateQuery({ sortBy, page: 1 });
    },
    [updateQuery]
  );

  const refetch = useCallback(async () => {
    await fetchSearchResults(query);
  }, [fetchSearchResults, query]);

  return {
    query,
    result,
    isLoading,
    isPending,
    error,
    understoodTokens,
    naturalPhrase,
    setNaturalPhrase,
    applyNaturalSearch,
    updateQuery,
    resetFilters,
    setPage,
    setSortBy,
    refetch,
  };
}
