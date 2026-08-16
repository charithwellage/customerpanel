'use client';

import React, { useId } from 'react';
import type { SessionStatus } from '../hooks/useSession';

export interface ReservationSignInGuidanceProps {
  status: SessionStatus;
  /** Same-origin `/account?returnTo=...` link back to the account entry point (PUB-22, PUB-23). */
  signInHref: string;
  /** Contextual copy naming the vehicle a reservation was attempted for. */
  vehicleLabel?: string;
}

/**
 * Reservation sign-in guidance (PUB-23): if a visitor tries to reserve a
 * vehicle without an account, they are told clearly what to do next rather
 * than the action silently failing. This is guidance only — vehicle
 * reservation eligibility, creation and hold behaviour are a separate,
 * server-authoritative capability (`D01-P06-T004`) wired into the actual
 * reserve action by `D01-P06-T005`; this component never claims a
 * reservation exists or was created (RULE-10).
 */
export function ReservationSignInGuidance({ status, signInHref, vehicleLabel }: ReservationSignInGuidanceProps) {
  const headingId = useId();
  const subject = vehicleLabel ?? 'this vehicle';

  if (status === 'active') {
    return (
      <div className="cc-reservation-guidance cc-reservation-guidance--active" role="status" aria-live="polite" aria-labelledby={headingId}>
        <h3 id={headingId} className="cc-reservation-guidance__heading">
          You&rsquo;re signed in
        </h3>
        <p className="cc-reservation-guidance__message">
          You&rsquo;re signed in, so reserving {subject} can continue from here once reservation requests open on this
          page.
        </p>
      </div>
    );
  }

  const heading = status === 'expired' ? 'Sign in again to reserve this vehicle' : 'Sign in to reserve this vehicle';
  const message =
    status === 'expired'
      ? `Your session has expired. Sign in again to continue reserving ${subject} — nothing has been reserved yet.`
      : `You need to sign in or create an account before reserving ${subject}. Nothing has been reserved yet.`;

  return (
    <div className="cc-reservation-guidance" role="status" aria-live="polite" aria-labelledby={headingId}>
      <h3 id={headingId} className="cc-reservation-guidance__heading">
        {heading}
      </h3>
      <p className="cc-reservation-guidance__message">{message}</p>
      <a href={signInHref} className="cc-btn cc-btn--primary">
        Sign In to Reserve
      </a>
    </div>
  );
}
