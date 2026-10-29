import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { CustomerDashboard, NormalizedApiError } from '@carchief/api-client';
import { DashboardService } from '@carchief/api-client';
import { useHttpClient } from '../account/index.js';

/**
 * Fetches the customer dashboard aggregate using TanStack Query.
 * Returns loading, error, and data states without invented values.
 *
 * Returns null data on 401/403 (unauthorized), throws on other errors.
 * Supports refetching via queryClient invalidation.
 */
export function useDashboard(): UseQueryResult<CustomerDashboard, NormalizedApiError> {
  const httpClient = useHttpClient();

  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      if (!httpClient) {
        throw new Error('Dashboard requires an authenticated HttpClient');
      }
      const service = new DashboardService(httpClient);
      try {
        return await service.getCustomerDashboard();
      } catch (err: unknown) {
        if (
          (err && typeof err === 'object' && 'statusCode' in err && (err as { statusCode: number }).statusCode === 404) ||
          (err instanceof Error && /HTTP 404/i.test(err.message))
        ) {
          return null as unknown as CustomerDashboard;
        }
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 1,
    throwOnError: false,
  });
}
