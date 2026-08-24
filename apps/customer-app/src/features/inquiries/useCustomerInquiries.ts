import { useQuery } from '@tanstack/react-query';
import type { CustomerPolymorphicInquiry } from '@carchief/domain';
import { HttpClient } from '@carchief/api-client';
import { loadCustomerSession } from '../account/index.js';
import { CustomerInquiryService } from '@carchief/api-client';

export interface UseCustomerInquiriesResult {
  inquiries: CustomerPolymorphicInquiry[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Fetch the signed-in customer's quote-request inquiries (D02-P13-T006, CUST-34).
 * Lists the customer's own inquiries plus per-vehicle inquirer-count aggregates.
 *
 * Builds its own `HttpClient` with an empty base URL rather than the shared
 * `useHttpClient()` context: that context's fallback base URL already ends
 * in `/api/v1` (to serve older services whose paths omit that prefix, e.g.
 * `CustomerInvoiceService`'s `/customer/invoices`), while
 * `CustomerInquiryService.list()` requests the full `/api/v1/customer/...`
 * path — combining the two doubles the prefix and 404s. This mirrors the
 * empty-base-URL `HttpClient` construction already proven correct by
 * `useCustomerVehicleDetail.ts` (D02-P13-T005) for the same new,
 * fully-prefixed service family.
 */
export function useCustomerInquiries(): UseCustomerInquiriesResult {
  const httpClient = new HttpClient({
    baseUrl: '',
    getAuthToken: () => loadCustomerSession()?.token,
  });

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['customerInquiries'],
    queryFn: async () => {
      const service = new CustomerInquiryService(httpClient);
      const response = await service.list();
      return response.items || [];
    },
    staleTime: 60 * 1000, // 1 minute
  });

  return {
    inquiries: data ?? [],
    isLoading,
    isError,
    error: error as Error | null,
    refetch: () => refetch(),
  };
}
