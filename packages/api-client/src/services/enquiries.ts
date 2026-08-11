import type { EnquiryRequest, EnquiryResponse } from '@carchief/domain';
import type { HttpClient } from '../http.js';

/**
 * Quotation enquiry submission (PUB-13, PUB-15, D01-P05-T004). Delivered in
 * full independent of `DEC-PUB-FREIGHT-MODEL`/`DEC-PUB-CITY-DELIVERY`
 * (D01-ASM-001) — an enquiry never carries a computed monetary total.
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
}
