import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { TestimonialListPrimitive } from '../features/testimonials/components/TestimonialListPrimitive.js';
import { TestimonialSubmissionForm } from '../features/testimonials/components/TestimonialSubmissionForm.js';
import type { TestimonialItem } from '@carchief/domain';

const mockTestimonials: TestimonialItem[] = [
  {
    id: 'testim-1',
    authorName: 'John K.',
    authorLocation: 'Harare, Zimbabwe',
    vehiclePurchased: '2021 Toyota Corolla Axio',
    rating: 5,
    content: 'Seamless import process! Arrived at Durban port on schedule.',
    submittedAt: '2026-08-01T12:00:00.000Z',
    status: 'approved',
    consent: true,
  },
  {
    id: 'testim-2',
    authorName: 'Amina M.',
    authorLocation: 'Mombasa, Kenya',
    vehiclePurchased: '2020 Mazda CX-5',
    rating: 5,
    content: 'Highly professional service and accurate inspection sheets.',
    submittedAt: '2026-08-03T14:30:00.000Z',
    status: 'approved',
    consent: true,
  },
];

describe('Testimonials Feature Suite (PUB-19, RULE-08, RULE-10, D01-P07-T003)', () => {
  describe('TestimonialListPrimitive', () => {
    it('renders approved testimonials, star rating score, and verified buyer badges', () => {
      const html = renderToStaticMarkup(
        React.createElement(TestimonialListPrimitive, {
          testimonials: mockTestimonials,
          averageRating: 5.0,
          total: 2,
        })
      );

      expect(html).toContain('Customer Testimonials &amp; Success Stories');
      expect(html).toContain('5.0');
      expect(html).toContain('Based on 2 verified reviews');
      expect(html).toContain('John K.');
      expect(html).toContain('Harare, Zimbabwe');
      expect(html).toContain('2021 Toyota Corolla Axio');
      expect(html).toContain('Seamless import process!');
      expect(html).toContain('Amina M.');
      expect(html).toContain('Mombasa, Kenya');
    });

    it('renders honest empty state when no approved testimonials exist', () => {
      const html = renderToStaticMarkup(
        React.createElement(TestimonialListPrimitive, {
          testimonials: [],
          averageRating: 5.0,
          total: 0,
        })
      );

      expect(html).toContain('No Testimonials Published Yet');
      expect(html).toContain('Be the first customer to share your vehicle purchase');
    });

    it('renders loading state with polite ARIA live region', () => {
      const html = renderToStaticMarkup(
        React.createElement(TestimonialListPrimitive, {
          testimonials: [],
          isLoading: true,
        })
      );

      expect(html).toContain('role="status"');
      expect(html).toContain('Loading customer testimonials...');
    });
  });

  describe('TestimonialSubmissionForm', () => {
    it('renders submission form with all required inputs and consent checkbox', () => {
      const html = renderToStaticMarkup(
        React.createElement(TestimonialSubmissionForm)
      );

      expect(html).toContain('Share Your Import Experience');
      expect(html).toContain('id="authorName"');
      expect(html).toContain('id="authorLocation"');
      expect(html).toContain('id="vehiclePurchased"');
      expect(html).toContain('id="rating"');
      expect(html).toContain('id="content"');
      expect(html).toContain('id="consent"');
      expect(html).toContain('Submit Testimonial for Moderation');
    });
  });
});
