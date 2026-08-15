import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { CreateCustomerPaymentRequest, CustomerPayment } from '@carchief/domain';
import { CustomerPaymentService, type NormalizedApiError } from '@carchief/api-client';
import { useHttpClient } from '../account/index.js';
import { isMutationBlockedOffline } from '../pwa/pwaConfig.js';

export function useCreateCustomerPayment(): UseMutationResult<CustomerPayment, NormalizedApiError, CreateCustomerPaymentRequest> {
  const httpClient = useHttpClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request) => {
      if (isMutationBlockedOffline()) {
        throw new Error('You are currently offline. TT submissions are blocked until the connection is restored.');
      }
      if (!httpClient) throw new Error('Payment submission requires an authenticated HttpClient.');
      return new CustomerPaymentService(httpClient).createCustomerPayment(request);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['customer-payments'] }),
        queryClient.invalidateQueries({ queryKey: ['customer-payment-notifications'] }),
      ]);
    },
  });
}
