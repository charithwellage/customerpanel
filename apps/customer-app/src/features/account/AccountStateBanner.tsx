import React from 'react';
import { AccountStatus } from './accountState.js';

export interface AccountStateBannerProps {
  status: AccountStatus;
  message?: string;
  onAction?: () => void;
  actionLabel?: string;
}

export const AccountStateBanner: React.FC<AccountStateBannerProps> = ({
  status,
  message,
  onAction,
  actionLabel = 'Re-authenticate',
}) => {
  if (status === 'ACTIVE') return null;

  const statusConfig: Record<AccountStatus, { title: string; defaultMsg: string; badgeClass: string }> = {
    ACTIVE: { title: 'Active Session', defaultMsg: 'Your session is active.', badgeClass: 'cc-acc-banner--active' },
    INACTIVE: { title: 'Account Inactive', defaultMsg: 'Your account is currently inactive. Contact your operations representative.', badgeClass: 'cc-acc-banner--inactive' },
    LOCKED: { title: 'Account Locked', defaultMsg: 'Security lock applied. Please complete Keycloak recovery process.', badgeClass: 'cc-acc-banner--locked' },
    UNAUTHORIZED: { title: 'Unauthorized Access', defaultMsg: 'You must sign in with a valid customer account to view this resource.', badgeClass: 'cc-acc-banner--unauthorized' },
    EXPIRED: { title: 'Session Expired', defaultMsg: 'Your demo session has expired. Please sign in again.', badgeClass: 'cc-acc-banner--expired' },
  };

  const config = statusConfig[status];

  return (
    <div className={`cc-acc-banner ${config.badgeClass}`} role="alert" aria-live="assertive">
      <div className="cc-acc-banner__content">
        <strong className="cc-acc-banner__title">{config.title}</strong>
        <p className="cc-acc-banner__message">{message || config.defaultMsg}</p>
      </div>
      {onAction && (
        <button type="button" className="cc-acc-banner__btn" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
};
