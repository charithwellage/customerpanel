import React, { useId, useMemo, useState } from 'react';
import { AuthService, HttpClient, NormalizedApiError, type UpdateCustomerProfileRequest } from '@carchief/api-client';
import { useCustomerShell } from '../shell/index.js';
import { useCustomerOnlineStatus } from '../pwa/useCustomerOnlineStatus.js';
import { isMutationBlockedOffline } from '../pwa/pwaConfig.js';
import { loadCustomerSession } from '../account/accountState.js';
import { useCustomerProfile, useUpdateCustomerProfile } from './useCustomerProfile.js';

type EditableProfile = Pick<UpdateCustomerProfileRequest, 'companyName' | 'phone' | 'deliveryAddress'>;

const emptyProfile: EditableProfile = { companyName: '', phone: '', deliveryAddress: '' };

function validateProfile(profile: EditableProfile): string | null {
  if (profile.companyName.trim().length < 2) return 'Company name must be at least 2 characters.';
  if (!/^\+?[0-9 ()-]{7,30}$/.test(profile.phone.trim())) return 'Enter a valid phone number.';
  if (profile.deliveryAddress.trim().length < 5) return 'Delivery address must be at least 5 characters.';
  return null;
}

interface PasswordFormState {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

const emptyPasswordForm: PasswordFormState = { currentPassword: '', newPassword: '', confirmNewPassword: '' };

type PasswordFieldErrors = Partial<Record<keyof PasswordFormState, string>>;

const GENERIC_CHANGE_PASSWORD_ERROR = 'Your password could not be changed. Please try again.';

export interface ChangePasswordErrorOutcome {
  /** Set when the error belongs on a specific password field, never a session-expiry banner. */
  field?: keyof PasswordFormState;
  /** Set when the error has no specific field and renders as a form-level summary instead. */
  summary?: string;
}

/**
 * Maps a caught `changeCustomerPassword` error onto field vs. summary
 * placement. A 401 on this authenticated call always means the *current
 * password* was wrong — the session middleware already rejects an expired
 * token with its own 401 before the handler that can throw this one ever
 * runs — so it is never rendered as a session-expiry message (acceptance
 * criterion: "wrong current password ... never as a session expiry").
 */
export function mapChangePasswordError(error: unknown): ChangePasswordErrorOutcome {
  if (error instanceof NormalizedApiError && error.statusCode === 401) {
    return { field: 'currentPassword' };
  }
  if (error instanceof NormalizedApiError && error.statusCode === 400) {
    const raw = error.rawError;
    const field = raw && typeof raw === 'object' && 'field' in raw && typeof (raw as { field?: unknown }).field === 'string'
      ? (raw as { field: string }).field
      : undefined;
    if (field === 'newPassword' || field === 'confirmNewPassword' || field === 'currentPassword') {
      return { field };
    }
    return { summary: error.message || GENERIC_CHANGE_PASSWORD_ERROR };
  }
  if (error instanceof NormalizedApiError && (error.statusCode === 0 || error.statusCode >= 500)) {
    return { summary: 'Unable to reach the server. Check your connection and try again.' };
  }
  return { summary: GENERIC_CHANGE_PASSWORD_ERROR };
}

/**
 * `AuthService.changePassword` posts a full `/api/v1/auth/...` path, so it
 * needs an origin-only `HttpClient` base URL (the same convention
 * `apps/customer-app/src/features/account/accountState.ts`'s
 * `createAuthService` uses) — never the `${origin}/api/v1` base
 * `HttpClientProvider` configures for the authenticated `/customer/**`
 * services. Unlike sign-in/registration this call is authenticated, so the
 * client also attaches the bearer token from the persisted session.
 */
function createAuthenticatedAuthService(): AuthService {
  const originBaseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const httpClient = new HttpClient({
    baseUrl: originBaseUrl,
    timeoutMs: 10000,
    getAuthToken: () => loadCustomerSession()?.token || null,
  });
  return new AuthService(httpClient);
}

export const ProfilePage: React.FC = () => {
  const { setActiveRoute, onSignOut } = useCustomerShell();
  const online = useCustomerOnlineStatus();
  const profileQuery = useCustomerProfile();
  const updateProfile = useUpdateCustomerProfile();
  const [form, setForm] = React.useState<EditableProfile>(emptyProfile);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [hasConflict, setHasConflict] = React.useState(false);
  const [savedMessage, setSavedMessage] = React.useState<string | null>(null);

  const authService = useMemo(() => createAuthenticatedAuthService(), []);
  const [passwordForm, setPasswordForm] = useState<PasswordFormState>(emptyPasswordForm);
  const [passwordFieldErrors, setPasswordFieldErrors] = useState<PasswordFieldErrors>({});
  const [passwordSummaryError, setPasswordSummaryError] = useState<string | null>(null);
  const [passwordSuccessMessage, setPasswordSuccessMessage] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const fieldId = useId();
  const currentPasswordId = `${fieldId}-current-password`;
  const newPasswordId = `${fieldId}-new-password`;
  const confirmNewPasswordId = `${fieldId}-confirm-new-password`;

  React.useEffect(() => { setActiveRoute('/profile'); }, [setActiveRoute]);
  React.useEffect(() => {
    if (profileQuery.data) {
      setForm({ companyName: profileQuery.data.companyName, phone: profileQuery.data.phone, deliveryAddress: profileQuery.data.deliveryAddress });
    }
  }, [profileQuery.data]);

  const updateField = (field: keyof EditableProfile) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setFormError(null);
    setHasConflict(false);
    setSavedMessage(null);
  };

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    setSavedMessage(null);
    if (!online) {
      setFormError('Profile changes require an internet connection.');
      return;
    }
    const validationError = validateProfile(form);
    if (validationError) {
      setFormError(validationError);
      return;
    }
    if (!profileQuery.data) return;
    updateProfile.mutate({ ...form, expectedVersion: profileQuery.data.version }, {
      onSuccess: () => setSavedMessage('Your contact details were saved.'),
      onError: (error) => {
        if (error instanceof NormalizedApiError && error.statusCode === 409) {
          setHasConflict(true);
          setFormError('This profile changed elsewhere. Refresh the profile before saving again.');
        }
        else if (error instanceof NormalizedApiError && error.statusCode === 401) setFormError('Your session has expired. Sign in again to update your profile.');
        else setFormError('Your contact details could not be saved. Please try again.');
      },
    });
  };

  React.useEffect(() => {
    if (profileQuery.error) setFormError('Your profile is temporarily unavailable.');
  }, [profileQuery.error]);

  const updatePasswordField = (field: keyof PasswordFormState) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordForm((current) => ({ ...current, [field]: event.target.value }));
    setPasswordFieldErrors({});
    setPasswordSummaryError(null);
    setPasswordSuccessMessage(null);
  };

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordSuccessMessage(null);
    setPasswordSummaryError(null);
    setPasswordFieldErrors({});

    const missing: PasswordFieldErrors = {};
    if (!passwordForm.currentPassword) missing.currentPassword = 'Enter your current password.';
    if (!passwordForm.newPassword) missing.newPassword = 'Enter a new password.';
    if (!passwordForm.confirmNewPassword) missing.confirmNewPassword = 'Re-enter your new password.';
    if (Object.keys(missing).length > 0) {
      setPasswordFieldErrors(missing);
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      setPasswordFieldErrors({ confirmNewPassword: 'Passwords do not match.' });
      return;
    }
    if (isMutationBlockedOffline()) {
      setPasswordSummaryError('You are offline. Password changes require an internet connection.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await authService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmNewPassword: passwordForm.confirmNewPassword,
      });
      setPasswordForm(emptyPasswordForm);
      setPasswordSuccessMessage('Your password was changed.');
    } catch (error) {
      const outcome = mapChangePasswordError(error);
      const message = error instanceof NormalizedApiError ? error.message : undefined;
      if (outcome.field) {
        setPasswordFieldErrors({ [outcome.field]: message || (outcome.field === 'currentPassword' ? 'Current password is incorrect.' : outcome.summary) });
      } else {
        setPasswordSummaryError(outcome.summary || GENERIC_CHANGE_PASSWORD_ERROR);
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const clientProfileId = profileQuery.data?.customerId
    ? `CC-CUST-${profileQuery.data.customerId.replace(/^cust-/, '').slice(0, 4).toUpperCase()}`
    : 'CC-CUST-1254';

  return (
    <section className="cc-cust-profile" aria-labelledby="profile-title">
      <h1 id="profile-title" className="visually-hidden">Profile &amp; Account</h1>

      {profileQuery.isLoading && <p className="cc-profile-state" role="status" aria-live="polite">Loading your profile…</p>}
      {profileQuery.isFetching && !profileQuery.isLoading && <p className="cc-profile-state" role="status" aria-live="polite">Refreshing profile…</p>}
      {profileQuery.error && (
        <div className="cc-profile-state cc-profile-state--error" role="alert">
          <p>Your profile could not be loaded.</p>
          <button type="button" className="cc-profile-btn cc-profile-btn--secondary" onClick={() => void profileQuery.refetch()}>Retry</button>
        </div>
      )}

      {!profileQuery.isLoading && !profileQuery.error && profileQuery.data && (
        <div className="cc-profile-grid">
          {/* Left Column: Contact Details Config */}
          <div className="cc-profile-col cc-profile-col--main">
            <section className="cc-profile-card" aria-labelledby="contact-config-title">
              <div className="cc-profile-card__header">
                <h2 id="contact-config-title" className="cc-profile-card__title">
                  CONTACT DETAILS CONFIG
                </h2>
                <p className="cc-profile-card__subtitle">
                  Update company contact records, telephone links, and logistics addresses.
                </p>
              </div>

              <form className="cc-profile-form" onSubmit={save} aria-labelledby="contact-config-title">
                {/* Read-Only Client Email */}
                <div className="cc-profile-field">
                  <label className="cc-profile-label" htmlFor="profile-email-input">
                    CLIENT EMAIL (READ ONLY)
                  </label>
                  <div className="cc-profile-input-wrap cc-profile-input-wrap--readonly">
                    <svg className="cc-profile-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect width="20" height="16" x="2" y="4" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                    <input
                      id="profile-email-input"
                      type="email"
                      className="cc-profile-input"
                      value={profileQuery.data.email}
                      readOnly
                      tabIndex={-1}
                      aria-readonly="true"
                    />
                  </div>
                </div>

                {/* Read-Only Client Full Name */}
                <div className="cc-profile-field">
                  <label className="cc-profile-label" htmlFor="profile-name-input">
                    CLIENT FULL NAME (READ ONLY)
                  </label>
                  <div className="cc-profile-input-wrap cc-profile-input-wrap--readonly">
                    <svg className="cc-profile-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <input
                      id="profile-name-input"
                      type="text"
                      className="cc-profile-input"
                      value={profileQuery.data.name}
                      readOnly
                      tabIndex={-1}
                      aria-readonly="true"
                    />
                  </div>
                </div>

                {/* Editable Company Name */}
                <div className="cc-profile-field">
                  <label className="cc-profile-label" htmlFor="profile-company-input">
                    COMPANY NAME
                  </label>
                  <div className="cc-profile-input-wrap">
                    <svg className="cc-profile-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
                      <path d="M9 22v-4h6v4" />
                      <path d="M8 6h.01" />
                      <path d="M16 6h.01" />
                      <path d="M8 10h.01" />
                      <path d="M16 10h.01" />
                      <path d="M8 14h.01" />
                      <path d="M16 14h.01" />
                    </svg>
                    <input
                      id="profile-company-input"
                      type="text"
                      className="cc-profile-input"
                      value={form.companyName}
                      onChange={updateField('companyName')}
                      autoComplete="organization"
                      placeholder="Enter company name"
                      required
                    />
                  </div>
                </div>

                {/* Editable Phone Number */}
                <div className="cc-profile-field">
                  <label className="cc-profile-label" htmlFor="profile-phone-input">
                    PHONE NUMBER
                  </label>
                  <div className="cc-profile-input-wrap">
                    <svg className="cc-profile-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    <input
                      id="profile-phone-input"
                      type="tel"
                      className="cc-profile-input"
                      value={form.phone}
                      onChange={updateField('phone')}
                      autoComplete="tel"
                      placeholder="e.g. +94715991619"
                      required
                    />
                  </div>
                </div>

                {/* Editable Delivery Address */}
                <div className="cc-profile-field">
                  <label className="cc-profile-label" htmlFor="profile-address-input">
                    DELIVERY ADDRESS
                  </label>
                  <div className="cc-profile-input-wrap">
                    <svg className="cc-profile-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <input
                      id="profile-address-input"
                      type="text"
                      className="cc-profile-input"
                      value={form.deliveryAddress}
                      onChange={updateField('deliveryAddress')}
                      autoComplete="street-address"
                      placeholder="e.g. Colombo, Sri Lanka"
                      required
                    />
                  </div>
                </div>

                {!online && <p className="cc-profile-alert cc-profile-alert--warning" role="status">You are offline. Profile updates are disabled until connectivity returns.</p>}
                {formError && <p className="cc-profile-alert cc-profile-alert--error" role="alert">{formError}</p>}
                {hasConflict && (
                  <button type="button" className="cc-profile-btn cc-profile-btn--secondary" onClick={() => { setHasConflict(false); setFormError(null); void profileQuery.refetch(); }}>
                    Refresh profile
                  </button>
                )}
                {savedMessage && <p className="cc-profile-alert cc-profile-alert--success" role="status">{savedMessage}</p>}

                <div className="cc-profile-actions">
                  <button
                    type="submit"
                    className="cc-profile-btn cc-profile-btn--primary"
                    disabled={!online || updateProfile.isPending}
                  >
                    {updateProfile.isPending ? 'COMMITTING MODIFICATIONS…' : 'COMMIT MODIFICATIONS'}
                  </button>
                </div>
              </form>
            </section>
          </div>

          {/* Right Column: Credential Revision & Account Auditing */}
          <div className="cc-profile-col cc-profile-col--side">
            {/* Credential Revision Card */}
            <section className="cc-profile-card" aria-labelledby="credential-revision-title">
              <div className="cc-profile-card__header">
                <h2 id="credential-revision-title" className="cc-profile-card__title">
                  CREDENTIAL REVISION
                </h2>
                <p className="cc-profile-card__subtitle">
                  Revise your account&apos;s secure credentials to ensure data integrity.
                </p>
              </div>

              <form className="cc-profile-form" onSubmit={(event) => void changePassword(event)} aria-labelledby="credential-revision-title" noValidate>
                {/* Current Password */}
                <div className="cc-profile-field">
                  <label className="cc-profile-label" htmlFor={currentPasswordId}>
                    CURRENT PASSWORD
                  </label>
                  <div className="cc-profile-input-wrap">
                    <svg className="cc-profile-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <input
                      id={currentPasswordId}
                      type="password"
                      className="cc-profile-input"
                      autoComplete="current-password"
                      placeholder="Enter current password"
                      value={passwordForm.currentPassword}
                      onChange={updatePasswordField('currentPassword')}
                      aria-invalid={passwordFieldErrors.currentPassword ? true : undefined}
                      aria-describedby={passwordFieldErrors.currentPassword ? `${currentPasswordId}-error` : undefined}
                      required
                    />
                  </div>
                  {passwordFieldErrors.currentPassword && (
                    <span id={`${currentPasswordId}-error`} className="cc-profile-field-error" role="alert">{passwordFieldErrors.currentPassword}</span>
                  )}
                </div>

                {/* New Password */}
                <div className="cc-profile-field">
                  <label className="cc-profile-label" htmlFor={newPasswordId}>
                    NEW PASSWORD
                  </label>
                  <div className="cc-profile-input-wrap">
                    <svg className="cc-profile-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <input
                      id={newPasswordId}
                      type="password"
                      className="cc-profile-input"
                      autoComplete="new-password"
                      placeholder="At least 6 characters"
                      value={passwordForm.newPassword}
                      onChange={updatePasswordField('newPassword')}
                      aria-invalid={passwordFieldErrors.newPassword ? true : undefined}
                      aria-describedby={passwordFieldErrors.newPassword ? `${newPasswordId}-error` : undefined}
                      required
                    />
                  </div>
                  {passwordFieldErrors.newPassword && (
                    <span id={`${newPasswordId}-error`} className="cc-profile-field-error" role="alert">{passwordFieldErrors.newPassword}</span>
                  )}
                </div>

                {/* Confirm New Password */}
                <div className="cc-profile-field">
                  <label className="cc-profile-label" htmlFor={confirmNewPasswordId}>
                    CONFIRM NEW PASSWORD
                  </label>
                  <div className="cc-profile-input-wrap">
                    <svg className="cc-profile-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <input
                      id={confirmNewPasswordId}
                      type="password"
                      className="cc-profile-input"
                      autoComplete="new-password"
                      placeholder="Repeat new password"
                      value={passwordForm.confirmNewPassword}
                      onChange={updatePasswordField('confirmNewPassword')}
                      aria-invalid={passwordFieldErrors.confirmNewPassword ? true : undefined}
                      aria-describedby={passwordFieldErrors.confirmNewPassword ? `${confirmNewPasswordId}-error` : undefined}
                      required
                    />
                  </div>
                  {passwordFieldErrors.confirmNewPassword && (
                    <span id={`${confirmNewPasswordId}-error`} className="cc-profile-field-error" role="alert">{passwordFieldErrors.confirmNewPassword}</span>
                  )}
                </div>

                {!online && <p className="cc-profile-alert cc-profile-alert--warning" role="status">You are offline. Password changes are disabled until connectivity returns.</p>}
                {passwordSummaryError && <p className="cc-profile-alert cc-profile-alert--error" role="alert">{passwordSummaryError}</p>}
                {passwordSuccessMessage && <p className="cc-profile-alert cc-profile-alert--success" role="status" aria-live="polite">{passwordSuccessMessage}</p>}

                <div className="cc-profile-actions">
                  <button
                    type="submit"
                    className="cc-profile-btn cc-profile-btn--secondary"
                    disabled={!online || isChangingPassword}
                  >
                    {isChangingPassword ? 'MODIFYING PASSWORD…' : 'MODIFY PASSWORD'}
                  </button>
                </div>
              </form>
            </section>

            {/* Account Auditing Info Card */}
            <section className="cc-profile-card cc-profile-card--audit" aria-labelledby="auditing-info-title">
              <div className="cc-profile-card__header cc-profile-card__header--audit">
                <svg className="cc-profile-audit-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                <h2 id="auditing-info-title" className="cc-profile-card__title cc-profile-card__title--audit">
                  ACCOUNT AUDITING INFO
                </h2>
              </div>
              <div className="cc-profile-audit-body">
                <p className="cc-profile-audit-text">
                  Every session transaction, profile revision, document preview, and telegraphic submission is logged under a secure audit trail associated with your client profile ID: <strong>{clientProfileId}</strong>.
                </p>
                <p className="cc-profile-audit-text">
                  IP mapping &amp; access logs are synchronized with Car Chief&apos;s central compliance databases.
                </p>
              </div>
            </section>
          </div>
        </div>
      )}
    </section>
  );
};
