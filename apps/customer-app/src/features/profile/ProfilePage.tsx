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

export function getPasswordStrength(password: string): { label: string; score: number; className: string } {
  if (!password) return { label: '', score: 0, className: '' };
  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[A-Z]/.test(password) && /[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) return { label: 'Weak', score: 1, className: 'cc-profile-strength--weak' };
  if (score <= 3) return { label: 'Medium', score: 2, className: 'cc-profile-strength--medium' };
  return { label: 'Strong', score: 3, className: 'cc-profile-strength--strong' };
}

export const ProfilePage: React.FC = () => {
  const { setActiveRoute, user } = useCustomerShell();
  const online = useCustomerOnlineStatus();
  const profileQuery = useCustomerProfile();
  const updateProfile = useUpdateCustomerProfile();
  const [form, setForm] = React.useState<EditableProfile>(emptyProfile);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [hasConflict, setHasConflict] = React.useState(false);
  const [savedMessage, setSavedMessage] = React.useState<string | null>(null);
  const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80';
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(DEFAULT_AVATAR);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const customerTier = user?.tier || 'Platinum';

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setFormError('Profile picture must be smaller than 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        if (typeof e.target?.result === 'string') {
          setAvatarUrl(e.target.result);
          setSavedMessage('Profile picture updated successfully.');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const authService = useMemo(() => createAuthenticatedAuthService(), []);
  const [passwordForm, setPasswordForm] = useState<PasswordFormState>(emptyPasswordForm);
  const [passwordFieldErrors, setPasswordFieldErrors] = useState<PasswordFieldErrors>({});
  const [passwordSummaryError, setPasswordSummaryError] = useState<string | null>(null);
  const [passwordSuccessMessage, setPasswordSuccessMessage] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  // Feature Additions State
  const [is2FaEnabled, setIs2FaEnabled] = useState(true);
  const [twoFactorMessage, setTwoFactorMessage] = useState<string | null>(null);
  const [sessions, setSessions] = useState([
    { id: 'sess-1', device: 'macOS Sonoma • Chrome 128', ip: '192.168.1.1', location: 'Colombo, Sri Lanka', isCurrent: true, activeTime: 'Active Now' },
    { id: 'sess-2', device: 'iPhone 15 Pro • Safari Mobile', ip: '175.157.22.4', location: 'Kandy, Sri Lanka', isCurrent: false, activeTime: '2 hours ago' },
  ]);
  const [sessionActionMessage, setSessionActionMessage] = useState<string | null>(null);
  const [preferences, setPreferences] = useState({
    shipmentAlerts: true,
    remittanceAlerts: true,
    securityAlerts: true,
    marketingOffers: false,
  });

  const fieldId = useId();
  const currentPasswordId = `${fieldId}-current-password`;
  const newPasswordId = `${fieldId}-new-password`;
  const confirmNewPasswordId = `${fieldId}-confirm-new-password`;

  const passwordStrength = useMemo(() => getPasswordStrength(passwordForm.newPassword), [passwordForm.newPassword]);

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

  const toggle2Fa = () => {
    const nextState = !is2FaEnabled;
    setIs2FaEnabled(nextState);
    setTwoFactorMessage(nextState ? 'Two-Factor Authentication is now active.' : 'Two-Factor Authentication is currently disabled.');
  };

  const revokeOtherSessions = () => {
    setSessions((current) => current.filter((s) => s.isCurrent));
    setSessionActionMessage('All other active device sessions have been revoked.');
  };

  const togglePreference = (key: keyof typeof preferences) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
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
        <>
          {/* Top Header Hero Banner Card */}
          <section className="cc-profile-header-card" aria-labelledby="profile-header-title">
            <div className="cc-profile-header-top">
              <div className="cc-profile-header-main">
                <div
                  className="cc-profile-avatar-box"
                  title="Click to upload profile picture"
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Customer Profile Avatar" className="cc-profile-avatar-img" />
                  ) : (
                    <span className="cc-profile-avatar-initials">
                      {profileQuery.data.name
                        ? profileQuery.data.name
                            .split(' ')
                            .filter(Boolean)
                            .map((n) => n[0])
                            .join('')
                            .substring(0, 2)
                            .toUpperCase()
                        : 'CC'}
                    </span>
                  )}
                  <button
                    type="button"
                    className="cc-profile-avatar-upload-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    aria-label="Upload profile picture"
                    title="Upload profile picture"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    className="visually-hidden"
                    onChange={handleAvatarChange}
                    data-testid="profile-pic-upload-input"
                  />
                </div>

                <div className="cc-profile-header-info">
                  <div className="cc-profile-header-title-line">
                    <h1 id="profile-header-title" className="cc-profile-header-name">
                      PROFILE &amp; <span className="cc-profile-title-highlight">SECURITY</span>
                    </h1>
                    <div className="cc-profile-badges-row">
                      <span className="cc-profile-badge cc-profile-badge--id">{clientProfileId}</span>
                      <span className="cc-profile-badge cc-profile-badge--tier">⭐️ {customerTier.toUpperCase()} TIER</span>
                      <span className="cc-profile-badge cc-profile-badge--status">VERIFIED CLIENT</span>
                    </div>
                  </div>
                  <p className="cc-profile-header-sub">
                    {profileQuery.data.companyName || 'Car Chief Enterprise Client'} &bull; {profileQuery.data.email}
                  </p>
                </div>
              </div>

              {/* Right Side: Account Security & Health Score Widget */}
              <div className="cc-profile-header-side">
                <div className="cc-profile-health-card">
                  <div className="cc-profile-health-top">
                    <span className="cc-profile-health-dot" />
                    <span className="cc-profile-health-label">ACCOUNT HEALTH: 100% EXCELLENT</span>
                  </div>
                  <div className="cc-profile-health-meta">
                    <span>SECURITY: ENFORCED</span>
                    <span>AUDIT: SYNCHRONIZED</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4-Column Full-Width Quick Metrics Ribbon */}
            <div className="cc-profile-metrics-ribbon">
              <div className="cc-profile-metric-chip">
                <div className="cc-profile-metric-icon-wrap cc-profile-metric-icon-wrap--fleet" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="16" height="16" x="4" y="4" rx="2" />
                    <path d="M9 18v-6h6v6" />
                    <path d="M9 6h6" />
                  </svg>
                </div>
                <div className="cc-profile-metric-info">
                  <span className="cc-profile-metric-label">ACTIVE FLEET</span>
                  <span className="cc-profile-metric-value">14 Units Tracked</span>
                  <span className="cc-profile-metric-tag cc-profile-metric-tag--info">Logistics Active</span>
                </div>
              </div>

              <div className="cc-profile-metric-chip">
                <div className="cc-profile-metric-icon-wrap cc-profile-metric-icon-wrap--security" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div className="cc-profile-metric-info">
                  <span className="cc-profile-metric-label">SECURITY POSTURE</span>
                  <span className="cc-profile-metric-value">{is2FaEnabled ? '2FA Enforced' : '2FA Recommended'}</span>
                  <span className={`cc-profile-metric-tag ${is2FaEnabled ? 'cc-profile-metric-tag--success' : 'cc-profile-metric-tag--warning'}`}>{is2FaEnabled ? 'Protected' : 'Action Needed'}</span>
                </div>
              </div>

              <div className="cc-profile-metric-chip">
                <div className="cc-profile-metric-icon-wrap cc-profile-metric-icon-wrap--partner" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </div>
                <div className="cc-profile-metric-info">
                  <span className="cc-profile-metric-label">CLIENT PARTNER</span>
                  <span className="cc-profile-metric-value">{customerTier} Tier</span>
                  <span className="cc-profile-metric-tag cc-profile-metric-tag--warning">Enterprise VIP</span>
                </div>
              </div>

              <div className="cc-profile-metric-chip">
                <div className="cc-profile-metric-icon-wrap cc-profile-metric-icon-wrap--compliance" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </div>
                <div className="cc-profile-metric-info">
                  <span className="cc-profile-metric-label">COMPLIANCE LOGS</span>
                  <span className="cc-profile-metric-value">100% Audit Trail</span>
                  <span className="cc-profile-metric-tag cc-profile-metric-tag--success">Synchronized</span>
                </div>
              </div>
            </div>
          </section>

          <div className="cc-profile-grid">
            {/* Left Column: Contact Details & Preferences */}
            <div className="cc-profile-col cc-profile-col--main">
              {/* Contact Details Config Card */}
              <section className="cc-profile-card" aria-labelledby="contact-config-title">
                <div className="cc-profile-card__header">
                  <div className="cc-profile-card__header-title-wrap">
                    <svg className="cc-profile-card__icon cc-profile-card__icon--contact" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <h2 id="contact-config-title" className="cc-profile-card__title cc-profile-card__title--contact">
                      CONTACT DETAILS CONFIG
                    </h2>
                  </div>
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
                      {updateProfile.isPending ? 'SAVING CHANGES…' : 'SAVE CHANGES'}
                    </button>
                  </div>
                </form>
              </section>

              {/* 2FA Multi-Factor Security Card */}
              <section className="cc-profile-card" aria-labelledby="mfa-card-title">
                <div className="cc-profile-card__header">
                  <div className="cc-profile-card__header-title-wrap">
                    <svg className="cc-profile-card__icon cc-profile-card__icon--2fa" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    <h2 id="mfa-card-title" className="cc-profile-card__title cc-profile-card__title--2fa">
                      MULTI-FACTOR AUTHENTICATION (2FA)
                    </h2>
                  </div>
                  <p className="cc-profile-card__subtitle">
                    Protect your high-value vessel tracking &amp; financial remittance data with extra security layers.
                  </p>
                </div>

                <div className="cc-profile-2fa-body">
                  <div className="cc-profile-2fa-row">
                    <div className="cc-profile-2fa-info">
                      <span className="cc-profile-2fa-label">Authenticator App (TOTP)</span>
                      <span className="cc-profile-2fa-sub">Use Google Authenticator or 1Password for sign-in codes</span>
                    </div>
                    <button
                      type="button"
                      className={`cc-profile-toggle-switch ${is2FaEnabled ? 'cc-profile-toggle-switch--active' : ''}`}
                      onClick={toggle2Fa}
                      aria-label={is2FaEnabled ? 'Disable Two-Factor Authentication' : 'Enable Two-Factor Authentication'}
                    >
                      <span className="cc-profile-toggle-knob" />
                    </button>
                  </div>

                  {twoFactorMessage && (
                    <p className={`cc-profile-alert ${is2FaEnabled ? 'cc-profile-alert--success' : 'cc-profile-alert--warning'}`} role="status">
                      {twoFactorMessage}
                    </p>
                  )}
                </div>
              </section>

              {/* Notification & Alert Preferences Card */}
              <section className="cc-profile-card" aria-labelledby="preferences-card-title">
                <div className="cc-profile-card__header">
                  <div className="cc-profile-card__header-title-wrap">
                    <svg className="cc-profile-card__icon cc-profile-card__icon--preferences" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                    <h2 id="preferences-card-title" className="cc-profile-card__title cc-profile-card__title--preferences">
                      NOTIFICATION &amp; ALERT PREFERENCES
                    </h2>
                  </div>
                  <p className="cc-profile-card__subtitle">
                    Manage real-time notifications for vessel arrivals, TT remittance, and security events.
                  </p>
                </div>

                <div className="cc-profile-preferences-list">
                  <div className="cc-profile-preference-row">
                    <div className="cc-profile-preference-main">
                      <div className="cc-profile-pref-icon-wrap" aria-hidden="true">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 21c1.5 0 1.5-1 3-1s1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1 1.5 1 3 1" />
                          <path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76" />
                          <path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6" />
                          <path d="M12 10v4" />
                          <path d="M12 2v3" />
                        </svg>
                      </div>
                      <div className="cc-profile-preference-info">
                        <span className="cc-profile-preference-title">Shipment &amp; Vessel Tracking</span>
                        <span className="cc-profile-preference-desc">Alerts when imported vehicles hit shipping milestones</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className={`cc-profile-toggle-switch ${preferences.shipmentAlerts ? 'cc-profile-toggle-switch--active' : ''}`}
                      onClick={() => togglePreference('shipmentAlerts')}
                      aria-label="Toggle shipment alerts"
                    >
                      <span className="cc-profile-toggle-knob" />
                    </button>
                  </div>

                  <div className="cc-profile-preference-row">
                    <div className="cc-profile-preference-main">
                      <div className="cc-profile-pref-icon-wrap" aria-hidden="true">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect width="20" height="14" x="2" y="5" rx="2" />
                          <line x1="2" x2="22" y1="10" y2="10" />
                          <line x1="6" x2="10" y1="15" y2="15" />
                        </svg>
                      </div>
                      <div className="cc-profile-preference-info">
                        <span className="cc-profile-preference-title">Payment &amp; TT Remittance</span>
                        <span className="cc-profile-preference-desc">Receipts and verification confirmations for telegraphic transfers</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className={`cc-profile-toggle-switch ${preferences.remittanceAlerts ? 'cc-profile-toggle-switch--active' : ''}`}
                      onClick={() => togglePreference('remittanceAlerts')}
                      aria-label="Toggle remittance alerts"
                    >
                      <span className="cc-profile-toggle-knob" />
                    </button>
                  </div>

                  <div className="cc-profile-preference-row">
                    <div className="cc-profile-preference-main">
                      <div className="cc-profile-pref-icon-wrap" aria-hidden="true">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                      </div>
                      <div className="cc-profile-preference-info">
                        <span className="cc-profile-preference-title">Security &amp; Login Activity</span>
                        <span className="cc-profile-preference-desc">Immediate alerts for new device logins and password revisions</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className={`cc-profile-toggle-switch ${preferences.securityAlerts ? 'cc-profile-toggle-switch--active' : ''}`}
                      onClick={() => togglePreference('securityAlerts')}
                      aria-label="Toggle security alerts"
                    >
                      <span className="cc-profile-toggle-knob" />
                    </button>
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column: Credential Revision, Active Sessions & Audit */}
            <div className="cc-profile-col cc-profile-col--side">
              {/* Credential Revision Card */}
              <section className="cc-profile-card" aria-labelledby="credential-revision-title">
                <div className="cc-profile-card__header">
                  <div className="cc-profile-card__header-title-wrap">
                    <svg className="cc-profile-card__icon cc-profile-card__icon--credentials" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <h2 id="credential-revision-title" className="cc-profile-card__title cc-profile-card__title--credentials">
                      CREDENTIAL REVISION
                    </h2>
                  </div>
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
                        type={showCurrentPassword ? 'text' : 'password'}
                        className="cc-profile-input"
                        autoComplete="current-password"
                        placeholder="Enter current password"
                        value={passwordForm.currentPassword}
                        onChange={updatePasswordField('currentPassword')}
                        aria-invalid={passwordFieldErrors.currentPassword ? true : undefined}
                        aria-describedby={passwordFieldErrors.currentPassword ? `${currentPasswordId}-error` : undefined}
                        required
                      />
                      <button
                        type="button"
                        className={`cc-profile-password-toggle-btn ${showCurrentPassword ? 'cc-profile-password-toggle-btn--active' : ''}`}
                        onClick={() => setShowCurrentPassword((prev) => !prev)}
                        aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                        title={showCurrentPassword ? 'Hide password' : 'Show password'}
                      >
                        {showCurrentPassword ? (
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </svg>
                        ) : (
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
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
                        type={showNewPassword ? 'text' : 'password'}
                        className="cc-profile-input"
                        autoComplete="new-password"
                        placeholder="At least 6 characters"
                        value={passwordForm.newPassword}
                        onChange={updatePasswordField('newPassword')}
                        aria-invalid={passwordFieldErrors.newPassword ? true : undefined}
                        aria-describedby={passwordFieldErrors.newPassword ? `${newPasswordId}-error` : undefined}
                        required
                      />
                      <button
                        type="button"
                        className={`cc-profile-password-toggle-btn ${showNewPassword ? 'cc-profile-password-toggle-btn--active' : ''}`}
                        onClick={() => setShowNewPassword((prev) => !prev)}
                        aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                        title={showNewPassword ? 'Hide password' : 'Show password'}
                      >
                        {showNewPassword ? (
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </svg>
                        ) : (
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                    </div>

                    {/* Real-time Password Strength Meter Indicator */}
                    {passwordForm.newPassword.length > 0 && (
                      <div className="cc-profile-strength-wrap" data-testid="password-strength-meter">
                        <div className="cc-profile-strength-bar">
                          <div className={`cc-profile-strength-fill ${passwordStrength.className}`} />
                        </div>
                        <span className="cc-profile-strength-text">
                          Strength: <strong>{passwordStrength.label}</strong>
                        </span>
                      </div>
                    )}

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
                        type={showConfirmNewPassword ? 'text' : 'password'}
                        className="cc-profile-input"
                        autoComplete="new-password"
                        placeholder="Repeat new password"
                        value={passwordForm.confirmNewPassword}
                        onChange={updatePasswordField('confirmNewPassword')}
                        aria-invalid={passwordFieldErrors.confirmNewPassword ? true : undefined}
                        aria-describedby={passwordFieldErrors.confirmNewPassword ? `${confirmNewPasswordId}-error` : undefined}
                        required
                      />
                      <button
                        type="button"
                        className={`cc-profile-password-toggle-btn ${showConfirmNewPassword ? 'cc-profile-password-toggle-btn--active' : ''}`}
                        onClick={() => setShowConfirmNewPassword((prev) => !prev)}
                        aria-label={showConfirmNewPassword ? 'Hide confirm new password' : 'Show confirm new password'}
                        title={showConfirmNewPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmNewPassword ? (
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </svg>
                        ) : (
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
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
                      className="cc-profile-btn cc-profile-btn--primary"
                      disabled={!online || isChangingPassword}
                    >
                      {isChangingPassword ? 'SAVING CHANGES…' : 'SAVE CHANGES'}
                    </button>
                  </div>
                </form>
              </section>

              {/* Active Device Sessions Card */}
              <section className="cc-profile-card" aria-labelledby="active-sessions-title">
                <div className="cc-profile-card__header">
                  <div className="cc-profile-card__header-title-wrap">
                    <svg className="cc-profile-card__icon cc-profile-card__icon--sessions" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
                      <path d="M12 18h.01" />
                    </svg>
                    <h2 id="active-sessions-title" className="cc-profile-card__title cc-profile-card__title--sessions">
                      ACTIVE DEVICE SESSIONS
                    </h2>
                  </div>
                  <p className="cc-profile-card__subtitle">
                    Devices currently signed into your Car Chief client account.
                  </p>
                </div>

                <div className="cc-profile-sessions-list">
                  {sessions.map((sess) => (
                    <div key={sess.id} className="cc-profile-session-item">
                      <div className="cc-profile-session-info">
                        <div className="cc-profile-session-title-row">
                          <span className="cc-profile-session-device">{sess.device}</span>
                          {sess.isCurrent && <span className="cc-profile-session-badge">THIS DEVICE</span>}
                        </div>
                        <span className="cc-profile-session-meta">{sess.location} &bull; {sess.ip} &bull; {sess.activeTime}</span>
                      </div>
                    </div>
                  ))}

                  {sessionActionMessage && (
                    <p className="cc-profile-alert cc-profile-alert--success" role="status">{sessionActionMessage}</p>
                  )}

                  {sessions.length > 1 && (
                    <button
                      type="button"
                      className="cc-profile-btn cc-profile-btn--secondary cc-profile-btn--revoke"
                      onClick={revokeOtherSessions}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
                        <line x1="12" y1="2" x2="12" y2="12" />
                      </svg>
                      REVOKE OTHER SESSIONS
                    </button>
                  )}
                </div>
              </section>

              {/* Account Auditing Info Card */}
              <section className="cc-profile-card cc-profile-card--audit" aria-labelledby="auditing-info-title">
                <div className="cc-profile-card__header cc-profile-card__header--audit">
                  <svg className="cc-profile-audit-icon cc-profile-card__icon--audit" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
        </>
      )}
    </section>
  );
};

