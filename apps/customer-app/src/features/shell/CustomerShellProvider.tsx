import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ThemeId, resolveThemeId } from '@carchief/theme';
import { applyCustomerTheme, ThemeMode } from '../../theme.js';
import { I18nProvider, CustomerGoogleTranslateWidget } from '../../i18n/index.js';

export interface CustomerUser {
  id: string;
  name: string;
  email: string;
  company?: string;
  role?: string;
  tier?: string;
}

export interface SubNavigationItem {
  id: string;
  label: string;
  href: string;
  icon?: string;
  badge?: string;
  altLabel?: string;
}

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon?: string;
  badge?: string;
  altLabel?: string;
  /** Optional child items — when present the parent item acts as a group toggle. */
  children?: SubNavigationItem[];
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
  {
    id: 'dashboard',
    label: 'Overview',
    altLabel: 'Dashboard',
    href: '/dashboard',
    icon: '📊',
  },
  {
    id: 'browse',
    label: 'All Inventory Stock',
    altLabel: 'Stock Inventory',
    href: '/inventory',
    icon: '🚗',
  },
  {
    id: 'garage',
    label: 'My Vehicles',
    altLabel: 'My Vehicles & Sourcing',
    href: '/vehicles',
    icon: '🚙',
    children: [
      { id: 'vehicles', label: 'My Vehicles', altLabel: 'My Vehicles', href: '/vehicles', icon: '🚙' },
      { id: 'wishlist', label: 'My Wishlist', altLabel: 'Wishlist', href: '/wishlist', icon: '❤️' },
      { id: 'inquiries', label: 'Inquiries & Quotes', altLabel: 'Inquiries & Quotes', href: '/inquiries', icon: '💬' },
    ],
  },
  {
    id: 'statement',
    label: 'My Statement',
    altLabel: 'Customer Statement',
    href: '/statement',
    icon: '📑',
  },
  {
    id: 'payments',
    label: 'Wire Remittance',
    altLabel: 'Payments & Wire Remittances',
    href: '/payments',
    icon: '💲',
  },
  {
    id: 'payment-allocations',
    label: 'Payment Allocations',
    altLabel: 'Payment Allocations',
    href: '/payment-allocations',
    icon: '🧾',
  },
  {
    id: 'profile',
    label: 'Profile & Security',
    altLabel: 'Profile & Account Security',
    href: '/profile',
    icon: '👤',
  },
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

  const [currentUser, setCurrentUser] = useState<CustomerUser | null>(initialUser ?? null);
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
    <I18nProvider>
      <CustomerShellContext.Provider
        value={{
          user: currentUser,
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
        <CustomerGoogleTranslateWidget />
      </CustomerShellContext.Provider>
    </I18nProvider>
  );
};

export const useCustomerShell = (): CustomerShellContextValue => {
  const context = useContext(CustomerShellContext);
  if (!context) {
    throw new Error('useCustomerShell must be used within a CustomerShellProvider');
  }
  return context;
};
