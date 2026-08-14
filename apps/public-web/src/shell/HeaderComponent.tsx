'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { PUBLIC_NAV_ITEMS } from './Header';
import { useSession } from '../features/account-entry';

export interface HeaderComponentProps {
  activePath?: string;
}

interface AccountEntryTriggerProps {
  className?: string;
  onNavigate?: () => void;
}

function AccountEntryTrigger({ className = '', onNavigate }: AccountEntryTriggerProps) {
  const pathname = usePathname();
  const session = useSession();
  const href = `/account?returnTo=${encodeURIComponent(pathname || '/')}`;
  const label = session.status === 'active' ? 'DEMO ACCOUNT' : 'CUSTOMER PORTAL';
  return (
    <a
      href={href}
      className={`customer-portal-btn ${className}`}
      onClick={onNavigate}
      aria-label={session.status === 'active' ? 'View demo account' : 'Access Customer Portal'}
    >
      <svg className="portal-user-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
      <span>{label}</span>
    </a>
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

        {/* Customer Portal / Account Action */}
        <div className="header-actions">
          <AccountEntryTrigger />
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
          <AccountEntryTrigger className="mobile-account-link" onNavigate={() => setMobileMenuOpen(false)} />
        </nav>
      )}
    </header>
  );
};

