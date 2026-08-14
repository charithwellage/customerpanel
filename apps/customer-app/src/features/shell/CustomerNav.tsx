import React, { useId } from 'react';
import { useCustomerShell } from './CustomerShellProvider.js';

export const CustomerNav: React.FC = () => {
  const { user, activeRoute, setActiveRoute, isMobileMenuOpen, toggleMobileMenu, closeMobileMenu, navigationItems } = useCustomerShell();
  // Generated rather than fixed so a second nav instance cannot duplicate the
  // id that `aria-controls` points at (CODE_REVIEW_RULES.md #4).
  const mobileMenuId = useId();

  return (
    <header className="cc-cust-shell-header">
      <div className="cc-cust-shell-header__container">
        <div className="cc-cust-shell-header__brand">
          <a
            href="/dashboard"
            className="cc-cust-shell-header__logo-link"
            onClick={(e) => {
              e.preventDefault();
              setActiveRoute('/dashboard');
              closeMobileMenu();
            }}
          >
            <span className="cc-cust-shell-header__logo-badge">CARCHIEF</span>
            <span className="cc-cust-shell-header__logo-sub">CUSTOMER PORTAL</span>
          </a>
        </div>

        <nav className="cc-cust-shell-nav--desktop" aria-label="Customer Desktop Navigation">
          <ul className="cc-cust-shell-nav__list">
            {navigationItems.map((item) => {
              const isActive = activeRoute === item.href || activeRoute.startsWith(`${item.href}/`);
              return (
                <li key={item.id} className="cc-cust-shell-nav__item">
                  <a
                    href={item.href}
                    className={`cc-cust-shell-nav__link ${isActive ? 'cc-cust-shell-nav__link--active' : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveRoute(item.href);
                    }}
                  >
                    {item.icon && <span className="cc-cust-shell-nav__icon">{item.icon}</span>}
                    <span>{item.label}</span>
                    {item.badge && <span className="cc-cust-shell-nav__badge">{item.badge}</span>}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="cc-cust-shell-header__user-wrap">
          {user ? (
            <div className="cc-cust-shell-user">
              <span className="cc-cust-shell-user__avatar" aria-hidden="true">
                {user.name.split(' ').map((n) => n[0]).join('')}
              </span>
              <div className="cc-cust-shell-user__info">
                <span className="cc-cust-shell-user__name">{user.name}</span>
                {user.company && <span className="cc-cust-shell-user__company">{user.company}</span>}
              </div>
            </div>
          ) : (
            <a href="/login" className="cc-cust-shell-login-btn">Sign In</a>
          )}

          <button
            type="button"
            className="cc-cust-shell-mobile-toggle"
            aria-expanded={isMobileMenuOpen}
            aria-controls={mobileMenuId}
            data-testid="cust-mobile-toggle"
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            onClick={toggleMobileMenu}
          >
            <span className="cc-cust-shell-mobile-toggle__icon">{isMobileMenuOpen ? '✕' : '☰'}</span>
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <nav id={mobileMenuId} className="cc-cust-shell-nav--mobile" aria-label="Customer Mobile Navigation">
          <ul className="cc-cust-shell-nav__list--mobile">
            {navigationItems.map((item) => {
              const isActive = activeRoute === item.href || activeRoute.startsWith(`${item.href}/`);
              return (
                <li key={item.id} className="cc-cust-shell-nav__item--mobile">
                  <a
                    href={item.href}
                    className={`cc-cust-shell-nav__link--mobile ${isActive ? 'cc-cust-shell-nav__link--active' : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveRoute(item.href);
                      closeMobileMenu();
                    }}
                  >
                    {item.icon && <span className="cc-cust-shell-nav__icon">{item.icon}</span>}
                    <span>{item.label}</span>
                    {item.badge && <span className="cc-cust-shell-nav__badge">{item.badge}</span>}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </header>
  );
};
