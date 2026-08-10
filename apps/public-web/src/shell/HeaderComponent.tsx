'use client';

import React, { useState } from 'react';
import { PUBLIC_NAV_ITEMS } from './Header';

export interface HeaderComponentProps {
  activePath?: string;
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
        </nav>
      )}
    </header>
  );
};
