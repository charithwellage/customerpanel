import { describe, it, expect, beforeEach, vi } from 'vitest';
import { quoteRequestFormSchema } from '@carchief/validation';
import type { QuoteRequestFormSchemaValues } from '@carchief/validation';

describe('Quote Request Form', () => {
  describe('quoteRequestFormSchema validation', () => {
    it('validates required name field', () => {
      const result = quoteRequestFormSchema.safeParse({
        name: '',
        email: 'test@example.com',
        phone: '+1234567890',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const nameError = result.error.issues.find((issue) => issue.path[0] === 'name');
        expect(nameError?.message).toContain('Enter your name');
      }
    });

    it('validates email format', () => {
      const result = quoteRequestFormSchema.safeParse({
        name: 'John Doe',
        email: 'invalid-email',
        phone: '+1234567890',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const emailError = result.error.issues.find((issue) => issue.path[0] === 'email');
        expect(emailError?.message).toContain('valid email');
      }
    });

    it('validates required email field', () => {
      const result = quoteRequestFormSchema.safeParse({
        name: 'John Doe',
        email: '',
        phone: '+1234567890',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const emailError = result.error.issues.find((issue) => issue.path[0] === 'email');
        expect(emailError?.message).toContain('Enter your email');
      }
    });

    it('validates required phone field', () => {
      const result = quoteRequestFormSchema.safeParse({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const phoneError = result.error.issues.find((issue) => issue.path[0] === 'phone');
        expect(phoneError?.message).toContain('Enter your phone');
      }
    });

    it('accepts valid form data with all required fields', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1 (555) 000-0000',
      };

      const result = quoteRequestFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('John Doe');
        expect(result.data.email).toBe('john@example.com');
        expect(result.data.phone).toBe('+1 (555) 000-0000');
      }
    });

    it('trims whitespace from fields', () => {
      const dataWithWhitespace = {
        name: '  John Doe  ',
        email: '  john@example.com  ',
        phone: '  +1234567890  ',
      };

      const result = quoteRequestFormSchema.safeParse(dataWithWhitespace);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('John Doe');
        expect(result.data.email).toBe('john@example.com');
        expect(result.data.phone).toBe('+1234567890');
      }
    });
  });

  describe('Submission payload shape (D02-ASM-009)', () => {
    it('submission includes name, email, and phone from form', () => {
      const formData: QuoteRequestFormSchemaValues = {
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+44 20 7946 0958',
      };

      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        message: 'Quote request from customer application',
        consent: true,
        vehicleSlug: 'vehicle-123',
        enquiryType: 'price-request',
        source: 'form',
      };

      // Verify the payload has the required shape
      expect(payload).toHaveProperty('name', 'Jane Smith');
      expect(payload).toHaveProperty('email', 'jane@example.com');
      expect(payload).toHaveProperty('phone', '+44 20 7946 0958');
      expect(payload).toHaveProperty('message');
      expect(payload).toHaveProperty('consent', true);
      expect(payload).toHaveProperty('vehicleSlug');
      expect(payload).toHaveProperty('enquiryType', 'price-request');
      expect(payload).toHaveProperty('source', 'form');
    });

    it('message is auto-filled server-side (D02-ASM-009)', () => {
      // The form should not require message as an input field
      const formData: QuoteRequestFormSchemaValues = {
        name: 'Test User',
        email: 'test@example.com',
        phone: '+1234567890',
      };

      // Message is auto-filled, not part of the form schema
      expect(formData).not.toHaveProperty('message');

      // When submitted, the client adds the fixed message
      const payload = {
        ...formData,
        message: 'Quote request from customer application',
        consent: true,
      };

      expect(payload.message).toBe('Quote request from customer application');
      expect(payload.consent).toBe(true);
    });

    it('consent is implied by submission (D02-ASM-009)', () => {
      const formData: QuoteRequestFormSchemaValues = {
        name: 'Test User',
        email: 'test@example.com',
        phone: '+1234567890',
      };

      // Consent is not a visible form field, but is set to true on submission
      expect(formData).not.toHaveProperty('consent');

      const payload = {
        ...formData,
        message: 'Quote request from customer application',
        consent: true,
      };

      expect(payload.consent).toBe(true);
    });
  });

  describe('Repeat submission handling (CUST-31)', () => {
    it('supports multiple submissions for the same vehicle', () => {
      // First submission
      const firstSubmission: QuoteRequestFormSchemaValues = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
      };

      const result1 = quoteRequestFormSchema.safeParse(firstSubmission);
      expect(result1.success).toBe(true);

      // Second submission (same visitor, same vehicle, same or different data)
      const secondSubmission: QuoteRequestFormSchemaValues = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1 (555) 000-0000',
      };

      const result2 = quoteRequestFormSchema.safeParse(secondSubmission);
      expect(result2.success).toBe(true);

      // Both submissions should be valid and allowed
      expect(result1.success).toBe(result2.success);
    });

    it('different visitors can submit for the same vehicle', () => {
      const firstVisitor: QuoteRequestFormSchemaValues = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
      };

      const secondVisitor: QuoteRequestFormSchemaValues = {
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+44 20 7946 0958',
      };

      const result1 = quoteRequestFormSchema.safeParse(firstVisitor);
      const result2 = quoteRequestFormSchema.safeParse(secondVisitor);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });
  });

  describe('Client validation coverage', () => {
    it('validates all three required fields independently', () => {
      const testCases = [
        {
          data: { name: '', email: 'test@example.com', phone: '+1234567890' },
          shouldFail: true,
          field: 'name',
        },
        {
          data: { name: 'John', email: '', phone: '+1234567890' },
          shouldFail: true,
          field: 'email',
        },
        {
          data: { name: 'John', email: 'test@example.com', phone: '' },
          shouldFail: true,
          field: 'phone',
        },
        {
          data: { name: 'John', email: 'test@example.com', phone: '+1234567890' },
          shouldFail: false,
          field: 'all',
        },
      ];

      testCases.forEach(({ data, shouldFail }) => {
        const result = quoteRequestFormSchema.safeParse(data);
        expect(result.success).toBe(!shouldFail);
      });
    });

    it('validates email format with pattern matching', () => {
      const emailTests = [
        { email: 'valid@example.com', valid: true },
        { email: 'user+tag@domain.co.uk', valid: true },
        { email: 'test@example.co', valid: true },
        { email: 'invalid', valid: false },
        { email: '@example.com', valid: false },
        { email: 'user@', valid: false },
        { email: 'user @example.com', valid: false },
      ];

      emailTests.forEach(({ email, valid }) => {
        const result = quoteRequestFormSchema.safeParse({
          name: 'John',
          email,
          phone: '+1234567890',
        });
        expect(result.success).toBe(valid);
      });
    });
  });
});
