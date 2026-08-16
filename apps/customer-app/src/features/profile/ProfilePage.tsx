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

  return (
    <section className="cc-cust-profile" aria-labelledby="profile-title">
      <header className="cc-cust-profile__header">
        <div>
          <p className="cc-cust-profile__eyebrow">Account settings</p>
          <h1 id="profile-title" className="cc-cust-profile__title">Profile &amp; Account</h1>
          <p className="cc-cust-profile__subtitle">Manage approved contact details and account security.</p>
        </div>
      </header>

      {profileQuery.isLoading && <p className="cc-cust-profile__state" role="status" aria-live="polite">Loading your profile…</p>}
      {profileQuery.isFetching && !profileQuery.isLoading && <p className="cc-cust-profile__state" role="status" aria-live="polite">Refreshing profile…</p>}
      {profileQuery.error && (
        <div className="cc-cust-profile__state cc-cust-profile__state--error" role="alert">
          <p>Your profile could not be loaded.</p>
          <button type="button" className="cc-cust-profile__button" onClick={() => void profileQuery.refetch()}>Retry</button>
        </div>
      )}

      {!profileQuery.isLoading && !profileQuery.error && profileQuery.data && (
        <>
          <section className="cc-cust-profile__card" aria-labelledby="identity-title">
            <h2 id="identity-title">Identity</h2>
            <p className="cc-cust-profile__notice">Name and email were captured at registration and cannot be edited here.</p>
            <dl className="cc-cust-profile__identity">
              <dt>Name</dt><dd>{profileQuery.data.name}</dd>
              <dt>Email</dt><dd>{profileQuery.data.email}</dd>
            </dl>
          </section>

          <form className="cc-cust-profile__card cc-cust-profile__form" onSubmit={save} aria-labelledby="contact-title">
            <div>
              <h2 id="contact-title">Contact details</h2>
              <p className="cc-cust-profile__notice">These fields are saved to the customer profile and can be updated while online.</p>
            </div>
            <label className="cc-cust-profile__field">
              <span>Company name</span>
              <input value={form.companyName} onChange={updateField('companyName')} autoComplete="organization" required />
            </label>
            <label className="cc-cust-profile__field">
              <span>Phone number</span>
              <input value={form.phone} onChange={updateField('phone')} type="tel" autoComplete="tel" required />
            </label>
            <label className="cc-cust-profile__field">
              <span>Delivery address</span>
              <textarea value={form.deliveryAddress} onChange={updateField('deliveryAddress')} rows={4} autoComplete="street-address" required />
            </label>
            {!online && <p className="cc-cust-profile__offline" role="status">You are offline. Profile updates are disabled until connectivity returns.</p>}
            {formError && <p className="cc-cust-profile__error" role="alert">{formError}</p>}
            {hasConflict && <button type="button" className="cc-cust-profile__button" onClick={() => { setHasConflict(false); setFormError(null); void profileQuery.refetch(); }}>Refresh profile</button>}
            {savedMessage && <p className="cc-cust-profile__success" role="status">{savedMessage}</p>}
            <button type="submit" className="cc-cust-profile__button cc-cust-profile__button--primary" disabled={!online || updateProfile.isPending}>
              {updateProfile.isPending ? 'Saving…' : 'Save contact details'}
            </button>
          </form>

          <form className="cc-cust-profile__card cc-cust-profile__form" onSubmit={(event) => void changePassword(event)} aria-labelledby="password-title" noValidate>
            <div>
              <h2 id="password-title">Change password</h2>
              <p className="cc-cust-profile__notice">Your current password is required to set a new one. The Mock API enforces the password policy server-side.</p>
            </div>
            <label className="cc-cust-profile__field">
              <span>Current password</span>
              <input
                id={currentPasswordId}
                type="password"
                autoComplete="current-password"
                value={passwordForm.currentPassword}
                onChange={updatePasswordField('currentPassword')}
                aria-invalid={passwordFieldErrors.currentPassword ? true : undefined}
                aria-describedby={passwordFieldErrors.currentPassword ? `${currentPasswordId}-error` : undefined}
                required
              />
              {passwordFieldErrors.currentPassword && (
                <span id={`${currentPasswordId}-error`} className="cc-cust-profile__error" role="alert">{passwordFieldErrors.currentPassword}</span>
              )}
            </label>
            <label className="cc-cust-profile__field">
              <span>New password</span>
              <input
                id={newPasswordId}
                type="password"
                autoComplete="new-password"
                value={passwordForm.newPassword}
                onChange={updatePasswordField('newPassword')}
                aria-invalid={passwordFieldErrors.newPassword ? true : undefined}
                aria-describedby={passwordFieldErrors.newPassword ? `${newPasswordId}-error` : undefined}
                required
              />
              {passwordFieldErrors.newPassword && (
                <span id={`${newPasswordId}-error`} className="cc-cust-profile__error" role="alert">{passwordFieldErrors.newPassword}</span>
              )}
            </label>
            <label className="cc-cust-profile__field">
              <span>Re-enter new password</span>
              <input
                id={confirmNewPasswordId}
                type="password"
                autoComplete="new-password"
                value={passwordForm.confirmNewPassword}
                onChange={updatePasswordField('confirmNewPassword')}
                aria-invalid={passwordFieldErrors.confirmNewPassword ? true : undefined}
                aria-describedby={passwordFieldErrors.confirmNewPassword ? `${confirmNewPasswordId}-error` : undefined}
                required
              />
              {passwordFieldErrors.confirmNewPassword && (
                <span id={`${confirmNewPasswordId}-error`} className="cc-cust-profile__error" role="alert">{passwordFieldErrors.confirmNewPassword}</span>
              )}
            </label>
            {!online && <p className="cc-cust-profile__offline" role="status">You are offline. Password changes are disabled until connectivity returns.</p>}
            {passwordSummaryError && <p className="cc-cust-profile__error" role="alert">{passwordSummaryError}</p>}
            {passwordSuccessMessage && <p className="cc-cust-profile__success" role="status" aria-live="polite">{passwordSuccessMessage}</p>}
            <button type="submit" className="cc-cust-profile__button cc-cust-profile__button--primary" disabled={!online || isChangingPassword}>
              {isChangingPassword ? 'Changing password…' : 'Change password'}
            </button>
          </form>

          <section className="cc-cust-profile__card" aria-labelledby="security-title">
            <h2 id="security-title">Account security</h2>
            <p className="cc-cust-profile__notice">
              Multi-factor authentication and session-device management are not available in this build.
            </p>
            {onSignOut && (
              <button type="button" className="cc-cust-profile__button" onClick={onSignOut}>Sign out</button>
            )}
          </section>
        </>
      )}
    </section>
  );
};
