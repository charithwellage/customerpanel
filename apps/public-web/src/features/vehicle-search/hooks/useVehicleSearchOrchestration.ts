'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import type { SearchVehiclesQuery, VehicleSearchResult } from '@carchief/domain';
import { AiVehicleSearchService, VehicleService, HttpClient } from '@carchief/api-client';
import {
  parseNaturalSearchQuery,
  parseUrlSearchQuery,
  serializeSearchQuery,
  type UnderstoodToken,
  type ParsedNaturalQueryResult,
  useAiVehicleSearch,
} from '@carchief/vehicle-search';

export interface UseVehicleSearchOrchestrationOptions {
  service?: VehicleService;
  aiService?: AiVehicleSearchService;
  baseUrl?: string;
  initialQuery?: SearchVehiclesQuery;
  lockedCollection?: string;
  lockedCategory?: string;
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
  aiPrompt: string;
  setAiPrompt: (prompt: string) => void;
  applyAiSearch: () => Promise<unknown>;
  clearAiSearch: () => void;
  isAiLoading: boolean;
  isAiActive: boolean;
  isAiUnavailable: boolean;
  aiError: string | null;
  aiSummary?: string;
  aiConstraints: string[];
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
  const [aiService] = useState<AiVehicleSearchService>(
    () => options.aiService || new AiVehicleSearchService(new HttpClient({
      baseUrl: options.baseUrl || (typeof window !== 'undefined' ? '' : process.env.API_BASE_URL || 'http://127.0.0.1:4000'),
    }))
  );

  const [query, setQuery] = useState<SearchVehiclesQuery>(() => {
    const urlQuery = searchParams ? parseUrlSearchQuery(searchParams) : {};
    return {
      ...options.initialQuery,
      ...urlQuery,
      ...(options.lockedCollection ? { collection: options.lockedCollection } : {}),
      ...(options.lockedCategory ? { category: options.lockedCategory } : {}),
    };
  });

  const [result, setResult] = useState<VehicleSearchResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const requestSequence = useRef(0);

  const [naturalPhrase, setNaturalPhrase] = useState<string>(query.searchQuery || '');
  const [understoodTokens, setUnderstoodTokens] = useState<UnderstoodToken[]>([]);
  const ai = useAiVehicleSearch({
    service: aiService,
    request: {
      scope: 'publicInventory',
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      filters: query,
      constraints: {
        ...(options.lockedCollection ? { collection: options.lockedCollection } : {}),
        ...(options.lockedCategory ? { category: options.lockedCategory } : {}),
      },
    },
  });

  const displayedResult: VehicleSearchResult | null = ai.result && ai.result.scope === 'publicInventory'
    ? {
        items: ai.result.items as VehicleSearchResult['items'],
        total: ai.result.total,
        page: ai.result.page,
        limit: ai.result.limit,
        totalPages: ai.result.totalPages,
        hasNextPage: ai.result.hasNextPage,
        hasPrevPage: ai.result.hasPrevPage,
        facets: ai.result.facets || result?.facets || emptyFacets(),
      }
    : result;

  // Sync state with URL search parameters
  useEffect(() => {
    if (searchParams) {
      const parsed = parseUrlSearchQuery(searchParams);
      setQuery((prev) => {
        const nextQuery = options.lockedCollection
          ? { ...parsed, collection: options.lockedCollection, ...(options.lockedCategory ? { category: options.lockedCategory } : {}) }
          : options.lockedCategory
            ? { ...parsed, category: options.lockedCategory }
            : parsed;
        if (JSON.stringify(prev) === JSON.stringify(nextQuery)) return prev;
        return nextQuery;
      });
      if (parsed.searchQuery) {
        setNaturalPhrase(parsed.searchQuery);
      }
    }
  }, [options.lockedCategory, options.lockedCollection, searchParams]);

  // Native history navigation is handled without remounting the showroom.
  // This keeps Back/Forward shareable while avoiding a route transition for
  // every individual filter interaction.
  useEffect(() => {
    const handlePopState = () => {
      const parsed = parseUrlSearchQuery(window.location.search);
      setQuery(options.lockedCollection
        ? { ...parsed, collection: options.lockedCollection, ...(options.lockedCategory ? { category: options.lockedCategory } : {}) }
        : options.lockedCategory
          ? { ...parsed, category: options.lockedCategory }
          : parsed);
      setNaturalPhrase(parsed.searchQuery || '');
      setUnderstoodTokens([]);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [options.lockedCategory, options.lockedCollection]);

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
      ai.clear();
      const updated = {
        ...query,
        ...updates,
        ...(options.lockedCollection ? { collection: options.lockedCollection } : {}),
        ...(options.lockedCategory ? { category: options.lockedCategory } : {}),
        page: updates.page ?? 1,
      };
      setQuery(updated);
      updateUrl(updated);
    },
    [ai.clear, query, updateUrl]
  );

  const applyNaturalSearch = useCallback(
    (phrase?: string): ParsedNaturalQueryResult => {
      const targetPhrase = phrase !== undefined ? phrase : naturalPhrase;
      ai.clear();
      const parsed = parseNaturalSearchQuery(targetPhrase);

      setUnderstoodTokens(parsed.understoodTokens);

      const updatedQuery: SearchVehiclesQuery = {
        ...query,
        ...parsed.parsedParams,
        ...(options.lockedCollection ? { collection: options.lockedCollection } : {}),
        ...(options.lockedCategory ? { category: options.lockedCategory } : {}),
        page: 1,
      };

      setQuery(updatedQuery);
      updateUrl(updatedQuery);

      return parsed;
    },
    [ai.clear, naturalPhrase, query, updateUrl]
  );

  const resetFilters = useCallback(() => {
    ai.clear();
    // Preserve market, destinationPort and collection context during reset
    const resetState: SearchVehiclesQuery = {
      market: query.market,
      destinationPort: query.destinationPort,
      collection: options.lockedCollection || query.collection,
      category: options.lockedCategory || query.category,
      page: 1,
      limit: 15,
      sortBy: 'newest',
    };
    setNaturalPhrase('');
    setUnderstoodTokens([]);
    setQuery(resetState);
    updateUrl(resetState);
  }, [ai.clear, options.lockedCategory, options.lockedCollection, query.market, query.destinationPort, query.collection, query.category, updateUrl]);

  const setPage = useCallback(
    (page: number) => {
      if (ai.isActive) void ai.search({ page });
      else updateQuery({ page });
    },
    [ai.isActive, ai.search, updateQuery]
  );

  const setSortBy = useCallback(
    (sortBy: SearchVehiclesQuery['sortBy']) => {
      updateQuery({ sortBy, page: 1 });
    },
    [updateQuery]
  );

  const handleNaturalPhraseChange = useCallback((value: string) => {
    ai.clear();
    setNaturalPhrase(value);
  }, [ai.clear]);

  const refetch = useCallback(async () => {
    await fetchSearchResults(query);
  }, [fetchSearchResults, query]);

  return {
    query,
    result: displayedResult,
    isLoading,
    isPending: false,
    error,
    understoodTokens,
    naturalPhrase,
    setNaturalPhrase: handleNaturalPhraseChange,
    applyNaturalSearch,
    updateQuery,
    resetFilters,
    setPage,
    setSortBy,
    refetch,
    aiPrompt: ai.prompt,
    setAiPrompt: ai.setPrompt,
    applyAiSearch: ai.search,
    clearAiSearch: ai.clear,
    isAiLoading: ai.isLoading,
    isAiActive: ai.isActive,
    isAiUnavailable: ai.unavailable,
    aiError: ai.error,
    aiSummary: ai.result?.interpretation.summary,
    aiConstraints: ai.result?.interpretation.appliedConstraints || [],
  };
}

function emptyFacets(): VehicleSearchResult['facets'] {
  const range = { min: 0, max: 0 };
  return {
    makes: [], bodyStyles: [], fuelTypes: [], transmissions: [], driveTrains: [], models: [], modelCodes: [],
    vehicleTypes: [], vehicleSubTypes: [], locationStatuses: [], destinationPorts: [], overdrives: [], colors: [],
    exteriorGrades: [], steerings: [], stockCountries: [], stockLocations: [], features: [], yearRange: range,
    priceRange: range, mileageRange: range, engineCcRange: range, seatsRange: range, loadCapacityRange: range,
  };
}
