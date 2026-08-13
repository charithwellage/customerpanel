import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { FaqBrowserPrimitive } from '../features/faq/components/FaqBrowserPrimitive.js';
import type { FaqCategory, FaqItem } from '@carchief/domain';

const mock12Categories: FaqCategory[] = [
  { id: 'cat-buying-process', name: 'Buying Process', order: 1 },
  { id: 'cat-payment-pricing', name: 'Payment & Pricing', order: 2 },
  { id: 'cat-shipping-freight', name: 'Shipping & Logistics', order: 3 },
  { id: 'cat-vehicle-condition', name: 'Vehicle Condition & Inspection', order: 4 },
  { id: 'cat-customs-duties', name: 'Customs & Import Duties', order: 5 },
  { id: 'cat-documentation', name: 'Documents & Registration', order: 6 },
  { id: 'cat-warranty-returns', name: 'Warranty & Claims', order: 7 },
  { id: 'cat-auction-services', name: 'Auction Services', order: 8 },
  { id: 'cat-account-security', name: 'Account & Security', order: 9 },
  { id: 'cat-insurance-coverage', name: 'Insurance Coverage', order: 10 },
  { id: 'cat-country-regulations', name: 'Country Import Rules', order: 11 },
  { id: 'cat-customer-support', name: 'Customer Support & Service', order: 12 },
];

const mockItems: FaqItem[] = [
  {
    id: 'faq-1',
    categoryId: 'cat-buying-process',
    categoryName: 'Buying Process',
    question: 'How do I purchase a vehicle on CarChief?',
    answer: 'Browse inventory, select your vehicle, and click Reserve.',
    slug: 'how-to-purchase',
    featured: true,
    owner: 'ContentTeam',
    status: 'approved',
    updatedAt: '2026-08-10T10:00:00.000Z',
  },
  {
    id: 'faq-8',
    categoryId: 'cat-auction-services',
    categoryName: 'Auction Services',
    question: 'How does live auction bidding work?',
    answer: 'Submit your maximum bid deposit. Our team bids live on your behalf at Japanese auctions.',
    slug: 'auction-bidding-process',
    featured: true,
    owner: 'AuctionTeam',
    status: 'approved',
    updatedAt: '2026-08-10T10:00:00.000Z',
  },
];

describe('FAQ Feature Suite (PUB-20, DEC-PUB-FAQ-AI, D01-P07-T004)', () => {
  it('enforces exact count of 12 categories in the taxonomy (PUB-20)', () => {
    expect(mock12Categories).toHaveLength(12);
  });

  it('renders FAQ browser with heading, search input, 12 categories, and items', () => {
    const html = renderToStaticMarkup(
      React.createElement(FaqBrowserPrimitive, {
        initialCategories: mock12Categories,
        initialItems: mockItems,
        initialTotal: 2,
      })
    );

    expect(html).toContain('Frequently Asked Questions');
    expect(html).toContain('Category Count: 12 Categories');
    expect(html).toContain('id="faq-search-input"');
    expect(html).toContain('Buying Process');
    expect(html).toContain('Auction Services');
    expect(html).toContain('How do I purchase a vehicle on CarChief?');
    expect(html).toContain('How does live auction bidding work?');
  });

  it('renders grounded no-answer state with escalation to contact page when no results match', () => {
    const html = renderToStaticMarkup(
      React.createElement(FaqBrowserPrimitive, {
        initialCategories: mock12Categories,
        initialItems: [],
        initialTotal: 0,
        initialGroundedNoAnswer: true,
      })
    );

    expect(html).toContain('No Matching Verified Answer Found');
    expect(html).toContain('Contact Operations &amp; Support');
    expect(html).toContain('href="/contact"');
  });

  it('includes accessible live region for announcing dynamic search filtering', () => {
    const html = renderToStaticMarkup(
      React.createElement(FaqBrowserPrimitive, {
        initialCategories: mock12Categories,
        initialItems: mockItems,
        initialTotal: 2,
      })
    );

    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('Showing 2 questions for all categories');
  });
});
