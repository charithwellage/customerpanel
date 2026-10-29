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
  InvoiceDocumentIcon,
  WireRemittanceDollarIcon,
  VaultShieldIcon,
  BulletinsBellIcon,
  ClientProfileUserIcon,
  MidnightMoonIcon,
  DaylightSunIcon,
  ExternalArrowIcon,
  SecureLogoutDoorIcon,
  CarChiefLogoMark,
  SidebarCollapseIcon,
  DemandTargetIcon,
  PortReadyBoxIcon,
  HomeIcon,
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

export const GlobalBulletinBellLive: React.FC<{ onOpen: () => void }> = ({ onOpen }) => {
  const { activeRoute, setActiveRoute, previousRoute } = useCustomerShell();
  const { data } = useCustomerNotifications('all', '');
  const unreadCount = data?.unreadCount ?? 0;
  const isNotificationsOpen = activeRoute === '/notifications';

  const handleClick = () => {
    if (isNotificationsOpen) {
      const target = (previousRoute && previousRoute !== '/notifications') ? previousRoute : '/dashboard';
      setActiveRoute(target);
    } else {
      onOpen();
    }
  };

  return (
    <button
      type="button"
      className={`cc-cust-top-action-btn cc-cust-top-bell-btn${isNotificationsOpen ? ' cc-cust-top-bell-btn--active' : ''}`}
      aria-label={
        isNotificationsOpen
          ? 'Minimize notifications and return'
          : unreadCount > 0
          ? `Bulletins and alerts, ${unreadCount} unread`
          : 'Bulletins and alerts'
      }
      title={isNotificationsOpen ? 'Minimize Notifications' : 'Bulletins & Alerts'}
      aria-expanded={isNotificationsOpen}
      onClick={handleClick}
    >
      <BulletinsBellIcon size={16} />
      {unreadCount > 0 && <span className="cc-cust-top-bell-badge">{unreadCount}</span>}
    </button>
  );
};

export const TopNotificationBellLive = GlobalBulletinBellLive;

export interface CustomerTopCornerActionsProps {
  compact?: boolean;
}

export const CustomerTopCornerActions: React.FC<CustomerTopCornerActionsProps> = ({ compact = false }) => {
  const { activeRoute, setActiveRoute, previousRoute, themeMode, toggleThemeMode, closeMobileMenu } = useCustomerShell();
  const queryClient = React.useContext(QueryClientContext);
  const isNotificationsOpen = activeRoute === '/notifications';

  const handleFallbackBellToggle = () => {
    if (isNotificationsOpen) {
      const target = (previousRoute && previousRoute !== '/notifications') ? previousRoute : '/dashboard';
      setActiveRoute(target);
    } else {
      setActiveRoute('/notifications');
    }
  };

  const handleHomeClick = () => {
    setActiveRoute('/dashboard');
    closeMobileMenu();
  };

  return (
    <aside className="cc-cust-top-actions" aria-label="Quick user actions" data-testid="cust-top-actions">
      {/* 1. Home / Dashboard Shortcut Button (Mobile Only) */}
      {compact && (
        <button
          type="button"
          className={`cc-cust-top-action-btn cc-cust-top-home-btn${activeRoute === '/dashboard' ? ' cc-cust-top-home-btn--active' : ''}`}
          onClick={handleHomeClick}
          aria-label="Navigate to Dashboard"
          title="Dashboard / Home"
          data-testid="cust-top-home-btn"
        >
          <span className="cc-cust-top-btn-icon" aria-hidden="true">
            <HomeIcon size={13} />
          </span>
        </button>
      )}

      {/* 2. Change Language Option */}
      <CustomerLanguageSwitcher
        id={compact ? 'mobile-top-language-switcher' : 'top-corner-language-switcher'}
        compact={compact}
      />

      <div className="cc-cust-top-actions-divider" aria-hidden="true" />

      {/* 2. Midnight Mode ONLY Icon */}
      <button
        type="button"
        className="cc-cust-top-action-btn cc-cust-top-theme-btn"
        onClick={toggleThemeMode}
        aria-pressed={themeMode === 'midnight'}
        aria-label={themeMode === 'midnight' ? 'Switch to Daylight Mode' : 'Switch to Midnight Mode'}
        title={themeMode === 'midnight' ? 'Switch to Daylight Mode' : 'Switch to Midnight Mode'}
        data-testid="cust-top-theme-toggle"
      >
        <span className="cc-cust-top-btn-icon" aria-hidden="true">
          {themeMode === 'midnight' ? (
            <DaylightSunIcon size={15} />
          ) : (
            <MidnightMoonIcon size={15} />
          )}
        </span>
      </button>

      {/* 3. Notification Bell Icon */}
      {queryClient ? (
        <GlobalBulletinBellLive onOpen={() => setActiveRoute('/notifications')} />
      ) : (
        <button
          type="button"
          className={`cc-cust-top-action-btn cc-cust-top-bell-btn${isNotificationsOpen ? ' cc-cust-top-bell-btn--active' : ''}`}
          aria-label={isNotificationsOpen ? 'Minimize notifications and return' : 'Bulletins and alerts'}
          title={isNotificationsOpen ? 'Minimize Notifications' : 'Bulletins & Alerts'}
          aria-expanded={isNotificationsOpen}
          onClick={handleFallbackBellToggle}
        >
          <BulletinsBellIcon size={16} />
        </button>
      )}
    </aside>
  );
};

/** Returns the translated label for a top-level nav group. */
function getGroupLabel(item: NavigationItem, t: (key: string, params?: Record<string, string | number>, fallback?: string) => string): string {
  switch (item.id) {
    case 'dashboard': return t('customer.dashboard', undefined, item.label);
    case 'browse':    return t('customer.allInventoryStock', undefined, item.label);
    case 'demand':    return t('customer.demandManagement', undefined, item.label);
    case 'garage':    return t('customer.myVehicles', undefined, item.label);
    case 'statement': return t('customer.statement', undefined, item.label);
    case 'payments':  return t('customer.wireRemittance', undefined, item.label);
    case 'finances':  return t('customer.finances', undefined, item.label);
    case 'account-payments': return t('customer.accountPayments', undefined, item.label);
    case 'account':   return t('customer.account', undefined, item.label);
    case 'profile':   return t('customer.profileSecurity', undefined, item.label);
    case 'notifications': return t('customer.bulletinsAlerts', undefined, item.label);
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
    case 'vehicles':      return t('customer.myOrders', undefined, item.label);
    case 'statement':     return t('customer.statement', undefined, item.label);
    case 'invoices':      return t('customer.purchasedVehicles', undefined, item.label);
    case 'payments':      return t('customer.wireRemittance', undefined, item.label);
    case 'documents':     return t('customer.documents', undefined, item.label);
    case 'notifications': return t('customer.notifications', undefined, item.label);
    case 'profile':       return t('customer.profile', undefined, item.label);
    case 'consignee':     return t('customer.consigneeNotifyParty', undefined, item.label);
    default: return item.label;
  }
}

const renderNavIcon = (itemId: string, fallbackIcon?: string): React.ReactNode => {
  const getIcon = () => {
    switch (itemId) {
      case 'dashboard':           return <DashboardGridIcon size={15} />;
      case 'browse':              return <ShowroomCarIcon size={15} />;
      case 'demand':              return <DemandTargetIcon size={15} />;
      case 'garage':              return <VehiclesSideCarIcon size={15} />;
      case 'finances':            return <WireRemittanceDollarIcon size={15} />;
      case 'account-payments':    return <WireRemittanceDollarIcon size={15} />;
      case 'account':             return <ClientProfileUserIcon size={15} />;
      case 'statement':           return <InvoiceDocumentIcon size={15} />;
      case 'inventory':           return <ShowroomCarIcon size={15} />;
      case 'inquiries':           return <InquiriesChatIcon size={15} />;
      case 'wishlist':            return <WishlistHeartIcon size={15} />;
      case 'favourites':          return <FavouritesStarIcon size={15} />;
      case 'vehicles':            return <VehiclesSideCarIcon size={15} />;
      case 'invoices':            return <InvoiceDocumentIcon size={15} />;
      case 'payments':            return <WireRemittanceDollarIcon size={15} />;
      case 'payment-allocations': return <InvoiceDocumentIcon size={15} />;
      case 'documents':           return <VaultShieldIcon size={15} />;
      case 'notifications':       return <BulletinsBellIcon size={15} />;
      case 'profile':             return <ClientProfileUserIcon size={15} />;
      case 'consignee':           return <PortReadyBoxIcon size={15} />;
      default: return fallbackIcon ? <span>{fallbackIcon}</span> : null;
    }
  };

  return (
    <span className="cc-cust-nav-icon-wrapper" style={{ color: 'var(--color-text-primary)', display: 'inline-flex', alignItems: 'center' }}>
      {getIcon()}
    </span>
  );
};

/** Chevron indicator for collapsible groups */
const ChevronIcon: React.FC<{ open: boolean }> = ({ open }) => (
  <svg
    className={`cc-cust-nav-chevron ${open ? 'cc-cust-nav-chevron--open' : ''}`}
    width="11"
    height="11"
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
  const { isNavCollapsed } = useCustomerShell();

  // Helper for matching active routes including query strings and hashes
  const isFromWishlist = activeRoute.startsWith('/wishlist') || activeRoute.includes('from=wishlist');
  const isFromDashboard =
    activeRoute.startsWith('/dashboard') ||
    activeRoute.includes('from=dashboard') ||
    activeRoute.includes('from=dashboard_personalized') ||
    activeRoute.includes('section=personalized_vehicles');
  const isFromOrders =
    activeRoute.startsWith('/vehicles') ||
    activeRoute.includes('from=orders_reserved') ||
    activeRoute.includes('from=orders_purchased');
  const isFromInquiries =
    activeRoute.startsWith('/inquiries') ||
    activeRoute.includes('from=inquiries');

  const isPathMatch = (href: string) => {
    if (isFromInquiries) {
      if (href === '/inventory') return false;
      if (href === '/inquiries') return true;
    }
    if (isFromOrders) {
      if (href === '/inventory') return false;
      if (href === '/vehicles') return true;
    }
    if (isFromWishlist) {
      if (href === '/inventory') return false;
      if (href === '/wishlist') return true;
    }
    if (isFromDashboard) {
      if (href === '/inventory') return false;
      if (href === '/dashboard') return true;
    }
    return (
      activeRoute === href ||
      (href !== '/' && (activeRoute.startsWith(`${href}/`) || activeRoute.startsWith(`${href}?`) || activeRoute.startsWith(`${href}#`)))
    );
  };

  // A group is active when the active route is the parent or any child route
  const childRoutes = item.children?.map((c) => c.href) ?? [];
  const isGroupActive = isPathMatch(item.href) || childRoutes.some(isPathMatch);

  // "My Vehicles", "Account & Payments", and "Profile & Security" groups are open by default always, while allowing customer to toggle/minimize it if they want
  const isMyVehicles = item.id === 'garage' || item.href === '/vehicles';
  const isAccountPayments = item.id === 'account-payments' || item.id === 'finances';
  const isProfile = item.id === 'profile' || item.href === '/profile';
  const [isOpen, setIsOpen] = useState(() => isMyVehicles || isAccountPayments || isProfile || isGroupActive);

  // Automatically keep sub-nav open when any child is active
  React.useEffect(() => {
    if (isGroupActive) {
      setIsOpen(true);
    }
  }, [isGroupActive]);

  const groupLabel = getGroupLabel(item, t);
  const linkClass = mobile ? 'cc-cust-shell-nav__link--mobile' : 'cc-cust-shell-nav__link';
  const itemClass = mobile ? 'cc-cust-shell-nav__item--mobile' : 'cc-cust-shell-nav__item';

  // Leaf item (no children — just Dashboard)
  if (!item.children || item.children.length === 0) {
    const isActive = isPathMatch(item.href);
    return (
      <li className={itemClass}>
        <a
          href={item.href}
          className={`${linkClass} ${isActive ? 'cc-cust-shell-nav__link--active' : ''}`}
          aria-current={isActive ? 'page' : undefined}
          aria-label={`${groupLabel}${item.altLabel ? ` (${item.altLabel})` : ''}`}
          title={groupLabel}
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
          {item.id === 'notifications' ? (
            <LiveNotificationBadgeWrapper fallbackBadge={item.badge} />
          ) : (
            item.badge ? <span className="cc-cust-shell-nav__badge">{item.badge}</span> : null
          )}
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
        title={groupLabel}
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
      {(isOpen || (!mobile && isNavCollapsed)) && (
        <ul className="cc-cust-nav-group__sub-list" role="group" aria-label={`${groupLabel} submenu`}>
          {item.children.map((child) => {
            const isChildActive = isPathMatch(child.href);
            const childLabel = getSubItemLabel(child, t);
            return (
              <li key={child.id} className="cc-cust-nav-group__sub-item">
                <a
                  href={child.href}
                  className={`cc-cust-nav-group__sub-link ${isChildActive ? 'cc-cust-nav-group__sub-link--active' : ''}`}
                  aria-current={isChildActive ? 'page' : undefined}
                  aria-label={`${childLabel}${child.altLabel ? ` (${child.altLabel})` : ''}`}
                  title={childLabel}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveRoute(child.href);
                    closeMobileMenu?.();
                  }}
                >
                  <span className="cc-cust-shell-nav__icon cc-cust-nav-group__sub-icon" aria-hidden="true">
                    {renderNavIcon(child.id, child.icon)}
                  </span>
                  <span className="cc-cust-nav-group__sub-label">{childLabel}</span>
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
    isNavCollapsed,
    toggleNavCollapsed,
    navigationItems,
    themeMode,
    toggleThemeMode,
    onSignOut,
  } = useCustomerShell();
  const { t } = useTranslation();
  const mobileMenuId = useId();
  const queryClient = React.useContext(QueryClientContext);
  const publicWebUrl = typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:3000`
    : 'http://127.0.0.1:3000';

  // Prevent background page from scrolling or jumping while full-screen mobile menu is open
  React.useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

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
              <CarChiefLogoMark width={22} height={24} className="cc-cust-shell-sidebar__logo-icon" />
              <span className="cc-cust-shell-sidebar__logo-badge">CARCHIEF</span>
              <span className="cc-cust-shell-sidebar__portal-pill">PORTAL</span>
            </div>
            <span className="sr-only">CUSTOMER PORTAL</span>
          </a>

          <div className="cc-cust-shell-sidebar__brand-actions">
            {/* Mobile Top Navigation Actions (Language, Theme Mode Toggle, Single Bell) */}
            <div className="cc-cust-shell-mobile-top-actions">
              <CustomerTopCornerActions compact />
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={!isNavCollapsed}
              className={`cc-cust-shell-toggle-switch ${!isNavCollapsed ? 'cc-cust-shell-toggle-switch--active' : ''}`}
              aria-label={isNavCollapsed ? 'Expand navigation bar' : 'Hide navigation bar'}
              title={isNavCollapsed ? 'Expand navigation bar' : 'Hide navigation bar'}
              data-testid="cust-nav-toggle"
              onClick={toggleNavCollapsed}
            >
              <span className="cc-cust-shell-toggle-knob" aria-hidden="true" />
            </button>

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
            <a
              href={publicWebUrl}
              className="cc-cust-sidebar-tool-btn"
              title="Exit To Showroom"
            >
              <span className="cc-cust-tool-icon" aria-hidden="true">
                <ExternalArrowIcon size={13} />
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
                  title="Sign Out"
                >
                  <span className="cc-cust-logout-icon" aria-hidden="true">
                    <SecureLogoutDoorIcon size={13} />
                  </span>
                  <span>{t('customer.logout', undefined, 'Sign Out')}</span>
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
            <a
              href={publicWebUrl}
              className="cc-cust-sidebar-tool-btn cc-cust-sidebar-tool-btn--mobile"
              title="Exit To Showroom"
            >
              <span className="cc-cust-tool-icon" aria-hidden="true">
                <ExternalArrowIcon size={13} />
              </span>
              <span>Exit To Showroom</span>
            </a>
            {user && onSignOut && (
              <button
                type="button"
                className="cc-cust-shell-signout-btn cc-cust-shell-signout-btn--mobile"
                onClick={() => {
                  closeMobileMenu();
                  onSignOut();
                }}
                title="Sign Out"
              >
                <span className="cc-cust-logout-icon" aria-hidden="true">
                  <SecureLogoutDoorIcon size={13} />
                </span>
                <span>{t('customer.logout', undefined, 'Sign Out')}</span>
                <span className="sr-only">Sign out</span>
              </button>
            )}
          </div>
        </nav>
      )}
    </aside>
  );
};
