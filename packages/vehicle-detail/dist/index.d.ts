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
export declare function serializeJsonLd(payload: unknown): string;
export declare function formatVehicleTitle(vehicle: {
    year: number;
    make: string;
    model: string;
}): string;
export declare function isVehicleAvailable(status: string): boolean;
export declare function getEffectivePrice(detail: VehicleDetail): {
    priceText: string;
    isRequestPrice: boolean;
};
export declare function getVisibleGalleryImages(media: CategorizedPublicMedia): string[];
//# sourceMappingURL=index.d.ts.map