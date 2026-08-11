import type { VehicleDomainSummary, VehicleSearchResult, SearchVehiclesQuery } from '@carchief/domain';
import type { HttpClient } from '../http.js';

export interface GetVehiclesOptions extends SearchVehiclesQuery {}

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

  public async searchVehicles(query?: SearchVehiclesQuery): Promise<VehicleSearchResult> {
    if (!this.httpClient) {
      return {
        items: [],
        total: 0,
        page: 1,
        limit: 12,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
        facets: {
          makes: [],
          bodyStyles: [],
          fuelTypes: [],
          yearRange: { min: 2000, max: 2026 },
          priceRange: { min: 0, max: 0 },
        },
      };
    }

    const params = new URLSearchParams();
    if (query?.searchQuery) params.set('searchQuery', query.searchQuery);
    if (query?.make) params.set('make', query.make);
    if (query?.model) params.set('model', query.model);
    if (query?.bodyStyle) params.set('bodyStyle', query.bodyStyle);
    if (query?.fuelType) params.set('fuelType', query.fuelType);
    if (query?.transmission) params.set('transmission', query.transmission);
    if (query?.driveTrain) params.set('driveTrain', query.driveTrain);
    if (query?.stockType) params.set('stockType', query.stockType);
    if (query?.locationStatus) params.set('locationStatus', query.locationStatus);
    if (query?.market) params.set('market', query.market);
    if (query?.category) params.set('category', query.category);
    if (query?.collection) params.set('collection', query.collection);
    if (query?.yearMin !== undefined) params.set('yearMin', String(query.yearMin));
    if (query?.yearMax !== undefined) params.set('yearMax', String(query.yearMax));
    if (query?.priceMin !== undefined) params.set('priceMin', String(query.priceMin));
    if (query?.priceMax !== undefined) params.set('priceMax', String(query.priceMax));
    if (query?.sortBy) params.set('sortBy', query.sortBy);
    if (query?.page !== undefined) params.set('page', String(query.page));
    if (query?.limit !== undefined) params.set('limit', String(query.limit));

    const queryString = params.toString();
    const path = `/api/v1/vehicles/search${queryString ? `?${queryString}` : ''}`;
    return this.httpClient.request<VehicleSearchResult>(path);
  }
}
