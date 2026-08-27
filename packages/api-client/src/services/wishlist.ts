import type { WishlistListResponse, WishlistToggleRequest, WishlistToggleResponse } from '@carchief/domain';
import type { HttpClient } from '../http.js';

/**
 * Wishlist management for authenticated customers (D02-P13-T002, CUST-36/CUST-37).
 * `list`, `add`, and `remove` require an authenticated customer identity;
 * the mock enforces this server-side, not this client (`HttpClient`'s `getAuthToken` hook
 * supplies the bearer token when configured).
 */
export class WishlistService {
  constructor(private httpClient?: HttpClient) {}

  /**
   * List all wishlisted vehicles for the signed-in customer (CUST-37).
   */
  public async list(): Promise<WishlistListResponse> {
    if (!this.httpClient) {
      throw new Error('WishlistService.list requires an HttpClient');
    }
    return this.httpClient.request<WishlistListResponse>('/api/v1/customer/wishlist');
  }

  /**
   * Add a vehicle to the wishlist (CUST-36).
   */
  public async add(vehicleSlug: string): Promise<WishlistToggleResponse> {
    if (!this.httpClient) {
      throw new Error('WishlistService.add requires an HttpClient');
    }
    const request: WishlistToggleRequest = { vehicleSlug };
    return this.httpClient.request<WishlistToggleResponse>('/api/v1/customer/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
  }

  /**
   * Remove a vehicle from the wishlist (CUST-36).
   */
  public async remove(vehicleSlug: string): Promise<WishlistToggleResponse> {
    if (!this.httpClient) {
      throw new Error('WishlistService.remove requires an HttpClient');
    }
    return this.httpClient.request<WishlistToggleResponse>(
      `/api/v1/customer/wishlist/${encodeURIComponent(vehicleSlug)}`,
      {
        method: 'DELETE',
      },
    );
  }
}
