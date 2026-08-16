import { z } from 'zod';

/**
 * D02-ASM-005: minimum 12 characters, no maximum below 128, at least one
 * letter and one digit, no forced rotation and no further composition rule.
 * This is the single shared declaration; `apps/mock-api/src/store.ts`'s
 * `validatePasswordPolicy` enforces the identical rule authoritatively and a
 * `packages/validation/src/__tests__` test asserts the two never drift.
 * This schema is a UX convenience only for `react-hook-form`'s
 * `zodResolver` — the Mock API remains the authoritative validator and must
 * never be suppressed or overridden by a client-side pass.
 */
export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;

const passwordPolicySchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`)
  .max(PASSWORD_MAX_LENGTH, `Password must be no more than ${PASSWORD_MAX_LENGTH} characters long`)
  .refine((value) => /[A-Za-z]/.test(value), 'Password must contain at least one letter')
  .refine((value) => /[0-9]/.test(value), 'Password must contain at least one digit');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Mirrors the Mock API's `RegisterCustomerRequest` (CUST-26,
 * `POST /api/v1/auth/register`) field-for-field so a server 400 `field`
 * value maps directly onto `setError(field, ...)` with no translation
 * table. The mobile-number and country-code shape follows
 * `validateRegisterCustomerRequest` in `apps/mock-api/src/store.ts`.
 */
export const registrationFormSchema = z
  .object({
    nameWithInitials: z.string().trim().min(1, 'Enter your name with initials.'),
    countryCode: z.string().trim().min(1, 'Select your country.'),
    mobileNumber: z
      .string()
      .trim()
      .min(1, 'Enter your mobile number.')
      .refine((value) => /^[0-9]{4,15}$/.test(value), 'Enter a valid mobile number (digits only).'),
    email: z
      .string()
      .trim()
      .min(1, 'Enter your email address.')
      .refine((value) => EMAIL_PATTERN.test(value), 'Enter a valid email address.'),
    password: passwordPolicySchema,
    confirmPassword: z.string().min(1, 'Re-enter your password.'),
  })
  .superRefine((values, ctx) => {
    if (values.password !== values.confirmPassword) {
      ctx.addIssue({ code: 'custom', path: ['confirmPassword'], message: 'Passwords do not match.' });
    }
  });

export type RegistrationFormSchemaValues = z.infer<typeof registrationFormSchema>;
export type RegistrationFormSchemaInput = z.input<typeof registrationFormSchema>;

/**
 * Mirrors the Mock API's `LoginRequest` (CUST-27, `POST /api/v1/auth/login`).
 * Deliberately does not apply the password-policy shape here: an existing
 * account's password may pre-date a later policy change, and a login form
 * must never reject a credential the server itself would accept
 * (account-enumeration/lockout boundary, CODE_REVIEW_RULES #6).
 */
export const loginFormSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Enter your email address.')
    .refine((value) => EMAIL_PATTERN.test(value), 'Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
});

export type LoginFormSchemaValues = z.infer<typeof loginFormSchema>;
export type LoginFormSchemaInput = z.input<typeof loginFormSchema>;

/**
 * Mirrors the Mock API's `ChangePasswordRequest` (CUST-28,
 * `POST /api/v1/auth/change-password`).
 */
export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password.'),
    newPassword: passwordPolicySchema,
    confirmNewPassword: z.string().min(1, 'Re-enter your new password.'),
  })
  .superRefine((values, ctx) => {
    if (values.newPassword !== values.confirmNewPassword) {
      ctx.addIssue({ code: 'custom', path: ['confirmNewPassword'], message: 'Passwords do not match.' });
    }
    if (values.currentPassword === values.newPassword) {
      ctx.addIssue({ code: 'custom', path: ['newPassword'], message: 'New password must be different from your current password.' });
    }
  });

export type PasswordChangeSchemaValues = z.infer<typeof passwordChangeSchema>;
export type PasswordChangeSchemaInput = z.input<typeof passwordChangeSchema>;

/**
 * Mirrors the Mock API's `ConfirmPasswordResetRequest` (CUST-29,
 * `POST /api/v1/auth/password-reset/confirm`). The initial
 * `PasswordResetRequest` (email only) needs no schema beyond the shared
 * email pattern, so it is not duplicated here — callers use the same
 * `EMAIL_PATTERN`-backed check inline.
 */
export const passwordResetSchema = z
  .object({
    token: z.string().trim().min(1, 'A reset token is required.'),
    newPassword: passwordPolicySchema,
    confirmNewPassword: z.string().min(1, 'Re-enter your new password.'),
  })
  .superRefine((values, ctx) => {
    if (values.newPassword !== values.confirmNewPassword) {
      ctx.addIssue({ code: 'custom', path: ['confirmNewPassword'], message: 'Passwords do not match.' });
    }
  });

export type PasswordResetSchemaValues = z.infer<typeof passwordResetSchema>;
export type PasswordResetSchemaInput = z.input<typeof passwordResetSchema>;
