import type { CustomerPairedAccount } from '@carchief/domain';
import type { HttpClient } from '../http.js';

export class CustomerAccountsService {
  constructor(private httpClient?: HttpClient) {}

  async listPairedAccounts(): Promise<CustomerPairedAccount[]> {
    if (!this.httpClient) throw new Error('CustomerAccountsService requires an HttpClient');
    return this.httpClient.request<CustomerPairedAccount[]>('/customer/paired-accounts');
  }
}
