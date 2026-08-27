import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { CustomerInvoiceDocument } from '@carchief/domain';
import { CustomerInvoiceService, type NormalizedApiError } from '@carchief/api-client';
import { useHttpClient } from '../account/index.js';

export function useCustomerInvoiceDocument(
  id: string | undefined,
  options?: { enabled?: boolean }
): UseQueryResult<CustomerInvoiceDocument | null, NormalizedApiError> {
  const httpClient = useHttpClient();
  const isEnabled = Boolean(id) && (options?.enabled ?? true);

  return useQuery({
    queryKey: ['customer-invoice-document', id],
    queryFn: async () => {
      if (!httpClient) {
        throw new Error('Customer invoice document requires an authenticated HttpClient');
      }
      if (!id) {
        return null;
      }
      const service = new CustomerInvoiceService(httpClient);
      return service.getCustomerInvoiceDocument(id);
    },
    enabled: isEnabled,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
  });
}
