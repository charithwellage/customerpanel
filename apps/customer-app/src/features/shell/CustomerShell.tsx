import React, { ReactNode } from 'react';
import { CustomerShellProvider, CustomerShellProviderProps, useCustomerShell } from './CustomerShellProvider.js';
import { CustomerNav } from './CustomerNav.js';
import { CustomerErrorBoundary } from './CustomerErrorBoundary.js';

export interface CustomerShellInnerProps {
  children: ReactNode;
  pageTitle?: string;
  pageSubtitle?: string;
  loading?: boolean;
  empty?: boolean;
  emptyMessage?: string;
  error?: string | null;
  onRetry?: () => void;
}

const CustomerShellInner: React.FC<CustomerShellInnerProps> = ({
  children,
  pageTitle,
  pageSubtitle,
  loading = false,
  empty = false,
  emptyMessage = 'No records available for this section.',
  error = null,
  onRetry,
}) => {
  const { activeRoute } = useCustomerShell();

  return (
    <div className="cc-cust-shell-layout" data-active-route={activeRoute}>
      <a className="cc-cust-shell-skip-link" href="#main-content">
        Skip to main content
      </a>
      <CustomerNav />

      <div className="cc-cust-shell-main-wrapper">
        <main className="cc-cust-shell-main" id="main-content" tabIndex={-1}>
          {(pageTitle || pageSubtitle) && (
            <header className={`cc-cust-shell-page-header ${activeRoute === '/dashboard' ? 'cc-cust-shell-page-header--overview sr-only' : ''}`}>
              <div className="cc-cust-shell-page-header__container">
                {pageTitle && <h1 className="cc-cust-shell-page-header__title">{pageTitle}</h1>}
                {pageSubtitle && <p className="cc-cust-shell-page-header__subtitle">{pageSubtitle}</p>}
              </div>
            </header>
          )}

          <div className="cc-cust-shell-container">
            <CustomerErrorBoundary>
              {loading ? (
                <div className="cc-cust-shell-loading" role="status" aria-live="polite">
                  <div className="cc-cust-shell-spinner" aria-hidden="true" />
                  <span>Loading portal data&hellip;</span>
                </div>
              ) : error ? (
                <div className="cc-cust-shell-error-banner" role="alert">
                  <strong>Unable to load section data.</strong>
                  <p>{error}</p>
                  {onRetry && (
                    <button type="button" className="cc-cust-shell-btn cc-cust-shell-btn--primary" onClick={onRetry}>
                      Retry
                    </button>
                  )}
                </div>
              ) : empty ? (
                <div className="cc-cust-shell-empty" role="status">
                  <p>{emptyMessage}</p>
                </div>
              ) : (
                children
              )}
            </CustomerErrorBoundary>
          </div>
        </main>

        <footer className="cc-cust-shell-footer">
          <div className="cc-cust-shell-footer__container">
            <p>&copy; {new Date().getFullYear()} CarChief Operations Portal. All rights reserved.</p>
            <div className="cc-cust-shell-footer__links">
              <span className="cc-cust-shell-footer__badge">⚡ Mock API Enabled</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export interface CustomerShellProps extends CustomerShellInnerProps, CustomerShellProviderProps {}

export const CustomerShell: React.FC<CustomerShellProps> = ({
  initialUser,
  initialRoute,
  themeId,
  navItems,
  onSignOut,
  ...innerProps
}) => {
  return (
    <CustomerShellProvider
      initialUser={initialUser}
      initialRoute={initialRoute}
      themeId={themeId}
      navItems={navItems}
      onSignOut={onSignOut}
    >
      <CustomerShellInner {...innerProps} />
    </CustomerShellProvider>
  );
};
