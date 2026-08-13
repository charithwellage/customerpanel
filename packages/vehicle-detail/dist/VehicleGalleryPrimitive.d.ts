export interface VehicleGalleryPrimitiveProps {
    images: string[];
    title: string;
    /** Minimum horizontal travel, in pixels, before a touch gesture counts as a swipe. */
    swipeThresholdPx?: number;
}
/**
 * Accessible vehicle media gallery shared by every CarChief application.
 *
 * Applications supply the already-projected, visibility-filtered image list; this
 * primitive owns only presentation and interaction. It emits no fixed DOM `id`
 * and nests no interactive controls, so it is safe to render more than once on a
 * page.
 */
export declare function VehicleGalleryPrimitive({ images, title, swipeThresholdPx, }: VehicleGalleryPrimitiveProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=VehicleGalleryPrimitive.d.ts.map