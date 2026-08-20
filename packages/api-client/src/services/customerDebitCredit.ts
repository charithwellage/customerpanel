import type { CustomerDebitCreditListResponse } from '@carchief/domain';
import type { HttpClient } from '../http.js';

export interface CustomerDebitCreditParams {
  type?: string;
  currency?: string;
  query?: string;
}

export class CustomerDebitCreditService {
  constructor(private httpClient?: HttpClient) {}

  async listCustomerDebitCredit(params?: CustomerDebitCreditParams): Promise<CustomerDebitCreditListResponse> {
    if (!this.httpClient) throw new Error('CustomerDebitCreditService requires an HttpClient');
    const searchParams = new URLSearchParams();
    if (params?.type && params.type !== 'ALL') searchParams.set('type', params.type);
    if (params?.currency && params.currency !== 'ALL') searchParams.set('currency', params.currency);
    if (params?.query) searchParams.set('query', params.query);
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.httpClient.request<CustomerDebitCreditListResponse>(`/customer/debit-credit${query}`);
  }
}
