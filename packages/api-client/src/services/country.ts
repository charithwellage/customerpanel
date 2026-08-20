import type { CountriesResponse } from '../generated/schema.js';
import type { HttpClient } from '../http.js';

/**
 * Country/dial-code catalog lookup backing registration's country selector
 * (CUST-26, `GET /api/v1/config/countries`). The Mock API is the runtime
 * source of truth (`apps/mock-api/src/store.ts`'s `COUNTRIES`); the shared
 * `@carchief/domain` copy (`findCountryByIsoCode`, `resolveDialCode`) is the
 * same data kept in sync for tests and any offline-safe fallback.
 *
 * Base-URL convention: full `/api/v1/...` path, matching `ConfigService` —
 * the public-web convention. See `AuthService` for the identical asymmetry
 * note.
 */
export class CountryService {
  constructor(private httpClient?: HttpClient) {}

  public getCountries(): Promise<CountriesResponse> {
    if (!this.httpClient) {
      throw new Error('CountryService.getCountries requires an HttpClient');
    }
    return this.httpClient.request<CountriesResponse>('/api/v1/config/countries');
  }
}
