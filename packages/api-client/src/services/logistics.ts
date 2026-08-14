import type { CustomerDocument, CustomerDocumentList, CustomerShipment, CustomerShipmentList } from '../generated/schema.js';
import type { HttpClient } from '../http.js';

/** Customer-scoped shipment and released-document projections. */
export class LogisticsService {
  constructor(private httpClient?: HttpClient) {}

  public async listShipments(): Promise<CustomerShipmentList> {
    return this.requireClient().request<CustomerShipmentList>('/customer/shipments');
  }

  public async getShipment(id: string): Promise<CustomerShipment> {
    return this.requireClient().request<CustomerShipment>(`/customer/shipments/${encodeURIComponent(id)}`);
  }

  public async listDocuments(): Promise<CustomerDocumentList> {
    return this.requireClient().request<CustomerDocumentList>('/customer/documents');
  }

  public async getDocument(id: string): Promise<CustomerDocument> {
    return this.requireClient().request<CustomerDocument>(`/customer/documents/${encodeURIComponent(id)}`);
  }

  private requireClient(): HttpClient {
    if (!this.httpClient) throw new Error('LogisticsService requires an HttpClient');
    return this.httpClient;
  }
}
