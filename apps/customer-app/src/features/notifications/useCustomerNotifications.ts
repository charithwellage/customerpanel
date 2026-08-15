import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CustomerNotificationListResponse, Notification } from '@carchief/api-client';
import { CustomerNotificationService } from '@carchief/api-client';
import { useHttpClient } from '../account/HttpClientProvider.js';

export type NotificationFilter = 'all' | 'read' | 'unread';

export function useCustomerNotifications(filter: NotificationFilter, search: string) {
  const httpClient = useHttpClient();
  return useQuery<CustomerNotificationListResponse, Error>({
    queryKey: ['customer', 'notifications', filter, search],
    enabled: Boolean(httpClient),
    queryFn: async () => {
      if (!httpClient) throw new Error('Customer API is unavailable');
      return new CustomerNotificationService(httpClient).list({ status: filter, q: search || undefined });
    },
  });
}

export function useMarkNotificationRead() {
  const httpClient = useHttpClient();
  const queryClient = useQueryClient();
  return useMutation<Notification, Error, string>({
    mutationFn: async (id) => {
      if (!httpClient) throw new Error('Customer API is unavailable');
      return new CustomerNotificationService(httpClient).markRead(id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customer', 'notifications'] }),
  });
}

export function useMarkAllNotificationsRead() {
  const httpClient = useHttpClient();
  const queryClient = useQueryClient();
  return useMutation<{ updatedCount: number; unreadCount: number }, Error>({
    mutationFn: async () => {
      if (!httpClient) throw new Error('Customer API is unavailable');
      return new CustomerNotificationService(httpClient).markAllRead();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customer', 'notifications'] }),
  });
}
