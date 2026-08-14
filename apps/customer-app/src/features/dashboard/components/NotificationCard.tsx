import React from 'react';
import type { CustomerDashboard } from '@carchief/api-client';

export interface NotificationCardProps {
  dashboard: CustomerDashboard;
}

/**
 * Displays unread notification count.
 * Shows whether the customer has any pending notifications.
 */
export const NotificationCard: React.FC<NotificationCardProps> = ({ dashboard }) => {
  return (
    <article className="cc-cust-card cc-cust-card--notifications">
      <div className="cc-cust-card__header">
        <h2 className="cc-cust-card__title">Notifications</h2>
      </div>

      <div className="cc-cust-card__content">
        <div className="cc-cust-card__stat">
          <dt className="cc-cust-card__label">Unread</dt>
          <dd
            className={`cc-cust-card__value ${
              dashboard.notificationUnreadCount > 0 ? 'cc-cust-card__value--alert' : ''
            }`}
          >
            {dashboard.notificationUnreadCount} {dashboard.notificationUnreadCount === 1 ? 'notification' : 'notifications'}
          </dd>
        </div>

        {dashboard.notificationUnreadCount > 0 && (
          <p className="cc-cust-card__hint">You have unread messages. Please review them.</p>
        )}
      </div>
    </article>
  );
};
