'use client';

import React from 'react';
import { useRegistrationForm } from './hooks/useRegistrationForm';
import { RegistrationForm } from './components/RegistrationForm';
import { RegistrationConfirmation } from './components/RegistrationConfirmation';

/**
 * `/register` route composition (CUST-26, D02-P12-T003). Renders the
 * registration form until `AuthService.register` succeeds, then swaps to
 * the confirmation state with the Customer application sign-in forward
 * link. No public-web session is ever created here.
 */
export function RegistrationSection() {
  const {
    values,
    setField,
    fieldErrors,
    countries,
    countriesLoading,
    countriesError,
    reloadCountries,
    dialCode,
    isSubmitting,
    submitError,
    successForwardUrl,
    submit,
  } = useRegistrationForm();

  return (
    <section className="cc-registration" aria-label="Create a CarChief account">
      <h1 className="cc-registration__title">Create your CarChief account</h1>
      <p className="cc-registration__intro">
        Register with your name, country and mobile number to start requesting reservations and tracking orders.
      </p>

      {successForwardUrl ? (
        <RegistrationConfirmation email={values.email} forwardUrl={successForwardUrl} />
      ) : (
        <RegistrationForm
          values={values}
          onFieldChange={setField}
          fieldErrors={fieldErrors}
          countries={countries}
          countriesLoading={countriesLoading}
          countriesError={countriesError}
          onRetryCountries={reloadCountries}
          dialCode={dialCode}
          isSubmitting={isSubmitting}
          submitError={submitError}
          onSubmit={submit}
        />
      )}
    </section>
  );
}
