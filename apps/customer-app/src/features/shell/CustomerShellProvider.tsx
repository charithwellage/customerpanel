import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ThemeId, resolveThemeId } from '@carchief/theme';
import { applyCustomerTheme, ThemeMode } from '../../theme.js';

export interface CustomerUser {
  id: string;
  name: string;
  email: string;
  company?: string;
  role?: string;
  tier?: string;
}

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon?: string;
  badge?: string;
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
  themeMode: ThemeMode;
  toggleThemeMode: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  navigationItems: NavigationItem[];
  /** Signs the customer out. Absent when the shell is rendered without a live session (for example an isolated component test). */
  onSignOut?: () => void;
}

const DEFAULT_NAV_ITEMS: NavigationItem[] = [
  { id: 'dashboard', label: 'Overview Desk', altLabel: 'Dashboard', href: '/dashboard', icon: '📊' },
  { id: 'inventory', label: 'Sourcing Showroom', altLabel: 'Inventory', href: '/inventory', icon: '🚗' },
  { id: 'inquiries', label: 'My Inquiries', altLabel: 'My Inquiries', href: '/inquiries', icon: '💬' },
  { id: 'wishlist', label: 'My Wishlist', altLabel: 'My Wishlist', href: '/wishlist', icon: '❤️' },
  { id: 'favourites', label: 'Favourites', altLabel: 'Favourites', href: '/favourites', icon: '⭐' },
  { id: 'vehicles', label: 'Sourced Vehicles', altLabel: 'My Vehicles', href: '/vehicles', icon: '🚙' },
  { id: 'shipments', label: 'Reserved Vehicles', altLabel: 'Shipments', href: '/shipments', icon: '⏱️' },
  { id: 'invoices', label: 'Billed Invoices', altLabel: 'Invoices & Ledger', href: '/invoices', icon: '📄' },
  { id: 'payments', label: 'Wire Remittance', altLabel: 'Payments', href: '/payments', icon: '💲' },
  { id: 'documents', label: 'Secure Vault', altLabel: 'Documents', href: '/documents', icon: '🛡️' },
  { id: 'notifications', label: 'Bulletins', altLabel: 'Notifications', href: '/notifications', icon: '🔔' },
  { id: 'profile', label: 'Client Profile', altLabel: 'Profile & Account', href: '/profile', icon: '👤' },
];

const CustomerShellContext = createContext<CustomerShellContextValue | undefined>(undefined);

export interface CustomerShellProviderProps {
  children: ReactNode;
  initialUser?: CustomerUser | null;
  initialRoute?: string;
  themeId?: string;
  initialThemeMode?: ThemeMode;
  navItems?: NavigationItem[];
  onSignOut?: () => void;
}

export const CustomerShellProvider: React.FC<CustomerShellProviderProps> = ({
  children,
  initialUser = null,
  initialRoute,
  themeId,
  initialThemeMode,
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

  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    if (initialThemeMode) return initialThemeMode;
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('carchief_theme_mode');
        if (saved === 'midnight' || saved === 'daylight') return saved;
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          return 'midnight';
        }
      } catch {
        // Ignore storage exceptions
      }
    }
    return 'daylight';
  });

  const resolvedTheme = resolveThemeId(themeId);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('carchief_theme_mode', mode);
      } catch {
        // Ignore storage exceptions
      }
      applyCustomerTheme(document.documentElement, resolvedTheme, mode);
    }
  };

  const toggleThemeMode = () => {
    const nextMode: ThemeMode = themeMode === 'midnight' ? 'daylight' : 'midnight';
    setThemeMode(nextMode);
  };

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      applyCustomerTheme(document.documentElement, resolvedTheme, themeMode);
    }
  }, [resolvedTheme, themeMode]);

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
        themeMode,
        toggleThemeMode,
        setThemeMode,
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
