import type { VehicleSearchResult, SearchVehiclesQuery, VehicleDetail } from '@carchief/domain';
import type { HttpClient } from '../http.js';

export interface GetVehiclesOptions extends SearchVehiclesQuery {}

export class VehicleService {
  constructor(private httpClient?: HttpClient) {}

  public async getVehicles(options?: GetVehiclesOptions): Promise<VehicleSearchResult> {
    if (!this.httpClient) {
      return emptyVehicleSearchResult();
    }

    const params = new URLSearchParams();
    appendVehicleQuery(params, options);
    const queryString = params.toString();
    const path = `/api/v1/vehicles${queryString ? `?${queryString}` : ''}`;
    return this.httpClient.request<VehicleSearchResult>(path);
  }

  public async getVehicleDetail(idOrSlug: string, options?: { audience?: 'public' | 'customer' | 'salesperson'; tier?: string; destinationCountry?: string }): Promise<VehicleDetail | null> {
    if (!this.httpClient) {
      return null;
    }
    try {
      const params = new URLSearchParams();
      if (options?.audience) params.set('audience', options.audience);
      if (options?.tier) params.set('tier', options.tier);
      if (options?.destinationCountry) params.set('destinationCountry', options.destinationCountry);
      const queryString = params.toString();
      const path = `/api/v1/vehicles/${encodeURIComponent(idOrSlug)}${queryString ? `?${queryString}` : ''}`;
      return await this.httpClient.request<VehicleDetail>(path);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'statusCode' in err && (err as { statusCode: number }).statusCode === 404) {
        return null;
      }
      throw err;
    }
  }
}

function appendVehicleQuery(params: URLSearchParams, query?: SearchVehiclesQuery): void {
    if (!query) return;
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') continue;
      params.set(key, Array.isArray(value) ? value.join(',') : String(value));
    }
}

function emptyVehicleSearchResult(): VehicleSearchResult {
  return {
    items: [], total: 0, page: 1, limit: 15, totalPages: 0, hasNextPage: false, hasPrevPage: false,
    facets: {
      makes: [], bodyStyles: [], fuelTypes: [], transmissions: [], driveTrains: [], models: [], modelCodes: [], vehicleTypes: [], vehicleSubTypes: [], locationStatuses: [], destinationPorts: [], overdrives: [], colors: [], exteriorGrades: [], steerings: [], stockCountries: [], stockLocations: [], features: [], yearRange: { min: 2000, max: 2026 }, priceRange: { min: 0, max: 0 }, mileageRange: { min: 0, max: 0 }, engineCcRange: { min: 0, max: 0 }, seatsRange: { min: 0, max: 0 }, loadCapacityRange: { min: 0, max: 0 },
    },
  };
}
