import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import VehicleDetailPage from '../../../features/vehicle-detail/VehicleDetailPage';
import { loadVehicleDetail } from '../../../features/vehicle-detail/loadVehicleDetail';
import { formatVehicleTitle, getVisibleGalleryImages } from '@carchief/vehicle-detail';

const DEFAULT_SITE_URL = 'http://127.0.0.1:3000';

/**
 * Per-vehicle metadata: unique title, description, canonical URL, OpenGraph and
 * Twitter tags (PUB-11).
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const vehicle = await loadVehicleDetail(slug);

  if (!vehicle) {
    return {
      title: 'Vehicle Not Found | CarChief',
      description: 'The requested vehicle could not be found in our inventory.',
    };
  }

  const title = `${formatVehicleTitle(vehicle)} | CarChief`;
  const description = `Buy ${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.bodyStyle ?? 'Vehicle'}). ${vehicle.mileage ? vehicle.mileage.toLocaleString() + ' km' : ''}. Location: ${vehicle.locationStatus ?? 'In Stock'}. Stock ID: ${vehicle.slug}.`;
  const gallery = getVisibleGalleryImages(vehicle.media);
  const mainImage = gallery.length > 0 ? gallery[0] : undefined;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL;

  // Always the resolved vehicle's canonical slug, never the requested path, so
  // an alias can never declare itself canonical.
  const canonicalUrl = `${siteUrl}/vehicles/${vehicle.slug}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'CarChief',
      images: mainImage ? [{ url: mainImage }] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: mainImage ? [mainImage] : [],
    },
  };
}

/**
 * Vehicle detail route.
 *
 * The vehicle is resolved server-side through the feature loader. An unknown
 * vehicle produces a real 404; a valid non-canonical alias (bare id or chassis
 * number) is permanently redirected to the canonical slug so each vehicle has
 * exactly one indexable URL (PUB-10, PUB-11).
 */
export default async function VehicleDetailRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const vehicle = await loadVehicleDetail(slug);

  if (!vehicle) {
    notFound();
  }

  if (vehicle.slug !== slug) {
    permanentRedirect(`/vehicles/${vehicle.slug}`);
  }

  return <VehicleDetailPage vehicle={vehicle} />;
}
