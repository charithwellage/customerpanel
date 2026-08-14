import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { CustomerInvoiceDetail } from '@carchief/domain';
import { CustomerInvoiceService, type NormalizedApiError } from '@carchief/api-client';
import { useHttpClient } from '../account/index.js';

export function useCustomerInvoiceDetail(
  id: string | undefined
): UseQueryResult<CustomerInvoiceDetail | null, NormalizedApiError> {
  const httpClient = useHttpClient();

  return useQuery({
    queryKey: ['customer-invoice-detail', id],
    queryFn: async () => {
      if (!httpClient) {
        throw new Error('Customer invoice detail requires an authenticated HttpClient');
      }
      if (!id) {
        return null;
      }
      const service = new CustomerInvoiceService(httpClient);
      return service.getCustomerInvoiceDetail(id);
    },
    enabled: Boolean(id),
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
  });
}
