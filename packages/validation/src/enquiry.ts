import { z } from 'zod';

// Duplicated from this package's own `validateEmail` (not imported, to avoid
// a circular module reference between `enquiry.ts` and `index.ts`) — a
// `packages/validation/src/__tests__` test asserts the two patterns match.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Mirrors `ENQUIRY_SOURCES`/`ENQUIRY_PREFERRED_DRIVE_SIDES` in
// `@carchief/domain` as literal tuples (zod's `z.enum` requires a
// non-empty literal tuple, not a `readonly string[]`) — a
// `packages/validation/src/__tests__` test asserts these stay in sync with
// the domain package's exported arrays.
const ENQUIRY_SOURCE_VALUES = ['form', 'whatsapp', 'email', 'call'] as const;
const ENQUIRY_PREFERRED_DRIVE_SIDE_VALUES = ['left', 'right'] as const;

/**
 * Shared client-side mirror of the mock's own `prepareEnquiry` validation
 * (D01-P06-T002, PUB-14). This is a UX convenience for `react-hook-form`'s
 * `zodResolver` only — the mock API remains the authoritative validator and
 * this schema must never suppress or override a server-reported field error.
 * Field names match the flat `EnquiryRequest` contract 1:1 so a server 400
 * `field` value maps directly onto a `setError(field, ...)` call with no
 * translation table.
 */
export const enquiryFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Enter your name.'),
    email: z
      .string()
      .trim()
      .min(1, 'Enter your email address.')
      .refine((value) => EMAIL_PATTERN.test(value), 'Enter a valid email address.'),
    phone: z.string().trim().min(1, 'Enter your phone number.'),
    message: z.string().trim().min(1, 'Enter your enquiry message.'),
    consent: z.boolean().refine((value) => value === true, {
      message: 'You must agree to be contacted before sending this enquiry.',
    }),
    destinationCode: z.string().trim().optional().default(''),
    portCode: z.string().trim().optional().default(''),
    source: z.enum(ENQUIRY_SOURCE_VALUES).optional().default('form'),
    preferredMake: z.string().trim().optional().default(''),
    preferredModel: z.string().trim().optional().default(''),
    preferredDriveSide: z
      .union([z.enum(ENQUIRY_PREFERRED_DRIVE_SIDE_VALUES), z.literal('')])
      .optional()
      .default(''),
    preferredYear: z.string().trim().optional().default(''),
    targetPriceUsd: z.string().trim().optional().default(''),
  })
  .superRefine((values, ctx) => {
    const hasDestination = values.destinationCode !== '';
    const hasPort = values.portCode !== '';
    if (hasDestination !== hasPort) {
      ctx.addIssue({
        code: 'custom',
        path: [hasDestination ? 'portCode' : 'destinationCode'],
        message: 'Select both a destination and an arrival port, or leave both blank.',
      });
    }

    if (values.preferredYear !== '') {
      const year = Number(values.preferredYear);
      const currentYear = new Date().getFullYear();
      if (!Number.isInteger(year) || year < 1990 || year > currentYear + 1) {
        ctx.addIssue({
          code: 'custom',
          path: ['preferredYear'],
          message: `Enter a preferred year between 1990 and ${currentYear + 1}.`,
        });
      }
    }

    if (values.targetPriceUsd !== '') {
      const price = Number(values.targetPriceUsd);
      if (!Number.isFinite(price) || price < 0) {
        ctx.addIssue({ code: 'custom', path: ['targetPriceUsd'], message: 'Enter a target price of 0 or more.' });
      }
    }
  });

/** Output shape (after zod's `.default()` is applied) — every field resolved, used once a submission passes validation. */
export type EnquiryFormSchemaValues = z.infer<typeof enquiryFormSchema>;
/** Input shape (before defaults) — matches what `react-hook-form`'s `useForm` manages field-by-field. */
export type EnquiryFormSchemaInput = z.input<typeof enquiryFormSchema>;

/**
 * Client-side quote-request form validation (D02-P13-T004, D02-P13-T005, CUST-31/CUST-32/CUST-33).
 * Shows only name, email and phone; message and consent are auto-filled server-side (D02-ASM-009).
 * Field names match the flat `EnquiryRequest` contract 1:1.
 */
export const quoteRequestFormSchema = z.object({
  name: z.string().trim().min(1, 'Enter your name.'),
  email: z
    .string()
    .trim()
    .min(1, 'Enter your email address.')
    .refine((value) => EMAIL_PATTERN.test(value), 'Enter a valid email address.'),
  phone: z.string().trim().min(1, 'Enter your phone number.'),
});

/** Output shape (after zod's `.default()` is applied) — every field resolved, used once a submission passes validation. */
export type QuoteRequestFormSchemaValues = z.infer<typeof quoteRequestFormSchema>;
/** Input shape (before defaults) — matches what `react-hook-form`'s `useForm` manages field-by-field. */
export type QuoteRequestFormSchemaInput = z.input<typeof quoteRequestFormSchema>;
