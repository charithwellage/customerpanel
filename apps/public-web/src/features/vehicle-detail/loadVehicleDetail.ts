import { cache } from 'react';
import { VehicleService, HttpClient } from '@carchief/api-client';
import type { VehicleDetail } from '@carchief/domain';

const DEFAULT_API_BASE_URL = 'http://127.0.0.1:4000';

/**
 * Server-side data boundary for the vehicle detail route.
 *
 * Routes and presentational components must not construct the API client
 * themselves; they call this loader instead. `cache()` de-duplicates the request
 * so `generateMetadata` and the page render share a single fetch per request.
 *
 * Returns `null` when the vehicle does not exist, so the caller can answer with a
 * real 404 rather than rendering a "not found" body at HTTP 200.
 */
export const loadVehicleDetail = cache(async (idOrSlug: string): Promise<VehicleDetail | null> => {
  const baseUrl = process.env.API_BASE_URL ?? DEFAULT_API_BASE_URL;
  const service = new VehicleService(new HttpClient({ baseUrl }));
  return service.getVehicleDetail(idOrSlug);
});
