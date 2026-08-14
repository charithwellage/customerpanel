import type {
  CustomerVehicleListResponse,
  CustomerVehicleDetail,
  ListCustomerVehiclesQuery,
} from '@carchief/domain';
import type { HttpClient } from '../http.js';

export class CustomerVehicleService {
  constructor(private httpClient?: HttpClient) {}

  public async listCustomerVehicles(query?: ListCustomerVehiclesQuery): Promise<CustomerVehicleListResponse> {
    if (!this.httpClient) {
      throw new Error('CustomerVehicleService.listCustomerVehicles requires an HttpClient');
    }

    const params = new URLSearchParams();
    if (query?.status) params.set('status', query.status);
    if (query?.query) params.set('query', query.query);
    if (query?.page) params.set('page', String(query.page));
    if (query?.limit) params.set('limit', String(query.limit));

    const qs = params.toString();
    const endpoint = `/customer/vehicles${qs ? `?${qs}` : ''}`;
    return this.httpClient.request<CustomerVehicleListResponse>(endpoint);
  }

  public async getCustomerVehicleDetail(idOrSlug: string): Promise<CustomerVehicleDetail | null> {
    if (!this.httpClient) {
      throw new Error('CustomerVehicleService.getCustomerVehicleDetail requires an HttpClient');
    }

    try {
      return await this.httpClient.request<CustomerVehicleDetail>(
        `/customer/vehicles/${encodeURIComponent(idOrSlug)}`
      );
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'statusCode' in err && (err as { statusCode: number }).statusCode === 404) {
        return null;
      }
      throw err;
    }
  }
}
