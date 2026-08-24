import type { CustomerPolymorphicInquiryListResponse } from '@carchief/domain';
import type { HttpClient } from '../http.js';

/**
 * Customer's own quote-request inquiries (D02-P13-T001, CUST-34/CUST-35).
 * Lists the signed-in customer's own quote requests and exposes per-vehicle inquirer-count aggregates.
 * `list` requires an authenticated customer identity;
 * the mock enforces this server-side, not this client (`HttpClient`'s `getAuthToken` hook
 * supplies the bearer token when configured).
 */
export class CustomerInquiryService {
  constructor(private httpClient?: HttpClient) {}

  /**
   * List all quote-request inquiries for the signed-in customer (CUST-34).
   * Returns the customer's own inquiries plus the per-vehicle inquirer-count aggregate.
   */
  public async list(): Promise<CustomerPolymorphicInquiryListResponse> {
    if (!this.httpClient) {
      throw new Error('CustomerInquiryService.list requires an HttpClient');
    }
    return this.httpClient.request<CustomerPolymorphicInquiryListResponse>('/api/v1/customer/inquiries');
  }

}
