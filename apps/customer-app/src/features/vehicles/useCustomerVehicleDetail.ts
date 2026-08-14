import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { CustomerVehicleDetail } from '@carchief/domain';
import { CustomerVehicleService, type NormalizedApiError } from '@carchief/api-client';
import { useHttpClient } from '../account/index.js';

export function useCustomerVehicleDetail(
  idOrSlug: string
): UseQueryResult<CustomerVehicleDetail | null, NormalizedApiError> {
  const httpClient = useHttpClient();

  return useQuery({
    queryKey: ['customer-vehicle-detail', idOrSlug],
    queryFn: async () => {
      if (!httpClient) {
        throw new Error('Customer vehicle detail requires an authenticated HttpClient');
      }
      const service = new CustomerVehicleService(httpClient);
      return service.getCustomerVehicleDetail(idOrSlug);
    },
    enabled: Boolean(idOrSlug),
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
  });
}
