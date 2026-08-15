import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { CustomerVehicleListResponse, ListCustomerVehiclesQuery } from '@carchief/domain';
import { CustomerVehicleService, type NormalizedApiError } from '@carchief/api-client';
import { useHttpClient } from '../account/index.js';

export function useCustomerVehicles(
  query?: ListCustomerVehiclesQuery
): UseQueryResult<CustomerVehicleListResponse, NormalizedApiError> {
  const httpClient = useHttpClient();

  return useQuery({
    queryKey: ['customer-vehicles', query?.status, query?.query, query?.page, query?.limit],
    queryFn: async () => {
      if (!httpClient) {
        throw new Error('Customer vehicles list requires an authenticated HttpClient');
      }
      const service = new CustomerVehicleService(httpClient);
      return service.listCustomerVehicles(query);
    },
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
  });
}
