import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateCustomerCardPaymentRequest } from '@carchief/domain';
import { CustomerPaymentService } from '@carchief/api-client';
import { useHttpClient } from '../account/index.js';

export function useCreateCustomerCardPayment() {
  const httpClient = useHttpClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (request: CreateCustomerCardPaymentRequest) => {
      if (!httpClient) throw new Error('Card payment requires an authenticated session');
      return new CustomerPaymentService(httpClient).createCustomerCardPayment(request);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['customer-payments'] });
      void queryClient.invalidateQueries({ queryKey: ['customer-payment-notifications'] });
      void queryClient.invalidateQueries({ queryKey: ['customer-vehicle-detail'] });
    },
  });
}
