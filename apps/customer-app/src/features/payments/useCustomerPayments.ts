import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { CustomerPaymentListResponse, CustomerPaymentNotificationListResponse, CustomerDebitCreditListResponse } from '@carchief/domain';
import { CustomerPaymentService, CustomerDebitCreditService, type CustomerDebitCreditParams, type NormalizedApiError } from '@carchief/api-client';
import { useHttpClient } from '../account/index.js';

export function useCustomerPayments(): UseQueryResult<CustomerPaymentListResponse, NormalizedApiError> {
  const httpClient = useHttpClient();
  return useQuery({
    queryKey: ['customer-payments'],
    queryFn: async () => {
      if (!httpClient) throw new Error('Customer payment journal requires an authenticated HttpClient');
      return new CustomerPaymentService(httpClient).listCustomerPayments();
    },
    enabled: Boolean(httpClient),
    staleTime: 30_000,
    retry: 1,
  });
}

export function useCustomerPaymentNotifications(): UseQueryResult<CustomerPaymentNotificationListResponse, NormalizedApiError> {
  const httpClient = useHttpClient();
  return useQuery({
    queryKey: ['customer-payment-notifications'],
    queryFn: async () => {
      if (!httpClient) throw new Error('Payment notifications require an authenticated HttpClient');
      return new CustomerPaymentService(httpClient).listCustomerPaymentNotifications();
    },
    enabled: Boolean(httpClient),
    staleTime: 30_000,
    retry: 1,
  });
}

export function useCustomerDebitCredit(params?: CustomerDebitCreditParams): UseQueryResult<CustomerDebitCreditListResponse, NormalizedApiError> {
  const httpClient = useHttpClient();
  return useQuery({
    queryKey: ['customer-debit-credit', params?.type, params?.currency, params?.query],
    queryFn: async () => {
      if (!httpClient) throw new Error('Customer debit credit requires an authenticated HttpClient');
      return new CustomerDebitCreditService(httpClient).listCustomerDebitCredit(params);
    },
    enabled: Boolean(httpClient),
    staleTime: 30_000,
    retry: 1,
  });
}
