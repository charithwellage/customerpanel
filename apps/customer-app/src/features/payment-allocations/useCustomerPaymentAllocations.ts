import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { CustomerPaymentAllocationListResponse, ListCustomerPaymentAllocationsQuery } from '@carchief/domain';
import { CustomerPaymentService, type NormalizedApiError } from '@carchief/api-client';
import { useHttpClient } from '../account/index.js';

export function useCustomerPaymentAllocations(query: ListCustomerPaymentAllocationsQuery): UseQueryResult<CustomerPaymentAllocationListResponse, NormalizedApiError> {
  const httpClient = useHttpClient();
  return useQuery({
    queryKey: ['customer-payment-allocations', query],
    queryFn: () => {
      if (!httpClient) throw new Error('TT payment allocations require an authenticated HttpClient');
      return new CustomerPaymentService(httpClient).listCustomerPaymentAllocations(query);
    },
    enabled: Boolean(httpClient),
    staleTime: 30_000,
    retry: 1,
  });
}
