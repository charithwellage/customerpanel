'use client';

import React, { useId } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { QuoteRequestFormSchemaValues } from '@carchief/validation';
import { quoteRequestFormSchema } from '@carchief/validation';
import type { QuoteRequestActionState } from '../hooks/useQuoteRequest';

export interface QuoteRequestActionProps {
  state: QuoteRequestActionState;
  vehicleLabel: string;
  errorMessage: string | null;
  onSubmit: (data: QuoteRequestFormSchemaValues) => Promise<void>;
  isSubmitted: boolean;
}

/**
 * The "Get Free Quote" form for anonymous visitors (CUST-31, CUST-32, D02-P13-T004).
 * Presentational and form-driven. Shows only name, email and phone; message and
 * consent are auto-filled server-side (D02-ASM-009).
 */
export function QuoteRequestAction({
  state,
  vehicleLabel,
  errorMessage,
  onSubmit,
  isSubmitted,
}: QuoteRequestActionProps) {
  const formId = useId();
  const errorId = useId();
  const headingId = useId();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<QuoteRequestFormSchemaValues>({
    resolver: zodResolver(quoteRequestFormSchema),
    mode: 'onChange',
  });

  const errorBanner = errorMessage && (
    <p id={errorId} role="alert" aria-live="assertive" className="cc-quote-request-action__error">
      {errorMessage}
    </p>
  );

  if (state === 'success' && isSubmitted) {
    return (
      <div className="cc-quote-request-action cc-quote-request-action--success" role="status" aria-live="polite" aria-labelledby={headingId}>
        <h3 id={headingId} className="cc-quote-request-action__heading">
          ✓ Quote request received
        </h3>
        <p className="cc-quote-request-action__message">
          Thank you for your interest in the {vehicleLabel}. Our team will review your request and contact you shortly with a personalized quote.
        </p>
      </div>
    );
  }

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className="cc-quote-request-action" aria-labelledby={headingId}>
      <h3 id={headingId} className="cc-quote-request-action__heading">
        Get a Free Quote
      </h3>
      <p className="cc-quote-request-action__description">
        Request a quote for the {vehicleLabel}. We'll contact you with detailed pricing and next steps.
      </p>

      {errorBanner}

      <div className="cc-quote-request-form__group">
        <label htmlFor={`${formId}-name`} className="cc-quote-request-form__label">
          Full Name
          <span className="cc-required-indicator" aria-label="required">*</span>
        </label>
        <input
          id={`${formId}-name`}
          type="text"
          {...register('name')}
          autoComplete="name"
          className="cc-quote-request-form__input"
          placeholder="John Doe"
          aria-invalid={errors.name ? 'true' : 'false'}
          aria-describedby={errors.name ? `${formId}-name-error` : undefined}
          disabled={isSubmitting || state === 'submitting'}
        />
        {errors.name && (
          <p id={`${formId}-name-error`} className="cc-quote-request-form__error">
            {errors.name.message}
          </p>
        )}
      </div>

      <div className="cc-quote-request-form__group">
        <label htmlFor={`${formId}-email`} className="cc-quote-request-form__label">
          Email Address
          <span className="cc-required-indicator" aria-label="required">*</span>
        </label>
        <input
          id={`${formId}-email`}
          type="email"
          {...register('email')}
          autoComplete="email"
          className="cc-quote-request-form__input"
          placeholder="john@example.com"
          aria-invalid={errors.email ? 'true' : 'false'}
          aria-describedby={errors.email ? `${formId}-email-error` : undefined}
          disabled={isSubmitting || state === 'submitting'}
        />
        {errors.email && (
          <p id={`${formId}-email-error`} className="cc-quote-request-form__error">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="cc-quote-request-form__group">
        <label htmlFor={`${formId}-phone`} className="cc-quote-request-form__label">
          Phone Number
          <span className="cc-required-indicator" aria-label="required">*</span>
        </label>
        <input
          id={`${formId}-phone`}
          type="tel"
          {...register('phone')}
          autoComplete="tel"
          className="cc-quote-request-form__input"
          placeholder="+1 (555) 000-0000"
          aria-invalid={errors.phone ? 'true' : 'false'}
          aria-describedby={errors.phone ? `${formId}-phone-error` : undefined}
          disabled={isSubmitting || state === 'submitting'}
        />
        {errors.phone && (
          <p id={`${formId}-phone-error`} className="cc-quote-request-form__error">
            {errors.phone.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        className="cc-btn cc-btn--primary cc-quote-request-form__submit"
        disabled={isSubmitting || state === 'submitting'}
        aria-describedby={errorMessage ? errorId : undefined}
      >
        {state === 'submitting' || isSubmitting ? 'Sending request…' : 'Request Quote'}
      </button>
    </form>
  );
}
