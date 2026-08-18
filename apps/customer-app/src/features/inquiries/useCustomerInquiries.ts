import { useQuery } from '@tanstack/react-query';
import type { CustomerInquirySummary } from '@carchief/domain';
import { useHttpClient } from '../account/index.js';
import { CustomerInquiryService } from '@carchief/api-client';

export interface UseCustomerInquiriesResult {
  inquiries: CustomerInquirySummary[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Fetch the signed-in customer's quote-request inquiries (D02-P13-T006, CUST-34).
 * Lists the customer's own inquiries plus per-vehicle inquirer-count aggregates.
 */
export function useCustomerInquiries(): UseCustomerInquiriesResult {
  const httpClient = useHttpClient();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['customerInquiries'],
    queryFn: async () => {
      const service = new CustomerInquiryService(httpClient ?? undefined);
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
