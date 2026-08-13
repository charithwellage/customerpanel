'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { HttpClient, NormalizedApiError, ReservationService } from '@carchief/api-client';
import type { ReservationResponse } from '@carchief/domain';
import {
  clearStoredReservationLink,
  readStoredReservationLink,
  writeStoredReservationLink,
} from '../reservation-storage';

function resolveBaseUrl(): string {
  // Same-origin proxy in the browser (src/app/api/v1/[...path]/route.ts);
  // direct mock-api call on the server, matching `useSession`'s convention.
  return typeof window !== 'undefined' ? '' : process.env.API_BASE_URL || 'http://127.0.0.1:4000';
}

const GENERIC_ERROR_MESSAGE = 'We could not complete the reservation. Please check your connection and try again.';

export type ReservationActionState = 'checking' | 'ready' | 'submitting' | 'active' | 'expired';

export interface UseReservationOptions {
  reservationService?: ReservationService;
}

export interface UseReservationReturn {
  state: ReservationActionState;
  reservation: ReservationResponse | null;
  errorMessage: string | null;
  reserve: () => Promise<void>;
}

/**
 * Orchestrates the "Reserve" action (PUB-23, RULE-05, RULE-08, RULE-10,
 * `D01-P06-T004`'s transactional contract) for one vehicle: on mount,
 * retrieves any reservation this browser previously created for this
 * customer/vehicle through the service boundary (never trusting the local
 * pointer alone, satisfying "a fresh browser must retrieve the created
 * reservation through the service boundary"); on `reserve()`, creates a new
 * hold and surfaces the exact eligibility/conflict/limit/expiry outcome the
 * mock reports. Only ever active while `enabled` (the caller gates this on
 * an `active` demo session and a reservable vehicle status) — `D01-P06-T005`
 * does not duplicate `useSession`'s sign-in guidance, it composes with it.
 */
export function useReservation(
  vehicleSlug: string,
  enabled: boolean,
  customerId: string | null,
  token: string | null,
  options: UseReservationOptions = {}
): UseReservationReturn {
  const tokenRef = useRef(token);
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  const service = useMemo(
    () =>
      options.reservationService ??
      new ReservationService(new HttpClient({ baseUrl: resolveBaseUrl(), getAuthToken: () => tokenRef.current })),
    [options.reservationService]
  );

  const [state, setState] = useState<ReservationActionState>('ready');
  const [reservation, setReservation] = useState<ReservationResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadExistingLink() {
      if (!enabled || !customerId || typeof window === 'undefined') {
        setState('ready');
        setReservation(null);
        return;
      }
      const link = readStoredReservationLink((key) => window.localStorage.getItem(key), vehicleSlug);
      if (!link || link.customerId !== customerId) {
        setState('ready');
        setReservation(null);
        return;
      }
      setState('checking');
      try {
        const fetched = await service.getById(link.reservationId);
        if (cancelled) return;
        if (!fetched || fetched.customerId !== customerId) {
          clearStoredReservationLink(
            (key) => window.localStorage.getItem(key),
            (key, value) => window.localStorage.setItem(key, value),
            vehicleSlug
          );
          setState('ready');
          setReservation(null);
          return;
        }
        setReservation(fetched);
        setState(fetched.status === 'active' ? 'active' : 'expired');
      } catch {
        if (cancelled) return;
        // A transient read failure never claims the reservation is gone; it
        // simply falls back to the Reserve action rather than blocking it.
        setState('ready');
        setReservation(null);
      }
    }

    void loadExistingLink();
    return () => {
      cancelled = true;
    };
  }, [enabled, customerId, vehicleSlug, service]);

  const reserve = useCallback(async () => {
    if (!customerId || typeof window === 'undefined') return;
    setState('submitting');
    setErrorMessage(null);
    try {
      const created = await service.create({ vehicleSlug });
      writeStoredReservationLink(
        (key) => window.localStorage.getItem(key),
        (key, value) => window.localStorage.setItem(key, value),
        vehicleSlug,
        { reservationId: created.id, customerId }
      );
      setReservation(created);
      setState(created.status === 'active' ? 'active' : 'expired');
    } catch (error) {
      // `NormalizedApiError.message` is the mock's own reviewed,
      // reason-specific copy (conflict/duplicate/limit_exceeded/
      // vehicle_unavailable/vehicle_not_found — `apps/mock-api/src/store.ts`),
      // the same "surface the server's message directly" pattern
      // `useEnquiryForm`/`useFreightEstimate` already use, so no parallel
      // reason-to-copy table needs to be kept in sync with the mock by hand.
      setErrorMessage(error instanceof NormalizedApiError ? error.message : GENERIC_ERROR_MESSAGE);
      setState('ready');
    }
  }, [customerId, service, vehicleSlug]);

  return { state, reservation, errorMessage, reserve };
}
