import type { CustomerNotificationListResponse, MarkNotificationsReadResponse, Notification } from '@carchief/domain';
import type { HttpClient } from '../http.js';

export class CustomerNotificationService {
  constructor(private httpClient?: HttpClient) {}

  private requireClient(): HttpClient {
    if (!this.httpClient) throw new Error('CustomerNotificationService requires an HttpClient');
    return this.httpClient;
  }

  list(query?: { status?: 'all' | 'read' | 'unread'; q?: string }): Promise<CustomerNotificationListResponse> {
    const params = new URLSearchParams();
    if (query?.status) params.set('status', query.status);
    if (query?.q) params.set('q', query.q);
    const suffix = params.toString() ? `?${params.toString()}` : '';
    return this.requireClient().request<CustomerNotificationListResponse>(`/customer/notifications${suffix}`);
  }

  markRead(id: string): Promise<Notification> {
    return this.requireClient().request<Notification>(`/customer/notifications/${encodeURIComponent(id)}/read`, { method: 'POST' });
  }

  markAllRead(): Promise<MarkNotificationsReadResponse> {
    return this.requireClient().request<MarkNotificationsReadResponse>('/customer/notifications/read-all', { method: 'POST' });
  }

  delete(id: string): Promise<{ success: boolean }> {
    return this.requireClient().request<{ success: boolean }>(`/customer/notifications/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }
}
