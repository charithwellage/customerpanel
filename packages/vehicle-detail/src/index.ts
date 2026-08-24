import type { VehicleDomainSummary, VehicleDetail, CategorizedPublicMedia } from '@carchief/domain';

export type { VehicleDetail, CategorizedPublicMedia };

export { VehicleGalleryPrimitive } from './VehicleGalleryPrimitive.js';
export type { VehicleGalleryPrimitiveProps } from './VehicleGalleryPrimitive.js';

export interface VehicleDetailProjection {
  vehicle: VehicleDomainSummary;
  galleryUrls: string[];
}

/**
 * Serializes a JSON-LD payload for safe embedding inside a `<script>` element.
 *
 * `JSON.stringify` does not escape `<`, `>` or `&`, so a vehicle field
 * containing `</script>` would otherwise close the script element and inject
 * arbitrary markup into the page. Vehicle text is staff-editable, so this is a
 * stored-injection path, not a theoretical one. The escaped sequences remain
 * valid JSON string escapes, so consumers parse the identical object.
 */
export function serializeJsonLd(payload: unknown): string {
  return JSON.stringify(payload)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

export function formatVehicleTitle(vehicle: { year: number; make: string; model: string }): string {
  return `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
}

export function isVehicleAvailable(status: string): boolean {
  return status === 'Available';
}

export function getEffectivePrice(detail: VehicleDetail): { priceText: string; isRequestPrice: boolean } {
  if (detail.priceState === 'request_price' || detail.requestPrice || detail.priceUsd === undefined) {
    return { priceText: 'Request Price', isRequestPrice: true };
  }
  const finalPrice = detail.discountedPriceUsd ?? detail.priceUsd;
  return { priceText: `$${finalPrice.toLocaleString()}`, isRequestPrice: false };
}

export function getVisibleGalleryImages(media: CategorizedPublicMedia): string[] {
  if (media.gallery?.length) {
    return media.gallery;
  }

  if (media.showAuctionPictures && media.auctionPictures?.length) {
    return media.auctionPictures;
  }

  if (media.showJapanPictures && media.japanPictures?.length) {
    return media.japanPictures;
  }

  if (media.showDurbanPictures && media.durbanPictures?.length) {
    return media.durbanPictures;
  }

  return [];
}
