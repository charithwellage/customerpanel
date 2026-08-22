import { useQuery } from '@tanstack/react-query';
import { ConfigService } from '@carchief/api-client';
import { useHttpClient } from '../account/HttpClientProvider.js';

export function useCustomerInventoryConfig() {
  const httpClient = useHttpClient();

  return useQuery({
    queryKey: ['public', 'config'],
    enabled: Boolean(httpClient),
    queryFn: async () => {
      if (!httpClient) throw new Error('Public configuration is unavailable');
      return new ConfigService(httpClient).getPublicConfig();
    },
  });
}
