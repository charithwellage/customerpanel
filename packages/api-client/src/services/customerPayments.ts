import type { CreateCustomerPaymentRequest, CustomerPayment, CustomerPaymentListResponse, CustomerPaymentNotificationListResponse, CustomerPaymentNotification, RecordPaymentNotificationRequest } from '@carchief/domain';
import type { HttpClient } from '../http.js';

export class CustomerPaymentService {
  constructor(private httpClient?: HttpClient) {}

  async listCustomerPayments(): Promise<CustomerPaymentListResponse> {
    if (!this.httpClient) throw new Error('CustomerPaymentService requires an HttpClient');
    return this.httpClient.request<CustomerPaymentListResponse>('/customer/payments');
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
