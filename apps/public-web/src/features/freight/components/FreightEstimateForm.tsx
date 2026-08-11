'use client';

import React, { useId } from 'react';
import type { FreightDestination, FreightPort } from '@carchief/domain';
import type { FreightFieldErrors, FreightFormValues } from '../hooks/useFreightEstimate';

export interface FreightEstimateFormProps {
  destinations: FreightDestination[];
  ports: FreightPort[];
  catalogLoading: boolean;
  catalogError: string | null;
  onRetryCatalog: () => void;
  values: FreightFormValues;
  onFieldChange: (field: keyof FreightFormValues, value: string) => void;
  fieldErrors: FreightFieldErrors;
  isSubmitting: boolean;
  onSubmit: () => void;
}

/**
 * Destination/port/dimension selection form for the freight estimate journey
 * (PUB-12). Presentational only — all data comes from `useFreightEstimate`;
 * this component neither fetches nor calculates a total.
 */
export function FreightEstimateForm({
  destinations,
  ports,
  catalogLoading,
  catalogError,
  onRetryCatalog,
  values,
  onFieldChange,
  fieldErrors,
  isSubmitting,
  onSubmit,
}: FreightEstimateFormProps) {
  const autoId = useId();
  const destinationId = `freight-destination-${autoId}`;
  const portId = `freight-port-${autoId}`;
  const lengthId = `freight-length-${autoId}`;
  const widthId = `freight-width-${autoId}`;
  const heightId = `freight-height-${autoId}`;
  const dimensionsErrorId = `freight-dimensions-error-${autoId}`;
  const destinationErrorId = `freight-destination-error-${autoId}`;
  const portErrorId = `freight-port-error-${autoId}`;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  if (catalogLoading) {
    return (
      <div role="status" aria-live="polite" className="cc-freight-form__state">
        Loading destinations and ports&hellip;
      </div>
    );
  }

  if (catalogError) {
    return (
      <div role="alert" className="cc-freight-form__state cc-freight-form__state--error">
        <strong>Unable to load destinations and ports.</strong>
        <span>{catalogError}</span>
        <button type="button" className="cc-btn cc-btn--secondary cc-btn--sm" onClick={onRetryCatalog}>
          Retry
        </button>
      </div>
    );
  }

  if (destinations.length === 0 || ports.length === 0) {
    return (
      <div role="region" aria-label="No destinations available" className="cc-freight-form__state cc-freight-form__state--empty">
        <p>No shipping destinations are configured yet. Please check back later or contact us directly.</p>
      </div>
    );
  }

  return (
    <form className="cc-freight-form" onSubmit={handleSubmit} noValidate aria-label="Shipping estimate request">
      <div className="cc-freight-form__field">
        <label htmlFor={destinationId} className="cc-freight-form__label">
          Destination country
          <span aria-hidden="true"> *</span>
        </label>
        <select
          id={destinationId}
          className="cc-freight-form__select"
          value={values.destinationCode}
          onChange={(e) => onFieldChange('destinationCode', e.target.value)}
          aria-required="true"
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
          <p id={destinationErrorId} role="alert" className="cc-freight-form__field-error">
            {fieldErrors.destinationCode}
          </p>
        )}
      </div>

      <div className="cc-freight-form__field">
        <label htmlFor={portId} className="cc-freight-form__label">
          Arrival port
          <span aria-hidden="true"> *</span>
        </label>
        <select
          id={portId}
          className="cc-freight-form__select"
          value={values.portCode}
          onChange={(e) => onFieldChange('portCode', e.target.value)}
          aria-required="true"
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
          <p id={portErrorId} role="alert" className="cc-freight-form__field-error">
            {fieldErrors.portCode}
          </p>
        )}
      </div>

      <fieldset className="cc-freight-form__dimensions">
        <legend className="cc-freight-form__label">Vehicle dimensions (optional, millimetres)</legend>
        <div className="cc-freight-form__dimensions-grid">
          <div className="cc-freight-form__field">
            <label htmlFor={lengthId} className="cc-freight-form__label cc-freight-form__label--sm">
              Length
            </label>
            <input
              id={lengthId}
              type="number"
              inputMode="numeric"
              min="0"
              className="cc-freight-form__number-input"
              value={values.lengthMm}
              onChange={(e) => onFieldChange('lengthMm', e.target.value)}
              aria-invalid={Boolean(fieldErrors.dimensions)}
              aria-describedby={fieldErrors.dimensions ? dimensionsErrorId : undefined}
            />
          </div>
          <div className="cc-freight-form__field">
            <label htmlFor={widthId} className="cc-freight-form__label cc-freight-form__label--sm">
              Width
            </label>
            <input
              id={widthId}
              type="number"
              inputMode="numeric"
              min="0"
              className="cc-freight-form__number-input"
              value={values.widthMm}
              onChange={(e) => onFieldChange('widthMm', e.target.value)}
              aria-invalid={Boolean(fieldErrors.dimensions)}
              aria-describedby={fieldErrors.dimensions ? dimensionsErrorId : undefined}
            />
          </div>
          <div className="cc-freight-form__field">
            <label htmlFor={heightId} className="cc-freight-form__label cc-freight-form__label--sm">
              Height
            </label>
            <input
              id={heightId}
              type="number"
              inputMode="numeric"
              min="0"
              className="cc-freight-form__number-input"
              value={values.heightMm}
              onChange={(e) => onFieldChange('heightMm', e.target.value)}
              aria-invalid={Boolean(fieldErrors.dimensions)}
              aria-describedby={fieldErrors.dimensions ? dimensionsErrorId : undefined}
            />
          </div>
        </div>
        {fieldErrors.dimensions && (
          <p id={dimensionsErrorId} role="alert" className="cc-freight-form__field-error">
            {fieldErrors.dimensions}
          </p>
        )}
      </fieldset>

      {/* City delivery and insurance are not yet configurable: no approved
          rate model exists for either (DEC-PUB-CITY-DELIVERY,
          DEC-PUB-FREIGHT-MODEL are OPEN — D01-ASM-001). Disclosing this
          honestly here, rather than offering a checkbox that would silently
          do nothing, keeps the form truthful about what it can do
          (RULE-09, RULE-10). */}
      <p className="cc-freight-form__note">
        City delivery and insurance options will appear here once a confirmed shipping rate is available.
      </p>

      <button type="submit" className="cc-btn cc-btn--primary" disabled={isSubmitting}>
        {isSubmitting ? 'Requesting estimate…' : 'Get shipping estimate'}
      </button>
    </form>
  );
}
