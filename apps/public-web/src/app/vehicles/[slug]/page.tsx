import VehicleDetailPage from '../../../features/vehicle-detail/VehicleDetailPage';
import { VehicleService, HttpClient } from '@carchief/api-client';

/**
 * Dynamic route page for vehicle detail by slug.
 * Server-renders the vehicle detail by fetching initial data from API_BASE_URL.
 */
export default async function VehicleDetailRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const baseUrl = process.env.API_BASE_URL ?? 'http://127.0.0.1:4000';
  const service = new VehicleService(new HttpClient({ baseUrl }));
  let initialVehicle = null;
  try {
    initialVehicle = await service.getVehicleDetail(slug);
  } catch (err) {
    // If vehicle not found (404) or error, initialVehicle remains null
    // VehicleDetailPage handles rendering the not-found / error state cleanly
  }

  return <VehicleDetailPage idOrSlug={slug} initialVehicle={initialVehicle} />;
}
