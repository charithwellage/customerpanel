import { z } from 'zod';
/**
 * Shared client-side mirror of the mock's own `prepareEnquiry` validation
 * (D01-P06-T002, PUB-14). This is a UX convenience for `react-hook-form`'s
 * `zodResolver` only — the mock API remains the authoritative validator and
 * this schema must never suppress or override a server-reported field error.
 * Field names match the flat `EnquiryRequest` contract 1:1 so a server 400
 * `field` value maps directly onto a `setError(field, ...)` call with no
 * translation table.
 */
export declare const enquiryFormSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    phone: z.ZodString;
    message: z.ZodString;
    consent: z.ZodBoolean;
    destinationCode: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    portCode: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    source: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        email: "email";
        form: "form";
        whatsapp: "whatsapp";
        call: "call";
    }>>>;
    preferredMake: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    preferredModel: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    preferredDriveSide: z.ZodDefault<z.ZodOptional<z.ZodUnion<readonly [z.ZodEnum<{
        left: "left";
        right: "right";
    }>, z.ZodLiteral<"">]>>>;
    preferredYear: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    targetPriceUsd: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
/** Output shape (after zod's `.default()` is applied) — every field resolved, used once a submission passes validation. */
export type EnquiryFormSchemaValues = z.infer<typeof enquiryFormSchema>;
/** Input shape (before defaults) — matches what `react-hook-form`'s `useForm` manages field-by-field. */
export type EnquiryFormSchemaInput = z.input<typeof enquiryFormSchema>;
//# sourceMappingURL=enquiry.d.ts.map