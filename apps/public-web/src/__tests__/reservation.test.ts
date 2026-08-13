/**
 * Vehicle-detail reservation action tests (D01-P06-T005, PUB-23, RULE-05,
 * RULE-08, RULE-10).
 *
 * Covers, per the task's required states:
 * - ready — Reserve action offered
 * - submitting — control disabled, no double-submit affordance
 * - active — success feedback, honest expiry timestamp, no automatic-release claim
 * - expired — honest expiry state, re-reserve offered
 * - unavailable — honest empty state for a non-reservable vehicle status (RULE-09)
 * - error — a conflict/limit/duplicate message rendered accessibly
 *
 * This repo's root `vitest.config.ts` runs with `environment: 'node'` (no
 * jsdom), so presentational components are asserted via
 * `renderToStaticMarkup` against explicit props, matching
 * `apps/public-web/src/__tests__/account-entry.test.ts`. `useReservation`
 * itself composes `@carchief/api-client`'s generated services against the
 * real mock over HTTP, proved end-to-end by `tests/e2e/enquiry-reservation.spec.ts`
 * rather than re-mocked here.
 */
import { describe, it, expect, vi } from 'vitest';
import type { ReservationResponse } from '@carchief/domain';
import { ReservationAction } from '../features/reservation/components/ReservationAction.js';
import { ReservationUnavailableNotice } from '../features/reservation/components/ReservationUnavailableNotice.js';
import {
  readStoredReservationLink,
  writeStoredReservationLink,
  clearStoredReservationLink,
} from '../features/reservation/reservation-storage.js';

const reservationFixture: ReservationResponse = {
  id: 'res-1',
  vehicleSlug: '2021-toyota-corolla-axio-veh-1',
  vehicleId: 'veh-1',
  customerId: 'user-123',
  customerEmail: 'user@carchief.com',
  status: 'active',
  createdAt: '2026-08-01T00:00:00.000Z',
  expiresAt: '2026-08-03T00:00:00.000Z',
  holdHours: 48,
};

/* --------------------------------------------------------------------------
   reservation-storage read/write/clear round-trip
   -------------------------------------------------------------------------- */
describe('reservation-storage read/write/clear', () => {
  it('round-trips a reservation link through a Storage-shaped fake', () => {
    const backing = new Map<string, string>();
    writeStoredReservationLink(
      (key) => backing.get(key) ?? null,
      (key, value) => backing.set(key, value),
      'veh-1',
      { reservationId: 'res-1', customerId: 'user-123' }
    );
    const link = readStoredReservationLink((key) => backing.get(key) ?? null, 'veh-1');
    expect(link).toEqual({ reservationId: 'res-1', customerId: 'user-123' });

    clearStoredReservationLink(
      (key) => backing.get(key) ?? null,
      (key, value) => backing.set(key, value),
      'veh-1'
    );
    expect(readStoredReservationLink((key) => backing.get(key) ?? null, 'veh-1')).toBeNull();
  });

  it('keeps links for different vehicles independent', () => {
    const backing = new Map<string, string>();
    const getItem = (key: string) => backing.get(key) ?? null;
    const setItem = (key: string, value: string) => backing.set(key, value);
    writeStoredReservationLink(getItem, setItem, 'veh-a', { reservationId: 'res-a', customerId: 'user-1' });
    writeStoredReservationLink(getItem, setItem, 'veh-b', { reservationId: 'res-b', customerId: 'user-1' });
    expect(readStoredReservationLink(getItem, 'veh-a')?.reservationId).toBe('res-a');
    expect(readStoredReservationLink(getItem, 'veh-b')?.reservationId).toBe('res-b');
    clearStoredReservationLink(getItem, setItem, 'veh-a');
    expect(readStoredReservationLink(getItem, 'veh-a')).toBeNull();
    expect(readStoredReservationLink(getItem, 'veh-b')?.reservationId).toBe('res-b');
  });

  it('treats corrupted/foreign localStorage content as no link rather than throwing', () => {
    expect(readStoredReservationLink(() => 'not json', 'veh-1')).toBeNull();
    expect(readStoredReservationLink(() => JSON.stringify({ unrelated: true }), 'veh-1')).toBeNull();
    expect(readStoredReservationLink(() => null, 'veh-1')).toBeNull();
  });
});

/* --------------------------------------------------------------------------
   ReservationAction rendering (ready / submitting / active / expired / error)
   -------------------------------------------------------------------------- */
describe('ReservationAction rendering', () => {
  it('offers the Reserve action in the ready state', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(
      React.createElement(ReservationAction, {
        state: 'ready',
        vehicleLabel: '2021 Toyota Corolla Axio',
        reservation: null,
        errorMessage: null,
        onReserve: vi.fn(),
      })
    );
    expect(html).toContain('Reserve This Vehicle');
    expect(html).toContain('Reserve 2021 Toyota Corolla Axio');
  });

  it('disables the control while submitting, preventing a double-submit affordance', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(
      React.createElement(ReservationAction, {
        state: 'submitting',
        vehicleLabel: '2021 Toyota Corolla Axio',
        reservation: null,
        errorMessage: null,
        onReserve: vi.fn(),
      })
    );
    expect(html).toContain('disabled=""');
    expect(html).toContain('Requesting reservation');
  });

  it('renders the checking state while a stored reservation link is being retrieved through the service boundary', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(
      React.createElement(ReservationAction, {
        state: 'checking',
        vehicleLabel: '2021 Toyota Corolla Axio',
        reservation: null,
        errorMessage: null,
        onReserve: vi.fn(),
      })
    );
    expect(html).toContain('Checking reservation status');
  });

  it('renders success feedback with the honest expiry timestamp and no automatic-release claim', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(
      React.createElement(ReservationAction, {
        state: 'active',
        vehicleLabel: '2021 Toyota Corolla Axio',
        reservation: reservationFixture,
        errorMessage: null,
        onReserve: vi.fn(),
      })
    );
    expect(html).toContain('is on hold for you');
    expect(html).toContain('48 hours');
    expect(html.toLowerCase()).not.toContain('automatically released');
    expect(html.toLowerCase()).not.toContain('will be released');
  });

  it('renders an honest expiry state and offers to reserve again', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(
      React.createElement(ReservationAction, {
        state: 'expired',
        vehicleLabel: '2021 Toyota Corolla Axio',
        reservation: { ...reservationFixture, status: 'expired' },
        errorMessage: null,
        onReserve: vi.fn(),
      })
    );
    expect(html).toContain('hold on 2021 Toyota Corolla Axio expired');
    expect(html).toContain('Reserve Again');
  });

  it('renders a conflict/limit/duplicate error accessibly, associated with the retry control', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(
      React.createElement(ReservationAction, {
        state: 'ready',
        vehicleLabel: '2021 Toyota Corolla Axio',
        reservation: null,
        errorMessage: 'This vehicle is already on hold for another customer',
        onReserve: vi.fn(),
      })
    );
    expect(html).toContain('role="alert"');
    expect(html).toContain('This vehicle is already on hold for another customer');
    expect(html).toMatch(/aria-describedby="[^"]+"/);
  });
});

/* --------------------------------------------------------------------------
   ReservationUnavailableNotice rendering (RULE-09 honest empty state)
   -------------------------------------------------------------------------- */
describe('ReservationUnavailableNotice rendering', () => {
  it('states the vehicle’s actual current status, never a generic placeholder', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(
      React.createElement(ReservationUnavailableNotice, {
        vehicleLabel: '2020 Nissan Note',
        vehicleStatus: 'Sold',
      })
    );
    expect(html).toContain('Reservation not available');
    expect(html).toContain('status: Sold');
  });
});

/* --------------------------------------------------------------------------
   No fixed/duplicate DOM ids (reusable component rule)
   -------------------------------------------------------------------------- */
describe('Reservation feature DOM id hygiene', () => {
  it('rendering two ReservationAction instances on one document produces no duplicate DOM id values', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');

    const html = renderToStaticMarkup(
      React.createElement(
        'div',
        null,
        React.createElement(ReservationAction, {
          state: 'ready',
          vehicleLabel: 'Vehicle A',
          reservation: null,
          errorMessage: null,
          onReserve: vi.fn(),
        }),
        React.createElement(ReservationAction, {
          state: 'ready',
          vehicleLabel: 'Vehicle B',
          reservation: null,
          errorMessage: null,
          onReserve: vi.fn(),
        })
      )
    );

    const idMatches = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
    expect(idMatches.length).toBeGreaterThan(0);
    expect(idMatches.length).toBe(new Set(idMatches).size);
  });
});
