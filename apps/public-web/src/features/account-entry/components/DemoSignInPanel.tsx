'use client';

import React, { useId } from 'react';

export interface DemoSignInPanelProps {
  /** `expired` renders re-authentication copy instead of the first-visit copy (PUB-22, PUB-23). */
  variant: 'anonymous' | 'expired';
  onSignIn: () => void;
  isSigningIn: boolean;
  error: string | null;
  /** Contextual copy naming the vehicle the visitor was trying to reserve, e.g. "2021 Toyota Corolla Axio". */
  vehicleLabel?: string;
}

/**
 * Sign-in / create-account entry point (PUB-22) using the stand-in demo
 * session (DEC-PUB-AUTH-BOUNDARY). There is no separate "create account"
 * flow — both actions mint the same non-production demo identity, and the
 * copy says so plainly (RULE-10) rather than implying a real password-based
 * account is created.
 */
export function DemoSignInPanel({ variant, onSignIn, isSigningIn, error, vehicleLabel }: DemoSignInPanelProps) {
  const headingId = useId();
  const errorId = useId();

  const heading = variant === 'expired' ? 'Your demo session has expired' : 'Sign in or create an account';
  const intro =
    variant === 'expired'
      ? 'For your safety, demo sessions expire after a while. Continue below to start a new one.'
      : vehicleLabel
        ? `Sign in or create an account to continue with ${vehicleLabel}.`
        : 'Sign in or create an account to request a reservation and access account-only areas.';

  return (
    <div className="cc-account-entry__panel" aria-labelledby={headingId}>
      <h2 id={headingId} className="cc-account-entry__heading">
        {heading}
      </h2>
      <p className="cc-account-entry__intro">{intro}</p>
      <p className="cc-account-entry__demo-badge" role="note">
        Demo Mode — this creates a non-production stand-in identity only, not a real account.
      </p>

      {error && (
        <p id={errorId} role="alert" aria-live="assertive" className="cc-account-entry__error">
          {error}
        </p>
      )}

      <button
        type="button"
        className="cc-btn cc-btn--primary"
        onClick={onSignIn}
        disabled={isSigningIn}
        aria-describedby={error ? errorId : undefined}
      >
        {isSigningIn ? 'Starting demo session…' : 'Continue with Demo Customer Account'}
      </button>
    </div>
  );
}
