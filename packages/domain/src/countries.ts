/**
 * ISO-3166 country + E.164 dial-code catalog (Phase 2.12, CUST-26,
 * `GET /api/v1/config/countries`). This is the one shared, frontend-facing
 * copy of the dataset the Mock API serves — the entries are kept identical
 * to `apps/mock-api/src/store.ts`'s own `COUNTRIES` array (that file cannot
 * import a frontend package; it stays the runtime source of truth reachable
 * only over HTTP, per `FRONT_END_ARCHITECTURE.md` §5). Both applications and
 * every test read this one list, so registration's country selector and its
 * dial-code prefix can never drift from what the server accepts.
 */
export interface CountryOption {
  isoCode: string;
  name: string;
  dialCode: string;
}

export const COUNTRIES: readonly CountryOption[] = [
  { isoCode: 'UG', name: 'Uganda', dialCode: '+256' },
  { isoCode: 'KE', name: 'Kenya', dialCode: '+254' },
  { isoCode: 'TZ', name: 'Tanzania', dialCode: '+255' },
  { isoCode: 'RW', name: 'Rwanda', dialCode: '+250' },
  { isoCode: 'SS', name: 'South Sudan', dialCode: '+211' },
  { isoCode: 'BI', name: 'Burundi', dialCode: '+257' },
  { isoCode: 'ET', name: 'Ethiopia', dialCode: '+251' },
  { isoCode: 'SO', name: 'Somalia', dialCode: '+252' },
  { isoCode: 'ZM', name: 'Zambia', dialCode: '+260' },
  { isoCode: 'MW', name: 'Malawi', dialCode: '+265' },
  { isoCode: 'CD', name: 'DR Congo', dialCode: '+243' },
  { isoCode: 'NG', name: 'Nigeria', dialCode: '+234' },
  { isoCode: 'GH', name: 'Ghana', dialCode: '+233' },
  { isoCode: 'ZA', name: 'South Africa', dialCode: '+27' },
  { isoCode: 'GB', name: 'United Kingdom', dialCode: '+44' },
  { isoCode: 'US', name: 'United States', dialCode: '+1' },
  { isoCode: 'AE', name: 'United Arab Emirates', dialCode: '+971' },
  { isoCode: 'JP', name: 'Japan', dialCode: '+81' },
  { isoCode: 'IN', name: 'India', dialCode: '+91' },
  { isoCode: 'AU', name: 'Australia', dialCode: '+61' },
];

/** Looks up a country by its ISO alpha-2 code (case-insensitive). */
export function findCountryByIsoCode(isoCode: string): CountryOption | undefined {
  const normalized = typeof isoCode === 'string' ? isoCode.trim().toUpperCase() : '';
  if (!normalized) return undefined;
  return COUNTRIES.find((country) => country.isoCode === normalized);
}

/** Resolves the E.164 dial code for an ISO alpha-2 country code, if known. */
export function resolveDialCode(isoCode: string): string | undefined {
  return findCountryByIsoCode(isoCode)?.dialCode;
}
