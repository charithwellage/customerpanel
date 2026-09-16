import React from 'react';
import { useCustomerShell } from './CustomerShellProvider.js';
import { useTranslation } from '../../i18n/index.js';
import {
  DashboardGridIcon,
  ShowroomCarIcon,
  DemandTargetIcon,
  VehiclesSideCarIcon,
} from '../../components/Icons.js';

export const CustomerMobileBottomNav: React.FC = () => {
  const {
    activeRoute,
    setActiveRoute,
    isMobileMenuOpen,
    toggleMobileMenu,
    closeMobileMenu,
  } = useCustomerShell();
  const { t } = useTranslation();

  const isRouteActive = (route: string) => {
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

    if (isFromInquiries) {
      if (route === '/inventory') return false;
      if (route === '/inquiries') return true;
    }
    if (isFromOrders) {
      if (route === '/inventory') return false;
      if (route === '/vehicles') return true;
    }
    if (isFromWishlist) {
      if (route === '/inventory') return false;
      if (route === '/vehicles') return true;
    }
    if (isFromDashboard) {
      if (route === '/inventory') return false;
      if (route === '/dashboard') return true;
    }
    if (route === '/dashboard') {
      return activeRoute === '/dashboard' || activeRoute === '/';
    }
    return activeRoute === route || activeRoute.startsWith(`${route}/`) || activeRoute.startsWith(`${route}?`);
  };

  const navItems = [
    {
      id: 'dashboard',
      href: '/dashboard',
      label: t('customer.dashboard', undefined, 'Overview'),
      icon: <DashboardGridIcon size={20} />,
    },
    {
      id: 'inventory',
      href: '/inventory',
      label: t('customer.inventory', undefined, 'Stock'),
      icon: <ShowroomCarIcon size={20} />,
    },
    {
      id: 'demand',
      href: '/demand',
      label: t('customer.demandManagement', undefined, 'Demand'),
      icon: <DemandTargetIcon size={20} />,
    },
    {
      id: 'vehicles',
      href: '/vehicles',
      label: t('customer.myVehicles', undefined, 'My Fleet'),
      icon: <VehiclesSideCarIcon size={20} />,
    },
  ];

  return (
    <nav className="cc-cust-mobile-bottom-nav" aria-label="Mobile Bottom Navigation">
      <div className="cc-cust-mobile-bottom-nav__inner">
        {navItems.map((item) => {
          const active = !isMobileMenuOpen && isRouteActive(item.href);
          return (
            <a
              key={item.id}
              href={item.href}
              className={`cc-cust-mobile-bottom-nav__item ${active ? 'cc-cust-mobile-bottom-nav__item--active' : ''}`}
              aria-current={active ? 'page' : undefined}
              onClick={(e) => {
                e.preventDefault();
                setActiveRoute(item.href);
                closeMobileMenu();
              }}
            >
              <span className="cc-cust-mobile-bottom-nav__icon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="cc-cust-mobile-bottom-nav__label">{item.label}</span>
            </a>
          );
        })}

        <button
          type="button"
          className={`cc-cust-mobile-bottom-nav__item cc-cust-mobile-bottom-nav__item--menu ${
            isMobileMenuOpen ? 'cc-cust-mobile-bottom-nav__item--active' : ''
          }`}
          aria-expanded={isMobileMenuOpen}
          aria-label={isMobileMenuOpen ? 'Close Menu' : 'Open Full Menu'}
          onClick={toggleMobileMenu}
        >
          <span className="cc-cust-mobile-bottom-nav__icon" aria-hidden="true">
            {isMobileMenuOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </span>
          <span className="cc-cust-mobile-bottom-nav__label">
            {isMobileMenuOpen ? 'Close' : 'Menu'}
          </span>
        </button>
      </div>
    </nav>
  );
};
