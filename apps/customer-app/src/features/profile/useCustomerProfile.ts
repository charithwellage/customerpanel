import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CustomerProfile, UpdateCustomerProfileRequest } from '@carchief/api-client';
import { CustomerProfileService } from '@carchief/api-client';
import { useHttpClient } from '../account/HttpClientProvider.js';

export function useCustomerProfile() {
  const httpClient = useHttpClient();
  return useQuery<CustomerProfile, Error>({
    queryKey: ['customer', 'profile'],
    enabled: Boolean(httpClient),
    queryFn: async () => {
      if (!httpClient) throw new Error('Customer API is unavailable');
      return new CustomerProfileService(httpClient).get();
    },
  });
}

export function useUpdateCustomerProfile() {
  const httpClient = useHttpClient();
  const queryClient = useQueryClient();
  return useMutation<CustomerProfile, Error, UpdateCustomerProfileRequest>({
    mutationFn: async (request) => {
      if (!httpClient) throw new Error('Customer API is unavailable');
      return new CustomerProfileService(httpClient).update(request);
    },
    onSuccess: (profile) => queryClient.setQueryData(['customer', 'profile'], profile),
  });
}
