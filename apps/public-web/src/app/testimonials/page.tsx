import React from 'react';
import type { Metadata } from 'next';
import { loadTestimonials } from '../../features/testimonials/loadTestimonials';
import { TestimonialListPrimitive } from '../../features/testimonials/components/TestimonialListPrimitive';
import { TestimonialSubmissionForm } from '../../features/testimonials/components/TestimonialSubmissionForm';
import '../../features/testimonials/testimonials.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Customer Testimonials & Verified Buyer Reviews | CarChief',
  description:
    'Read verified customer reviews and submit your Japanese vehicle import feedback with CarChief.',
};

export default async function TestimonialsPage() {
  const testimonialsData = await loadTestimonials();
  const items = testimonialsData.items ?? [];
  const averageRating =
    items.length > 0
      ? items.reduce((acc, item) => acc + item.rating, 0) / items.length
      : 5.0;

  return (
    <main className="cc-testimonials-page">
      <div className="cc-testimonials-container">
        <TestimonialListPrimitive
          testimonials={items}
          averageRating={averageRating}
          total={testimonialsData.total ?? items.length}
        />

        <TestimonialSubmissionForm />
      </div>
    </main>
  );
}
