'use client';

import React, { useId } from 'react';
import type { FreightDestination, FreightPort } from '@carchief/domain';
import type { EnquiryFieldErrors, EnquiryFormValues } from '../hooks/useEnquiryForm';

export interface EnquiryFormProps {
  vehicleSlug?: string;
  values: EnquiryFormValues;
  onFieldChange: (field: keyof EnquiryFormValues, value: string) => void;
  fieldErrors: EnquiryFieldErrors;
  destinations: FreightDestination[];
  ports: FreightPort[];
  catalogLoading: boolean;
  catalogError: string | null;
  onRetryCatalog: () => void;
  isSubmitting: boolean;
  submitError: string | null;
  onSubmit: () => void;
  onRetrySubmit: () => void;
}

/**
 * Quotation enquiry form (PUB-13): name, email, phone and message are always
 * required; the destination/arrival port pair is an optional pairing so the
 * same form serves a general enquiry, a vehicle enquiry, or a quotation
 * enquiry naming a shipping destination. Presentational only — all data and
 * submission come from `useEnquiryForm`.
 */
export function EnquiryForm({
  vehicleSlug,
  values,
  onFieldChange,
  fieldErrors,
  destinations,
  ports,
  catalogLoading,
  catalogError,
  onRetryCatalog,
  isSubmitting,
  submitError,
  onSubmit,
  onRetrySubmit,
}: EnquiryFormProps) {
  const autoId = useId();
  const nameId = `enquiry-name-${autoId}`;
  const emailId = `enquiry-email-${autoId}`;
  const phoneId = `enquiry-phone-${autoId}`;
  const messageId = `enquiry-message-${autoId}`;
  const destinationId = `enquiry-destination-${autoId}`;
  const portId = `enquiry-port-${autoId}`;
  const nameErrorId = `enquiry-name-error-${autoId}`;
  const emailErrorId = `enquiry-email-error-${autoId}`;
  const phoneErrorId = `enquiry-phone-error-${autoId}`;
  const messageErrorId = `enquiry-message-error-${autoId}`;
  const destinationErrorId = `enquiry-destination-error-${autoId}`;
  const portErrorId = `enquiry-port-error-${autoId}`;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form className="cc-enquiry-form" onSubmit={handleSubmit} noValidate aria-label="Quotation enquiry">
      {vehicleSlug && (
        <p className="cc-enquiry-form__context">
          Enquiring about vehicle <strong>{vehicleSlug}</strong>.
        </p>
      )}

      <div className="cc-enquiry-form__field">
        <label htmlFor={nameId} className="cc-enquiry-form__label">
          Name
          <span aria-hidden="true"> *</span>
        </label>
        <input
          id={nameId}
          type="text"
          autoComplete="name"
          className="cc-enquiry-form__input"
          value={values.name}
          onChange={(e) => onFieldChange('name', e.target.value)}
          aria-required="true"
          aria-invalid={Boolean(fieldErrors.name)}
          aria-describedby={fieldErrors.name ? nameErrorId : undefined}
        />
        {fieldErrors.name && (
          <p id={nameErrorId} role="alert" className="cc-enquiry-form__field-error">
            {fieldErrors.name}
          </p>
        )}
      </div>

      <div className="cc-enquiry-form__field">
        <label htmlFor={emailId} className="cc-enquiry-form__label">
          Email
          <span aria-hidden="true"> *</span>
        </label>
        <input
          id={emailId}
          type="email"
          autoComplete="email"
          className="cc-enquiry-form__input"
          value={values.email}
          onChange={(e) => onFieldChange('email', e.target.value)}
          aria-required="true"
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={fieldErrors.email ? emailErrorId : undefined}
        />
        {fieldErrors.email && (
          <p id={emailErrorId} role="alert" className="cc-enquiry-form__field-error">
            {fieldErrors.email}
          </p>
        )}
      </div>

      <div className="cc-enquiry-form__field">
        <label htmlFor={phoneId} className="cc-enquiry-form__label">
          Phone number
          <span aria-hidden="true"> *</span>
        </label>
        <input
          id={phoneId}
          type="tel"
          autoComplete="tel"
          className="cc-enquiry-form__input"
          value={values.phone}
          onChange={(e) => onFieldChange('phone', e.target.value)}
          aria-required="true"
          aria-invalid={Boolean(fieldErrors.phone)}
          aria-describedby={fieldErrors.phone ? phoneErrorId : undefined}
        />
        {fieldErrors.phone && (
          <p id={phoneErrorId} role="alert" className="cc-enquiry-form__field-error">
            {fieldErrors.phone}
          </p>
        )}
      </div>

      <fieldset className="cc-enquiry-form__destination">
        <legend className="cc-enquiry-form__label">Shipping destination (optional)</legend>

        {catalogLoading && (
          <div role="status" aria-live="polite" className="cc-enquiry-form__state">
            Loading destinations&hellip;
          </div>
        )}

        {!catalogLoading && catalogError && (
          <div role="alert" className="cc-enquiry-form__state cc-enquiry-form__state--error">
            <strong>Unable to load destinations.</strong>
            <span>{catalogError}</span>
            <button type="button" className="cc-btn cc-btn--secondary cc-btn--sm" onClick={onRetryCatalog}>
              Retry
            </button>
          </div>
        )}

        {!catalogLoading && !catalogError && (
          <div className="cc-enquiry-form__destination-grid">
            <div className="cc-enquiry-form__field">
              <label htmlFor={destinationId} className="cc-enquiry-form__label cc-enquiry-form__label--sm">
                Destination country
              </label>
              <select
                id={destinationId}
                className="cc-enquiry-form__select"
                value={values.destinationCode}
                onChange={(e) => onFieldChange('destinationCode', e.target.value)}
                aria-invalid={Boolean(fieldErrors.destinationCode)}
                aria-describedby={fieldErrors.destinationCode ? destinationErrorId : undefined}
              >
                <option value="">Select a destination&hellip;</option>
                {destinations.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.name} ({d.country})
                  </option>
                ))}
              </select>
              {fieldErrors.destinationCode && (
                <p id={destinationErrorId} role="alert" className="cc-enquiry-form__field-error">
                  {fieldErrors.destinationCode}
                </p>
              )}
            </div>

            <div className="cc-enquiry-form__field">
              <label htmlFor={portId} className="cc-enquiry-form__label cc-enquiry-form__label--sm">
                Arrival port
              </label>
              <select
                id={portId}
                className="cc-enquiry-form__select"
                value={values.portCode}
                onChange={(e) => onFieldChange('portCode', e.target.value)}
                aria-invalid={Boolean(fieldErrors.portCode)}
                aria-describedby={fieldErrors.portCode ? portErrorId : undefined}
              >
                <option value="">Select an arrival port&hellip;</option>
                {ports.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.name} ({p.country})
                  </option>
                ))}
              </select>
              {fieldErrors.portCode && (
                <p id={portErrorId} role="alert" className="cc-enquiry-form__field-error">
                  {fieldErrors.portCode}
                </p>
              )}
            </div>
          </div>
        )}
      </fieldset>

      <div className="cc-enquiry-form__field">
        <label htmlFor={messageId} className="cc-enquiry-form__label">
          Message
          <span aria-hidden="true"> *</span>
        </label>
        <textarea
          id={messageId}
          className="cc-enquiry-form__textarea"
          rows={5}
          value={values.message}
          onChange={(e) => onFieldChange('message', e.target.value)}
          aria-required="true"
          aria-invalid={Boolean(fieldErrors.message)}
          aria-describedby={fieldErrors.message ? messageErrorId : undefined}
        />
        {fieldErrors.message && (
          <p id={messageErrorId} role="alert" className="cc-enquiry-form__field-error">
            {fieldErrors.message}
          </p>
        )}
      </div>

      {submitError && (
        <div role="alert" className="cc-enquiry-form__state cc-enquiry-form__state--error">
          <strong>We could not send your enquiry.</strong>
          <span>{submitError}</span>
          <button type="button" className="cc-btn cc-btn--secondary cc-btn--sm" onClick={onRetrySubmit}>
            Try again
          </button>
        </div>
      )}

      <button type="submit" className="cc-btn cc-btn--primary" disabled={isSubmitting}>
        {isSubmitting ? 'Sending enquiry…' : 'Send enquiry'}
      </button>
    </form>
  );
}
