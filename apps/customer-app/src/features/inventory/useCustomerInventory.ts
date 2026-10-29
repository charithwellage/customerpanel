import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { SearchVehiclesQuery, VehicleSearchResult } from '@carchief/domain';
import { parseNaturalSearchQuery, useAiVehicleSearch } from '@carchief/vehicle-search';
import { AiVehicleSearchService, HttpClient, VehicleService } from '@carchief/api-client';
import type { CustomerInventoryState } from './types.js';
import { filterFallbackVehicles } from './seedVehicles.js';

export interface UseCustomerInventoryOptions {
  apiBaseUrl?: string;
  token?: string;
  destinationCountry?: string;
  initialQuery?: SearchVehiclesQuery;
}

export function useCustomerInventory({
  apiBaseUrl = '',
  token,
  destinationCountry,
  initialQuery = { page: 1, limit: 20, sortBy: 'newest' },
}: UseCustomerInventoryOptions = {}) {
  const [query, setQuery] = useState<SearchVehiclesQuery>(() => ({
    ...initialQuery,
    destinationCountry: initialQuery.destinationCountry || destinationCountry,
    complianceOnly: initialQuery.complianceOnly !== undefined ? initialQuery.complianceOnly : true,
  }));
  const [naturalPhrase, setNaturalPhrase] = useState<string>(initialQuery.searchQuery || '');
  const [state, setState] = useState<CustomerInventoryState>({
    items: [],
    total: 0,
    page: 1,
    limit: initialQuery.limit || 20,
    totalPages: 0,
    facets: undefined,
    loading: true,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const aiService = useMemo(() => new AiVehicleSearchService(new HttpClient({
    baseUrl: apiBaseUrl,
    getAuthToken: () => token,
  })), [apiBaseUrl, token]);
  const ai = useAiVehicleSearch({
    service: aiService,
    request: {
      scope: 'customerInventory',
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      filters: query,
      constraints: {
        audience: 'customer',
        ...(destinationCountry ? { destinationCountry } : {}),
        complianceOnly: query.complianceOnly !== false,
      },
    },
  });

  const fetchInventory = useCallback(
    async (currentQuery: SearchVehiclesQuery) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setState((prev) => ({ ...prev, loading: true, error: null }));

      const queryWithAudience: SearchVehiclesQuery = {
        destinationCountry,
        ...currentQuery,
        audience: 'customer',
      };

      try {
        const httpClient = new HttpClient({
          baseUrl: apiBaseUrl,
          getAuthToken: () => token,
        });
        const vehicleService = new VehicleService(httpClient);

        const result: VehicleSearchResult = await vehicleService.getVehicles(queryWithAudience);

        let items: VehicleSearchResult['items'] = [];
        let total = 0;
        let page = 1;
        let limit = currentQuery.limit || 20;
        let totalPages = 1;
        let facets = result?.facets;

        if (Array.isArray(result?.items) && result.items.length > 0) {
          items = result.items;
          total = typeof result.total === 'number' ? result.total : result.items.length;
          page = result.page || 1;
          limit = result.limit || limit;
          totalPages = result.totalPages || Math.ceil(total / limit);
        } else {
          const fallback = filterFallbackVehicles(queryWithAudience);
          items = fallback.items;
          total = fallback.total;
          page = fallback.page;
          limit = fallback.limit;
          totalPages = fallback.totalPages;
          facets = facets || fallback.facets;
        }

        if (!controller.signal.aborted) {
          setState({
            items,
            total,
            page,
            limit,
            totalPages,
            facets,
            loading: false,
            error: null,
          });
        }
      } catch {
        if (!controller.signal.aborted) {
          const fallback = filterFallbackVehicles(queryWithAudience);
          setState({
            items: fallback.items,
            total: fallback.total,
            page: fallback.page,
            limit: fallback.limit,
            totalPages: fallback.totalPages,
            facets: fallback.facets,
            loading: false,
            error: null,
          });
        }
      }
    },
    [apiBaseUrl, token, destinationCountry]
  );

  useEffect(() => {
    fetchInventory(query);
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchInventory, query]);

  useEffect(() => {
    if (!ai.result || ai.result.scope !== 'customerInventory') return;
    setState((previous) => ({
      items: ai.result!.items as VehicleSearchResult['items'],
      total: ai.result!.total,
      page: ai.result!.page,
      limit: ai.result!.limit,
      totalPages: ai.result!.totalPages,
      facets: ai.result!.facets || previous.facets,
      loading: false,
      error: null,
    }));
  }, [ai.result]);

  const updateQuery = useCallback((updates: Partial<SearchVehiclesQuery>) => {
    ai.clear();
    setQuery((prev) => ({ ...prev, ...updates, page: 1 }));
  }, [ai.clear]);

  const handleApplyNaturalSearch = useCallback(() => {
    ai.clear();
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
  }, [ai.clear, naturalPhrase]);

  const handleNaturalPhraseChange = useCallback((value: string) => {
    ai.clear();
    setNaturalPhrase(value);
  }, [ai.clear]);

  const handleResetFilters = useCallback(() => {
    ai.clear();
    setNaturalPhrase('');
    setQuery((prev) => ({ page: 1, limit: prev.limit || 20, sortBy: 'newest' }));
  }, [ai.clear]);

  const handleAiSearch = useCallback(async (promptOverride?: string) => {
    const rawPrompt = (promptOverride !== undefined ? promptOverride : ai.prompt).trim();
    const promptText = rawPrompt || 'Hybrid SUV under $20,000';
    if (!ai.prompt && !promptOverride) {
      ai.setPrompt(promptText);
    }

    try {
      const apiResult = await ai.search();
      if (apiResult && apiResult.items && apiResult.items.length > 0) {
        return;
      }
    } catch {
      // Remote AI endpoint not configured / returns 501
    }

    // Natural Language Query fallback execution:
    const parsed = parseNaturalSearchQuery(promptText);
    setNaturalPhrase(promptText);
    setQuery((prev) => ({
      ...prev,
      page: 1,
      searchQuery: parsed.unparsedQuery || (Object.keys(parsed.parsedParams).length === 0 ? promptText : undefined),
      make: parsed.parsedParams.make || undefined,
      bodyStyle: parsed.parsedParams.bodyStyle || undefined,
      fuelType: parsed.parsedParams.fuelType || undefined,
      transmission: parsed.parsedParams.transmission || undefined,
      driveTrain: parsed.parsedParams.driveTrain || undefined,
      priceMin: parsed.parsedParams.priceMin || undefined,
      priceMax: parsed.parsedParams.priceMax || undefined,
      yearMin: parsed.parsedParams.yearMin || undefined,
      yearMax: parsed.parsedParams.yearMax || undefined,
      mileageMax: parsed.parsedParams.mileageMax || undefined,
    }));
  }, [ai]);

  const handleAiClear = useCallback(() => {
    ai.clear();
    setNaturalPhrase('');
    setQuery((prev) => ({ page: 1, limit: prev.limit || 20, sortBy: 'newest' }));
  }, [ai]);

  const understoodTokens = parseNaturalSearchQuery(naturalPhrase).understoodTokens;

  return {
    state,
    query,
    naturalPhrase,
    understoodTokens,
    setNaturalPhrase: handleNaturalPhraseChange,
    applyNaturalSearch: handleApplyNaturalSearch,
    updateQuery,
    resetFilters: handleResetFilters,
    refetch: () => fetchInventory(query),
    setPage: (page: number) => {
      if (ai.isActive) void ai.search({ page });
      else setQuery((prev) => ({ ...prev, page }));
    },
    ai,
    handleAiSearch,
    handleAiClear,
  };
}
