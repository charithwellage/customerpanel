import type { CustomerInquiryListResponse, VehicleInquiryAggregate } from '@carchief/domain';
import type { HttpClient } from '../http.js';

/**
 * Customer's own quote-request inquiries (D02-P13-T001, CUST-34/CUST-35).
 * Lists the signed-in customer's own quote requests and exposes per-vehicle inquirer-count aggregates.
 * `list` and `getVehicleInquiryCount` require an authenticated customer identity;
 * the mock enforces this server-side, not this client (`HttpClient`'s `getAuthToken` hook
 * supplies the bearer token when configured).
 */
export class CustomerInquiryService {
  constructor(private httpClient?: HttpClient) {}

  /**
   * List all quote-request inquiries for the signed-in customer (CUST-34).
   * Returns the customer's own inquiries plus the per-vehicle inquirer-count aggregate.
   */
  public async list(): Promise<CustomerInquiryListResponse> {
    if (!this.httpClient) {
      throw new Error('CustomerInquiryService.list requires an HttpClient');
    }
    return this.httpClient.request<CustomerInquiryListResponse>('/api/v1/customer/inquiries');
  }

  /**
   * Get the aggregate inquirer count for a specific vehicle (CUST-35).
   * Returns how many distinct customers have requested a quote for the vehicle.
   */
  public async getVehicleInquiryCount(vehicleSlug: string): Promise<VehicleInquiryAggregate> {
    if (!this.httpClient) {
      throw new Error('CustomerInquiryService.getVehicleInquiryCount requires an HttpClient');
    }
    return this.httpClient.request<VehicleInquiryAggregate>(
      `/api/v1/vehicles/${encodeURIComponent(vehicleSlug)}/inquiry-count`,
    );
  }
}
