import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { FavouriteSearch, FavouriteSearchCriteria, FavouriteSearchFacets } from '@carchief/domain';
import type { NormalizedApiError } from '@carchief/api-client';
import { useHttpClient } from '../account/index.js';
import { FavouritesService } from '@carchief/api-client';

export interface UseCustomerFavouritesResult {
  favourites: FavouriteSearch[];
  facets: FavouriteSearchFacets | null;
  isLoading: boolean;
  isLoadingFacets: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  createFavourite: (name: string, criteria: FavouriteSearchCriteria) => Promise<FavouriteSearch>;
  removeFavourite: (id: string) => Promise<void>;
  isCreating: boolean;
  isRemoving: boolean;
  createError: NormalizedApiError | null;
  isFavouritesFull: boolean; // true when at 25-item limit
  favouriteLimit: number;
}

/**
 * Fetch and manage the signed-in customer's saved search-criteria favourites (D02-P13-T007, CUST-38/39/40).
 * Supports listing, creating, and removing favourites.
 * Enforces 25-favourite limit client-side and fetches facets for dropdown options.
 */
export function useCustomerFavourites(): UseCustomerFavouritesResult {
  const httpClient = useHttpClient();
  const queryClient = useQueryClient();
  const FAVOURITE_LIMIT = 25;

  const { data: favourites, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['customerFavourites'],
    queryFn: async () => {
      const service = new FavouritesService(httpClient ?? undefined);
      const response = await service.list();
      return response.items || [];
    },
    staleTime: 60 * 1000, // 1 minute
  });

  const { data: facets, isLoading: isLoadingFacets } = useQuery({
    queryKey: ['favouriteFacets'],
    queryFn: async () => {
      const service = new FavouritesService(httpClient ?? undefined);
      return await service.getFacets();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const createMutation = useMutation({
    mutationFn: async (params: { name: string; criteria: FavouriteSearchCriteria }) => {
      const service = new FavouritesService(httpClient ?? undefined);
      return await service.create(params.name, params.criteria);
    },
    onSuccess: () => {
      // Refetch the favourites list after creation
      queryClient.invalidateQueries({ queryKey: ['customerFavourites'] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const service = new FavouritesService(httpClient ?? undefined);
      await service.remove(id);
    },
    onSuccess: () => {
      // Refetch the favourites list after removal
      queryClient.invalidateQueries({ queryKey: ['customerFavourites'] });
    },
  });

  const isFavouritesFull = (favourites?.length ?? 0) >= FAVOURITE_LIMIT;

  return {
    favourites: favourites ?? [],
    facets: facets ?? null,
    isLoading,
    isLoadingFacets,
    isError,
    error: error as Error | null,
    refetch: () => refetch(),
    createFavourite: (name: string, criteria: FavouriteSearchCriteria) =>
      createMutation.mutateAsync({ name, criteria }),
    removeFavourite: removeMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isRemoving: removeMutation.isPending,
    createError: (createMutation.error as NormalizedApiError) ?? null,
    isFavouritesFull,
    favouriteLimit: FAVOURITE_LIMIT,
  };
}
