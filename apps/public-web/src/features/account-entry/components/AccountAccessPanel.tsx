'use client';

import React, { useId } from 'react';

export interface AccountAccessPanelProps {
  /** `expired` renders re-authentication copy instead of the first-visit copy (PUB-22, PUB-23). */
  variant: 'anonymous' | 'expired';
  /** The Customer application's sign-in entry point, resolved from configuration (`resolveCustomerAppUrl`). */
  customerAppUrl: string;
  /** Contextual copy naming the vehicle the visitor was trying to reserve, e.g. "2021 Toyota Corolla Axio". */
  vehicleLabel?: string;
}

/**
 * Honest account-access entry point (PUB-22, CUST-30): there is no demo
 * identity path left, and the public website itself never mints a token. A
 * visitor is directed to the two real paths — create a real account
 * (`/register`) or sign in with an existing one, which only ever happens in
 * the Customer application (`DEC-CUST-IDENTITY-RECOVERY`). This component
 * never implies a form here on public-web would create or verify a
 * credential.
 */
export function AccountAccessPanel({ variant, customerAppUrl, vehicleLabel }: AccountAccessPanelProps) {
  const headingId = useId();

  const heading = variant === 'expired' ? 'Your session has expired' : 'An account is required';
  const intro =
    variant === 'expired'
      ? 'Sign in again to continue. Nothing was lost — your account and its data are unaffected.'
      : vehicleLabel
        ? `Sign in or create a free account to continue with ${vehicleLabel}.`
        : 'Sign in or create a free account to request a reservation and access account-only areas.';

  return (
    <div className="cc-account-entry__panel" aria-labelledby={headingId}>
      <h2 id={headingId} className="cc-account-entry__heading">
        {heading}
      </h2>
      <p className="cc-account-entry__intro">{intro}</p>

      <div className="cc-account-entry__actions">
        <a href={customerAppUrl} className="cc-btn cc-btn--primary">
          Sign In
        </a>
        <a href="/register" className="cc-btn cc-btn--secondary">
          Create an Account
        </a>
      </div>
    </div>
  );
}
