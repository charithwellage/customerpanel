import React, { ReactNode } from 'react';
import { useCustomerOnlineStatus } from './useCustomerOnlineStatus.js';

export interface OfflineGuardProps {
  children: ReactNode;
  allowReadOnlyOffline?: boolean;
}

export const OfflineGuard: React.FC<OfflineGuardProps> = ({ children, allowReadOnlyOffline = true }) => {
  const isOnlineState = useCustomerOnlineStatus();

  return (
    <>
      {!isOnlineState && (
        <div className="cc-pwa-offline-banner" role="status" aria-live="polite">
          <div className="cc-pwa-offline-banner__container">
            <span className="cc-pwa-offline-banner__icon">📡</span>
            <div className="cc-pwa-offline-banner__text">
              <strong>Offline Mode Active</strong>
              <span>
                {allowReadOnlyOffline
                  ? 'You are viewing cached portal data. Financial payments, allocations, and vehicle reservations are blocked while offline.'
                  : 'Connectivity required to view this section.'}
              </span>
            </div>
          </div>
        </div>
      )}
      {children}
    </>
  );
};
