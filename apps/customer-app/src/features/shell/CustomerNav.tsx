import React, { useId, useState } from 'react';
import { useCustomerShell } from './CustomerShellProvider.js';
import type { NavigationItem, SubNavigationItem } from './CustomerShellProvider.js';
import { QueryClientContext } from '@tanstack/react-query';
import { useCustomerNotifications } from '../notifications/useCustomerNotifications.js';
import { useTranslation, CustomerLanguageSwitcher } from '../../i18n/index.js';
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

/** Returns the translated label for a top-level nav group. */
function getGroupLabel(item: NavigationItem, t: (key: string, params?: Record<string, string | number>, fallback?: string) => string): string {
  switch (item.id) {
    case 'dashboard': return t('customer.dashboard', undefined, item.label);
    case 'browse':    return t('customer.allInventoryStock', undefined, item.label);
    case 'garage':    return t('customer.myVehicles', undefined, item.label);
    case 'finances':  return t('customer.finances', undefined, item.label);
    case 'account':   return t('customer.account', undefined, item.label);
    default: return item.label;
  }
}

/** Returns the translated label for a sub-item. */
function getSubItemLabel(item: SubNavigationItem, t: (key: string, params?: Record<string, string | number>, fallback?: string) => string): string {
  switch (item.id) {
    case 'inventory':     return t('customer.inventory', undefined, item.label);
    case 'inquiries':     return t('customer.inquiries', undefined, item.label);
    case 'wishlist':      return t('customer.wishlist', undefined, item.label);
    case 'favourites':    return t('customer.favourites', undefined, item.label);
    case 'vehicles':      return t('customer.myVehicles', undefined, item.label);
    case 'shipments':     return t('customer.holdVehicles', undefined, item.label);
    case 'statement':     return t('customer.statement', undefined, item.label);
    case 'invoices':      return t('customer.purchasedVehicles', undefined, item.label);
    case 'payments':      return t('customer.payments', undefined, item.label);
    case 'documents':     return t('customer.documents', undefined, item.label);
    case 'notifications': return t('customer.notifications', undefined, item.label);
    case 'profile':       return t('customer.profile', undefined, item.label);
    default: return item.label;
  }
}

const renderNavIcon = (itemId: string, fallbackIcon?: string): React.ReactNode => {
  switch (itemId) {
    case 'dashboard':     return <DashboardGridIcon size={18} />;
    case 'browse':        return <ShowroomCarIcon size={18} />;
    case 'garage':        return <VehiclesSideCarIcon size={18} />;
    case 'finances':      return <InvoiceDocumentIcon size={18} />;
    case 'account':       return <ClientProfileUserIcon size={18} />;
    case 'statement':     return <InvoiceDocumentIcon size={18} />;
    case 'inventory':     return <ShowroomCarIcon size={18} />;
    case 'inquiries':     return <InquiriesChatIcon size={18} />;
    case 'wishlist':      return <WishlistHeartIcon size={18} />;
    case 'favourites':    return <FavouritesStarIcon size={18} />;
    case 'vehicles':      return <VehiclesSideCarIcon size={18} />;
    case 'shipments':     return <StopwatchClockIcon size={18} />;
    case 'invoices':      return <InvoiceDocumentIcon size={18} />;
    case 'payments':      return <WireRemittanceDollarIcon size={18} />;
    case 'documents':     return <VaultShieldIcon size={18} />;
    case 'notifications': return <BulletinsBellIcon size={18} />;
    case 'profile':       return <ClientProfileUserIcon size={18} />;
    default: return fallbackIcon ? <span>{fallbackIcon}</span> : null;
  }
};

/** Chevron indicator for collapsible groups */
const ChevronIcon: React.FC<{ open: boolean }> = ({ open }) => (
  <svg
    className={`cc-cust-nav-chevron ${open ? 'cc-cust-nav-chevron--open' : ''}`}
    width="12"
    height="12"
    viewBox="0 0 12 12"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface NavGroupProps {
  item: NavigationItem;
  activeRoute: string;
  setActiveRoute: (route: string) => void;
  closeMobileMenu?: () => void;
  mobile?: boolean;
}

const NavGroup: React.FC<NavGroupProps> = ({ item, activeRoute, setActiveRoute, closeMobileMenu, mobile }) => {
  const { t } = useTranslation();

  // A group is active when the active route is the parent or any child route
  const childRoutes = item.children?.map((c) => c.href) ?? [];
  const isGroupActive = activeRoute === item.href || childRoutes.some((r) => activeRoute === r || (r !== '/' && activeRoute.startsWith(`${r}/`)));

  const [isOpen, setIsOpen] = useState(isGroupActive);

  const groupLabel = getGroupLabel(item, t);
  const linkClass = mobile ? 'cc-cust-shell-nav__link--mobile' : 'cc-cust-shell-nav__link';
  const itemClass = mobile ? 'cc-cust-shell-nav__item--mobile' : 'cc-cust-shell-nav__item';

  // Leaf item (no children — just Dashboard)
  if (!item.children || item.children.length === 0) {
    const isActive = activeRoute === item.href;
    return (
      <li className={itemClass}>
        <a
          href={item.href}
          className={`${linkClass} ${isActive ? 'cc-cust-shell-nav__link--active' : ''}`}
          aria-current={isActive ? 'page' : undefined}
          aria-label={`${groupLabel}${item.altLabel ? ` (${item.altLabel})` : ''}`}
          onClick={(e) => {
            e.preventDefault();
            setActiveRoute(item.href);
            closeMobileMenu?.();
          }}
        >
          <span className="cc-cust-shell-nav__icon" aria-hidden="true">
            {renderNavIcon(item.id, item.icon)}
          </span>
          <span className="cc-cust-shell-nav__label">{groupLabel}</span>
        </a>
      </li>
    );
  }

  return (
    <li className={`${itemClass} cc-cust-nav-group`}>
      {/* Group toggle button */}
      <button
        type="button"
        className={`${linkClass} cc-cust-nav-group__toggle ${isGroupActive ? 'cc-cust-shell-nav__link--active' : ''}`}
        aria-expanded={isOpen}
        aria-label={`${groupLabel} — ${isOpen ? 'collapse' : 'expand'} submenu`}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className="cc-cust-shell-nav__icon" aria-hidden="true">
          {renderNavIcon(item.id, item.icon)}
        </span>
        <span className="cc-cust-shell-nav__label">{groupLabel}</span>
        {item.altLabel && <span className="sr-only">{item.altLabel}</span>}
        <ChevronIcon open={isOpen} />
      </button>

      {/* Sub-items */}
      {isOpen && (
        <ul className="cc-cust-nav-group__sub-list" role="group" aria-label={`${groupLabel} submenu`}>
          {item.children.map((child) => {
            const isChildActive = activeRoute === child.href || (child.href !== '/' && activeRoute.startsWith(`${child.href}/`));
            const childLabel = getSubItemLabel(child, t);
            return (
              <li key={child.id} className="cc-cust-nav-group__sub-item">
                <a
                  href={child.href}
                  className={`cc-cust-nav-group__sub-link ${isChildActive ? 'cc-cust-nav-group__sub-link--active' : ''}`}
                  aria-current={isChildActive ? 'page' : undefined}
                  aria-label={`${childLabel}${child.altLabel ? ` (${child.altLabel})` : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveRoute(child.href);
                    closeMobileMenu?.();
                  }}
                >
                  <span className="cc-cust-shell-nav__icon cc-cust-nav-group__sub-icon" aria-hidden="true">
                    {renderNavIcon(child.id, child.icon)}
                  </span>
                  <span>{childLabel}</span>
                  {child.id === 'notifications' ? (
                    <LiveNotificationBadgeWrapper fallbackBadge={child.badge} />
                  ) : (
                    child.badge ? <span className="cc-cust-shell-nav__badge">{child.badge}</span> : null
                  )}
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
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
  const { t } = useTranslation();
  const mobileMenuId = useId();
  const [isSyncing, setIsSyncing] = useState(false);
  const publicWebUrl = typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:3000`
    : 'http://127.0.0.1:3000';

  const handleSyncData = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
    }, 800);
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

        {/* Primary Navigation — 5 consolidated groups */}
        <nav className="cc-cust-shell-nav--desktop" aria-label="Customer Desktop Navigation">
          <ul className="cc-cust-shell-nav__list">
            {navigationItems.map((item) => (
              <NavGroup
                key={item.id}
                item={item}
                activeRoute={activeRoute}
                setActiveRoute={setActiveRoute}
              />
            ))}
          </ul>
        </nav>

        {/* Bottom Sidebar Utilities & Logout */}
        <div className="cc-cust-shell-sidebar__footer">
          <div className="cc-cust-shell-sidebar__tools">
            {/* Customer Language Switcher (D02-P14-T006) */}
            <CustomerLanguageSwitcher id="desktop-cust-language-switcher" />

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
              <span>{isSyncing ? 'Syncing...' : t('customer.sync', undefined, 'Sync Data')}</span>
            </button>

            <a
              href={publicWebUrl}
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
                  <span>{t('customer.logout', undefined, 'Secure Log Out')}</span>
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
          <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--color-border)' }}>
            <CustomerLanguageSwitcher id="mobile-cust-language-switcher" />
          </div>

          <ul className="cc-cust-shell-nav__list--mobile">
            {navigationItems.map((item) => (
              <NavGroup
                key={item.id}
                item={item}
                activeRoute={activeRoute}
                setActiveRoute={setActiveRoute}
                closeMobileMenu={closeMobileMenu}
                mobile
              />
            ))}
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
                <span>{t('customer.logout', undefined, 'Secure Log Out')}</span>
                <span className="sr-only">Sign out</span>
              </button>
            )}
          </div>
        </nav>
      )}
    </aside>
  );
};
