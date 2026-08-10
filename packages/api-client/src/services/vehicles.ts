import type { VehicleDomainSummary } from '@carchief/domain';
import type { HttpClient } from '../http.js';

export interface GetVehiclesOptions {
  collection?: 'latest_arrivals' | 'premium_teaser' | 'discounted' | 'clearance' | 'featured' | 'browse';
  market?: string;
  category?: string;
  limit?: number;
}

export class VehicleService {
  constructor(private httpClient?: HttpClient) {}

  public async getVehicles(options?: GetVehiclesOptions): Promise<VehicleDomainSummary[]> {
    if (!this.httpClient) {
      return [];
    }

    const params = new URLSearchParams();
    if (options?.collection) params.set('collection', options.collection);
    if (options?.market) params.set('market', options.market);
    if (options?.category) params.set('category', options.category);
    if (options?.limit) params.set('limit', String(options.limit));

    const queryString = params.toString();
    const path = `/api/v1/vehicles${queryString ? `?${queryString}` : ''}`;
    return this.httpClient.request<VehicleDomainSummary[]>(path);
  }
}

