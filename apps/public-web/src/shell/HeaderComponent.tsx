'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { PUBLIC_NAV_ITEMS, resolveCustomerAppUrl } from './Header';
import { GlobalSearch } from './GlobalSearch';
import { useTranslation, LanguageSwitcher } from '../i18n';
import { useSession, EnterpriseLoginModal } from '../features/account-entry';

export interface HeaderComponentProps {
  activePath?: string;
}

interface HeaderAuthActionsProps {
  className?: string;
  onNavigate?: () => void;
  onOpenLogin?: () => void;
}

/**
 * Enterprise Header Actions:
 * - When Unauthenticated: Login (opens Enterprise Login Popup) + Register (/register).
 * - When Authenticated: Active user status indicator + CUSTOMER PORTAL button + Sign Out action.
 */
function HeaderAuthActions({ className = '', onNavigate, onOpenLogin }: HeaderAuthActionsProps) {
  const session = useSession();
  const { t } = useTranslation();
  const customerAppUrl = resolveCustomerAppUrl();
  const isSignedIn = session.status === 'active';

  if (isSignedIn) {
    const userDisplayName = session.claims?.email?.split('@')[0] || 'Member';
    return (
      <div className={`header-auth-actions ${className}`}>
        <div className="header-user-status" title={`Signed in as ${session.claims?.email || 'Customer'}`}>
          <span className="header-user-dot" />
          <span className="header-user-name">{userDisplayName}</span>
        </div>
        <a
          href={session.token ? `${customerAppUrl}/?token=${encodeURIComponent(session.token)}` : customerAppUrl}
          className="header-auth-btn header-auth-btn--portal"
          onClick={onNavigate}
          aria-label="Customer Portal"
        >
          <svg className="header-auth-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
          <span>CUSTOMER PORTAL</span>
        </a>
        <button
          type="button"
          className="header-auth-btn header-auth-btn--signout"
          onClick={() => {
            session.signOut();
            onNavigate?.();
          }}
          title="Sign Out"
          aria-label="Sign Out"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className={`header-auth-actions ${className}`}>
      <button
        type="button"
        className="header-auth-btn header-auth-btn--login"
        onClick={() => {
          onOpenLogin?.();
          onNavigate?.();
        }}
      >
        <svg className="header-auth-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
          <polyline points="10 17 15 12 10 7" />
          <line x1="15" y1="12" x2="3" y2="12" />
        </svg>
        <span>{t('header.login', undefined, 'Login')}</span>
      </button>
      <a href="/register" className="header-auth-btn header-auth-btn--register" onClick={onNavigate}>
        <svg className="header-auth-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="8.5" cy="7" r="4" />
          <line x1="20" y1="8" x2="20" y2="14" />
          <line x1="23" y1="11" x2="17" y2="11" />
        </svg>
        <span>{t('header.register', undefined, 'Register')}</span>
      </a>
    </div>
  );
}

export const HeaderComponent: React.FC<HeaderComponentProps> = ({ activePath: propActivePath }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [currentHash, setCurrentHash] = useState<string>('');
  const pathname = usePathname();
  const currentPath = propActivePath !== undefined ? propActivePath : (pathname || '/');
  const { t } = useTranslation();

  useEffect(() => {
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
        {t('header.skipLink', undefined, 'Skip to main content')}
      </a>

      {/* Top Utility Header Bar */}
      <div className="header-top-bar">
        <div className="header-top-container">
          <div className="header-top-left">
            <span className="header-utility-item">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>{t('header.japanTime', undefined, 'Japan Time: JST (UTC+9)')}</span>
            </span>
            <span className="header-top-divider">|</span>
            <span className="header-utility-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13" rx="2" />
                <polygon points="16 8 20 8 23 11 23 16 16 16 8" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
              <span>{t('header.carsInStock', undefined, 'Total Cars in Stock: 68,000+')}</span>
            </span>
          </div>

          <div className="header-top-right">
            {/* Global Language Switcher (D02-P14-T006) */}
            <LanguageSwitcher id="desktop-language-switcher" />

            <div className="header-utility-select-wrap">
              <span className="header-utility-icon">🌍</span>
              <select className="header-utility-select" aria-label={t('header.countrySelect', undefined, 'Select Country')} defaultValue="Global">
                <option value="Global">Global / All Ports</option>
                <option value="LK">Sri Lanka (Colombo)</option>
                <option value="UG">Uganda (Mombasa / Kampala)</option>
                <option value="KE">Kenya (Mombasa)</option>
                <option value="TZ">Tanzania (Dar es Salaam)</option>
                <option value="AU">Australia (Sydney/Brisbane)</option>
                <option value="NZ">New Zealand</option>
                <option value="JP">Japan Domestic</option>
              </select>
            </div>

            <div className="header-utility-select-wrap">
              <span className="header-utility-icon">💵</span>
              <select className="header-utility-select" aria-label={t('header.currencySelect', undefined, 'Select Currency')} defaultValue="USD">
                <option value="USD">USD ($)</option>
                <option value="JPY">JPY (¥)</option>
              </select>
            </div>

            <a href="https://wa.me/817092101426" target="_blank" rel="noopener noreferrer" className="header-top-contact" aria-label="Contact on WhatsApp">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="#22c55e">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
              </svg>
              <span>+81-70-9210-1426</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main E-Commerce Header Bar */}
      <div className="header-container">
        {/* Brand Logo */}
        <a href="/" className="brand-logo" aria-label="CarChief Home">
          <div className="brand-shield-icon" aria-hidden="true">
            <svg width="28" height="30" viewBox="0 0 24 26" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 1L2 5.5V11.5C2 17.65 6.26 23.38 12 25C17.74 23.38 22 17.65 22 11.5V5.5L12 1Z" fill="#DC2626" stroke="#B91C1C" strokeWidth="1.5"/>
              <text x="12" y="16.5" textAnchor="middle" fill="#FFFFFF" fontSize="13" fontWeight="900" fontFamily="Inter, sans-serif">C</text>
            </svg>
          </div>
          <div className="brand-title-wrap">
            <span className="brand-name">
              <span className="brand-name-car">CAR</span>
              <span className="brand-name-chief">CHIEF</span>
            </span>
            <span className="brand-subtitle">www.carchief.com</span>
          </div>
        </a>

        {/* Global Search Bar */}
        <div className="header-search-container">
          <GlobalSearch />
        </div>

        {/* Login / Register / Customer Portal Actions */}
        <div className="header-actions">
          <HeaderAuthActions onOpenLogin={() => setIsLoginModalOpen(true)} />
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

      {/* Secondary E-Commerce Navigation Bar */}
      <nav className="desktop-nav" aria-label="Main Navigation">
        <div className="desktop-nav-container">
          {PUBLIC_NAV_ITEMS.map((item) => {
            const isActive = isItemActive(item.href);
            const label = item.i18nKey ? t(item.i18nKey, undefined, item.label) : item.label;
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
                {label}
              </a>
            );
          })}
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <nav className="mobile-nav-drawer" aria-label="Mobile Navigation">
          <div className="mobile-utility-section" style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border-subtle)' }}>
            <LanguageSwitcher id="mobile-language-switcher" />
          </div>

          <div className="mobile-search-section">
            <GlobalSearch isMobile onSearchComplete={() => setMobileMenuOpen(false)} />
          </div>

          <div className="mobile-nav-links-list">
            {PUBLIC_NAV_ITEMS.map((item) => {
              const isActive = isItemActive(item.href);
              const label = item.i18nKey ? t(item.i18nKey, undefined, item.label) : item.label;
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
                  {label}
                </a>
              );
            })}
          </div>

          <HeaderAuthActions
            className="mobile-header-auth-actions"
            onNavigate={() => setMobileMenuOpen(false)}
            onOpenLogin={() => {
              setMobileMenuOpen(false);
              setIsLoginModalOpen(true);
            }}
          />
        </nav>
      )}

      {/* Enterprise Login Popup Modal */}
      <EnterpriseLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccessAuth={({ token }) => {
          if (typeof window === 'undefined') return;
          const customerAppUrl = resolveCustomerAppUrl();
          window.location.assign(`${customerAppUrl}/?token=${encodeURIComponent(token)}`);
        }}
        title="Enterprise Customer Sign In"
        subtitle="Sign in to access your CarChief Customer Portal, live ocean freight calculations, wishlist, and verified vehicle bookings."
      />
    </header>
  );
};
