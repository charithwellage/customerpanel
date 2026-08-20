import { useQuery } from '@tanstack/react-query';
import { CustomerStatementService, type CustomerStatementParams } from '@carchief/api-client';
import type { CustomerStatementSummary } from '@carchief/domain';
import { useHttpClient } from '../account/index.js';

export function useCustomerStatement(params?: CustomerStatementParams) {
  const httpClient = useHttpClient();
  const service = new CustomerStatementService(httpClient ?? undefined);

  return useQuery<CustomerStatementSummary>({
    queryKey: ['customer', 'statement', params?.fromDate, params?.toDate],
    queryFn: () => service.getCustomerStatement(params),
    enabled: Boolean(httpClient),
  });
}
