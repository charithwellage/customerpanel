'use client';

import React, { useId } from 'react';

export interface ReservationUnavailableNoticeProps {
  vehicleLabel: string;
  /** The vehicle's current status, shown verbatim rather than a generic "unavailable" (RULE-09: an honest reason, not a vague placeholder). */
  vehicleStatus: string;
}

/**
 * Honest empty state (RULE-09) for a vehicle whose current status is not
 * reservable (for example `Sold`) — never shows a Reserve action that would
 * predictably fail, and never fabricates a reason beyond the vehicle's own
 * recorded status.
 */
export function ReservationUnavailableNotice({ vehicleLabel, vehicleStatus }: ReservationUnavailableNoticeProps) {
  const headingId = useId();

  return (
    <div className="cc-reservation-action" role="status" aria-labelledby={headingId}>
      <h3 id={headingId} className="cc-reservation-action__heading">
        Reservation not available
      </h3>
      <p className="cc-reservation-action__message">
        {vehicleLabel} cannot be reserved right now (status: {vehicleStatus}).
      </p>
    </div>
  );
}
