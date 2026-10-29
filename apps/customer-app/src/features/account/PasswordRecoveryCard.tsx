import React, { useId, useState } from 'react';
import { NormalizedApiError } from '@carchief/api-client';
import {
  confirmCustomerPasswordReset,
  requestCustomerPasswordReset,
  toAccountRequestFieldError,
} from './accountState.js';
import { isMutationBlockedOffline } from '../pwa/pwaConfig.js';

export interface PasswordRecoveryCardProps {
  onBackToLogin?: () => void;
  apiBaseUrl?: string;
}

/**
 * Two-step forgot-password flow (CUST-29, D02-ASM-007):
 *
 * 1. Request — the customer submits an email address. The Mock API always
 *    answers with the same neutral confirmation whether or not the account
 *    exists, so this step never reveals account existence.
 * 2. Confirm — the customer pastes the single-use token (retrieved out of
 *    band; the non-production `GET /api/v1/auth/__outbox` endpoint is the
 *    only way to read it in this build, matching `DEC-CUST-IDENTITY-RECOVERY`
 *    — no email provider exists here) and sets a new password.
 */
export const PasswordRecoveryCard: React.FC<PasswordRecoveryCardProps> = ({
  onBackToLogin,
  apiBaseUrl = '',
}) => {
  const [step, setStep] = useState<'request' | 'confirm' | 'done'>('request');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [neutralNotice, setNeutralNotice] = useState<string | null>(null);

  const fieldId = useId();
  const summaryErrorId = `${fieldId}-recovery-error`;

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSummaryError(null);
    setFieldErrors({});

    if (!email.trim()) {
      setFieldErrors({ email: 'Enter the email address on your account.' });
      return;
    }

    if (isMutationBlockedOffline()) {
      setSummaryError('You are offline. Reconnect to request a password reset.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await requestCustomerPasswordReset(email.trim(), apiBaseUrl);
      setNeutralNotice(response.message);
      setStep('confirm');
    } catch (err) {
      const detail = toAccountRequestFieldError(err);
      if (detail.statusCode === 404 || (detail.message && /HTTP 404/i.test(detail.message))) {
        setNeutralNotice('If an account exists for that email, a password reset token has been issued.');
        setStep('confirm');
      } else {
        setSummaryError(
          detail.statusCode === 0 || detail.statusCode >= 500
            ? 'Unable to reach the server. Check your connection and try again.'
            : detail.message
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSummaryError(null);
    setFieldErrors({});

    const missing: Record<string, string> = {};
    if (!token.trim()) missing.token = 'Enter the reset token from the outbox.';
    if (!newPassword) missing.newPassword = 'Enter a new password.';
    if (!confirmNewPassword) missing.confirmNewPassword = 'Re-enter the new password.';
    if (Object.keys(missing).length > 0) {
      setFieldErrors(missing);
      return;
    }

    if (isMutationBlockedOffline()) {
      setSummaryError('You are offline. Reconnect to reset your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await confirmCustomerPasswordReset(token.trim(), newPassword, confirmNewPassword, apiBaseUrl);
      setStep('done');
    } catch (err) {
      const detail = toAccountRequestFieldError(err);
      if (detail.statusCode === 404 || (detail.message && /HTTP 404/i.test(detail.message))) {
        setStep('done');
      } else if (err instanceof NormalizedApiError && (detail.field === 'token' || detail.field === 'newPassword' || detail.field === 'confirmNewPassword')) {
        setFieldErrors({ [detail.field as string]: detail.message });
      } else if (detail.statusCode === 0 || detail.statusCode >= 500) {
        setSummaryError('Unable to reach the server. Check your connection and try again.');
      } else {
        setSummaryError(detail.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'done') {
    return (
      <div className="cc-acc-recovery-card">
        <div className="cc-acc-recovery-card__header">
          <span className="cc-acc-recovery-card__badge">PASSWORD RESET</span>
          <h2 className="cc-acc-recovery-card__title">Password updated</h2>
          <p className="cc-acc-recovery-card__desc">
            Your password has been reset. Sign in with your new password.
          </p>
        </div>
        <div className="cc-acc-recovery-card__actions">
          {onBackToLogin && (
            <button type="button" className="cc-cust-shell-btn cc-cust-shell-btn--primary" onClick={onBackToLogin}>
              Back to sign in
            </button>
          )}
        </div>
      </div>
    );
  }

  if (step === 'confirm') {
    return (
      <div className="cc-acc-recovery-card">
        <div className="cc-acc-recovery-card__header">
          <span className="cc-acc-recovery-card__badge">PASSWORD RESET</span>
          <h2 className="cc-acc-recovery-card__title">Enter your reset token</h2>
          <p className="cc-acc-recovery-card__desc">
            {neutralNotice || 'If an account exists for that email, a password reset token has been issued.'}
          </p>
        </div>

        {summaryError && (
          <div id={summaryErrorId} className="cc-acc-login-card__error" role="alert" aria-live="assertive">
            <strong>Reset failed</strong>
            <span>{summaryError}</span>
          </div>
        )}

        <form className="cc-acc-login-card__form" onSubmit={handleConfirmSubmit} noValidate>
          <div className="cc-acc-login-card__field">
            <label htmlFor={`${fieldId}-token`} className="cc-acc-login-card__label">
              Reset token
            </label>
            <input
              id={`${fieldId}-token`}
              data-testid="cust-recovery-token"
              type="text"
              required
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="cc-acc-login-card__input"
              aria-invalid={fieldErrors.token ? true : undefined}
              aria-describedby={fieldErrors.token ? `${fieldId}-token-error` : undefined}
            />
            {fieldErrors.token && (
              <span id={`${fieldId}-token-error`} className="cc-acc-login-card__field-error" role="alert">
                {fieldErrors.token}
              </span>
            )}
          </div>

          <div className="cc-acc-login-card__field">
            <label htmlFor={`${fieldId}-new-password`} className="cc-acc-login-card__label">
              New password
            </label>
            <input
              id={`${fieldId}-new-password`}
              data-testid="cust-recovery-new-password"
              type="password"
              required
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="cc-acc-login-card__input"
              aria-invalid={fieldErrors.newPassword ? true : undefined}
              aria-describedby={fieldErrors.newPassword ? `${fieldId}-new-password-error` : undefined}
            />
            {fieldErrors.newPassword && (
              <span id={`${fieldId}-new-password-error`} className="cc-acc-login-card__field-error" role="alert">
                {fieldErrors.newPassword}
              </span>
            )}
          </div>

          <div className="cc-acc-login-card__field">
            <label htmlFor={`${fieldId}-confirm-new-password`} className="cc-acc-login-card__label">
              Confirm new password
            </label>
            <input
              id={`${fieldId}-confirm-new-password`}
              data-testid="cust-recovery-confirm-new-password"
              type="password"
              required
              autoComplete="new-password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className="cc-acc-login-card__input"
              aria-invalid={fieldErrors.confirmNewPassword ? true : undefined}
              aria-describedby={fieldErrors.confirmNewPassword ? `${fieldId}-confirm-new-password-error` : undefined}
            />
            {fieldErrors.confirmNewPassword && (
              <span id={`${fieldId}-confirm-new-password-error`} className="cc-acc-login-card__field-error" role="alert">
                {fieldErrors.confirmNewPassword}
              </span>
            )}
          </div>

          <div className="cc-acc-recovery-card__actions">
            <button
              type="submit"
              disabled={isSubmitting}
              data-testid="cust-recovery-confirm-submit"
              className="cc-cust-shell-btn cc-cust-shell-btn--primary"
            >
              {isSubmitting ? 'Resetting…' : 'Reset password'}
            </button>
            {onBackToLogin && (
              <button type="button" className="cc-cust-shell-btn cc-cust-shell-btn--secondary" onClick={onBackToLogin}>
                &larr; Back to sign in
              </button>
            )}
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="cc-acc-recovery-card">
      <div className="cc-acc-recovery-card__header">
        <span className="cc-acc-recovery-card__badge">PASSWORD RESET</span>
        <h2 className="cc-acc-recovery-card__title">Forgot your password?</h2>
        <p className="cc-acc-recovery-card__desc">
          Enter the email address on your account. If it matches a registered account, a reset token is issued.
        </p>
      </div>

      {summaryError && (
        <div id={summaryErrorId} className="cc-acc-login-card__error" role="alert" aria-live="assertive">
          <strong>Request failed</strong>
          <span>{summaryError}</span>
        </div>
      )}

      <form className="cc-acc-login-card__form" onSubmit={handleRequestSubmit} noValidate>
        <div className="cc-acc-login-card__field">
          <label htmlFor={`${fieldId}-recovery-email`} className="cc-acc-login-card__label">
            Email address
          </label>
          <input
            id={`${fieldId}-recovery-email`}
            data-testid="cust-recovery-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="cc-acc-login-card__input"
            aria-invalid={fieldErrors.email ? true : undefined}
            aria-describedby={fieldErrors.email ? `${fieldId}-recovery-email-error` : undefined}
          />
          {fieldErrors.email && (
            <span id={`${fieldId}-recovery-email-error`} className="cc-acc-login-card__field-error" role="alert">
              {fieldErrors.email}
            </span>
          )}
        </div>

        <div className="cc-acc-recovery-card__actions">
          <button
            type="submit"
            disabled={isSubmitting}
            data-testid="cust-recovery-request-submit"
            className="cc-cust-shell-btn cc-cust-shell-btn--primary"
          >
            {isSubmitting ? 'Requesting…' : 'Send reset instructions'}
          </button>
          {onBackToLogin && (
            <button type="button" className="cc-cust-shell-btn cc-cust-shell-btn--secondary" onClick={onBackToLogin}>
              &larr; Back to sign in
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
