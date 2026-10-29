import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ThemeId, resolveThemeId } from '@carchief/theme';
import { applyCustomerTheme, ThemeMode } from '../../theme.js';
import { I18nProvider } from '../../i18n/index.js';

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
  previousRoute?: string;
  setActiveRoute: (route: string) => void;
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
  isNavCollapsed: boolean;
  toggleNavCollapsed: () => void;
  setNavCollapsed: (collapsed: boolean) => void;
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
    id: 'demand',
    label: 'Demand Management',
    altLabel: 'Vehicle Demand & Sourcing',
    href: '/demand',
    icon: '🎯',
  },
  {
    id: 'garage',
    label: 'My Vehicles',
    altLabel: 'My Vehicles & Sourcing',
    href: '/vehicles',
    icon: '🚙',
    children: [
      { id: 'vehicles', label: 'My Orders', altLabel: 'My Orders', href: '/vehicles', icon: '🚙' },
      { id: 'wishlist', label: 'My Wishlist', altLabel: 'Wishlist', href: '/wishlist', icon: '❤️' },
      { id: 'inquiries', label: 'Inquiries & Quotes', altLabel: 'Inquiries & Quotes', href: '/inquiries', icon: '💬' },
    ],
  },
  {
    id: 'account-payments',
    label: 'Account & Payments',
    altLabel: 'Account & Payments',
    href: '/statement',
    icon: '💳',
    children: [
      { id: 'statement', label: 'My Statement', altLabel: 'Customer Statement', href: '/statement', icon: '📑' },
      { id: 'payments', label: 'Wire Remittance', altLabel: 'Payments & Wire Remittances', href: '/payments', icon: '💲' },
    ],
  },
  /* Section PAYMENT ALLOCATIONS hidden and commented out from both web and mobile
  {
    id: 'payment-allocations',
    label: 'Payment Allocations',
    altLabel: 'Payment Allocations',
    href: '/payment-allocations',
    icon: '🧾',
  },
  */
  {
    id: 'profile',
    label: 'Profile & Security',
    altLabel: 'Profile & Account Security',
    href: '/profile',
    icon: '👤',
    children: [
      { id: 'profile', label: 'Profile & Security', altLabel: 'Profile & Security', href: '/profile', icon: '👤' },
      { id: 'consignee', label: 'Consignee & Notify Party', altLabel: 'Consignee & Notify Party Details', href: '/consignee', icon: '📦' },
    ],
  },
];

const CustomerShellContext = createContext<CustomerShellContextValue | undefined>(undefined);

export interface CustomerShellProviderProps {
  children: ReactNode;
  initialUser?: CustomerUser | null;
  initialRoute?: string;
  initialNavCollapsed?: boolean;
  themeId?: string;
  initialThemeMode?: ThemeMode;
  navItems?: NavigationItem[];
  onSignOut?: () => void;
}

export const CustomerShellProvider: React.FC<CustomerShellProviderProps> = ({
  children,
  initialUser = null,
  initialRoute,
  initialNavCollapsed,
  themeId,
  initialThemeMode,
  navItems = DEFAULT_NAV_ITEMS,
  onSignOut,
}) => {
  const getInitialPath = () => {
    if (initialRoute) return initialRoute;
    if (typeof window !== 'undefined' && window.location.pathname && window.location.pathname !== '/') {
      return (window.location.pathname || '') + (window.location.search || '') + (window.location.hash || '');
    }
    return '/dashboard';
  };

  const [currentUser, setCurrentUser] = useState<CustomerUser | null>(initialUser ?? null);
  const [activeRoute, setActiveRouteState] = useState<string>(getInitialPath);
  const [previousRoute, setPreviousRoute] = useState<string>(() => {
    const init = getInitialPath();
    return init !== '/notifications' ? init : '/dashboard';
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isNavCollapsed, setIsNavCollapsed] = useState<boolean>(() => {
    if (typeof initialNavCollapsed === 'boolean') return initialNavCollapsed;
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('carchief_nav_collapsed');
        if (saved === 'true') return true;
        if (saved === 'false') return false;
      } catch {
        // Ignore storage exceptions
      }
    }
    return false;
  });

  const toggleNavCollapsed = () => {
    setIsNavCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('carchief_nav_collapsed', String(next));
        } catch {
          // Ignore storage exceptions
        }
      }
      return next;
    });
  };

  const setNavCollapsed = (collapsed: boolean) => {
    setIsNavCollapsed(collapsed);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('carchief_nav_collapsed', String(collapsed));
      } catch {
        // Ignore storage exceptions
      }
    }
  };

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

  const setActiveRoute = React.useCallback((route: string) => {
    setActiveRouteState((prev) => {
      if (prev !== route && prev !== '/notifications') {
        setPreviousRoute(prev);
      }
      return route;
    });
    if (typeof window !== 'undefined') {
      const currentFull = (window.location.pathname || '') + (window.location.search || '') + (window.location.hash || '');
      if (currentFull !== route) {
        window.history.pushState(null, '', route);
      }
    }
  }, []);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const handlePopState = () => {
      const fullPath = (window.location.pathname || '') + (window.location.search || '') + (window.location.hash || '');
      const nextRoute = fullPath || '/dashboard';
      setActiveRouteState((prev) => {
        if (prev !== nextRoute && prev !== '/notifications') {
          setPreviousRoute(prev);
        }
        return nextRoute;
      });
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const handleSignOut = () => {
    setActiveRouteState('/dashboard');
    if (typeof window !== 'undefined') {
      try {
        window.history.replaceState(null, '', '/');
      } catch {
        // Ignore history exceptions
      }
    }
    onSignOut?.();
  };

  return (
    <I18nProvider>
      <CustomerShellContext.Provider
        value={{
          user: currentUser,
          activeRoute,
          previousRoute,
          setActiveRoute,
          isMobileMenuOpen,
          toggleMobileMenu,
          closeMobileMenu,
          isNavCollapsed,
          toggleNavCollapsed,
          setNavCollapsed,
          themeId: resolvedTheme,
          themeMode,
          toggleThemeMode,
          setThemeMode,
          navigationItems: navItems,
          onSignOut: onSignOut ? handleSignOut : undefined,
        }}
      >
        {children}
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
