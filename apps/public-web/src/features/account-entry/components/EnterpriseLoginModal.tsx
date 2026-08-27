'use client';

import React, { useEffect, useId, useState } from 'react';
import { issueSessionToken, parseSessionToken, type JwtClaims } from '@carchief/domain';
import { writeStoredSession } from '../session-storage';
import { SESSION_EVENT } from '../hooks/useSession';

export interface EnterpriseLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  badgeText?: string;
  vehicleSlug?: string;
  onSuccessAuth?: (user: { email: string; name: string; token: string }) => void;
}

export function EnterpriseLoginModal({
  isOpen,
  onClose,
  title = 'Sign In to CarChief',
  subtitle = 'Access your global vehicle fleet, live ocean freight tracking, instant Proforma Invoices, and port clearances.',
  badgeText = '⚡ ENTERPRISE CUSTOMER PORTAL',
  vehicleSlug,
  onSuccessAuth,
}: EnterpriseLoginModalProps) {
  const dialogId = useId();
  const [email, setEmail] = useState('prabodha@carchief.com');
  const [password, setPassword] = useState('Password123!');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ESC key listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const performLogin = (userEmail: string, userName: string, provider = 'credentials') => {
    if (typeof window === 'undefined') return;

    const token = issueSessionToken('CustomerBuyer', 'cust-123', userEmail, 'Standard');
    const claims = parseSessionToken(token) || {
      sub: 'cust-123',
      email: userEmail,
      role: 'CustomerBuyer',
      permissions: ['read:public', 'read:customer', 'create:inquiry', 'create:reservation', 'create:payment'],
      exp: Math.floor(Date.now() / 1000) + 86400 * 30,
    };

    writeStoredSession((k, v) => window.localStorage.setItem(k, v), {
      token,
      claims,
    });
    window.dispatchEvent(new Event(SESSION_EVENT));

    if (onSuccessAuth) {
      onSuccessAuth({ email: userEmail, name: userName, token });
    }
    onClose();
  };

  const handleSocialLogin = (provider: 'google' | 'apple' | 'microsoft') => {
    const emailMap: Record<string, string> = {
      google: 'google.customer@carchief.com',
      apple: 'apple.customer@carchief.com',
      microsoft: 'outlook.customer@carchief.com',
    };
    const nameMap: Record<string, string> = {
      google: 'Google Verified Customer',
      apple: 'Apple Verified Customer',
      microsoft: 'Outlook Verified Customer',
    };

    performLogin(emailMap[provider], nameMap[provider], provider);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const derivedName = email.split('@')[0] || 'Customer';
      performLogin(email.trim(), derivedName, 'email');
      setIsSubmitting(false);
    }, 200);
  };

  return (
    <div
      className="cc-auth-modal-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="cc-auth-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${dialogId}-title`}
      >
        <button
          type="button"
          className="cc-auth-modal-close-btn"
          onClick={onClose}
          aria-label="Close modal"
        >
          ✕
        </button>

        {/* Brand Header */}
        <div className="cc-auth-brand-row">
          <div className="cc-auth-brand-logo-group">
            <div className="cc-auth-shield-icon" aria-hidden="true">
              <svg width="26" height="28" viewBox="0 0 24 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 1L2 5.5V11.5C2 17.65 6.26 23.38 12 25C17.74 23.38 22 17.65 22 11.5V5.5L12 1Z" fill="#DC2626" stroke="#B91C1C" strokeWidth="1.5"/>
                <text x="12" y="16.5" textAnchor="middle" fill="#FFFFFF" fontSize="13" fontWeight="900" fontFamily="Inter, sans-serif">C</text>
              </svg>
            </div>
            <div className="cc-auth-brand-title">
              <span className="cc-auth-brand-car">CAR</span>
              <span className="cc-auth-brand-chief">CHIEF</span>
              <span className="cc-auth-brand-portal">PORTAL</span>
            </div>
          </div>
          <span className="cc-auth-online-pill">
            <span className="cc-auth-online-dot" /> ONLINE
          </span>
        </div>

        <div className="cc-auth-modal-header">
          <div className="cc-auth-custom-badge">{badgeText}</div>
          <h2 id={`${dialogId}-title`} className="cc-auth-modal-title">
            {title}
          </h2>
          <p className="cc-auth-modal-subtitle">{subtitle}</p>
        </div>

        {/* Benefit Chips */}
        <div className="cc-auth-benefits-chips">
          <span className="cc-auth-chip">⚡ Live Freight Tracking</span>
          <span className="cc-auth-chip">📑 Proforma Invoices</span>
          <span className="cc-auth-chip">🔒 256-Bit SSL Secured</span>
        </div>

        {/* Social SSO Group */}
        <div className="cc-auth-sso-group">
          {/* Google SSO */}
          <button
            type="button"
            className="cc-sso-button cc-sso-button--google"
            onClick={() => handleSocialLogin('google')}
          >
            <svg className="cc-sso-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Apple SSO */}
          <button
            type="button"
            className="cc-sso-button cc-sso-button--apple"
            onClick={() => handleSocialLogin('apple')}
          >
            <svg className="cc-sso-icon" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 0.92-2.85-.9.04-2.02.6-2.66 1.35-.57.65-1.06 1.71-.93 2.73 1.01.08 2.05-.51 2.67-1.23z" />
            </svg>
            <span>Continue with Apple</span>
          </button>

          {/* Microsoft / Outlook SSO */}
          <button
            type="button"
            className="cc-sso-button cc-sso-button--ms"
            onClick={() => handleSocialLogin('microsoft')}
          >
            <svg className="cc-sso-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <rect x="1" y="1" width="10" height="10" fill="#F25022" />
              <rect x="13" y="1" width="10" height="10" fill="#7FBA00" />
              <rect x="1" y="13" width="10" height="10" fill="#00A4EF" />
              <rect x="13" y="13" width="10" height="10" fill="#FFB900" />
            </svg>
            <span>Continue with Microsoft / Outlook</span>
          </button>
        </div>

        {/* Divider */}
        <div className="cc-auth-modal-divider">
          <span>OR SIGN IN WITH EMAIL</span>
        </div>

        {errorMessage && (
          <div className="cc-auth-error-box" role="alert">
            {errorMessage}
          </div>
        )}

        {/* Email & Password Form */}
        <form className="cc-auth-form" onSubmit={handleFormSubmit}>
          <div className="cc-auth-field">
            <label className="cc-auth-label">EMAIL ADDRESS</label>
            <input
              type="email"
              className="cc-auth-input"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="cc-auth-field">
            <div className="cc-auth-label-row">
              <label className="cc-auth-label">PASSWORD</label>
              <button
                type="button"
                className="cc-auth-forgot-btn"
                onClick={() => alert('Password reset link sent to demo outbox.')}
              >
                Forgot password?
              </button>
            </div>
            <div className="cc-auth-password-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                className="cc-auth-input cc-auth-input--password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="cc-auth-pwd-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="cc-auth-submit-btn"
          >
            {isSubmitting ? 'Signing in…' : 'SIGN IN TO CUSTOMER PORTAL →'}
          </button>
        </form>

        <div className="cc-auth-modal-footer">
          <button type="button" className="cc-auth-return-btn" onClick={onClose}>
            ← Return to Public Showroom &amp; Inventory
          </button>
          <p className="cc-auth-security-notice">
            🔒 CarChief Secured Global Gateway · 256-Bit SSL Protected
          </p>
        </div>
      </div>
    </div>
  );
}
