import type { CustomerTierBenefits } from '@carchief/domain';
import type { HttpClient } from '../http.js';

export class CustomerTierBenefitsService {
  constructor(private httpClient?: HttpClient) {}

  async get(): Promise<CustomerTierBenefits> {
    if (!this.httpClient) throw new Error('CustomerTierBenefitsService requires an HttpClient');
    return this.httpClient.request<CustomerTierBenefits>('/api/v1/customer/tier-benefits');
  }
}
