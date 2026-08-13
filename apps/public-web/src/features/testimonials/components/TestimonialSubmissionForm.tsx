'use client';

import React, { useState } from 'react';
import type { TestimonialSubmissionRequest } from '@carchief/domain';
import { submitTestimonial } from '../loadTestimonials';

export interface TestimonialSubmissionFormProps {
  onSuccess?: () => void;
}

export const TestimonialSubmissionForm: React.FC<TestimonialSubmissionFormProps> = ({
  onSuccess,
}) => {
  const [authorName, setAuthorName] = useState('');
  const [authorLocation, setAuthorLocation] = useState('');
  const [vehiclePurchased, setVehiclePurchased] = useState('');
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [consent, setConsent] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitSuccess(null);
    setErrorMessage(null);
    setValidationError(null);

    // Frontend validation
    if (!authorName.trim()) {
      setValidationError('Please provide your full name.');
      return;
    }
    if (!authorLocation.trim()) {
      setValidationError('Please provide your location (city & country).');
      return;
    }
    if (!content.trim()) {
      setValidationError('Please write your review feedback.');
      return;
    }
    if (!consent) {
      setValidationError('You must consent to allowing CarChief to publish your feedback publicly upon moderation approval.');
      return;
    }

    const payload: TestimonialSubmissionRequest = {
      authorName: authorName.trim(),
      authorLocation: authorLocation.trim(),
      vehiclePurchased: vehiclePurchased.trim() || undefined,
      rating,
      content: content.trim(),
      consent: true,
    };

    try {
      setIsSubmitting(true);
      const res = await submitTestimonial(payload);

      if (res && (res.id || res.status === 'pending')) {
        setSubmitSuccess(
          res.message ||
            'Thank you! Your testimonial has been received and submitted for moderation. It will be reviewed by our team before appearing publicly.'
        );
        // Reset form
        setAuthorName('');
        setAuthorLocation('');
        setVehiclePurchased('');
        setRating(5);
        setContent('');
        setConsent(false);
        onSuccess?.();
      } else {
        setErrorMessage(res?.message || 'Failed to submit testimonial. Please try again.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected network error occurred.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="tstm-form-container" aria-labelledby="form-heading">
      <div className="tstm-form-card">
        <header className="tstm-form-header">
          <div className="tstm-form-eyebrow">
            <span>💬 PUBLISH YOUR EXPERIENCE</span>
          </div>
          <h2 id="form-heading" className="tstm-form-title">
            Share Your Import Experience
          </h2>
          <p className="tstm-form-desc">
            Have you recently imported a high-end vehicle through CarChief? Share your logistics speed, pricing clarity, and quality metrics with global dealer networks.
          </p>
        </header>

        {submitSuccess && (
          <div role="status" aria-live="polite" className="tstm-alert tstm-alert--success">
            <strong>Submission Received!</strong>
            <p>{submitSuccess}</p>
          </div>
        )}

        {errorMessage && (
          <div role="alert" className="tstm-alert tstm-alert--error">
            <strong>Submission Error:</strong>
            <p>{errorMessage}</p>
          </div>
        )}

        {validationError && (
          <div role="alert" className="tstm-alert tstm-alert--warning">
            <p>{validationError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="tstm-form" noValidate>
          <div className="tstm-form-grid">
            <div className="tstm-form-group">
              <label htmlFor="authorName" className="tstm-form-label">
                YOUR FULL NAME <span className="tstm-required">*</span>
              </label>
              <input
                id="authorName"
                type="text"
                required
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="e.g., Jonathan Mercer"
                className="tstm-form-input"
              />
            </div>

            <div className="tstm-form-group">
              <label htmlFor="authorLocation" className="tstm-form-label">
                LOCATION (CITY, COUNTRY) <span className="tstm-required">*</span>
              </label>
              <input
                id="authorLocation"
                type="text"
                required
                value={authorLocation}
                onChange={(e) => setAuthorLocation(e.target.value)}
                placeholder="e.g., Zurich, Switzerland"
                className="tstm-form-input"
              />
            </div>
          </div>

          <div className="tstm-form-grid">
            <div className="tstm-form-group">
              <label htmlFor="vehiclePurchased" className="tstm-form-label">
                VEHICLE MODEL SOURCED
              </label>
              <input
                id="vehiclePurchased"
                type="text"
                value={vehiclePurchased}
                onChange={(e) => setVehiclePurchased(e.target.value)}
                placeholder="e.g., 2021 Ferrari Roma"
                className="tstm-form-input"
              />
            </div>

            <div className="tstm-form-group">
              <label htmlFor="rating" className="tstm-form-label">
                OPERATIONAL RATING <span className="tstm-required">*</span>
              </label>
              <select
                id="rating"
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="tstm-form-select"
              >
                <option value={5}>⭐⭐⭐⭐⭐ (5/5 Perfect Sourcing)</option>
                <option value={4}>⭐⭐⭐⭐☆ (4/5 Great Experience)</option>
                <option value={3}>⭐⭐⭐☆☆ (3/5 Satisfactory)</option>
                <option value={2}>⭐⭐☆☆☆ (2/5 Fair)</option>
                <option value={1}>⭐☆☆☆☆ (1/5 Poor)</option>
              </select>
            </div>
          </div>

          <div className="tstm-form-group">
            <label htmlFor="content" className="tstm-form-label">
              REVIEW COMMENTS <span className="tstm-required">*</span>
            </label>
            <textarea
              id="content"
              rows={4}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Detail your ocean logistics speed, documentation clarity, vehicle inspection alignment, and transport team responsiveness..."
              className="tstm-form-textarea"
            />
          </div>

          <div className="tstm-form-group tstm-form-group--checkbox">
            <label htmlFor="consent" className="tstm-checkbox-label">
              <input
                id="consent"
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="tstm-checkbox"
              />
              <span>
                I agree to allow CarChief to publish my name, location, vehicle model, and feedback publicly upon moderation approval. <span className="tstm-required">*</span>
              </span>
            </label>
          </div>

          <div className="tstm-form-footer">
            <span className="tstm-verified-badge">🛡️ VERIFIED SOURCING NETWORK</span>
            <button
              type="submit"
              disabled={isSubmitting}
              className="tstm-submit-btn"
            >
              {isSubmitting ? 'Submitting Testimonial...' : 'Submit Testimonial for Moderation'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};
