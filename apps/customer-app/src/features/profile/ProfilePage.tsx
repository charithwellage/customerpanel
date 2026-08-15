import React from 'react';
import { NormalizedApiError, type UpdateCustomerProfileRequest } from '@carchief/api-client';
import { useCustomerShell } from '../shell/index.js';
import { useCustomerOnlineStatus } from '../pwa/useCustomerOnlineStatus.js';
import { useCustomerProfile, useUpdateCustomerProfile } from './useCustomerProfile.js';

type EditableProfile = Pick<UpdateCustomerProfileRequest, 'companyName' | 'phone' | 'deliveryAddress'>;

const emptyProfile: EditableProfile = { companyName: '', phone: '', deliveryAddress: '' };

function validateProfile(profile: EditableProfile): string | null {
  if (profile.companyName.trim().length < 2) return 'Company name must be at least 2 characters.';
  if (!/^\+?[0-9 ()-]{7,30}$/.test(profile.phone.trim())) return 'Enter a valid phone number.';
  if (profile.deliveryAddress.trim().length < 5) return 'Delivery address must be at least 5 characters.';
  return null;
}

export const ProfilePage: React.FC = () => {
  const { setActiveRoute } = useCustomerShell();
  const online = useCustomerOnlineStatus();
  const profileQuery = useCustomerProfile();
  const updateProfile = useUpdateCustomerProfile();
  const [form, setForm] = React.useState<EditableProfile>(emptyProfile);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [hasConflict, setHasConflict] = React.useState(false);
  const [savedMessage, setSavedMessage] = React.useState<string | null>(null);

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
    setHasConflict(false);
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

  return (
    <section className="cc-cust-profile" aria-labelledby="profile-title">
      <header className="cc-cust-profile__header">
        <div>
          <p className="cc-cust-profile__eyebrow">Account settings</p>
          <h1 id="profile-title" className="cc-cust-profile__title">Profile &amp; Account</h1>
          <p className="cc-cust-profile__subtitle">Manage approved contact details used for customer delivery communication.</p>
        </div>
        <span className="cc-cust-profile__boundary">Identity is managed by the identity provider.</span>
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
            <h2 id="identity-title">Verified identity</h2>
            <p className="cc-cust-profile__notice">Name and email are fixed by the authenticated customer identity and cannot be edited here.</p>
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

          <section className="cc-cust-profile__card" aria-labelledby="password-title">
            <h2 id="password-title">Password</h2>
            <p className="cc-cust-profile__notice">Password changes, reauthentication and MFA are handled by the AutoPulse/Keycloak identity boundary. This demo does not store passwords.</p>
            <button type="button" className="cc-cust-profile__button" onClick={() => setFormError('Password changes are available through the identity-provider handoff and are not completed by this demo.')}>Open identity-provider handoff</button>
          </section>
        </>
      )}
    </section>
  );
};
