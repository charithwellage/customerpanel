'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { PUBLIC_NAV_ITEMS } from './Header';
import { useSession } from '../features/account-entry';

export interface HeaderComponentProps {
  activePath?: string;
}

/**
 * Sign-in / demo-account entry point (PUB-22, D01-P06-T003), rendered as a
 * plain nav-styled link — no new business logic here, just a thin
 * integration point into `features/account-entry` so the entry point is
 * discoverable from anywhere in the Public App, not only the vehicle detail
 * page. Carries the current path as `returnTo` so a fresh sign-in from any
 * page returns the visitor where they were.
 */
interface AccountEntryTriggerProps {
  className: string;
  onNavigate?: () => void;
}

function AccountEntryTrigger({ className, onNavigate }: AccountEntryTriggerProps) {
  const pathname = usePathname();
  const session = useSession();
  const href = `/account?returnTo=${encodeURIComponent(pathname || '/')}`;
  const label = session.status === 'active' ? 'Demo Account' : 'Sign In';
  return (
    <a
      href={href}
      className={className}
      onClick={onNavigate}
      aria-label={session.status === 'active' ? 'View demo account' : 'Sign in or create an account'}
    >
      {label}
    </a>
  );
}

export const HeaderComponent: React.FC<HeaderComponentProps> = ({ activePath = '/' }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="header-shell" id="site-header">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <div className="header-container">
        {/* Brand Logo */}
        <a href="/" className="brand-logo" aria-label="CarChief Home">
          <span className="brand-icon">CC</span>
          <span className="brand-name">CARCHIEF</span>
          <span className="online-badge">
            <span className="online-dot" /> ONLINE
          </span>
        </a>

        {/* Desktop Navigation */}
        <nav className="desktop-nav" aria-label="Main Navigation">
          {PUBLIC_NAV_ITEMS.map((item) => {
            const isActive = activePath === item.href || (item.href === '/' && activePath === '/');
            return (
              <a
                key={item.href}
                href={item.href}
                className={`nav-link ${isActive ? 'nav-link-active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                {item.label}
              </a>
            );
          })}
          <AccountEntryTrigger className="nav-link" />
        </nav>

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
          {PUBLIC_NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="mobile-nav-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.label}
            </a>
          ))}
          <AccountEntryTrigger className="mobile-nav-link" onNavigate={() => setMobileMenuOpen(false)} />
        </nav>
      )}
    </header>
  );
};
