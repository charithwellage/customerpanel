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
  isSignedIn?: boolean;
  signInHref?: string;
  onOpenCalculator?: () => void;
}

/**
 * The "Get Free Quote" interface (CUST-31, CUST-32, D02-P13-T004, D02-P14-T003).
 * - Authenticated users get an instant trigger to open the dynamic C&F Quote Calculator modal.
 * - Anonymous visitors are guided with deep-linked authentication routing (including SSO options)
 *   and can also submit a direct quick callback/quote request.
 */
export function QuoteRequestAction({
  state,
  vehicleLabel,
  errorMessage,
  onSubmit,
  isSubmitted,
  isSignedIn = false,
  signInHref = '/account',
  onOpenCalculator,
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

  if (isSignedIn) {
    return (
      <div className="cc-quote-request-action cc-quote-request-action--auth" aria-labelledby={headingId}>
        <div className="cc-quote-auth-card">
          <span className="cc-quote-auth-badge">⚡ INSTANT C&F CALCULATOR</span>
          <h3 id={headingId} className="cc-quote-request-action__heading">
            Instant C&F Quote Calculator
          </h3>
          <p className="cc-quote-request-action__description">
            You are signed in to CarChief. Configure your destination port, compare RORO vs Container maritime freight, and calculate real-time totals with insurance and warranties.
          </p>
          <button
            type="button"
            className="cc-btn cc-btn--primary cc-quote-calculator-trigger-btn"
            onClick={onOpenCalculator}
            data-testid="open-quote-calculator-btn"
          >
            <span>Open C&F Quote Calculator</span>
            <span className="cc-btn-arrow" aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cc-quote-request-unauth-container">
      {/* Guidance and Auth Routing */}
      <div className="cc-quote-auth-prompt" role="region" aria-label="Sign in guidance for quote">
        <span className="cc-quote-auth-badge">🔒 AUTHENTICATED BUYER PORTAL</span>
        <h3 id={headingId} className="cc-quote-auth-title">
          Get a Free Instant C&F Quote
        </h3>
        <p className="cc-quote-auth-text">
          Sign in or create a free account to customize destination ports, view live shipping schedules, and calculate all-inclusive C&F totals for {vehicleLabel}.
        </p>

        <a
          href={signInHref}
          className="cc-btn cc-btn--primary cc-quote-signin-btn"
          data-testid="quote-signin-redirect"
        >
          <span>Sign In / Register to Calculate</span>
          <span className="cc-btn-arrow" aria-hidden="true">→</span>
        </a>

        <div className="cc-quote-sso-options">
          <span className="cc-quote-sso-label">Quick Access:</span>
          <a href={signInHref} className="cc-quote-sso-pill" aria-label="Sign in with Google">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Google
          </a>
          <a href={signInHref} className="cc-quote-sso-pill" aria-label="Sign in with Apple">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.65-.81 1.1-1.94.98-3.07-.95.04-2.11.64-2.79 1.45-.6.69-1.12 1.83-.98 2.94 1.06.08 2.14-.54 2.79-1.32z" />
            </svg>
            Apple
          </a>
        </div>
      </div>

      <div className="cc-quote-divider" aria-hidden="true">
        <span>OR REQUEST A DIRECT SALES CALLBACK</span>
      </div>

      {/* Quick Lead Form */}
      <form id={formId} onSubmit={handleSubmit(onSubmit)} className="cc-quote-request-action">
        <h4 className="cc-quote-quick-form-heading">
          Quick Lead Inquiry
        </h4>
        <p className="cc-quote-request-action__description">
          Enter your contact details below to receive a direct quote consultation for the {vehicleLabel}.
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
          className="cc-btn cc-btn--secondary cc-quote-request-form__submit"
          disabled={isSubmitting || state === 'submitting'}
          aria-describedby={errorMessage ? errorId : undefined}
        >
          {state === 'submitting' || isSubmitting ? 'Sending request…' : 'Submit Quick Inquiry'}
        </button>
      </form>
    </div>
  );
}
