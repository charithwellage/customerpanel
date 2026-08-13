import React, { useState } from 'react';
import { CustomerSession, requestDemoCustomerSession } from './accountState.js';

export interface LoginFormProps {
  onLoginSuccess: (session: CustomerSession) => void;
  onRequestRecovery?: () => void;
  apiBaseUrl?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onLoginSuccess,
  onRequestRecovery,
  apiBaseUrl = '',
}) => {
  const [email, setEmail] = useState('c.sterling@sterlingimports.com');
  const [password, setPassword] = useState('••••••••••••');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDemoLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const session = await requestDemoCustomerSession(apiBaseUrl);
      onLoginSuccess(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="cc-acc-login-card">
      <div className="cc-acc-login-card__header">
        <span className="cc-acc-login-card__badge">CUSTOMER PORTAL ACCESS</span>
        <h2 className="cc-acc-login-card__title">Sign In to CarChief</h2>
        <p className="cc-acc-login-card__subtitle">
          Access your fleet dashboard, live inventory allocations, and custom clearance documents.
        </p>
      </div>

      {error && (
        <div className="cc-acc-login-card__error" role="alert" aria-live="assertive">
          <strong>Authentication Error</strong>
          <span>{error}</span>
        </div>
      )}

      <form className="cc-acc-login-card__form" onSubmit={handleDemoLogin}>
        <div className="cc-acc-login-card__field">
          <label htmlFor="cust-login-email" className="cc-acc-login-card__label">
            Work Email Address
          </label>
          <input
            id="cust-login-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="cc-acc-login-card__input"
          />
        </div>

        <div className="cc-acc-login-card__field">
          <div className="cc-acc-login-card__label-row">
            <label htmlFor="cust-login-password" className="cc-acc-login-card__label">
              Password
            </label>
            {onRequestRecovery && (
              <button
                type="button"
                className="cc-acc-login-card__forgot-btn"
                onClick={onRequestRecovery}
              >
                Forgot Password?
              </button>
            )}
          </div>
          <input
            id="cust-login-password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="cc-acc-login-card__input"
          />
        </div>

        <div className="cc-acc-login-card__actions">
          <button
            type="submit"
            disabled={isSubmitting}
            className="cc-cust-shell-btn cc-cust-shell-btn--primary cc-acc-login-card__submit"
          >
            {isSubmitting ? 'Authenticating…' : 'Sign In / Request Demo Session 🚀'}
          </button>
        </div>
      </form>

      <div className="cc-acc-login-card__footer">
        <span className="cc-acc-login-card__footer-note">
          🛡️ Non-production stand-in demo session powered by CarChief API Service.
        </span>
      </div>
    </div>
  );
};
