import React from 'react';
import type { Notification } from '@carchief/api-client';
import { useCustomerShell } from '../shell/index.js';
import {
  useCustomerNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useDeleteNotification,
  type NotificationFilter,
} from './useCustomerNotifications.js';

export function appRouteFor(notification: Notification): string | null {
  const related = notification.related;
  if (!related) return null;
  if (related.kind === 'Vehicle') return `/vehicles/${related.id}`;
  if (related.kind === 'Invoice' || related.kind === 'ProformaInvoice') return `/invoices/${related.id}`;
  if (related.kind === 'Shipment' || related.kind === 'ShipOk') return '/vehicles';
  if (related.kind === 'Document' || related.kind === 'DocumentRelease') return '/documents';
  if (related.kind === 'Payment') return '/payments';
  return null;
}

function formatNotificationDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
  } catch {
    return isoString;
  }
}

function getNotificationTitle(n: Notification): string {
  if (n.title) return n.title;
  if (n.type === 'Payment') return 'TT WIRE PAYMENT APPROVED';
  if (n.type === 'Shipment') return 'VESSEL SHIPMENT SCHEDULED';
  if (n.type === 'Document') return 'DOCUMENT RELEASE READY';
  if (n.type === 'Vehicle') return 'VEHICLE STATUS UPDATED';
  return 'ACCOUNT ACTIVITY UPDATE';
}

function getNotificationTypeTag(n: Notification): string {
  if (n.type === 'Payment') return '(PAYMENT_APPROVED)';
  if (n.type === 'Shipment') return '(SHIPMENT_SCHEDULED)';
  if (n.type === 'Document') return '(DOCUMENT_RELEASED)';
  if (n.type === 'Vehicle') return '(VEHICLE_UPDATED)';
  return `(${n.type.toUpperCase()})`;
}

export const NotificationsPage: React.FC = () => {
  const { setActiveRoute } = useCustomerShell();
  const [filter, setFilter] = React.useState<NotificationFilter>('all');
  const [search, setSearch] = React.useState('');
  const { data, isLoading, isFetching, error, refetch } = useCustomerNotifications(filter, search.trim());
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteNotif = useDeleteNotification();

  React.useEffect(() => {
    setActiveRoute('/notifications');
  }, [setActiveRoute]);

  const openRelated = (notification: Notification) => {
    const route = appRouteFor(notification);
    if (route) setActiveRoute(route);
  };

  const handleMarkRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    markRead.mutate(id);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNotif.mutate(id);
  };

  return (
    <div className="cc-notifs-page" aria-labelledby="bulletins-title">
      {/* Top Search & Filter Bar */}
      <div className="cc-notifs-toolbar" role="search" aria-label="Notification search and filters">
        <div className="cc-notifs-search-wrap">
          <svg className="cc-notifs-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            id="bulletins-search"
            type="search"
            className="cc-notifs-search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notifications..."
            aria-label="Search notifications"
          />
        </div>

        <div className="cc-notifs-filter-wrap">
          <select
            id="bulletins-filter-select"
            className="cc-notifs-filter-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value as NotificationFilter)}
            aria-label="Filter notifications by status"
          >
            <option value="all">All Notifications</option>
            <option value="unread">Unread Notifications</option>
            <option value="read">Read Notifications</option>
          </select>
        </div>

        <button
          type="button"
          id="bulletins-mark-all-btn"
          className="cc-notifs-mark-all-btn"
          onClick={() => markAllRead.mutate()}
          disabled={markAllRead.isPending || (data?.unreadCount ?? 0) === 0}
        >
          {markAllRead.isPending ? 'MARKING...' : 'MARK ALL READ'}
        </button>
      </div>

      {/* Loading & Status Alerts */}
      {isFetching && !isLoading && (
        <div className="cc-notifs-status" role="status" aria-live="polite">
          Refreshing notifications...
        </div>
      )}
      {isLoading && (
        <div className="cc-notifs-status" role="status" aria-live="polite">
          Loading live notifications from database...
        </div>
      )}
      {error && (
        <div className="cc-notifs-status cc-notifs-status--error" role="alert">
          <p>Notifications are temporarily unavailable.</p>
          <button type="button" className="cc-notifs-retry-btn" onClick={() => void refetch()}>
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && data?.items.length === 0 && (
        <div className="cc-notifs-empty" role="status">
          <div className="cc-notifs-empty-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
          <p className="cc-notifs-empty-text">
            {search.trim()
              ? 'No notifications match your search query.'
              : filter === 'unread'
              ? 'You have no unread notifications.'
              : 'No live bulletins or notifications found in database.'}
          </p>
        </div>
      )}

      {/* Notifications List */}
      {!isLoading && !error && data && data.items.length > 0 && (
        <div className="cc-notifs-list" aria-label="Customer notifications">
          {data.items.map((notification) => {
            const isUnread = !notification.isRead;
            const route = appRouteFor(notification);
            const title = getNotificationTitle(notification);
            const typeTag = getNotificationTypeTag(notification);
            const dateStr = formatNotificationDate(notification.createdAt);

            return (
              <article
                key={notification.id}
                className={`cc-notif-card ${isUnread ? 'cc-notif-card--unread' : 'cc-notif-card--read'}`}
                onClick={() => {
                  if (route) openRelated(notification);
                }}
              >
                {/* Left Icon Badge */}
                <div className={`cc-notif-icon-box ${isUnread ? 'cc-notif-icon-box--unread' : 'cc-notif-icon-box--read'}`} aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>

                {/* Main Content Area */}
                <div className="cc-notif-body">
                  <div className="cc-notif-header-line">
                    <span className="cc-notif-title">{title}</span>
                    <span className="cc-notif-badge-critical">CRITICAL</span>
                    <span className="cc-notif-type-tag">{typeTag}</span>
                  </div>

                  <p className="cc-notif-message">{notification.message}</p>

                  <time className="cc-notif-timestamp" dateTime={notification.createdAt}>
                    {dateStr}
                  </time>
                </div>

                {/* Right Action Buttons */}
                <div className="cc-notif-actions" onClick={(e) => e.stopPropagation()}>
                  {isUnread && (
                    <button
                      type="button"
                      className="cc-notif-read-btn"
                      onClick={(e) => handleMarkRead(notification.id, e)}
                      disabled={markRead.isPending}
                      title="Mark as read"
                      aria-label="Mark as read"
                    >
                      READ
                    </button>
                  )}

                  <button
                    type="button"
                    className="cc-notif-delete-btn"
                    onClick={(e) => handleDelete(notification.id, e)}
                    disabled={deleteNotif.isPending}
                    title="Delete notification"
                    aria-label="Delete notification"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
