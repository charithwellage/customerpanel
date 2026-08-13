import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ThemeId, resolveThemeId } from '@carchief/theme';

export interface CustomerUser {
  id: string;
  name: string;
  email: string;
  company?: string;
  role: 'CUSTOMER';
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

export const CustomerShellProvider: React.FC<CustomerShellProviderProps> = ({
  children,
  initialUser = { id: 'cust_demo', name: 'Charles Sterling', email: 'c.sterling@sterlingimports.com', company: 'Sterling Imports Ltd', role: 'CUSTOMER' },
  initialRoute = '/dashboard',
  themeId,
  navItems = DEFAULT_NAV_ITEMS,
}) => {
  const [user] = useState<CustomerUser | null>(initialUser);
  const [activeRoute, setActiveRoute] = useState<string>(initialRoute);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

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
