import VehicleDetailPage from '../../../features/vehicle-detail/VehicleDetailPage';

/**
 * Dynamic route page for vehicle detail.
 * Receives the vehicle identifier (slug or id) from the URL params.
 * Next.js 15 requires params to be awaited in async server components.
 */
export default async function VehicleDetailRoute({
  params,
}: {
  params: Promise<{ idOrSlug: string }>;
}) {
  const { idOrSlug } = await params;
  return <VehicleDetailPage idOrSlug={idOrSlug} />;
}


