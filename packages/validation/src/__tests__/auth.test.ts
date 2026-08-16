import { describe, it, expect } from 'vitest';
import {
  registrationFormSchema,
  loginFormSchema,
  passwordChangeSchema,
  passwordResetSchema,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
} from '../auth.js';

const VALID_PASSWORD = 'a-strong-password1';

describe('registrationFormSchema', () => {
  const validInput = {
    nameWithInitials: 'J. Doe',
    countryCode: 'UG',
    mobileNumber: '700000000',
    email: 'j.doe@example.com',
    password: VALID_PASSWORD,
    confirmPassword: VALID_PASSWORD,
  };

  it('accepts a valid registration submission', () => {
    const result = registrationFormSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('rejects a missing name', () => {
    const result = registrationFormSchema.safeParse({ ...validInput, nameWithInitials: '' });
    expect(result.success).toBe(false);
  });

  it('rejects a missing country selection', () => {
    const result = registrationFormSchema.safeParse({ ...validInput, countryCode: '' });
    expect(result.success).toBe(false);
  });

  it('rejects a non-numeric mobile number', () => {
    const result = registrationFormSchema.safeParse({ ...validInput, mobileNumber: 'not-a-number' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid email address', () => {
    const result = registrationFormSchema.safeParse({ ...validInput, email: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('rejects a password below the policy minimum', () => {
    const result = registrationFormSchema.safeParse({ ...validInput, password: 'short1', confirmPassword: 'short1' });
    expect(result.success).toBe(false);
  });

  it('rejects mismatched password and confirmation on the confirmPassword field', () => {
    const result = registrationFormSchema.safeParse({ ...validInput, confirmPassword: `${VALID_PASSWORD}x` });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === 'confirmPassword')).toBe(true);
    }
  });
});

describe('loginFormSchema', () => {
  it('accepts a valid email/password submission', () => {
    const result = loginFormSchema.safeParse({ email: 'j.doe@example.com', password: 'anything-the-server-decides' });
    expect(result.success).toBe(true);
  });

  it('rejects an empty email', () => {
    const result = loginFormSchema.safeParse({ email: '', password: 'anything' });
    expect(result.success).toBe(false);
  });

  it('rejects an empty password', () => {
    const result = loginFormSchema.safeParse({ email: 'j.doe@example.com', password: '' });
    expect(result.success).toBe(false);
  });

  it('does not apply the registration password policy to login (an existing credential must always be submittable)', () => {
    const result = loginFormSchema.safeParse({ email: 'j.doe@example.com', password: 'short' });
    expect(result.success).toBe(true);
  });
});

describe('passwordChangeSchema', () => {
  const validInput = {
    currentPassword: 'old-password1',
    newPassword: VALID_PASSWORD,
    confirmNewPassword: VALID_PASSWORD,
  };

  it('accepts a valid password change submission', () => {
    const result = passwordChangeSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('rejects a new password that fails the policy', () => {
    const result = passwordChangeSchema.safeParse({ ...validInput, newPassword: 'short1', confirmNewPassword: 'short1' });
    expect(result.success).toBe(false);
  });

  it('rejects mismatched new password and confirmation', () => {
    const result = passwordChangeSchema.safeParse({ ...validInput, confirmNewPassword: `${VALID_PASSWORD}x` });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === 'confirmNewPassword')).toBe(true);
    }
  });

  it('rejects a new password identical to the current password', () => {
    const result = passwordChangeSchema.safeParse({
      currentPassword: VALID_PASSWORD,
      newPassword: VALID_PASSWORD,
      confirmNewPassword: VALID_PASSWORD,
    });
    expect(result.success).toBe(false);
  });
});

describe('passwordResetSchema', () => {
  const validInput = {
    token: 'reset-token-1',
    newPassword: VALID_PASSWORD,
    confirmNewPassword: VALID_PASSWORD,
  };

  it('accepts a valid reset confirmation submission', () => {
    const result = passwordResetSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('rejects a missing token', () => {
    const result = passwordResetSchema.safeParse({ ...validInput, token: '' });
    expect(result.success).toBe(false);
  });

  it('rejects a new password that fails the policy', () => {
    const result = passwordResetSchema.safeParse({ ...validInput, newPassword: 'short1', confirmNewPassword: 'short1' });
    expect(result.success).toBe(false);
  });

  it('rejects mismatched new password and confirmation', () => {
    const result = passwordResetSchema.safeParse({ ...validInput, confirmNewPassword: `${VALID_PASSWORD}x` });
    expect(result.success).toBe(false);
  });
});

describe('shared password policy stays in sync with D02-ASM-005', () => {
  it('declares the exact D02-ASM-005 bounds (min 12, max 128 characters)', () => {
    expect(PASSWORD_MIN_LENGTH).toBe(12);
    expect(PASSWORD_MAX_LENGTH).toBe(128);
  });

  it('accepts a password at exactly the minimum length with a letter and digit', () => {
    const password = `${'a'.repeat(PASSWORD_MIN_LENGTH - 1)}1`;
    expect(password.length).toBe(PASSWORD_MIN_LENGTH);
    const result = loginFormSchema.safeParse({ email: 'x@example.com', password });
    expect(result.success).toBe(true);
    const regResult = registrationFormSchema.safeParse({
      nameWithInitials: 'J. Doe',
      countryCode: 'UG',
      mobileNumber: '700000000',
      email: 'j.doe@example.com',
      password,
      confirmPassword: password,
    });
    expect(regResult.success).toBe(true);
  });

  it('rejects a password one character below the minimum', () => {
    const password = 'a'.repeat(PASSWORD_MIN_LENGTH - 2) + '1';
    expect(password.length).toBe(PASSWORD_MIN_LENGTH - 1);
    const result = passwordChangeSchema.safeParse({
      currentPassword: 'old-password1',
      newPassword: password,
      confirmNewPassword: password,
    });
    expect(result.success).toBe(false);
  });

  it('rejects a password with no digit', () => {
    const password = 'a'.repeat(PASSWORD_MIN_LENGTH);
    const result = passwordChangeSchema.safeParse({
      currentPassword: 'old-password1',
      newPassword: password,
      confirmNewPassword: password,
    });
    expect(result.success).toBe(false);
  });

  it('rejects a password with no letter', () => {
    const password = '1'.repeat(PASSWORD_MIN_LENGTH);
    const result = passwordChangeSchema.safeParse({
      currentPassword: 'old-password1',
      newPassword: password,
      confirmNewPassword: password,
    });
    expect(result.success).toBe(false);
  });

  it('rejects a password above the maximum length', () => {
    const password = `${'a'.repeat(PASSWORD_MAX_LENGTH)}1`;
    expect(password.length).toBe(PASSWORD_MAX_LENGTH + 1);
    const result = passwordChangeSchema.safeParse({
      currentPassword: 'old-password1',
      newPassword: password,
      confirmNewPassword: password,
    });
    expect(result.success).toBe(false);
  });
});
