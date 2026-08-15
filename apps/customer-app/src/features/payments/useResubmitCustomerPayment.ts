import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { CustomerPayment } from '@carchief/domain';
import { CustomerPaymentService, type NormalizedApiError } from '@carchief/api-client';
import { useHttpClient } from '../account/index.js';
import { isMutationBlockedOffline } from '../pwa/pwaConfig.js';

export function useResubmitCustomerPayment(): UseMutationResult<CustomerPayment, NormalizedApiError, string> {
  const httpClient = useHttpClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (paymentId) => {
      if (isMutationBlockedOffline()) throw new Error('You are currently offline. Payment resubmission is blocked until the connection is restored.');
      if (!httpClient) throw new Error('Payment resubmission requires an authenticated HttpClient.');
      return new CustomerPaymentService(httpClient).resubmitCustomerPayment(paymentId);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['customer-payments'] }),
        queryClient.invalidateQueries({ queryKey: ['customer-payment-notifications'] }),
      ]);
    },
  });
}
