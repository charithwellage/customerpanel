import { useQuery } from '@tanstack/react-query';
import type { CustomerShipment } from '@carchief/api-client';
import { LogisticsService } from '@carchief/api-client';
import { useHttpClient } from '../account/HttpClientProvider.js';

export function useShipments() {
  const httpClient = useHttpClient();
  return useQuery<CustomerShipment[], Error>({
    queryKey: ['customer', 'shipments'],
    enabled: Boolean(httpClient),
    queryFn: async () => {
      if (!httpClient) throw new Error('Customer API is unavailable');
      const result = await new LogisticsService(httpClient).listShipments();
      return result.items;
    },
  });
}
