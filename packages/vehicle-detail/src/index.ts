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

