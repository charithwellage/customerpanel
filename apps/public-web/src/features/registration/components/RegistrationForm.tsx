'use client';

import React, { useId, useMemo, useState } from 'react';
import type { CountryOption } from '@carchief/domain/dist/countries.js';
import type { RegistrationFieldErrors, RegistrationFormValues } from '../hooks/useRegistrationForm';

export interface RegistrationFormProps {
  values: RegistrationFormValues;
  onFieldChange: (field: keyof RegistrationFormValues, value: string) => void;
  fieldErrors: RegistrationFieldErrors;
  countries: CountryOption[];
  countriesLoading: boolean;
  countriesError: string | null;
  onRetryCountries: () => void;
  dialCode: string | undefined;
  isSubmitting: boolean;
  submitError: string | null;
  onSubmit: () => void;
}

/**
 * Self-service registration form (CUST-26, D02-P12-T003): name with
 * initials, country, mobile number (with a dial code that tracks the
 * selected country), email address, password and re-entered password.
 * Presentational only — all data and submission come from
 * `useRegistrationForm`. Errors are announced through a live region as well
 * as inline (COMMON_FRONTEND_RULES.md), and the password/confirm-password
 * value is never placed in a URL or query string.
 */
export function RegistrationForm({
  values,
  onFieldChange,
  fieldErrors,
  countries,
  countriesLoading,
  countriesError,
  onRetryCountries,
  dialCode,
  isSubmitting,
  submitError,
  onSubmit,
}: RegistrationFormProps) {
  const autoId = useId();
  const nameId = `register-name-${autoId}`;
  const countryId = `register-country-${autoId}`;
  const mobileId = `register-mobile-${autoId}`;
  const emailId = `register-email-${autoId}`;
  const passwordId = `register-password-${autoId}`;
  const confirmPasswordId = `register-confirm-password-${autoId}`;
  const nameErrorId = `register-name-error-${autoId}`;
  const countryErrorId = `register-country-error-${autoId}`;
  const mobileErrorId = `register-mobile-error-${autoId}`;
  const emailErrorId = `register-email-error-${autoId}`;
  const passwordErrorId = `register-password-error-${autoId}`;
  const confirmPasswordErrorId = `register-confirm-password-error-${autoId}`;
  const passwordHintId = `register-password-hint-${autoId}`;

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [countryMenuOpen, setCountryMenuOpen] = useState(false);
  const [highlightedCountry, setHighlightedCountry] = useState(0);

  const selectedCountry = countries.find((country) => country.isoCode === values.countryCode);
  const filteredCountries = useMemo(() => {
    const query = countrySearch.trim().toLocaleLowerCase();
    if (!query) return countries;
    return countries.filter((country) =>
      `${country.name} ${country.isoCode} ${country.dialCode}`.toLocaleLowerCase().includes(query),
    );
  }, [countries, countrySearch]);

  function selectCountry(country: CountryOption) {
    onFieldChange('countryCode', country.isoCode);
    setCountrySearch('');
    setCountryMenuOpen(false);
  }

  function handleCountryKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setCountryMenuOpen(true);
      setHighlightedCountry((current) => Math.min(current + 1, Math.max(filteredCountries.length - 1, 0)));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedCountry((current) => Math.max(current - 1, 0));
    } else if (event.key === 'Enter' && countryMenuOpen && filteredCountries[highlightedCountry]) {
      event.preventDefault();
      selectCountry(filteredCountries[highlightedCountry]);
    } else if (event.key === 'Escape') {
      setCountryMenuOpen(false);
    }
  }

  const hasAnyError = Object.values(fieldErrors).some(Boolean) || Boolean(submitError);
  const firstErrorMessage =
    fieldErrors.nameWithInitials ||
    fieldErrors.countryCode ||
    fieldErrors.mobileNumber ||
    fieldErrors.email ||
    fieldErrors.password ||
    fieldErrors.confirmPassword ||
    submitError ||
    '';

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form className="cc-registration-form" onSubmit={handleSubmit} noValidate aria-label="Create a CarChief account">
      {/* Errors are announced to assistive technology once, here, in addition to each field's own inline message (COMMON_FRONTEND_RULES.md). */}
      <div role="alert" aria-live="assertive" className="cc-registration-form__live-region cc-visually-hidden">
        {hasAnyError ? firstErrorMessage : ''}
      </div>

      <div className="cc-registration-form__field cnt-field-wrap">
        <label htmlFor={nameId} className="cc-registration-form__label cnt-form-label">
          Name with initials
          <span aria-hidden="true" className="cnt-required"> *</span>
        </label>
        <input
          id={nameId}
          type="text"
          autoComplete="name"
          placeholder="e.g., J. K. Perera"
          className="cc-registration-form__input cnt-form-input"
          value={values.nameWithInitials}
          onChange={(e) => onFieldChange('nameWithInitials', e.target.value)}
          aria-required="true"
          aria-invalid={Boolean(fieldErrors.nameWithInitials)}
          aria-describedby={fieldErrors.nameWithInitials ? nameErrorId : undefined}
        />
        {fieldErrors.nameWithInitials && (
          <p id={nameErrorId} role="alert" className="cc-registration-form__field-error cnt-error-msg">
            {fieldErrors.nameWithInitials}
          </p>
        )}
      </div>

      <div className="cc-registration-form__field cnt-field-wrap">
        <label htmlFor={countryId} className="cc-registration-form__label cnt-form-label">
          Country
          <span aria-hidden="true" className="cnt-required"> *</span>
        </label>

        {countriesLoading && (
          <div role="status" aria-live="polite" className="cc-registration-form__state">
            Loading countries&hellip;
          </div>
        )}

        {!countriesLoading && countriesError && (
          <div role="alert" className="cc-registration-form__state cc-registration-form__state--error">
            <strong>Unable to load countries.</strong>
            <span>{countriesError}</span>
            <button type="button" className="cc-btn cc-btn--secondary cc-btn--sm" onClick={onRetryCountries}>
              Retry
            </button>
          </div>
        )}

        {!countriesLoading && !countriesError && (
          <div className="cc-registration-form__country-picker">
            <input
            id={countryId}
            className="cc-registration-form__input cc-registration-form__country-input cnt-form-input"
            role="combobox"
            type="search"
            autoComplete="off"
            placeholder="Search countries..."
            value={countryMenuOpen ? countrySearch : selectedCountry?.name ?? ''}
            onFocus={() => setCountryMenuOpen(true)}
            onChange={(event) => {
              setCountrySearch(event.target.value);
              setCountryMenuOpen(true);
              setHighlightedCountry(0);
            }}
            onKeyDown={handleCountryKeyDown}
            onBlur={() => window.setTimeout(() => setCountryMenuOpen(false), 150)}
            aria-required="true"
            aria-invalid={Boolean(fieldErrors.countryCode)}
            aria-describedby={fieldErrors.countryCode ? countryErrorId : undefined}
            aria-expanded={countryMenuOpen}
            aria-controls={`${countryId}-options`}
            aria-activedescendant={countryMenuOpen && filteredCountries[highlightedCountry] ? `${countryId}-option-${filteredCountries[highlightedCountry].isoCode}` : undefined}
            />
            {countryMenuOpen && (
              <ul id={`${countryId}-options`} role="listbox" className="cc-registration-form__country-options">
                {filteredCountries.length > 0 ? filteredCountries.map((country, index) => (
                  <li
                    id={`${countryId}-option-${country.isoCode}`}
                    key={country.isoCode}
                    role="option"
                    aria-selected={country.isoCode === values.countryCode}
                    className={index === highlightedCountry ? 'cc-registration-form__country-option--highlighted' : undefined}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectCountry(country)}
                  >
                    <span>{country.name}</span>
                    {country.dialCode && <span>{country.dialCode}</span>}
                  </li>
                )) : (
                  <li className="cc-registration-form__country-empty">No countries match your search.</li>
                )}
              </ul>
            )}
          </div>
        )}
        {fieldErrors.countryCode && (
          <p id={countryErrorId} role="alert" className="cc-registration-form__field-error cnt-error-msg">
            {fieldErrors.countryCode}
          </p>
        )}
      </div>

      <div className="cc-registration-form__field cnt-field-wrap">
        <label htmlFor={mobileId} className="cc-registration-form__label cnt-form-label">
          Mobile number
          <span aria-hidden="true" className="cnt-required"> *</span>
        </label>
        <div className="cc-registration-form__mobile-row">
          <span className="cc-registration-form__dial-code" aria-hidden="true">
            {dialCode || '—'}
          </span>
          <input
            id={mobileId}
            type="tel"
            autoComplete="tel-national"
            placeholder="e.g., 712345678"
            className="cc-registration-form__input cnt-form-input"
            value={values.mobileNumber}
            onChange={(e) => onFieldChange('mobileNumber', e.target.value)}
            aria-required="true"
            aria-invalid={Boolean(fieldErrors.mobileNumber)}
            aria-describedby={fieldErrors.mobileNumber ? mobileErrorId : undefined}
          />
        </div>
        {fieldErrors.mobileNumber && (
          <p id={mobileErrorId} role="alert" className="cc-registration-form__field-error cnt-error-msg">
            {fieldErrors.mobileNumber}
          </p>
        )}
      </div>

      <div className="cc-registration-form__field cnt-field-wrap">
        <label htmlFor={emailId} className="cc-registration-form__label cnt-form-label">
          Email address
          <span aria-hidden="true" className="cnt-required"> *</span>
        </label>
        <input
          id={emailId}
          type="email"
          autoComplete="email"
          placeholder="e.g., customer@example.com"
          className="cc-registration-form__input cnt-form-input"
          value={values.email}
          onChange={(e) => onFieldChange('email', e.target.value)}
          aria-required="true"
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={fieldErrors.email ? emailErrorId : undefined}
        />
        {fieldErrors.email && (
          <p id={emailErrorId} role="alert" className="cc-registration-form__field-error cnt-error-msg">
            {fieldErrors.email}
          </p>
        )}
      </div>

      <div className="cc-registration-form__field cnt-field-wrap">
        <label htmlFor={passwordId} className="cc-registration-form__label cnt-form-label">
          Password
          <span aria-hidden="true" className="cnt-required"> *</span>
        </label>
        <div className="cc-registration-form__password-row">
          <input
            id={passwordId}
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            className="cc-registration-form__input cnt-form-input"
            value={values.password}
            onChange={(e) => onFieldChange('password', e.target.value)}
            aria-required="true"
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={`${passwordHintId}${fieldErrors.password ? ` ${passwordErrorId}` : ''}`}
          />
          <button
            type="button"
            className="cc-registration-form__toggle-visibility"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-pressed={showPassword}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
        <p id={passwordHintId} className="cc-registration-form__hint">
          At least 12 characters, including a letter and a digit.
        </p>
        {fieldErrors.password && (
          <p id={passwordErrorId} role="alert" className="cc-registration-form__field-error cnt-error-msg">
            {fieldErrors.password}
          </p>
        )}
      </div>

      <div className="cc-registration-form__field cnt-field-wrap">
        <label htmlFor={confirmPasswordId} className="cc-registration-form__label cnt-form-label">
          Re-enter password
          <span aria-hidden="true" className="cnt-required"> *</span>
        </label>
        <div className="cc-registration-form__password-row">
          <input
            id={confirmPasswordId}
            type={showConfirmPassword ? 'text' : 'password'}
            autoComplete="new-password"
            className="cc-registration-form__input cnt-form-input"
            value={values.confirmPassword}
            onChange={(e) => onFieldChange('confirmPassword', e.target.value)}
            aria-required="true"
            aria-invalid={Boolean(fieldErrors.confirmPassword)}
            aria-describedby={fieldErrors.confirmPassword ? confirmPasswordErrorId : undefined}
          />
          <button
            type="button"
            className="cc-registration-form__toggle-visibility"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            aria-pressed={showConfirmPassword}
          >
            {showConfirmPassword ? 'Hide' : 'Show'}
          </button>
        </div>
        {fieldErrors.confirmPassword && (
          <p id={confirmPasswordErrorId} role="alert" className="cc-registration-form__field-error cnt-error-msg">
            {fieldErrors.confirmPassword}
          </p>
        )}
      </div>

      {submitError && (
        <div role="alert" className="cc-registration-form__state cc-registration-form__state--error">
          <strong>We could not create your account.</strong>
          <span>{submitError}</span>
        </div>
      )}

      <div className="cc-registration-form__actions">
        <button type="submit" className="cc-btn cc-btn--primary cc-registration-form__submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </button>
      </div>
    </form>
  );
}
