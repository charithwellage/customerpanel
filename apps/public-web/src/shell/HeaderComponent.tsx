'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { PUBLIC_NAV_ITEMS, resolveCustomerAppUrl } from './Header';

export interface HeaderComponentProps {
  activePath?: string;
}

interface HeaderAuthActionsProps {
  className?: string;
  onNavigate?: () => void;
}

/**
 * Login (secondary) + Register (primary) header actions (D02-P12-T003,
 * CUST-26, CUST-27). Industry-standard placement: Login first, Register
 * last, so the strongest call to action sits rightmost. Login deep-links to
 * the Customer application's own sign-in entry point (resolved from
 * configuration, never a hard-coded host); Register is an in-app route.
 * Replaces the removed demo Customer Portal entry point.
 */
function HeaderAuthActions({ className = '', onNavigate }: HeaderAuthActionsProps) {
  const customerAppUrl = resolveCustomerAppUrl();
  return (
    <div className={`header-auth-actions ${className}`}>
      <a href={customerAppUrl} className="header-auth-btn header-auth-btn--login" onClick={onNavigate}>
        Login
      </a>
      <a href="/register" className="header-auth-btn header-auth-btn--register" onClick={onNavigate}>
        Register
      </a>
    </div>
  );
}

export const HeaderComponent: React.FC<HeaderComponentProps> = ({ activePath: propActivePath }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentHash, setCurrentHash] = useState<string>('');
  const pathname = usePathname();
  const currentPath = propActivePath !== undefined ? propActivePath : (pathname || '/');

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleHashChange = () => {
      setCurrentHash(window.location.hash);
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  const isItemActive = (href: string) => {
    const [pathPart, hashPart] = href.split('#');
    const cleanPath = pathPart || '/';

    if (hashPart) {
      const isCorrectPath = currentPath === cleanPath;
      const isCorrectHash = currentHash === `#${hashPart}`;
      return isCorrectPath && isCorrectHash;
    }

    if (href === '/') {
      return currentPath === '/' && (!currentHash || currentHash === '#');
    }

    return currentPath === href || currentPath.startsWith(href + '/') || currentPath.startsWith(href + '?');
  };

  return (
    <header className="header-shell" id="site-header">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <div className="header-container">
        {/* Brand Logo */}
        <a href="/" className="brand-logo" aria-label="CarChief Home">
          <div className="brand-shield-icon" aria-hidden="true">
            <svg width="24" height="26" viewBox="0 0 24 26" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 1L2 5.5V11.5C2 17.65 6.26 23.38 12 25C17.74 23.38 22 17.65 22 11.5V5.5L12 1Z" fill="#DC2626" stroke="#B91C1C" strokeWidth="1.5"/>
              <text x="12" y="16.5" textAnchor="middle" fill="#FFFFFF" fontSize="13" fontWeight="900" fontFamily="Inter, sans-serif">C</text>
            </svg>
          </div>
          <span className="brand-name">
            <span className="brand-name-car">CAR</span>
            <span className="brand-name-chief">CHIEF</span>
          </span>
          <span className="online-badge">
            <span className="online-dot" /> ONLINE
          </span>
        </a>

        {/* Desktop Navigation */}
        <nav className="desktop-nav" aria-label="Main Navigation">
          {PUBLIC_NAV_ITEMS.map((item) => {
            const isActive = isItemActive(item.href);
            return (
              <a
                key={item.href}
                href={item.href}
                className={`nav-link ${isActive ? 'nav-link-active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => {
                  if (item.href.includes('#')) {
                    const [, hash] = item.href.split('#');
                    setCurrentHash(`#${hash}`);
                  } else {
                    setCurrentHash('');
                  }
                }}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Login / Register */}
        <div className="header-actions">
          <HeaderAuthActions />
        </div>

        {/* Mobile Menu Toggle */}
        <button
          type="button"
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <nav className="mobile-nav-drawer" aria-label="Mobile Navigation">
          {PUBLIC_NAV_ITEMS.map((item) => {
            const isActive = isItemActive(item.href);
            return (
              <a
                key={item.href}
                href={item.href}
                className={`mobile-nav-link ${isActive ? 'mobile-nav-link-active' : ''}`}
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (item.href.includes('#')) {
                    const [, hash] = item.href.split('#');
                    setCurrentHash(`#${hash}`);
                  } else {
                    setCurrentHash('');
                  }
                }}
              >
                {item.label}
              </a>
            );
          })}
          <HeaderAuthActions className="mobile-header-auth-actions" onNavigate={() => setMobileMenuOpen(false)} />
        </nav>
      )}
    </header>
  );
};
