'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
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
  lockedCollection?: string;
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
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [service] = useState<VehicleService>(
    () =>
      options.service ||
      new VehicleService(new HttpClient({
        // Browser requests must stay same-origin so remote clients use the
        // public-web /api/v1 proxy instead of resolving 127.0.0.1 locally.
        baseUrl: options.baseUrl || (typeof window !== 'undefined' ? '' : process.env.API_BASE_URL || 'http://127.0.0.1:4000'),
      }))
  );

  const [query, setQuery] = useState<SearchVehiclesQuery>(() => {
    const urlQuery = searchParams ? parseUrlSearchQuery(searchParams) : {};
    return {
      ...options.initialQuery,
      ...urlQuery,
      ...(options.lockedCollection ? { collection: options.lockedCollection } : {}),
    };
  });

  const [result, setResult] = useState<VehicleSearchResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const requestSequence = useRef(0);

  const [naturalPhrase, setNaturalPhrase] = useState<string>(query.searchQuery || '');
  const [understoodTokens, setUnderstoodTokens] = useState<UnderstoodToken[]>([]);

  // Sync state with URL search parameters
  useEffect(() => {
    if (searchParams) {
      const parsed = parseUrlSearchQuery(searchParams);
      setQuery((prev) => {
        const nextQuery = options.lockedCollection
          ? { ...parsed, collection: options.lockedCollection }
          : parsed;
        if (JSON.stringify(prev) === JSON.stringify(nextQuery)) return prev;
        return nextQuery;
      });
      if (parsed.searchQuery) {
        setNaturalPhrase(parsed.searchQuery);
      }
    }
  }, [searchParams]);

  // Native history navigation is handled without remounting the showroom.
  // This keeps Back/Forward shareable while avoiding a route transition for
  // every individual filter interaction.
  useEffect(() => {
    const handlePopState = () => {
      const parsed = parseUrlSearchQuery(window.location.search);
      setQuery(options.lockedCollection ? { ...parsed, collection: options.lockedCollection } : parsed);
      setNaturalPhrase(parsed.searchQuery || '');
      setUnderstoodTokens([]);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [options.lockedCollection]);

  // Execute vehicle search request
  const fetchSearchResults = useCallback(
    async (activeQuery: SearchVehiclesQuery) => {
      const requestId = ++requestSequence.current;
      setIsLoading(true);
      setError(null);
      try {
        const data = await service.getVehicles(activeQuery);
        if (requestId !== requestSequence.current) return;
        setResult(data);
      } catch (err: unknown) {
        if (requestId !== requestSequence.current) return;
        const msg = err instanceof Error ? err.message : 'Failed to search vehicles. Please try again.';
        setError(msg);
      } finally {
        if (requestId === requestSequence.current) setIsLoading(false);
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
      const currentParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : searchParams || undefined;
      const serialized = serializeSearchQuery(newQuery, currentParams);
      const url = `${pathname || '/allstock'}?${serialized.toString()}`;
      if (typeof window !== 'undefined' && window.location.href !== `${window.location.origin}${url}`) {
        window.history.replaceState(window.history.state, '', url);
      }
    },
    [pathname, searchParams]
  );

  const updateQuery = useCallback(
    (updates: Partial<SearchVehiclesQuery>) => {
      const updated = {
        ...query,
        ...updates,
        ...(options.lockedCollection ? { collection: options.lockedCollection } : {}),
        page: updates.page ?? 1,
      };
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
        ...(options.lockedCollection ? { collection: options.lockedCollection } : {}),
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
      collection: options.lockedCollection || query.collection,
      page: 1,
      limit: 12,
      sortBy: 'newest',
    };
    setNaturalPhrase('');
    setUnderstoodTokens([]);
    setQuery(resetState);
    updateUrl(resetState);
  }, [options.lockedCollection, query.market, query.destinationPort, query.collection, updateUrl]);

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
    isPending: false,
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
