import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { CustomerInquirySummary } from '@carchief/domain';
import { CustomerShellProvider } from '../../shell/index.js';
import { HttpClientProvider } from '../../account/index.js';
import { CustomerInquiriesPage } from '../CustomerInquiriesPage.js';
import { InquiryMessageModal } from '../components/InquiryMessageModal.js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const MOCK_USER = {
  id: 'cust-123',
  name: 'Charith Wellage',
  email: 'charith.wellage@carchief.com',
  role: 'CUSTOMER' as const,
};

describe('Customer Inquiries Feature', () => {
  describe('CustomerInquirySummary domain models', () => {
    it('should support singular inquirer count', () => {
      const mockInquiry: CustomerInquirySummary = {
        vehicleSlug: '2020-toyota-camry-123',
        vehicleId: '123',
        vehicleTitle: '2020 Toyota Camry',
        requestedAt: '2026-08-17T10:00:00Z',
        inquirerCount: 1,
      };

      expect(mockInquiry.inquirerCount).toBe(1);
    });

    it('should support plural inquirer count', () => {
      const mockInquiry: CustomerInquirySummary = {
        vehicleSlug: '2020-toyota-camry-123',
        vehicleId: '123',
        vehicleTitle: '2020 Toyota Camry',
        requestedAt: '2026-08-17T10:00:00Z',
        inquirerCount: 5,
      };

      expect(mockInquiry.inquirerCount).toBe(5);
      expect(mockInquiry.inquirerCount > 1).toBe(true);
    });
  });

  describe('FRD Section 6 Inquiries UI & Polymorphic Cards', () => {
    it('renders CustomerInquiriesPage with source filters, count bar and polymorphic cards', () => {
      const html = renderToStaticMarkup(
        React.createElement(
          QueryClientProvider,
          { client: queryClient },
          React.createElement(
            CustomerShellProvider,
            { initialUser: MOCK_USER, initialRoute: '/inquiries' },
            React.createElement(
              HttpClientProvider,
              { apiBaseUrl: 'http://127.0.0.1:4000' },
              React.createElement(CustomerInquiriesPage)
            )
          )
        )
      );

      expect(html).toContain('data-testid="customer-inquiries-page"');
      expect(html).toContain('data-testid="source-stock-checkbox"');
      expect(html).toContain('data-testid="source-auction-checkbox"');
      expect(html).toContain('data-testid="source-general-checkbox"');
      expect(html).toContain('Total Records Found:');
      expect(html).toContain('data-testid="inq-card-IN-0003"');
      expect(html).toContain('data-testid="inq-card-IN-0002"');
      expect(html).toContain('data-testid="inq-card-IN-0001"');
    });

    it('renders InquiryMessageModal with message bubbles and staff response', () => {
      const html = renderToStaticMarkup(
        React.createElement(InquiryMessageModal, {
          isOpen: true,
          onClose: () => {},
          inquiryNumber: 'IN-0002',
          source: 'Auction',
          date: '26th Sep, 2024 13:45:00',
          message: 'Inspection grade request for Raize Z',
          replyMessage: 'Grade 5.0 A condition verified at Yokohama.',
          repliedAt: '26th Sep, 2024 15:30:00',
        })
      );

      expect(html).toContain('data-testid="inquiry-message-modal"');
      expect(html).toContain('Inquiry Message (IN-0002)');
      expect(html).toContain('Inspection grade request for Raize Z');
      expect(html).toContain('CarChief Logistics Desk');
      expect(html).toContain('Grade 5.0 A condition verified at Yokohama.');
    });
  });
});
