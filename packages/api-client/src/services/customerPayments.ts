import type { CreateCustomerPaymentRequest, CreateCustomerCardPaymentRequest, CustomerPayment, CustomerPaymentListResponse, CustomerPaymentNotificationListResponse, CustomerPaymentNotification, RecordPaymentNotificationRequest, CustomerPaymentAllocationListResponse, CustomerPaymentAllocationSummary, ListCustomerPaymentAllocationsQuery } from '@carchief/domain';
import type { HttpClient } from '../http.js';

export class CustomerPaymentService {
  constructor(private httpClient?: HttpClient) {}

  async listCustomerPayments(): Promise<CustomerPaymentListResponse> {
    if (!this.httpClient) throw new Error('CustomerPaymentService requires an HttpClient');
    return this.httpClient.request<CustomerPaymentListResponse>('/customer/payments');
  }

  async listCustomerPaymentAllocations(query?: ListCustomerPaymentAllocationsQuery): Promise<CustomerPaymentAllocationListResponse> {
    if (!this.httpClient) throw new Error('CustomerPaymentService requires an HttpClient');
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query || {})) if (value !== undefined && value !== '') params.set(key, String(value));
    const suffix = params.toString();
    return this.httpClient.request<CustomerPaymentAllocationListResponse>(`/customer/payment-allocations${suffix ? `?${suffix}` : ''}`);
  }

  async getCustomerPaymentAllocation(id: string): Promise<CustomerPaymentAllocationSummary | null> {
    if (!this.httpClient) throw new Error('CustomerPaymentService requires an HttpClient');
    try {
      return await this.httpClient.request<CustomerPaymentAllocationSummary>(`/customer/payment-allocations/${encodeURIComponent(id)}`);
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'statusCode' in error && (error as { statusCode: number }).statusCode === 404) return null;
      throw error;
    }
  }

  async downloadCustomerInvoicePdf(invoiceId: string): Promise<Blob> {
    if (!this.httpClient) throw new Error('CustomerPaymentService requires an HttpClient');
    return this.httpClient.requestBlob(`/customer/invoices/${encodeURIComponent(invoiceId)}/document.pdf`);
  }

  async resubmitCustomerPayment(id: string): Promise<CustomerPayment> {
    if (!this.httpClient) throw new Error('CustomerPaymentService requires an HttpClient');
    return this.httpClient.request<CustomerPayment>(`/customer/payments/${encodeURIComponent(id)}/resubmit`, { method: 'POST' });
  }

  async createCustomerPayment(request: CreateCustomerPaymentRequest): Promise<CustomerPayment> {
    if (!this.httpClient) throw new Error('CustomerPaymentService requires an HttpClient');
    return this.httpClient.request<CustomerPayment>('/customer/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
  }

  async createCustomerCardPayment(request: CreateCustomerCardPaymentRequest): Promise<CustomerPayment> {
    if (!this.httpClient) throw new Error('CustomerPaymentService requires an HttpClient');
    return this.httpClient.request<CustomerPayment>('/customer/card-payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
  }

  async listCustomerPaymentNotifications(paymentId?: string): Promise<CustomerPaymentNotificationListResponse> {
    if (!this.httpClient) throw new Error('CustomerPaymentService requires an HttpClient');
    const query = paymentId ? `?paymentId=${encodeURIComponent(paymentId)}` : '';
    return this.httpClient.request<CustomerPaymentNotificationListResponse>(`/customer/payment-notifications${query}`);
  }

  async recordPaymentNotification(id: string, request: RecordPaymentNotificationRequest): Promise<CustomerPaymentNotification> {
    if (!this.httpClient) throw new Error('CustomerPaymentService requires an HttpClient');
    return this.httpClient.request<CustomerPaymentNotification>(`/finance/customer-payments/${encodeURIComponent(id)}/notifications`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request),
    });
  }
}
