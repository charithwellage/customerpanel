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
    <section className="cc-testimonial-form-wrap" aria-labelledby="form-heading">
      <div className="cc-testimonial-form-card">
        <header className="cc-testimonial-form-header">
          <h2 id="form-heading" className="cc-testimonial-form-title">
            Share Your Import Experience
          </h2>
          <p className="cc-testimonial-form-desc">
            Purchased a vehicle with CarChief? Submit your review below. All submissions are moderated before publication.
          </p>
        </header>

        {submitSuccess && (
          <div role="status" aria-live="polite" className="cc-testimonial-alert cc-testimonial-alert--success">
            <strong>Submission Received!</strong>
            <p>{submitSuccess}</p>
          </div>
        )}

        {errorMessage && (
          <div role="alert" className="cc-testimonial-alert cc-testimonial-alert--error">
            <strong>Submission Error:</strong>
            <p>{errorMessage}</p>
          </div>
        )}

        {validationError && (
          <div role="alert" className="cc-testimonial-alert cc-testimonial-alert--warning">
            <p>{validationError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="cc-testimonial-form" noValidate>
          <div className="cc-form-grid">
            <div className="cc-form-group">
              <label htmlFor="authorName" className="cc-form-label">
                Your Name <span className="cc-required">*</span>
              </label>
              <input
                id="authorName"
                type="text"
                required
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="e.g. Tendai Mutasa"
                className="cc-form-input"
              />
            </div>

            <div className="cc-form-group">
              <label htmlFor="authorLocation" className="cc-form-label">
                Location (City & Country) <span className="cc-required">*</span>
              </label>
              <input
                id="authorLocation"
                type="text"
                required
                value={authorLocation}
                onChange={(e) => setAuthorLocation(e.target.value)}
                placeholder="e.g. Harare, Zimbabwe"
                className="cc-form-input"
              />
            </div>
          </div>

          <div className="cc-form-grid">
            <div className="cc-form-group">
              <label htmlFor="vehiclePurchased" className="cc-form-label">
                Purchased Vehicle (Optional)
              </label>
              <input
                id="vehiclePurchased"
                type="text"
                value={vehiclePurchased}
                onChange={(e) => setVehiclePurchased(e.target.value)}
                placeholder="e.g. 2021 Toyota Corolla Axio"
                className="cc-form-input"
              />
            </div>

            <div className="cc-form-group">
              <label htmlFor="rating" className="cc-form-label">
                Overall Rating <span className="cc-required">*</span>
              </label>
              <select
                id="rating"
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="cc-form-select"
              >
                <option value={5}>★★★★★ (5 - Excellent)</option>
                <option value={4}>★★★★☆ (4 - Good)</option>
                <option value={3}>★★★☆☆ (3 - Satisfactory)</option>
                <option value={2}>★★☆☆☆ (2 - Fair)</option>
                <option value={1}>★☆☆☆☆ (1 - Poor)</option>
              </select>
            </div>
          </div>

          <div className="cc-form-group">
            <label htmlFor="content" className="cc-form-label">
              Your Review & Feedback <span className="cc-required">*</span>
            </label>
            <textarea
              id="content"
              rows={4}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Describe your vehicle condition, shipping experience, and customer service received..."
              className="cc-form-textarea"
            />
          </div>

          <div className="cc-form-group cc-form-group--checkbox">
            <label htmlFor="consent" className="cc-form-checkbox-label">
              <input
                id="consent"
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="cc-form-checkbox"
              />
              <span>
                I agree to allow CarChief to publish my name, location, vehicle model, and feedback publicly upon moderation approval. <span className="cc-required">*</span>
              </span>
            </label>
          </div>

          <div className="cc-form-actions">
            <button
              type="submit"
              disabled={isSubmitting}
              className="cc-btn cc-btn--primary"
            >
              {isSubmitting ? 'Submitting Testimonial...' : 'Submit Testimonial for Moderation'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};
