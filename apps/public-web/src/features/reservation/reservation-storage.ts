/**
 * Browser storage for the id of a reservation the current browser created,
 * keyed by vehicle slug (RULE-08: a created reservation must keep showing as
 * "reserved" consistently, even across a page reload, rather than reverting
 * to a bare Reserve button as if nothing happened). This link is only a
 * pointer — the actual reservation state always comes back from
 * `ReservationService.getById` (the service boundary), never trusted as
 * authoritative on its own (`FRONT_END_ARCHITECTURE.md` §16). Kept as pure
 * functions taking `Storage`-shaped callbacks, matching
 * `features/account-entry/session-storage.ts`, so this stays unit-testable
 * under this repo's `environment: 'node'` Vitest config with no jsdom
 * dependency.
 */

export const RESERVATION_LINK_STORAGE_KEY = 'carchief.reservationLinks.v1';

export interface StoredReservationLink {
  reservationId: string;
  /** The customer identity that created this link, so switching accounts never shows a stranger's reservation as "yours". */
  customerId: string;
}

type ReservationLinkMap = Record<string, StoredReservationLink>;

function readLinkMap(getItem: (key: string) => string | null): ReservationLinkMap {
  try {
    const raw = getItem(RESERVATION_LINK_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as ReservationLinkMap;
  } catch {
    // Corrupted/foreign localStorage content is treated as no link, never a crash.
    return {};
  }
}

export function readStoredReservationLink(
  getItem: (key: string) => string | null,
  vehicleSlug: string
): StoredReservationLink | null {
  const entry = readLinkMap(getItem)[vehicleSlug];
  if (!entry || typeof entry.reservationId !== 'string' || typeof entry.customerId !== 'string') {
    return null;
  }
  return entry;
}

export function writeStoredReservationLink(
  getItem: (key: string) => string | null,
  setItem: (key: string, value: string) => void,
  vehicleSlug: string,
  link: StoredReservationLink
): void {
  const map = readLinkMap(getItem);
  map[vehicleSlug] = link;
  setItem(RESERVATION_LINK_STORAGE_KEY, JSON.stringify(map));
}

export function clearStoredReservationLink(
  getItem: (key: string) => string | null,
  setItem: (key: string, value: string) => void,
  vehicleSlug: string
): void {
  const map = readLinkMap(getItem);
  delete map[vehicleSlug];
  setItem(RESERVATION_LINK_STORAGE_KEY, JSON.stringify(map));
}
