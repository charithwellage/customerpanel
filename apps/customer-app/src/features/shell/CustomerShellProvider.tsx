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
  altLabel?: string;
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
  /** Signs the customer out. Absent when the shell is rendered without a live session (for example an isolated component test). */
  onSignOut?: () => void;
}

const DEFAULT_NAV_ITEMS: NavigationItem[] = [
  { id: 'dashboard', label: 'Overview Desk', altLabel: 'Dashboard', href: '/dashboard', icon: '📊' },
  { id: 'inventory', label: 'Sourcing Showroom', altLabel: 'Inventory', href: '/inventory', icon: '🚗' },
  { id: 'inquiries', label: 'My Inquiries', altLabel: 'My Inquiries', href: '/inquiries', icon: '💬' },
  { id: 'vehicles', label: 'Sourced Vehicles', altLabel: 'My Vehicles', href: '/vehicles', icon: '🚙' },
  { id: 'shipments', label: 'Reserved Vehicles', altLabel: 'Shipments', href: '/shipments', icon: '⏱️' },
  { id: 'invoices', label: 'Billed Invoices', altLabel: 'Invoices & Ledger', href: '/invoices', icon: '📄' },
  { id: 'payments', label: 'Wire Remittance', altLabel: 'Payments', href: '/payments', icon: '💲' },
  { id: 'documents', label: 'Secure Vault', altLabel: 'Documents', href: '/documents', icon: '🛡️' },
  { id: 'notifications', label: 'Bulletins', altLabel: 'Notifications', href: '/notifications', icon: '🔔', badge: 3 },
  { id: 'profile', label: 'Client Profile', altLabel: 'Profile & Account', href: '/profile', icon: '👤' },
];

const CustomerShellContext = createContext<CustomerShellContextValue | undefined>(undefined);

export interface CustomerShellProviderProps {
  children: ReactNode;
  initialUser?: CustomerUser | null;
  initialRoute?: string;
  themeId?: string;
  navItems?: NavigationItem[];
  onSignOut?: () => void;
}

export const CustomerShellProvider: React.FC<CustomerShellProviderProps> = ({
  children,
  initialUser = null,
  initialRoute,
  themeId,
  navItems = DEFAULT_NAV_ITEMS,
  onSignOut,
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
        onSignOut,
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
