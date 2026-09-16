import React, { useState } from 'react';
import { CUSTOMER_PWA_CONFIG } from './pwaConfig.js';

export interface CustomerPwaBannerProps {
  onInstall?: () => void;
  onRefresh?: () => void;
}

export const CustomerPwaBanner: React.FC<CustomerPwaBannerProps> = ({ onInstall, onRefresh }) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <aside className="cc-pwa-banner" aria-label="App Installation Prompt">
      <div className="cc-pwa-banner__container">
        <div className="cc-pwa-banner__info">
          <div className="cc-pwa-banner__header-line">
            <span className="cc-pwa-banner__badge">⚡ PWA READY</span>
            <strong className="cc-pwa-banner__title">
              <span className="cc-pwa-banner__title-full">Install {CUSTOMER_PWA_CONFIG.appName}</span>
              <span className="cc-pwa-banner__title-short">Install {CUSTOMER_PWA_CONFIG.shortName}</span>
            </strong>
          </div>
          <p className="cc-pwa-banner__subtitle">
            Add CarChief to your home screen or desktop for fast offline fleet tracking and instant document access.
          </p>
        </div>
        <div className="cc-pwa-banner__actions">
          {onInstall && (
            <button
              type="button"
              className="cc-cust-shell-btn cc-cust-shell-btn--primary"
              onClick={onInstall}
            >
              Install App 📲
            </button>
          )}
          {onRefresh && (
            <button
              type="button"
              className="cc-cust-shell-btn cc-cust-shell-btn--secondary"
              onClick={onRefresh}
            >
              Manual Refresh 🔄
            </button>
          )}
          <button
            type="button"
            className="cc-pwa-banner__close"
            aria-label="Dismiss banner"
            onClick={() => setDismissed(true)}
          >
            ✕
          </button>
        </div>
      </div>
    </aside>
  );
};
