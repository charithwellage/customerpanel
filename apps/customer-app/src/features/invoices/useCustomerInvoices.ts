import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { CustomerInvoiceListResponse, ListCustomerInvoicesQuery } from '@carchief/domain';
import { CustomerInvoiceService, type NormalizedApiError } from '@carchief/api-client';
import { useHttpClient } from '../account/index.js';

export function useCustomerInvoices(
  query?: ListCustomerInvoicesQuery
): UseQueryResult<CustomerInvoiceListResponse, NormalizedApiError> {
  const httpClient = useHttpClient();

  return useQuery({
    queryKey: ['customer-invoices', query?.type, query?.status, query?.query, query?.page, query?.limit],
    queryFn: async () => {
      if (!httpClient) {
        throw new Error('Customer invoices list requires an authenticated HttpClient');
      }
      const service = new CustomerInvoiceService(httpClient);
      return service.listCustomerInvoices(query);
    },
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
  });
}
