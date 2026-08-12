'use client';

import React from 'react';
import type { VehicleStatus } from '@carchief/domain';
import { ReservationSignInGuidance, useSession } from '../account-entry';
import { useReservation } from './hooks/useReservation';
import { ReservationAction } from './components/ReservationAction';
import { ReservationUnavailableNotice } from './components/ReservationUnavailableNotice';

export interface ReservationSectionProps {
  vehicleSlug: string;
  vehicleStatus: VehicleStatus;
  vehicleLabel: string;
}

/**
 * Mirrors `@carchief/domain`'s `RESERVABLE_VEHICLE_STATUSES` (the same
 * server-authoritative vocabulary `apps/mock-api/src/store.ts` enforces)
 * rather than importing it as a runtime value: `@carchief/domain`'s single
 * `dist/index.js` entry re-exports `auth.js`, which imports `node:buffer` at
 * module scope, and a value import here would pull that into this client
 * bundle and fail Next's webpack build (`UnhandledSchemeError`) — the same
 * constraint `features/account-entry/session-storage.ts` documents for
 * `isJwtExpired`. This copy only decides whether to *show* the Reserve
 * action; `POST /api/v1/reservations` re-checks eligibility server-side on
 * every attempt regardless (FRONT_END_ARCHITECTURE.md §16), so a
 * momentarily stale copy here can never grant an ineligible reservation.
 */
const RESERVABLE_STATUS_SET = new Set<VehicleStatus>(['Available', 'Reserved']);

/**
 * Vehicle-detail reservation composition (PUB-23, RULE-05, RULE-08, RULE-10):
 * ties the account-entry sign-in guidance (`D01-P06-T003`) to the actual
 * Reserve action against the transactional hold contract (`D01-P06-T004`).
 * The vehicle's own status decides whether reserving is offered at all
 * (RULE-09 honest empty state for `Sold`/other non-reservable statuses);
 * `useSession`'s status then decides between sign-in guidance and the real
 * action — this component never re-implements either concern, only composes
 * them.
 */
export function ReservationSection({ vehicleSlug, vehicleStatus, vehicleLabel }: ReservationSectionProps) {
  const session = useSession();
  const isReservableStatus = RESERVABLE_STATUS_SET.has(vehicleStatus);
  const isSignedIn = session.status === 'active';
  const customerId = session.claims?.sub ?? null;

  const { state, reservation, errorMessage, reserve } = useReservation(
    vehicleSlug,
    isReservableStatus && isSignedIn,
    customerId,
    session.token
  );

  if (!isReservableStatus) {
    return <ReservationUnavailableNotice vehicleLabel={vehicleLabel} vehicleStatus={vehicleStatus} />;
  }

  if (!isSignedIn) {
    return (
      <ReservationSignInGuidance
        status={session.status}
        signInHref={`/account?returnTo=${encodeURIComponent(`/vehicles/${vehicleSlug}`)}`}
        vehicleLabel={vehicleLabel}
      />
    );
  }

  return (
    <ReservationAction
      state={state}
      vehicleLabel={vehicleLabel}
      reservation={reservation}
      errorMessage={errorMessage}
      onReserve={reserve}
    />
  );
}
