import type { VehicleDomainSummary } from '@carchief/domain';

export interface VehicleDetailProjection {
  vehicle: VehicleDomainSummary;
  galleryUrls: string[];
}

export function formatVehicleTitle(vehicle: VehicleDomainSummary): string {
  return `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
}
