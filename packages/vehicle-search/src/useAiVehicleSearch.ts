'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { AiVehicleSearchRequest, AiVehicleSearchResponse } from '@carchief/domain';
import { AiVehicleSearchService, NormalizedApiError } from '@carchief/api-client';

export interface UseAiVehicleSearchOptions {
  service: AiVehicleSearchService | null;
  request: Omit<AiVehicleSearchRequest, 'query'>;
}

export function useAiVehicleSearch({ service, request }: UseAiVehicleSearchOptions) {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<AiVehicleSearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef(request);
  const sequenceRef = useRef(0);

  useEffect(() => { requestRef.current = request; }, [request]);

  const search = useCallback(async (overrides: Partial<Omit<AiVehicleSearchRequest, 'query' | 'scope'>> = {}) => {
    const normalizedPrompt = prompt.trim();
    if (!service || !normalizedPrompt) return null;
    const sequence = ++sequenceRef.current;
    setIsLoading(true);
    setUnavailable(false);
    setError(null);
    try {
      const response = await service.search({ ...requestRef.current, ...overrides, query: normalizedPrompt });
      if (sequence === sequenceRef.current) setResult(response);
      return response;
    } catch (caught: unknown) {
      if (sequence !== sequenceRef.current) return null;
      if (caught instanceof NormalizedApiError && caught.statusCode === 501) {
        setUnavailable(true);
      } else {
        setError(caught instanceof Error ? caught.message : 'Unable to complete AI vehicle search.');
      }
      return null;
    } finally {
      if (sequence === sequenceRef.current) setIsLoading(false);
    }
  }, [prompt, service]);

  const updatePrompt = useCallback((value: string) => {
    setPrompt(value);
    setUnavailable(false);
    setError(null);
  }, []);

  const clear = useCallback(() => {
    sequenceRef.current += 1;
    setPrompt('');
    setResult(null);
    setUnavailable(false);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    prompt,
    setPrompt: updatePrompt,
    result,
    isLoading,
    isActive: Boolean(result),
    unavailable,
    error,
    search,
    clear,
  };
}
