import type { CustomerProfile, UpdateCustomerProfileRequest } from '../generated/schema.js';
import type { HttpClient } from '../http.js';

export class CustomerProfileService {
  constructor(private httpClient?: HttpClient) {}

  private requireClient(): HttpClient {
    if (!this.httpClient) throw new Error('CustomerProfileService requires an HttpClient');
    return this.httpClient;
  }

  get(): Promise<CustomerProfile> {
    return this.requireClient().request<CustomerProfile>('/customer/profile');
  }

  update(request: UpdateCustomerProfileRequest): Promise<CustomerProfile> {
    return this.requireClient().request<CustomerProfile>('/customer/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
  }
}
