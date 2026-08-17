import { z } from 'zod';

/**
 * Favourite search criteria validation (D02-P13-T007, CUST-38/CUST-39, D02-ASM-008/010).
 * Mirrors the `FavouriteSearchCriteria` interface field-for-field.
 * Cross-field checks ensure yearFrom <= yearTo, priceFromUsd <= priceToUsd, and mileageMin <= mileageMax when both are present.
 */
export const favouriteSearchCriteriaSchema = z
  .object({
    make: z.string().trim().optional().default(''),
    model: z.string().trim().optional().default(''),
    modelCode: z.string().trim().optional().default(''), // D02-ASM-008: no backing column today
    yearFrom: z.number().int().positive().optional(),
    yearTo: z.number().int().positive().optional(),
    priceFromUsd: z.number().nonnegative().optional(),
    priceToUsd: z.number().nonnegative().optional(),
    mileageMin: z.number().nonnegative().optional(),
    mileageMax: z.number().nonnegative().optional(),
    engineCc: z.string().trim().optional().default(''), // D02-ASM-008: no backing column today
    fuelType: z.string().trim().optional().default(''),
    color: z.string().trim().optional().default(''), // D02-ASM-008: no backing column today
    steering: z.string().trim().optional().default(''), // D02-ASM-008: no backing column today
    driveTrain: z.string().trim().optional().default(''),
    transmission: z.string().trim().optional().default(''),
  })
  .superRefine((values, ctx) => {
    // Validate yearFrom <= yearTo when both are present
    if (values.yearFrom !== undefined && values.yearTo !== undefined && values.yearFrom > values.yearTo) {
      ctx.addIssue({
        code: 'custom',
        path: ['yearTo'],
        message: 'Year To must be greater than or equal to Year From.',
      });
    }

    // Validate priceFromUsd <= priceToUsd when both are present
    if (
      values.priceFromUsd !== undefined &&
      values.priceToUsd !== undefined &&
      values.priceFromUsd > values.priceToUsd
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['priceToUsd'],
        message: 'Price To must be greater than or equal to Price From.',
      });
    }

    // Validate mileageMin <= mileageMax when both are present
    if (
      values.mileageMin !== undefined &&
      values.mileageMax !== undefined &&
      values.mileageMin > values.mileageMax
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['mileageMax'],
        message: 'Max Mileage must be greater than or equal to Min Mileage.',
      });
    }
  });

/** Output shape (after zod's `.default()` is applied) — every field resolved, used once a submission passes validation. */
export type FavouriteSearchCriteriaValues = z.infer<typeof favouriteSearchCriteriaSchema>;
/** Input shape (before defaults) — matches what `react-hook-form`'s `useForm` manages field-by-field. */
export type FavouriteSearchCriteriaInput = z.input<typeof favouriteSearchCriteriaSchema>;

/**
 * Favourite search create validation (D02-P13-T007, CUST-38/CUST-39/CUST-40, D02-ASM-009/010).
 * A favourite must have at least one non-empty criteria field (D02-ASM-010).
 * Field names match the domain types 1:1.
 */
export const favouriteSearchCreateSchema = z
  .object({
    name: z.string().trim().min(1, 'Enter a name for this favourite.').max(80, 'Name must be 80 characters or less.'),
    criteria: favouriteSearchCriteriaSchema,
  })
  .superRefine((values, ctx) => {
    // D02-ASM-010: Reject all-empty criteria set (must have at least one non-empty field)
    const { criteria } = values;
    const hasAnyField =
      criteria.make !== '' ||
      criteria.model !== '' ||
      criteria.modelCode !== '' ||
      (criteria.yearFrom !== undefined && criteria.yearFrom > 0) ||
      (criteria.yearTo !== undefined && criteria.yearTo > 0) ||
      (criteria.priceFromUsd !== undefined && criteria.priceFromUsd > 0) ||
      (criteria.priceToUsd !== undefined && criteria.priceToUsd > 0) ||
      (criteria.mileageMin !== undefined && criteria.mileageMin > 0) ||
      (criteria.mileageMax !== undefined && criteria.mileageMax > 0) ||
      criteria.engineCc !== '' ||
      criteria.fuelType !== '' ||
      criteria.color !== '' ||
      criteria.steering !== '' ||
      criteria.driveTrain !== '' ||
      criteria.transmission !== '';

    if (!hasAnyField) {
      ctx.addIssue({
        code: 'custom',
        path: ['criteria'],
        message: 'Select at least one search criteria.',
      });
    }
  });

/** Output shape (after zod's `.default()` is applied) — every field resolved, used once a submission passes validation. */
export type FavouriteSearchCreateSchemaValues = z.infer<typeof favouriteSearchCreateSchema>;
/** Input shape (before defaults) — matches what `react-hook-form`'s `useForm` manages field-by-field. */
export type FavouriteSearchCreateSchemaInput = z.input<typeof favouriteSearchCreateSchema>;
