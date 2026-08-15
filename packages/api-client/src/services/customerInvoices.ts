import type {
  CustomerInvoiceListResponse,
  CustomerInvoiceDetail,
  CustomerInvoiceDocument,
  ListCustomerInvoicesQuery,
} from '@carchief/domain';
import type { HttpClient } from '../http.js';

export class CustomerInvoiceService {
  constructor(private httpClient?: HttpClient) {}

  public async listCustomerInvoices(query?: ListCustomerInvoicesQuery): Promise<CustomerInvoiceListResponse> {
    if (!this.httpClient) {
      throw new Error('CustomerInvoiceService.listCustomerInvoices requires an HttpClient');
    }

    const params = new URLSearchParams();
    if (query?.type) params.set('type', query.type);
    if (query?.status) params.set('status', query.status);
    if (query?.query) params.set('query', query.query);
    if (query?.page) params.set('page', String(query.page));
    if (query?.limit) params.set('limit', String(query.limit));

    const qs = params.toString();
    const endpoint = `/customer/invoices${qs ? `?${qs}` : ''}`;
    return this.httpClient.request<CustomerInvoiceListResponse>(endpoint);
  }

  public async getCustomerInvoiceDetail(id: string): Promise<CustomerInvoiceDetail | null> {
    if (!this.httpClient) {
      throw new Error('CustomerInvoiceService.getCustomerInvoiceDetail requires an HttpClient');
    }

    try {
      return await this.httpClient.request<CustomerInvoiceDetail>(
        `/customer/invoices/${encodeURIComponent(id)}`
      );
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'statusCode' in err && (err as { statusCode: number }).statusCode === 404) {
        return null;
      }
      throw err;
    }
  }

  public async getCustomerInvoiceDocument(id: string): Promise<CustomerInvoiceDocument | null> {
    if (!this.httpClient) {
      throw new Error('CustomerInvoiceService.getCustomerInvoiceDocument requires an HttpClient');
    }

    try {
      return await this.httpClient.request<CustomerInvoiceDocument>(
        `/customer/invoices/${encodeURIComponent(id)}/document`
      );
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'statusCode' in err && (err as { statusCode: number }).statusCode === 404) {
        return null;
      }
      throw err;
    }
  }
}
