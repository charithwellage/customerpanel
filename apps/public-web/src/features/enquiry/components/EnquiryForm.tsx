'use client';

import React, { useId } from 'react';
import type { FreightDestination, FreightPort } from '@carchief/domain';
import type { EnquiryFieldErrors, EnquiryFormValues } from '../hooks/useEnquiryForm';

export interface EnquiryFormProps {
  vehicleSlug?: string;
  values: EnquiryFormValues;
  onFieldChange: (field: keyof EnquiryFormValues, value: string | boolean) => void;
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
 * General/vehicle/Premium Vehicle/quotation enquiry form (PUB-13, PUB-14,
 * D01-P06-T002): name, email, phone, message and consent are always
 * required; the destination/arrival port pair, preferred contact method and
 * vehicle-preference capture are optional. The vehicle-preference fieldset
 * only appears when no specific vehicle is already named (`vehicleSlug`) —
 * describing preferences for a vehicle already identified would be
 * contradictory. Presentational only — all data and submission come from
 * `useEnquiryForm`.
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
  const sourceId = `enquiry-source-${autoId}`;
  const preferredMakeId = `enquiry-preferred-make-${autoId}`;
  const preferredModelId = `enquiry-preferred-model-${autoId}`;
  const preferredDriveSideId = `enquiry-preferred-drive-side-${autoId}`;
  const preferredYearId = `enquiry-preferred-year-${autoId}`;
  const targetPriceId = `enquiry-target-price-${autoId}`;
  const consentId = `enquiry-consent-${autoId}`;
  const nameErrorId = `enquiry-name-error-${autoId}`;
  const emailErrorId = `enquiry-email-error-${autoId}`;
  const phoneErrorId = `enquiry-phone-error-${autoId}`;
  const messageErrorId = `enquiry-message-error-${autoId}`;
  const destinationErrorId = `enquiry-destination-error-${autoId}`;
  const portErrorId = `enquiry-port-error-${autoId}`;
  const preferredYearErrorId = `enquiry-preferred-year-error-${autoId}`;
  const targetPriceErrorId = `enquiry-target-price-error-${autoId}`;
  const consentErrorId = `enquiry-consent-error-${autoId}`;

  const showVehiclePreferences = !vehicleSlug;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form className="cc-enquiry-form" onSubmit={handleSubmit} noValidate aria-label="Enquiry">
      {vehicleSlug && (
        <p className="cc-enquiry-form__context">
          Enquiring about vehicle <strong>{vehicleSlug}</strong>.
        </p>
      )}

      <div className="cnt-form-row-grid">
        <div className="cc-enquiry-form__field cnt-field-wrap">
          <label htmlFor={nameId} className="cc-enquiry-form__label cnt-form-label">
            YOUR FULL NAME / Name
            <span aria-hidden="true" className="cnt-required"> *</span>
          </label>
          <div className="cnt-input-with-icon">
            <span className="cnt-input-icon">👤</span>
            <input
              id={nameId}
              type="text"
              autoComplete="name"
              placeholder="e.g., Charles Sterling"
              className="cc-enquiry-form__input cnt-form-input"
              value={values.name}
              onChange={(e) => onFieldChange('name', e.target.value)}
              aria-required="true"
              aria-invalid={Boolean(fieldErrors.name)}
              aria-describedby={fieldErrors.name ? nameErrorId : undefined}
            />
          </div>
          {fieldErrors.name && (
            <p id={nameErrorId} role="alert" className="cc-enquiry-form__field-error cnt-error-msg">
              {fieldErrors.name}
            </p>
          )}
        </div>

        <div className="cc-enquiry-form__field cnt-field-wrap">
          <label htmlFor={emailId} className="cc-enquiry-form__label cnt-form-label">
            WORK EMAIL ADDRESS / Email
            <span aria-hidden="true" className="cnt-required"> *</span>
          </label>
          <div className="cnt-input-with-icon">
            <span className="cnt-input-icon">✉</span>
            <input
              id={emailId}
              type="email"
              autoComplete="email"
              placeholder="e.g., customer@sterling.com"
              className="cc-enquiry-form__input cnt-form-input"
              value={values.email}
              onChange={(e) => onFieldChange('email', e.target.value)}
              aria-required="true"
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? emailErrorId : undefined}
            />
          </div>
          {fieldErrors.email && (
            <p id={emailErrorId} role="alert" className="cc-enquiry-form__field-error cnt-error-msg">
              {fieldErrors.email}
            </p>
          )}
        </div>
      </div>

      <div className="cc-enquiry-form__field cnt-field-wrap">
        <label htmlFor={phoneId} className="cc-enquiry-form__label cnt-form-label">
          MOBILE PHONE NUMBER / Phone number
          <span aria-hidden="true" className="cnt-required"> *</span>
        </label>
        <div className="cnt-input-with-icon">
          <span className="cnt-input-icon">📞</span>
          <input
            id={phoneId}
            type="tel"
            autoComplete="tel"
            placeholder="e.g., +1 (555) 019-2834"
            className="cc-enquiry-form__input cnt-form-input"
            value={values.phone}
            onChange={(e) => onFieldChange('phone', e.target.value)}
            aria-required="true"
            aria-invalid={Boolean(fieldErrors.phone)}
            aria-describedby={fieldErrors.phone ? phoneErrorId : undefined}
          />
        </div>
        {fieldErrors.phone && (
          <p id={phoneErrorId} role="alert" className="cc-enquiry-form__field-error cnt-error-msg">
            {fieldErrors.phone}
          </p>
        )}
      </div>

      <div className="cc-enquiry-form__field cnt-field-wrap">
        <label htmlFor={messageId} className="cc-enquiry-form__label cnt-form-label">
          DETAILED MESSAGE / SPECIFICATIONS SOUGHT / Message
          <span aria-hidden="true" className="cnt-required"> *</span>
        </label>
        <textarea
          id={messageId}
          className="cc-enquiry-form__textarea cnt-form-textarea"
          rows={4}
          placeholder="Provide details about the vehicles you are searching for, target shipping ports, or standard timing parameters..."
          value={values.message}
          onChange={(e) => onFieldChange('message', e.target.value)}
          aria-required="true"
          aria-invalid={Boolean(fieldErrors.message)}
          aria-describedby={fieldErrors.message ? messageErrorId : undefined}
        />
        {fieldErrors.message && (
          <p id={messageErrorId} role="alert" className="cc-enquiry-form__field-error cnt-error-msg">
            {fieldErrors.message}
          </p>
        )}
      </div>

      <div className="cc-enquiry-form__consent cnt-consent-wrap">
        <label htmlFor={consentId} className="cc-enquiry-form__consent-label cnt-consent-label">
          <input
            id={consentId}
            type="checkbox"
            checked={values.consent}
            onChange={(e) => onFieldChange('consent', e.target.checked)}
            aria-required="true"
            aria-invalid={Boolean(fieldErrors.consent)}
            aria-describedby={fieldErrors.consent ? consentErrorId : undefined}
            className="cnt-checkbox"
          />
          <span>
            I agree to be contacted by CarChief about this enquiry.
            <span aria-hidden="true"> *</span>
          </span>
        </label>
        {fieldErrors.consent && (
          <p id={consentErrorId} role="alert" className="cc-enquiry-form__field-error cnt-error-msg">
            {fieldErrors.consent}
          </p>
        )}
      </div>

      {submitError && (
        <div role="alert" className="cc-enquiry-form__state cc-enquiry-form__state--error cnt-submit-error">
          <strong>We could not send your enquiry.</strong>
          <span>{submitError}</span>
          <button type="button" className="cc-btn cc-btn--secondary cc-btn--sm" onClick={onRetrySubmit}>
            Try again
          </button>
        </div>
      )}

      <div className="cc-enquiry-form__field" style={{ display: 'none' }}>
        <label htmlFor={sourceId} className="cc-enquiry-form__label">
          Preferred contact method
        </label>
        <select
          id={sourceId}
          className="cc-enquiry-form__select"
          value={values.source}
          onChange={(e) => onFieldChange('source', e.target.value)}
        >
          <option value="form">This form / email</option>
          <option value="call">Phone call</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="email">Email</option>
        </select>
      </div>

      {showVehiclePreferences && (
        <fieldset className="cc-enquiry-form__preferences" style={{ display: 'none' }}>
          <legend className="cc-enquiry-form__label">Tell us what you&rsquo;re looking for (optional)</legend>
          <div className="cc-enquiry-form__preferences-grid">
            <div className="cc-enquiry-form__field">
              <label htmlFor={preferredMakeId} className="cc-enquiry-form__label">Make</label>
              <input
                id={preferredMakeId}
                type="text"
                value={values.preferredMake}
                onChange={(e) => onFieldChange('preferredMake', e.target.value)}
              />
            </div>
            <div className="cc-enquiry-form__field">
              <label htmlFor={preferredModelId} className="cc-enquiry-form__label">Model</label>
              <input
                id={preferredModelId}
                type="text"
                value={values.preferredModel}
                onChange={(e) => onFieldChange('preferredModel', e.target.value)}
              />
            </div>
            <div className="cc-enquiry-form__field">
              <label htmlFor={preferredDriveSideId} className="cc-enquiry-form__label">Drive side</label>
              <select
                id={preferredDriveSideId}
                value={values.preferredDriveSide}
                onChange={(e) => onFieldChange('preferredDriveSide', e.target.value)}
              >
                <option value="">No preference</option>
                <option value="left">Left-hand drive</option>
                <option value="right">Right-hand drive</option>
              </select>
            </div>
            <div className="cc-enquiry-form__field">
              <label htmlFor={preferredYearId} className="cc-enquiry-form__label">Preferred year</label>
              <input
                id={preferredYearId}
                type="number"
                value={values.preferredYear}
                onChange={(e) => onFieldChange('preferredYear', e.target.value)}
                aria-invalid={Boolean(fieldErrors.preferredYear)}
                aria-describedby={fieldErrors.preferredYear ? preferredYearErrorId : undefined}
              />
              {fieldErrors.preferredYear && (
                <p id={preferredYearErrorId} role="alert" className="cc-enquiry-form__field-error">
                  {fieldErrors.preferredYear}
                </p>
              )}
            </div>
            <div className="cc-enquiry-form__field">
              <label htmlFor={targetPriceId} className="cc-enquiry-form__label">Target price (USD)</label>
              <input
                id={targetPriceId}
                type="number"
                value={values.targetPriceUsd}
                onChange={(e) => onFieldChange('targetPriceUsd', e.target.value)}
                aria-invalid={Boolean(fieldErrors.targetPriceUsd)}
                aria-describedby={fieldErrors.targetPriceUsd ? targetPriceErrorId : undefined}
              />
              {fieldErrors.targetPriceUsd && (
                <p id={targetPriceErrorId} role="alert" className="cc-enquiry-form__field-error">
                  {fieldErrors.targetPriceUsd}
                </p>
              )}
            </div>
          </div>
        </fieldset>
      )}

      <fieldset className="cc-enquiry-form__destination" style={{ display: catalogLoading || catalogError || (destinations.length > 0 && values.destinationCode) ? 'block' : 'none' }}>
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

      <div className="cnt-form-footer-actions">
        <span className="cnt-pipeline-badge">🛡️ SECURE INTEGRATED PIPELINE</span>
        <button type="submit" className="cc-btn cc-btn--primary cnt-send-btn" disabled={isSubmitting}>
          {isSubmitting ? 'Sending enquiry…' : 'SEND INQUIRY 🚀'}
        </button>
      </div>
    </form>
  );
}
