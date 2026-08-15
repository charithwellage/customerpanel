import React from 'react';
import type { Notification } from '@carchief/api-client';
import { useCustomerShell } from '../shell/index.js';
import { useCustomerNotifications, useMarkAllNotificationsRead, useMarkNotificationRead, type NotificationFilter } from './useCustomerNotifications.js';

export function appRouteFor(notification: Notification): string | null {
  const related = notification.related;
  if (!related) return null;
  if (related.kind === 'Vehicle') return `/vehicles/${related.id}`;
  if (related.kind === 'Invoice' || related.kind === 'ProformaInvoice') return `/invoices/${related.id}`;
  if (related.kind === 'Shipment' || related.kind === 'ShipOk') return '/shipments';
  if (related.kind === 'Document' || related.kind === 'DocumentRelease') return '/documents';
  if (related.kind === 'Payment') return '/payments';
  return null;
}

const filters: Array<{ value: NotificationFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
];

export const NotificationsPage: React.FC = () => {
  const { setActiveRoute } = useCustomerShell();
  const [filter, setFilter] = React.useState<NotificationFilter>('all');
  const [search, setSearch] = React.useState('');
  const { data, isLoading, isFetching, error, refetch } = useCustomerNotifications(filter, search.trim());
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  React.useEffect(() => { setActiveRoute('/notifications'); }, [setActiveRoute]);

  const openRelated = (notification: Notification) => {
    const route = appRouteFor(notification);
    if (route) setActiveRoute(route);
  };

  return (
    <section className="cc-cust-notifications" aria-labelledby="notifications-title">
      <header className="cc-cust-notifications__header">
        <div>
          <p className="cc-cust-notifications__eyebrow">Account activity</p>
          <h1 id="notifications-title" className="cc-cust-notifications__title">Notifications</h1>
          <p className="cc-cust-notifications__subtitle">Updates about your customer-owned vehicles, payments and documents.</p>
        </div>
        <div className="cc-cust-notifications__summary" aria-live="polite">
          <strong>{data?.unreadCount ?? 0}</strong> unread
        </div>
      </header>

      <div className="cc-cust-notifications__controls" role="search" aria-label="Notification search and filters">
        <label className="cc-cust-notifications__field">
          <span>Search notifications</span>
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search updates" />
        </label>
        <div className="cc-cust-notifications__filters" role="group" aria-label="Notification status">
          {filters.map((item) => (
            <button key={item.value} type="button" className={`cc-cust-notifications__filter ${filter === item.value ? 'cc-cust-notifications__filter--active' : ''}`} aria-pressed={filter === item.value} onClick={() => setFilter(item.value)}>
              {item.label}
            </button>
          ))}
        </div>
        <button type="button" className="cc-cust-notifications__mark-all" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending || (data?.unreadCount ?? 0) === 0}>
          {markAllRead.isPending ? 'Marking read…' : 'Mark all read'}
        </button>
      </div>

      {isFetching && !isLoading && <p className="cc-cust-notifications__state" role="status" aria-live="polite">Refreshing notifications…</p>}
      {isLoading && <p className="cc-cust-notifications__state" role="status" aria-live="polite">Loading notifications…</p>}
      {error && (
        <div className="cc-cust-notifications__state cc-cust-notifications__state--error" role="alert">
          <p>Notifications are temporarily unavailable.</p>
          <button type="button" className="cc-cust-notifications__retry" onClick={() => void refetch()}>Retry</button>
        </div>
      )}
      {markRead.isError && <p className="cc-cust-notifications__state cc-cust-notifications__state--error" role="alert">That notification could not be marked as read. Please try again.</p>}
      {markAllRead.isError && <p className="cc-cust-notifications__state cc-cust-notifications__state--error" role="alert">Notifications could not be updated. Please try again.</p>}

      {!isLoading && !error && data?.items.length === 0 && (
        <p className="cc-cust-notifications__state" role="status">{search.trim() ? 'No notifications match your search.' : filter === 'unread' ? 'You have no unread notifications.' : 'No notifications are available yet.'}</p>
      )}

      {!isLoading && !error && data && data.items.length > 0 && (
        <div className="cc-cust-notifications__list" aria-label="Customer notifications">
          {data.items.map((notification) => {
            const route = appRouteFor(notification);
            return (
              <article key={notification.id} className={`cc-cust-notification-card ${notification.isRead ? '' : 'cc-cust-notification-card--unread'}`}>
                <div className="cc-cust-notification-card__header">
                  <div>
                    <p className="cc-cust-notification-card__type">{notification.type}</p>
                    <h2 className="cc-cust-notification-card__title">{notification.title || notification.message}</h2>
                  </div>
                  {!notification.isRead && <span className="cc-cust-notification-card__new">New</span>}
                </div>
                {notification.title && <p className="cc-cust-notification-card__message">{notification.message}</p>}
                <time className="cc-cust-notification-card__date" dateTime={notification.createdAt}>{new Date(notification.createdAt).toLocaleString()}</time>
                <div className="cc-cust-notification-card__actions">
                  {!notification.isRead && <button type="button" className="cc-cust-notification-card__action" onClick={() => markRead.mutate(notification.id)} disabled={markRead.isPending}>Mark as read</button>}
                  {route && <button type="button" className="cc-cust-notification-card__link" onClick={() => openRelated(notification)}>Open related record</button>}
                  {!route && notification.related && <span className="cc-cust-notification-card__unavailable">Related record is not available in this view.</span>}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
