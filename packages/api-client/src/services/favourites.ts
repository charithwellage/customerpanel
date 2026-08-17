import type {
  FavouriteSearch,
  FavouriteSearchCriteria,
  FavouriteSearchFacets,
  FavouriteSearchListResponse,
} from '@carchief/domain';
import type { HttpClient } from '../http.js';

/**
 * Favourites (saved search criteria) management for authenticated customers (D02-P13-T002, CUST-38/CUST-39/CUST-40).
 * `list`, `create`, `remove`, and `getFacets` require an authenticated customer identity;
 * the mock enforces this server-side, not this client (`HttpClient`'s `getAuthToken` hook
 * supplies the bearer token when configured).
 * A customer may hold at most 25 favourites; the 26th creation attempt is rejected (CUST-40).
 */
export class FavouritesService {
  constructor(private httpClient?: HttpClient) {}

  /**
   * List all saved search-criteria profiles for the signed-in customer (CUST-38/CUST-39).
   */
  public async list(): Promise<FavouriteSearchListResponse> {
    if (!this.httpClient) {
      throw new Error('FavouritesService.list requires an HttpClient');
    }
    return this.httpClient.request<FavouriteSearchListResponse>('/api/v1/customer/favourites');
  }

  /**
   * Create a new saved search-criteria profile (CUST-38/CUST-39/CUST-40).
   * The 26th creation attempt is rejected by the server with a 409 conflict.
   * The mock enforces the 25-favourite limit server-side (CUST-40).
   */
  public async create(name: string, criteria: FavouriteSearchCriteria): Promise<FavouriteSearch> {
    if (!this.httpClient) {
      throw new Error('FavouritesService.create requires an HttpClient');
    }
    const request = { name, criteria };
    return this.httpClient.request<FavouriteSearch>('/api/v1/customer/favourites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
  }

  /**
   * Remove a saved search-criteria profile by ID.
   */
  public async remove(id: string): Promise<void> {
    if (!this.httpClient) {
      throw new Error('FavouritesService.remove requires an HttpClient');
    }
    await this.httpClient.request<void>(`/api/v1/customer/favourites/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get distinct values available for each favourite search field (CUST-39, D02-ASM-008).
   * Returns real, database-backed values for each criterion field.
   * Fields with no backing column today (modelCode, engineCc, color, steering) return empty arrays.
   */
  public async getFacets(): Promise<FavouriteSearchFacets> {
    if (!this.httpClient) {
      throw new Error('FavouritesService.getFacets requires an HttpClient');
    }
    return this.httpClient.request<FavouriteSearchFacets>('/api/v1/customer/favourites/facets');
  }
}
