import { z } from 'zod';

/**
 * Wishlist toggle (add/remove) validation (D02-P13-T005, D02-P13-T007, CUST-36).
 * Field names match the flat `WishlistToggleRequest` contract 1:1.
 */
export const wishlistToggleSchema = z.object({
  vehicleSlug: z.string().trim().min(1, 'Vehicle slug is required.'),
});

/** Output shape (after zod's `.default()` is applied) — every field resolved, used once a submission passes validation. */
export type WishlistToggleSchemaValues = z.infer<typeof wishlistToggleSchema>;
/** Input shape (before defaults) — matches what `react-hook-form`'s `useForm` manages field-by-field. */
export type WishlistToggleSchemaInput = z.input<typeof wishlistToggleSchema>;
