/**
 * Schema boundary tests for `enquiryFormSchema` (D01-P06-T002, PUB-13,
 * PUB-14). This is the client-side mirror of the mock's own `prepareEnquiry`
 * validation, consumed by `react-hook-form`'s `zodResolver` — it never
 * replaces server-side validation, only pre-checks the same rules for a
 * faster, more accessible in-browser error.
 */
import { describe, it, expect } from 'vitest';
import { ENQUIRY_SOURCES, ENQUIRY_PREFERRED_DRIVE_SIDES } from '@carchief/domain';
import { enquiryFormSchema, quoteRequestFormSchema, validateEmail } from '../index.js';

const VALID = {
  name: 'Jane Doe',
  email: 'jane@example.com',
  phone: '+256700111222',
  message: 'General enquiry.',
  consent: true,
};

describe('enquiryFormSchema', () => {
  it('accepts the minimum valid contact fields plus consent', () => {
    const result = enquiryFormSchema.safeParse(VALID);
    expect(result.success).toBe(true);
  });

  it('requires name, email, phone and message', () => {
    const result = enquiryFormSchema.safeParse({ ...VALID, name: '', email: '', phone: '', message: '', consent: true });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((issue) => issue.path[0]);
      expect(paths).toEqual(expect.arrayContaining(['name', 'email', 'phone', 'message']));
    }
  });

  it('rejects an invalid email format', () => {
    const result = enquiryFormSchema.safeParse({ ...VALID, email: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('requires consent to be explicitly true, never inferred', () => {
    const result = enquiryFormSchema.safeParse({ ...VALID, consent: false });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === 'consent')).toBe(true);
    }
  });

  it('requires both destinationCode and portCode when either one is filled', () => {
    const result = enquiryFormSchema.safeParse({ ...VALID, destinationCode: 'UG' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === 'portCode')).toBe(true);
    }
  });

  it('passes with a complete destination/port pair', () => {
    const result = enquiryFormSchema.safeParse({ ...VALID, destinationCode: 'UG', portCode: 'MBA' });
    expect(result.success).toBe(true);
  });

  it('rejects a preferredYear outside the sane range', () => {
    const result = enquiryFormSchema.safeParse({ ...VALID, preferredYear: '1900' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === 'preferredYear')).toBe(true);
    }
  });

  it('accepts an omitted vehicle-preference block (optional capture)', () => {
    const result = enquiryFormSchema.safeParse(VALID);
    expect(result.success).toBe(true);
  });

  it('rejects a negative targetPriceUsd', () => {
    const result = enquiryFormSchema.safeParse({ ...VALID, targetPriceUsd: '-100' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === 'targetPriceUsd')).toBe(true);
    }
  });

  it('accepts a valid preferredDriveSide and rejects an unsupported one', () => {
    expect(enquiryFormSchema.safeParse({ ...VALID, preferredDriveSide: 'right' }).success).toBe(true);
    expect(enquiryFormSchema.safeParse({ ...VALID, preferredDriveSide: 'center' }).success).toBe(false);
  });

  it('keeps its local enquiry-source/drive-side vocabulary in sync with @carchief/domain', () => {
    const sourceResult = enquiryFormSchema.safeParse({ ...VALID, source: 'whatsapp' });
    expect(sourceResult.success).toBe(true);
    expect(ENQUIRY_SOURCES).toEqual(['form', 'whatsapp', 'email', 'call']);
    expect(ENQUIRY_PREFERRED_DRIVE_SIDES).toEqual(['left', 'right']);
  });

  it('mirrors the package email pattern used by validateEmail', () => {
    expect(validateEmail('jane@example.com')).toBe(true);
    expect(enquiryFormSchema.safeParse({ ...VALID, email: 'jane@example.com' }).success).toBe(true);
    expect(validateEmail('not-an-email')).toBe(false);
    expect(enquiryFormSchema.safeParse({ ...VALID, email: 'not-an-email' }).success).toBe(false);
  });
});

describe('quoteRequestFormSchema', () => {
  const VALID_QUOTE = {
    name: 'John Smith',
    email: 'john@example.com',
    phone: '+256701234567',
  };

  it('accepts the minimum required quote-request fields (name, email, phone)', () => {
    const result = quoteRequestFormSchema.safeParse(VALID_QUOTE);
    expect(result.success).toBe(true);
  });

  it('requires name field', () => {
    const result = quoteRequestFormSchema.safeParse({ ...VALID_QUOTE, name: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === 'name')).toBe(true);
    }
  });

  it('requires email field and validates format', () => {
    const result = quoteRequestFormSchema.safeParse({ ...VALID_QUOTE, email: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === 'email')).toBe(true);
    }

    const invalidEmailResult = quoteRequestFormSchema.safeParse({ ...VALID_QUOTE, email: 'invalid-email' });
    expect(invalidEmailResult.success).toBe(false);
  });

  it('requires phone field', () => {
    const result = quoteRequestFormSchema.safeParse({ ...VALID_QUOTE, phone: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === 'phone')).toBe(true);
    }
  });

  it('accepts valid email addresses', () => {
    expect(quoteRequestFormSchema.safeParse({ ...VALID_QUOTE, email: 'test@example.com' }).success).toBe(true);
    expect(quoteRequestFormSchema.safeParse({ ...VALID_QUOTE, email: 'user+tag@domain.co.uk' }).success).toBe(true);
  });

  it('rejects invalid email addresses', () => {
    expect(quoteRequestFormSchema.safeParse({ ...VALID_QUOTE, email: 'no-at-sign.com' }).success).toBe(false);
    expect(quoteRequestFormSchema.safeParse({ ...VALID_QUOTE, email: '@example.com' }).success).toBe(false);
    expect(quoteRequestFormSchema.safeParse({ ...VALID_QUOTE, email: 'user@' }).success).toBe(false);
  });
});
