'use client';

import React, { useId } from 'react';
import type { ReservationResponse } from '@carchief/domain';
import type { ReservationActionState } from '../hooks/useReservation';

export interface ReservationActionProps {
  state: ReservationActionState;
  vehicleLabel: string;
  reservation: ReservationResponse | null;
  errorMessage: string | null;
  onReserve: () => void;
}

/**
 * The actual "Reserve" action once a visitor is signed in with an eligible
 * vehicle (PUB-23). Presentational and prop-driven, matching
 * `DemoSignInPanel`/`SessionStatusPanel`'s shape — no hook usage inside.
 * Never claims an automatic release happens after the hold expires
 * (`DEC-PUB-RESERVATION-EXPIRY-ACTION` stays OPEN, RULE-10); only the
 * `expiresAt` fact the mock returns is shown.
 */
export function ReservationAction({ state, vehicleLabel, reservation, errorMessage, onReserve }: ReservationActionProps) {
  const headingId = useId();
  const errorId = useId();

  const errorBanner = errorMessage && (
    <p id={errorId} role="alert" aria-live="assertive" className="cc-reservation-action__error">
      {errorMessage}
    </p>
  );

  if (state === 'checking') {
    return (
      <div className="cc-reservation-action" role="status" aria-live="polite" aria-labelledby={headingId}>
        <h3 id={headingId} className="cc-reservation-action__heading">
          Checking reservation status…
        </h3>
      </div>
    );
  }

  if (state === 'active' && reservation) {
    const expiresAtLabel = new Date(reservation.expiresAt).toLocaleString();
    return (
      <div className="cc-reservation-action cc-reservation-action--active" role="status" aria-live="polite" aria-labelledby={headingId}>
        <h3 id={headingId} className="cc-reservation-action__heading">
          {vehicleLabel} is on hold for you
        </h3>
        <p className="cc-reservation-action__message">
          Your reservation hold is valid until {expiresAtLabel} ({reservation.holdHours} hours from request). What happens to
          the vehicle after that time has not been finalized yet — contact us if you need it extended.
        </p>
      </div>
    );
  }

  if (state === 'expired' && reservation) {
    const expiredAtLabel = new Date(reservation.expiresAt).toLocaleString();
    return (
      <div className="cc-reservation-action" aria-labelledby={headingId}>
        <h3 id={headingId} className="cc-reservation-action__heading">
          Your hold on {vehicleLabel} expired
        </h3>
        <p className="cc-reservation-action__message" role="status" aria-live="polite">
          Your reservation hold expired at {expiredAtLabel}. You can request a new reservation below.
        </p>
        {errorBanner}
        <button
          type="button"
          className="cc-btn cc-btn--primary"
          onClick={onReserve}
          aria-describedby={errorMessage ? errorId : undefined}
        >
          Reserve Again
        </button>
      </div>
    );
  }

  return (
    <div className="cc-reservation-action" aria-labelledby={headingId}>
      <h3 id={headingId} className="cc-reservation-action__heading">
        Reserve {vehicleLabel}
      </h3>
      <p className="cc-reservation-action__message">
        Reserving holds this vehicle for you for a limited time so another customer cannot buy it while you decide.
      </p>
      {errorBanner}
      <button
        type="button"
        className="cc-btn cc-btn--primary"
        onClick={onReserve}
        disabled={state === 'submitting'}
        aria-describedby={errorMessage ? errorId : undefined}
      >
        {state === 'submitting' ? 'Requesting reservation…' : 'Reserve This Vehicle'}
      </button>
    </div>
  );
}
