'use client';

import React from 'react';

export interface RegistrationConfirmationProps {
  email: string;
  forwardUrl: string;
}

/**
 * Post-registration success state (CUST-26, D02-P12-T003). Registration
 * never mints a public-web session — this panel only confirms the account
 * was created and hands the visitor an explicit link to the Customer
 * application's sign-in, with their registered email pre-filled. No token
 * or credential crosses the origin boundary.
 */
export function RegistrationConfirmation({ email, forwardUrl }: RegistrationConfirmationProps) {
  return (
    <div role="status" aria-live="polite" className="cc-registration-confirmation">
      <h2 className="cc-registration-confirmation__title">Account created</h2>
      <p className="cc-registration-confirmation__body">
        Your CarChief account for <strong>{email}</strong> has been created. Sign in to the Customer application to
        continue.
      </p>
      <a href={forwardUrl} className="cc-btn cc-btn--primary cc-registration-confirmation__cta">
        Continue to sign in
      </a>
    </div>
  );
}
