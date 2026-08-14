import type { CustomerDashboard } from '../generated/schema.js';
import type { HttpClient } from '../http.js';

/**
 * Customer dashboard service (D02-ASM-001, D02-P02-T001). Fetches the
 * customer-scoped dashboard aggregate containing KPIs derived from linked
 * vehicles, invoices, payments, shipments, documents and notifications.
 * Server-authoritative; no browser calculation or fabrication.
 */
export class DashboardService {
  constructor(private httpClient?: HttpClient) {}

  public async getCustomerDashboard(): Promise<CustomerDashboard> {
    if (!this.httpClient) {
      throw new Error('DashboardService.getCustomerDashboard requires an HttpClient');
    }
    return this.httpClient.request<CustomerDashboard>('/customer/dashboard');
  }
}
