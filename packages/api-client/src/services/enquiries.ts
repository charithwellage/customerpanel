import type { EnquiryRequest, EnquiryResponse, LeadRecord, LeadListResponse } from '@carchief/domain';
import type { HttpClient } from '../http.js';

/**
 * Quotation enquiry submission (PUB-13, PUB-15, D01-P05-T004) plus the
 * staff-facing lead read-by-ID/list proof operations (PUB-16, D01-P06-T001).
 * Delivered in full independent of `DEC-PUB-FREIGHT-MODEL`/
 * `DEC-PUB-CITY-DELIVERY` (D01-ASM-001) — an enquiry never carries a
 * computed monetary total. `getLeadById`/`listLeads` require an
 * authenticated staff identity with the `read:leads` permission; the mock
 * enforces this server-side, not this client (`HttpClient`'s
 * `getAuthToken` hook supplies the bearer token when configured).
 */
export class EnquiryService {
  constructor(private httpClient?: HttpClient) {}

  public async submit(request: EnquiryRequest): Promise<EnquiryResponse> {
    if (!this.httpClient) {
      throw new Error('EnquiryService.submit requires an HttpClient');
    }
    return this.httpClient.request<EnquiryResponse>('/api/v1/enquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
  }

  /**
   * Staff-facing lead read-by-ID (PUB-16, D01-P06-T001) — proves a
   * submitted enquiry is retrievable through the salesperson-facing
   * service boundary. Returns `null` for an unknown id (404), matching the
   * `VehicleService.getVehicleDetail` convention.
   */
  public async getLeadById(id: string): Promise<LeadRecord | null> {
    if (!this.httpClient) {
      throw new Error('EnquiryService.getLeadById requires an HttpClient');
    }
    try {
      return await this.httpClient.request<LeadRecord>(`/api/v1/enquiries/${encodeURIComponent(id)}`);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'statusCode' in err && (err as { statusCode: number }).statusCode === 404) {
        return null;
      }
      throw err;
    }
  }

  /** Staff-facing lead list proof operation (PUB-16, D01-P06-T001). */
  public async listLeads(): Promise<LeadListResponse> {
    if (!this.httpClient) {
      throw new Error('EnquiryService.listLeads requires an HttpClient');
    }
    return this.httpClient.request<LeadListResponse>('/api/v1/enquiries');
  }
}
