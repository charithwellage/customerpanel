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
    <section className="cc-testimonials-list" aria-labelledby="testimonials-heading">
      <header className="cc-testimonials-list__header">
        <div>
          <span className="cc-testimonials-list__badge">Verified Buyer Reviews</span>
          <h2 id="testimonials-heading" className="cc-testimonials-list__title">
            Customer Testimonials & Success Stories
          </h2>
          <p className="cc-testimonials-list__subtitle">
            Read real experiences from vehicle importers across East Africa, Southern Africa, the Caribbean, and global ports.
          </p>
        </div>

        <div className="cc-testimonials-list__summary-card">
          <div className="cc-testimonials-list__score">{averageRating.toFixed(1)}</div>
          <div className="cc-testimonials-list__score-meta">
            {renderStars(averageRating)}
            <span className="cc-testimonials-list__count">Based on {total} verified reviews</span>
          </div>
        </div>
      </header>

      {isLoading && (
        <div role="status" aria-live="polite" className="cc-testimonials-list__loading">
          <div className="cc-spinner" aria-hidden="true" />
          <span>Loading customer testimonials...</span>
        </div>
      )}

      {!isLoading && testimonials.length === 0 && (
        <div className="cc-testimonials-list__empty" role="region" aria-label="Empty testimonials">
          <h3>No Testimonials Published Yet</h3>
          <p>Be the first customer to share your vehicle purchase and delivery experience with CarChief!</p>
        </div>
      )}

      {!isLoading && testimonials.length > 0 && (
        <div className="cc-testimonials-list__grid">
          {testimonials.map((item) => {
            const formattedDate = item.submittedAt
              ? new Date(item.submittedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : undefined;

            return (
              <article key={item.id} className="cc-testimonial-card">
                <header className="cc-testimonial-card__header">
                  <div className="cc-testimonial-card__stars">{renderStars(item.rating)}</div>
                  {item.vehiclePurchased && (
                    <span className="cc-testimonial-card__vehicle">{item.vehiclePurchased}</span>
                  )}
                </header>

                <blockquote className="cc-testimonial-card__quote">
                  &ldquo;{item.content}&rdquo;
                </blockquote>

                <footer className="cc-testimonial-card__footer">
                  <div className="cc-testimonial-card__author-info">
                    <strong className="cc-testimonial-card__name">{item.authorName}</strong>
                    <span className="cc-testimonial-card__location">{item.authorLocation}</span>
                  </div>
                  {formattedDate && (
                    <time dateTime={item.submittedAt} className="cc-testimonial-card__date">
                      {formattedDate}
                    </time>
                  )}
                </footer>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
