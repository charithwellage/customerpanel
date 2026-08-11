import type { Metadata } from 'next';
import VehicleDetailPage from '../../../features/vehicle-detail/VehicleDetailPage';
import { VehicleService, HttpClient } from '@carchief/api-client';
import { formatVehicleTitle, getVisibleGalleryImages } from '@carchief/vehicle-detail';

/**
 * Generate metadata for vehicle detail page.
 * Provides unique title, description, canonical URL, OpenGraph, and Twitter tags (PUB-11).
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const baseUrl = process.env.API_BASE_URL ?? 'http://127.0.0.1:4000';
  const service = new VehicleService(new HttpClient({ baseUrl }));
  try {
    const vehicle = await service.getVehicleDetail(slug);
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
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://127.0.0.1:3000';
    const canonicalUrl = `${siteUrl}/vehicles/${slug}`;

    return {
      title,
      description,
      alternates: {
        canonical: canonicalUrl,
      },
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
  } catch {
    return {
      title: 'Vehicle Details | CarChief',
      description: 'Find quality Japanese used vehicles with CarChief.',
    };
  }
}

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
  }

  return <VehicleDetailPage idOrSlug={slug} initialVehicle={initialVehicle} />;
}
