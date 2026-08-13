import type { FreightDestination, FreightPort, FreightEstimateRequest, FreightEstimateResponse } from '@carchief/domain';
import type { HttpClient } from '../http.js';

/**
 * Destination/port/rate lookup only (D01-ASM-001). `estimate()` always
 * returns the deterministic `estimate_unavailable_pending_rate` outcome
 * while `DEC-PUB-FREIGHT-MODEL` is OPEN — no formula and no computed total
 * are implemented here.
 */
export class FreightService {
  constructor(private httpClient?: HttpClient) {}

  public async getDestinations(): Promise<FreightDestination[]> {
    if (!this.httpClient) {
      return [];
    }
    return this.httpClient.request<FreightDestination[]>('/api/v1/freight/destinations');
  }

  public async getPorts(): Promise<FreightPort[]> {
    if (!this.httpClient) {
      return [];
    }
    return this.httpClient.request<FreightPort[]>('/api/v1/freight/ports');
  }

  public async estimate(request: FreightEstimateRequest): Promise<FreightEstimateResponse> {
    if (!this.httpClient) {
      throw new Error('FreightService.estimate requires an HttpClient');
    }
    return this.httpClient.request<FreightEstimateResponse>('/api/v1/freight/estimate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
  }
}
