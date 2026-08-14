import { useQuery } from '@tanstack/react-query';
import type { CustomerDocument } from '@carchief/api-client';
import { LogisticsService } from '@carchief/api-client';
import { useHttpClient } from '../account/HttpClientProvider.js';

export function useDocuments() {
  const httpClient = useHttpClient();
  return useQuery<CustomerDocument[], Error>({
    queryKey: ['customer', 'documents'],
    enabled: Boolean(httpClient),
    queryFn: async () => {
      if (!httpClient) throw new Error('Customer API is unavailable');
      const result = await new LogisticsService(httpClient).listDocuments();
      return result.items;
    },
  });
}
