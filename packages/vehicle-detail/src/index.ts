import type { VehicleDomainSummary, VehicleDetail, CategorizedPublicMedia } from '@carchief/domain';

export type { VehicleDetail, CategorizedPublicMedia };

export interface VehicleDetailProjection {
  vehicle: VehicleDomainSummary;
  galleryUrls: string[];
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

