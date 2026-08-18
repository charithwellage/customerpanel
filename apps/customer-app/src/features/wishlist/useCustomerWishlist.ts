import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { WishlistItem } from '@carchief/domain';
import { useHttpClient } from '../account/index.js';
import { WishlistService } from '@carchief/api-client';

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
  const httpClient = useHttpClient();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['customerWishlist'],
    queryFn: async () => {
      const service = new WishlistService(httpClient ?? undefined);
      const response = await service.list();
      return response.items || [];
    },
    staleTime: 60 * 1000, // 1 minute
  });

  const removeMutation = useMutation({
    mutationFn: async (vehicleSlug: string) => {
      const service = new WishlistService(httpClient ?? undefined);
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
