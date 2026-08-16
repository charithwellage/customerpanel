import React, { useId, useState } from 'react';
import { NormalizedApiError } from '@carchief/api-client';
import {
  CustomerSession,
  loginCustomer,
  toAccountRequestFieldError,
} from './accountState.js';
import { isMutationBlockedOffline } from '../pwa/pwaConfig.js';

export interface LoginFormProps {
  onLoginSuccess: (session: CustomerSession) => void;
  onRequestRecovery?: () => void;
  apiBaseUrl?: string;
}

const GENERIC_INVALID_CREDENTIAL_MESSAGE = 'Invalid email or password. Please try again.';

/** Reads the `email` query param T003's registration confirmation forwards. */
function readPrefilledEmail(): string {
  if (typeof window === 'undefined') return '';
  try {
    return new URLSearchParams(window.location.search).get('email') || '';
  } catch {
    return '';
  }
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onLoginSuccess,
  onRequestRecovery,
  apiBaseUrl = '',
}) => {
  const [email, setEmail] = useState<string>(readPrefilledEmail);
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const fieldId = useId();
  const emailId = `${fieldId}-email`;
  const passwordId = `${fieldId}-password`;
  const summaryErrorId = `${fieldId}-summary-error`;
  const emailErrorId = `${fieldId}-email-error`;
  const passwordErrorId = `${fieldId}-password-error`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSummaryError(null);
    setFieldErrors({});

    if (!email.trim() || !password) {
      setFieldErrors({
        ...(email.trim() ? {} : { email: 'Enter your email address.' }),
        ...(password ? {} : { password: 'Enter your password.' }),
      });
      return;
    }

    if (isMutationBlockedOffline()) {
      setSummaryError('You are offline. Reconnect to sign in.');
      return;
    }

    setIsSubmitting(true);
    try {
      const session = await loginCustomer(email.trim(), password, apiBaseUrl);
      onLoginSuccess(session);
    } catch (err) {
      const detail = toAccountRequestFieldError(err);
      if (err instanceof NormalizedApiError && err.statusCode === 401) {
        // Byte-identical for unknown email and wrong password — the Mock API
        // never distinguishes the two, and neither does this form.
        setSummaryError(GENERIC_INVALID_CREDENTIAL_MESSAGE);
      } else if (detail.field === 'email' || detail.field === 'password') {
        setFieldErrors({ [detail.field]: detail.message });
      } else if (detail.statusCode === 0 || detail.statusCode >= 500) {
        setSummaryError('Unable to reach the server. Check your connection and try again.');
      } else {
        setSummaryError(detail.message || GENERIC_INVALID_CREDENTIAL_MESSAGE);
      }
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

      {summaryError && (
        <div
          id={summaryErrorId}
          className="cc-acc-login-card__error"
          role="alert"
          aria-live="assertive"
        >
          <strong>Sign-in failed</strong>
          <span>{summaryError}</span>
        </div>
      )}

      <form className="cc-acc-login-card__form" onSubmit={handleSubmit} noValidate>
        <div className="cc-acc-login-card__field">
          <label htmlFor={emailId} className="cc-acc-login-card__label">
            Email Address
          </label>
          <input
            id={emailId}
            data-testid="cust-login-email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="cc-acc-login-card__input"
            aria-invalid={fieldErrors.email ? true : undefined}
            aria-describedby={fieldErrors.email ? emailErrorId : undefined}
          />
          {fieldErrors.email && (
            <span id={emailErrorId} className="cc-acc-login-card__field-error" role="alert">
              {fieldErrors.email}
            </span>
          )}
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
                Forgot password?
              </button>
            )}
          </div>
          <input
            id={passwordId}
            data-testid="cust-login-password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="cc-acc-login-card__input"
            aria-invalid={fieldErrors.password ? true : undefined}
            aria-describedby={fieldErrors.password ? passwordErrorId : undefined}
          />
          {fieldErrors.password && (
            <span id={passwordErrorId} className="cc-acc-login-card__field-error" role="alert">
              {fieldErrors.password}
            </span>
          )}
        </div>

        <div className="cc-acc-login-card__actions">
          <button
            type="submit"
            disabled={isSubmitting}
            data-testid="cust-login-submit"
            className="cc-cust-shell-btn cc-cust-shell-btn--primary cc-acc-login-card__submit"
          >
            {isSubmitting ? 'Signing in…' : 'Sign In'}
          </button>
        </div>
      </form>
    </div>
  );
};
