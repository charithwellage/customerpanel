import React from 'react';
import type { TestimonialItem } from '@carchief/domain';

export interface TestimonialListPrimitiveProps {
  testimonials: TestimonialItem[];
  averageRating?: number;
  total?: number;
  isLoading?: boolean;
}

function renderStars(rating: number) {
  const fullStars = Math.min(5, Math.max(1, Math.round(rating)));
  return (
    <span aria-label={`Rating: ${fullStars} out of 5 stars`} className="cc-stars">
      {'★'.repeat(fullStars)}
      {'☆'.repeat(5 - fullStars)}
    </span>
  );
}

export const TestimonialListPrimitive: React.FC<TestimonialListPrimitiveProps> = ({
  testimonials,
  averageRating = 5.0,
  total = testimonials.length,
  isLoading = false,
}) => {
  return (
    <section className="tstm-section" aria-labelledby="testimonials-heading">
      {/* Dark Hero Banner */}
      <div className="tstm-hero-banner">
        <div className="tstm-hero-inner">
          <div className="tstm-hero-eyebrow">
            <span>🔖 VETTED SOURCING LOGS</span>
          </div>
          <h1 id="testimonials-heading" className="tstm-hero-title">
            TRUSTED BY WORLD CLASS <span className="tstm-hero-title-accent">COLLECTORS &amp; FRANCHISES</span>
          </h1>
          <p className="tstm-hero-subtitle">
            Verified logs and experiences from leading dealers, prestige vehicle buyers, and fleet networks globally.
          </p>
          <div className="tstm-hero-pills">
            <span className="tstm-hero-pill">🌐 14+ Export Countries</span>
            <span className="tstm-hero-pill">⭐ {averageRating.toFixed(1)} Average Sourcing Score (Based on {total} verified reviews)</span>
          </div>
        </div>
      </div>

      <div className="tstm-body-wrap">
        <h2 className="sr-only">Customer Testimonials &amp; Success Stories</h2>
        {isLoading && (
          <div role="status" aria-live="polite" className="tstm-loading">
            <div className="cc-spinner" aria-hidden="true" />
            <span>Loading customer testimonials...</span>
          </div>
        )}

        {!isLoading && testimonials.length === 0 && (
          <div className="tstm-empty" role="region" aria-label="Empty testimonials">
            <h3>No Testimonials Published Yet</h3>
            <p>Be the first customer to share your vehicle purchase and delivery experience with CarChief!</p>
          </div>
        )}

        {!isLoading && testimonials.length > 0 && (
          <div className="tstm-grid">
            {testimonials.map((item) => {
              const initials = item.authorName
                .split(' ')
                .map((part) => part[0])
                .join('')
                .substring(0, 2)
                .toUpperCase();

              return (
                <article key={item.id} className="tstm-card">
                  <header className="tstm-card-header">
                    <div className="tstm-stars" aria-label={`Rating: ${item.rating} out of 5 stars`}>
                      {'★'.repeat(Math.min(5, Math.max(1, Math.round(item.rating))))}
                    </div>
                    <span className="tstm-quote-watermark" aria-hidden="true">❝</span>
                  </header>

                  <blockquote className="tstm-card-quote">
                    &ldquo;{item.content}&rdquo;
                  </blockquote>

                  <footer className="tstm-card-footer">
                    <div className="tstm-author-meta">
                      <div className="tstm-avatar">{initials}</div>
                      <div className="tstm-author-details">
                        <strong className="tstm-author-name">{item.authorName}</strong>
                        <span className="tstm-author-location">{item.authorLocation}</span>
                      </div>
                    </div>

                    {item.vehiclePurchased && (
                      <span className="tstm-vehicle-tag">{item.vehiclePurchased}</span>
                    )}
                  </footer>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
