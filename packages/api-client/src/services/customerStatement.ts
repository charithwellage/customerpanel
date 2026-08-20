import type { CustomerStatementSummary } from '@carchief/domain';
import type { HttpClient } from '../http.js';

export interface CustomerStatementParams {
  fromDate?: string;
  toDate?: string;
}

export class CustomerStatementService {
  constructor(private httpClient?: HttpClient) {}

  async getCustomerStatement(params?: CustomerStatementParams): Promise<CustomerStatementSummary> {
    if (!this.httpClient) throw new Error('CustomerStatementService requires an HttpClient');
    const searchParams = new URLSearchParams();
    if (params?.fromDate) searchParams.set('fromDate', params.fromDate);
    if (params?.toDate) searchParams.set('toDate', params.toDate);
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.httpClient.request<CustomerStatementSummary>(`/customer/statement${query}`);
  }
}
