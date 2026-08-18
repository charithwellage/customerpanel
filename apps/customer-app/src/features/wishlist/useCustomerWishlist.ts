import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { WishlistItem } from '@carchief/domain';
import { HttpClient, WishlistService } from '@carchief/api-client';
import { loadCustomerSession } from '../account/index.js';

export interface UseCustomerWishlistResult {
  items: WishlistItem[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  removeItem: (vehicleSlug: string) => Promise<void>;
  isRemoving: boolean;
}

/**
 * Fetch and manage the signed-in customer's wishlisted vehicles (D02-P13-T007, CUST-37).
 * Supports listing and removing items.
 */
export function useCustomerWishlist(): UseCustomerWishlistResult {
  // Builds its own `HttpClient` with an empty base URL rather than the
  // shared `useHttpClient()` context: that context's fallback base URL
  // already ends in `/api/v1` (to serve older services whose paths omit
  // that prefix), while `WishlistService` requests the full
  // `/api/v1/customer/...` path — combining the two doubles the prefix and
  // 404s. This mirrors the empty-base-URL `HttpClient` construction already
  // proven correct by `useCustomerVehicleDetail.ts` (D02-P13-T005) for the
  // same new, fully-prefixed service family.
  const httpClient = new HttpClient({
    baseUrl: '',
    getAuthToken: () => loadCustomerSession()?.token,
  });
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['customerWishlist'],
    queryFn: async () => {
      const service = new WishlistService(httpClient);
      const response = await service.list();
      return response.items || [];
    },
    staleTime: 60 * 1000, // 1 minute
  });

  const removeMutation = useMutation({
    mutationFn: async (vehicleSlug: string) => {
      const service = new WishlistService(httpClient);
      await service.remove(vehicleSlug);
    },
    onSuccess: () => {
      // Refetch the wishlist after removal
      queryClient.invalidateQueries({ queryKey: ['customerWishlist'] });
    },
  });

  return {
    items: data ?? [],
    isLoading,
    isError,
    error: error as Error | null,
    refetch: () => refetch(),
    removeItem: removeMutation.mutateAsync,
    isRemoving: removeMutation.isPending,
  };
}
