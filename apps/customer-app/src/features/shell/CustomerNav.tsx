import React, { useId, useState } from 'react';
import { useCustomerShell } from './CustomerShellProvider.js';
import { QueryClientContext } from '@tanstack/react-query';
import { useCustomerNotifications } from '../notifications/useCustomerNotifications.js';
import {
  BrandBuildingIcon,
  DashboardGridIcon,
  ShowroomCarIcon,
  InquiriesChatIcon,
  WishlistHeartIcon,
  FavouritesStarIcon,
  VehiclesSideCarIcon,
  StopwatchClockIcon,
  InvoiceDocumentIcon,
  WireRemittanceDollarIcon,
  VaultShieldIcon,
  BulletinsBellIcon,
  ClientProfileUserIcon,
  MidnightMoonIcon,
  DaylightSunIcon,
  SyncArrowsIcon,
  ExternalArrowIcon,
  SecureLogoutDoorIcon,
} from '../../components/Icons.js';

const LiveNotificationBadge: React.FC = () => {
  const { data } = useCustomerNotifications('all', '');
  const count = data?.unreadCount ?? 0;
  if (count <= 0) return null;
  return <span className="cc-cust-shell-nav__badge">{count}</span>;
};

const LiveNotificationBadgeWrapper: React.FC<{ fallbackBadge?: string | number }> = ({ fallbackBadge }) => {
  const queryClient = React.useContext(QueryClientContext);
  if (!queryClient) {
    return fallbackBadge ? <span className="cc-cust-shell-nav__badge">{fallbackBadge}</span> : null;
  }
  return <LiveNotificationBadge />;
};

export const CustomerNav: React.FC = () => {
  const {
    user,
    activeRoute,
    setActiveRoute,
    isMobileMenuOpen,
    toggleMobileMenu,
    closeMobileMenu,
    navigationItems,
    themeMode,
    toggleThemeMode,
    onSignOut,
  } = useCustomerShell();
  const mobileMenuId = useId();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncData = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
    }, 800);
  };

  const renderNavIcon = (itemId: string, fallbackIcon?: string) => {
    switch (itemId) {
      case 'dashboard':
        return <DashboardGridIcon size={18} />;
      case 'inventory':
        return <ShowroomCarIcon size={18} />;
      case 'inquiries':
        return <InquiriesChatIcon size={18} />;
      case 'wishlist':
        return <WishlistHeartIcon size={18} />;
      case 'favourites':
        return <FavouritesStarIcon size={18} />;
      case 'vehicles':
        return <VehiclesSideCarIcon size={18} />;
      case 'shipments':
        return <StopwatchClockIcon size={18} />;
      case 'invoices':
        return <InvoiceDocumentIcon size={18} />;
      case 'payments':
        return <WireRemittanceDollarIcon size={18} />;
      case 'documents':
        return <VaultShieldIcon size={18} />;
      case 'notifications':
        return <BulletinsBellIcon size={18} />;
      case 'profile':
        return <ClientProfileUserIcon size={18} />;
      default:
        return fallbackIcon ? <span>{fallbackIcon}</span> : null;
    }
  };

  return (
    <aside className="cc-cust-shell-sidebar">
      <div className="cc-cust-shell-sidebar__inner">
        {/* Top Brand Header */}
        <div className="cc-cust-shell-sidebar__brand">
          <a
            href="/dashboard"
            className="cc-cust-shell-sidebar__logo-link"
            onClick={(e) => {
              e.preventDefault();
              setActiveRoute('/dashboard');
              closeMobileMenu();
            }}
          >
            <div className="cc-cust-shell-sidebar__logo-wrap">
              <BrandBuildingIcon size={22} className="cc-cust-shell-sidebar__logo-icon" />
              <span className="cc-cust-shell-sidebar__logo-badge">CARCHIEF</span>
              <span className="cc-cust-shell-sidebar__portal-pill">PORTAL</span>
            </div>
            <span className="sr-only">CUSTOMER PORTAL</span>
          </a>

          <button
            type="button"
            className="cc-cust-shell-mobile-toggle"
            aria-expanded={isMobileMenuOpen}
            aria-controls={mobileMenuId}
            data-testid="cust-mobile-toggle"
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            onClick={toggleMobileMenu}
          >
            <span className="cc-cust-shell-mobile-toggle__icon">{isMobileMenuOpen ? '✕' : '☰'}</span>
          </button>
        </div>

        {/* Primary Navigation */}
        <nav className="cc-cust-shell-nav--desktop" aria-label="Customer Desktop Navigation">
          <ul className="cc-cust-shell-nav__list">
            {navigationItems.map((item) => {
              const isActive = activeRoute === item.href || (item.href !== '/dashboard' && activeRoute.startsWith(`${item.href}/`));
              return (
                <li key={item.id} className="cc-cust-shell-nav__item">
                  <a
                    href={item.href}
                    className={`cc-cust-shell-nav__link ${isActive ? 'cc-cust-shell-nav__link--active' : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                    aria-label={`${item.label}${item.altLabel ? ` (${item.altLabel})` : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveRoute(item.href);
                    }}
                  >
                    <span className="cc-cust-shell-nav__icon" aria-hidden="true">
                      {renderNavIcon(item.id, item.icon)}
                    </span>
                    <span className="cc-cust-shell-nav__label">{item.label}</span>
                    {item.altLabel && <span className="sr-only">{item.altLabel}</span>}
                    {item.id === 'notifications' ? (
                      <LiveNotificationBadgeWrapper fallbackBadge={item.badge} />
                    ) : (
                      item.badge ? <span className="cc-cust-shell-nav__badge">{item.badge}</span> : null
                    )}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Sidebar Utilities & Logout */}
        <div className="cc-cust-shell-sidebar__footer">
          <div className="cc-cust-shell-sidebar__tools">
            <button
              type="button"
              className="cc-cust-sidebar-tool-btn"
              onClick={toggleThemeMode}
              aria-pressed={themeMode === 'midnight'}
              title={themeMode === 'midnight' ? 'Switch to Daylight Mode' : 'Switch to Midnight Mode'}
            >
              <span className="cc-cust-tool-icon" aria-hidden="true">
                {themeMode === 'midnight' ? (
                  <DaylightSunIcon size={16} />
                ) : (
                  <MidnightMoonIcon size={16} />
                )}
              </span>
              <span>{themeMode === 'midnight' ? 'Daylight Mode' : 'Midnight Mode'}</span>
            </button>

            <button
              type="button"
              className="cc-cust-sidebar-tool-btn"
              onClick={handleSyncData}
              disabled={isSyncing}
            >
              <span className={`cc-cust-tool-icon ${isSyncing ? 'cc-cust-tool-icon--spin' : ''}`} aria-hidden="true">
                <SyncArrowsIcon size={16} />
              </span>
              <span>{isSyncing ? 'Syncing...' : 'Sync Sourcing Data'}</span>
            </button>

            <a
              href="http://localhost:3000"
              className="cc-cust-sidebar-tool-btn"
            >
              <span className="cc-cust-tool-icon" aria-hidden="true">
                <ExternalArrowIcon size={16} />
              </span>
              <span>Exit To Showroom</span>
            </a>
          </div>

          <div className="cc-cust-shell-sidebar__auth-action">
            {user ? (
              onSignOut ? (
                <button
                  type="button"
                  className="cc-cust-shell-signout-btn"
                  onClick={onSignOut}
                >
                  <span className="cc-cust-logout-icon" aria-hidden="true">
                    <SecureLogoutDoorIcon size={16} />
                  </span>
                  <span>Secure Log Out</span>
                  <span className="sr-only">Sign out</span>
                </button>
              ) : null
            ) : (
              <span className="cc-cust-shell-login-btn" data-testid="cust-nav-signed-out">
                Not signed in
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {isMobileMenuOpen && (
        <nav id={mobileMenuId} className="cc-cust-shell-nav--mobile" aria-label="Customer Mobile Navigation">
          <ul className="cc-cust-shell-nav__list--mobile">
            {navigationItems.map((item) => {
              const isActive = activeRoute === item.href || (item.href !== '/dashboard' && activeRoute.startsWith(`${item.href}/`));
              return (
                <li key={item.id} className="cc-cust-shell-nav__item--mobile">
                  <a
                    href={item.href}
                    className={`cc-cust-shell-nav__link--mobile ${isActive ? 'cc-cust-shell-nav__link--active' : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveRoute(item.href);
                      closeMobileMenu();
                    }}
                  >
                    <span className="cc-cust-shell-nav__icon" aria-hidden="true">
                      {renderNavIcon(item.id, item.icon)}
                    </span>
                    <span>{item.label}</span>
                    {item.altLabel && <span className="sr-only">{item.altLabel}</span>}
                    {item.id === 'notifications' ? (
                      <LiveNotificationBadgeWrapper fallbackBadge={item.badge} />
                    ) : (
                      item.badge ? <span className="cc-cust-shell-nav__badge">{item.badge}</span> : null
                    )}
                  </a>
                </li>
              );
            })}
          </ul>

          <div className="cc-cust-shell-nav__mobile-footer">
            {user && onSignOut && (
              <button
                type="button"
                className="cc-cust-shell-signout-btn cc-cust-shell-signout-btn--mobile"
                onClick={() => {
                  closeMobileMenu();
                  onSignOut();
                }}
              >
                <span className="cc-cust-logout-icon" aria-hidden="true">
                  <SecureLogoutDoorIcon size={16} />
                </span>
                <span>Secure Log Out</span>
                <span className="sr-only">Sign out</span>
              </button>
            )}
          </div>
        </nav>
      )}
    </aside>
  );
};
