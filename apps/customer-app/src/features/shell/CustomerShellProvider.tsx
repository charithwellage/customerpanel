import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ThemeId, resolveThemeId } from '@carchief/theme';
import type { CustomerTier } from '@carchief/domain';

export interface CustomerUser {
  id: string;
  name: string;
  email: string;
  company?: string;
  role: 'CUSTOMER';
  tier?: CustomerTier;
}

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon?: string;
  badge?: string | number;
}

export interface CustomerShellContextValue {
  user: CustomerUser | null;
  activeRoute: string;
  setActiveRoute: (route: string) => void;
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
  themeId: ThemeId;
  navigationItems: NavigationItem[];
}

const DEFAULT_NAV_ITEMS: NavigationItem[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: '📊' },
  { id: 'inventory', label: 'Inventory', href: '/inventory', icon: '🚗' },
  { id: 'vehicles', label: 'My Vehicles', href: '/vehicles', icon: '🔑' },
  { id: 'invoices', label: 'Invoices & Ledger', href: '/invoices', icon: '📄' },
  { id: 'payments', label: 'Payments', href: '/payments', icon: '💳' },
  { id: 'shipments', label: 'Shipments', href: '/shipments', icon: '🚢' },
  { id: 'documents', label: 'Documents', href: '/documents', icon: '📁' },
  { id: 'profile', label: 'Profile & Account', href: '/profile', icon: '👤' },
];

const CustomerShellContext = createContext<CustomerShellContextValue | undefined>(undefined);

export interface CustomerShellProviderProps {
  children: ReactNode;
  initialUser?: CustomerUser | null;
  initialRoute?: string;
  themeId?: string;
  navItems?: NavigationItem[];
}

/**
 * Stand-in used only when the shell is rendered outside a verified session (for
 * example an isolated component test). It is a deliberately generic label with
 * a reserved-for-testing address (RFC 2606) and no company, so nothing here can
 * be mistaken for a real person or organisation. The running application passes
 * the identity from the actual session instead — see `src/app/App.tsx`.
 */
export const PLACEHOLDER_CUSTOMER_USER: CustomerUser = {
  id: 'demo-customer',
  name: 'Demo Customer',
  email: 'demo.customer@example.invalid',
  role: 'CUSTOMER',
};

export const CustomerShellProvider: React.FC<CustomerShellProviderProps> = ({
  children,
  initialUser = PLACEHOLDER_CUSTOMER_USER,
  initialRoute,
  themeId,
  navItems = DEFAULT_NAV_ITEMS,
}) => {
  const getInitialPath = () => {
    if (initialRoute) return initialRoute;
    if (typeof window !== 'undefined' && window.location.pathname && window.location.pathname !== '/') {
      return window.location.pathname;
    }
    return '/dashboard';
  };

  const [user] = useState<CustomerUser | null>(initialUser);
  const [activeRoute, setActiveRouteState] = useState<string>(getInitialPath);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const setActiveRoute = (route: string) => {
    setActiveRouteState(route);
    if (typeof window !== 'undefined' && window.location.pathname !== route) {
      window.history.pushState(null, '', route);
    }
  };

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const handlePopState = () => {
      setActiveRouteState(window.location.pathname || '/dashboard');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const resolvedTheme = resolveThemeId(themeId);

  return (
    <CustomerShellContext.Provider
      value={{
        user,
        activeRoute,
        setActiveRoute,
        isMobileMenuOpen,
        toggleMobileMenu,
        closeMobileMenu,
        themeId: resolvedTheme,
        navigationItems: navItems,
      }}
    >
      {children}
    </CustomerShellContext.Provider>
  );
};

export const useCustomerShell = (): CustomerShellContextValue => {
  const context = useContext(CustomerShellContext);
  if (!context) {
    throw new Error('useCustomerShell must be used within a CustomerShellProvider');
  }
  return context;
};
