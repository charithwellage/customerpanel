import type { CreateCustomerPaymentRequest, CustomerPayment, CustomerPaymentListResponse } from '@carchief/domain';
import type { HttpClient } from '../http.js';

export class CustomerPaymentService {
  constructor(private httpClient?: HttpClient) {}

  async listCustomerPayments(): Promise<CustomerPaymentListResponse> {
    if (!this.httpClient) throw new Error('CustomerPaymentService requires an HttpClient');
    return this.httpClient.request<CustomerPaymentListResponse>('/customer/payments');
  }

  async getCustomerPayment(id: string): Promise<CustomerPayment | null> {
    if (!this.httpClient) throw new Error('CustomerPaymentService requires an HttpClient');
    try { return await this.httpClient.request<CustomerPayment>(`/customer/payments/${encodeURIComponent(id)}`); }
    catch (error: unknown) {
      if (error && typeof error === 'object' && 'statusCode' in error && (error as { statusCode: number }).statusCode === 404) return null;
      throw error;
    }
  }

  async createCustomerPayment(request: CreateCustomerPaymentRequest): Promise<CustomerPayment> {
    if (!this.httpClient) throw new Error('CustomerPaymentService requires an HttpClient');
    return this.httpClient.request<CustomerPayment>('/customer/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
  }
}
