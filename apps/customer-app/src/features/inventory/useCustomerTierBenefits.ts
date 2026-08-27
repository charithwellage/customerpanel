import { useQuery } from '@tanstack/react-query';
import type { CustomerTierBenefits } from '@carchief/domain';
import { CustomerTierBenefitsService } from '@carchief/api-client';
import { useHttpClient } from '../account/HttpClientProvider.js';

export function useCustomerTierBenefits() {
  const httpClient = useHttpClient();
  return useQuery<CustomerTierBenefits, Error>({
    queryKey: ['customer', 'tier-benefits'],
    enabled: Boolean(httpClient),
    queryFn: async () => {
      if (!httpClient) throw new Error('Customer tier benefits are unavailable');
      return new CustomerTierBenefitsService(httpClient).get();
    },
  });
}
