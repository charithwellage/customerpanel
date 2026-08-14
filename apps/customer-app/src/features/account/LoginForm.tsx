import React, { useId, useState } from 'react';
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
  // Both fields start genuinely empty. Pre-filling them with a specimen address
  // and dot-filled password made the form look like a real account was already
  // signed in (prohibited "forced identity", TASK_EXECUTION_PROTOCOL.md §7);
  // the example address now lives in a `placeholder`, which is not a value.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fieldId = useId();
  const emailId = `${fieldId}-email`;
  const passwordId = `${fieldId}-password`;

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
          <label htmlFor={emailId} className="cc-acc-login-card__label">
            Work Email Address
          </label>
          <input
            id={emailId}
            data-testid="cust-login-email"
            type="email"
            // Deliberately not `required`. The demo-session endpoint ignores
            // these fields entirely, so enforcing them in the browser would be
            // validation with no server counterpart — the "browser-only
            // validation" defect listed in TASK_EXECUTION_PROTOCOL.md §7.
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="cc-acc-login-card__input"
          />
        </div>

        <div className="cc-acc-login-card__field">
          <div className="cc-acc-login-card__label-row">
            <label htmlFor={passwordId} className="cc-acc-login-card__label">
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
            id={passwordId}
            data-testid="cust-login-password"
            type="password"
            autoComplete="current-password"
            placeholder="Your password"
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
            {isSubmitting ? 'Requesting demo session…' : 'Request Demo Session 🚀'}
          </button>
        </div>
      </form>

      <div className="cc-acc-login-card__footer">
        <span className="cc-acc-login-card__footer-note">
          🛡️ This build issues a non-production stand-in session from the CarChief Mock API. The address and password
          above are not verified and are not transmitted; production credential sign-in belongs to AutoPulse identity
          services.
        </span>
      </div>
    </div>
  );
};
