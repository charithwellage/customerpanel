import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CustomerShellProvider } from '../../shell/index.js';
import { CustomerInventoryPage } from '../CustomerInventoryPage.js';
import { CustomerVehicleDetailPage } from '../CustomerVehicleDetailPage.js';

const MOCK_PLATINUM_USER = {
  id: 'cust-plat-123',
  name: 'VIP Platinum Buyer',
  email: 'vip@example.com',
  role: 'CUSTOMER' as const,
  tier: 'Platinum' as const,
};

const MOCK_STANDARD_USER = {
  id: 'cust-std-456',
  name: 'Standard Buyer',
  email: 'std@example.com',
  role: 'CUSTOMER' as const,
  tier: 'Standard' as const,
};

describe('Customer Inventory & Vehicle Detail Components (D02-P03-T003)', () => {
  describe('CustomerInventoryPage', () => {
    it('renders customer tier status banner for Platinum tier with 15% VIP discount notice', () => {
      const html = renderToStaticMarkup(
        React.createElement(
          CustomerShellProvider,
          { initialUser: MOCK_PLATINUM_USER, initialRoute: '/inventory' },
          React.createElement(CustomerInventoryPage, {})
        )
      );

      expect(html).toContain('Platinum Tier Account');
      expect(html).toContain('15% VIP discount');
      expect(html).toContain('Search by keyword');
      expect(html).toContain('FULL INVENTORY CATALOG');
      expect(html).toContain('CarChief Inventory Search');
    });

    it('renders customer tier status banner for Standard tier with standard stock terms', () => {
      const html = renderToStaticMarkup(
        React.createElement(
          CustomerShellProvider,
          { initialUser: MOCK_STANDARD_USER, initialRoute: '/inventory' },
          React.createElement(CustomerInventoryPage, {})
        )
      );

      expect(html).toContain('Standard Tier Account');
      expect(html).toContain('Standard export inventory pricing');
    });
  });

  describe('CustomerVehicleDetailPage', () => {
    it('renders loading state when initial data is being fetched', () => {
      const html = renderToStaticMarkup(
        React.createElement(
          CustomerShellProvider,
          { initialUser: MOCK_PLATINUM_USER, initialRoute: '/inventory/veh-1' },
          React.createElement(CustomerVehicleDetailPage, { slug: 'veh-1' })
        )
      );

      expect(html).toContain('Loading vehicle details...');
    });
  });

  describe('Quote Request and Wishlist (D02-P13-T005)', () => {
    it('includes quote request and wishlist button elements in the component structure', async () => {
      const { readFile } = await import('node:fs/promises');
      const source = await readFile(new URL('../CustomerVehicleDetailPage.tsx', import.meta.url), 'utf8');

      expect(source).toContain('data-testid="quote-request-btn"');
      expect(source).toContain('data-testid="wishlist-toggle-btn"');
      expect(source).toContain('submitQuoteRequest');
      expect(source).toContain('toggleWishlist');
      expect(source).toContain('Get Free Quote');
      expect(source).toContain('Add to Wishlist');
      expect(source).toContain('Remove from Wishlist');
    });

    it('renders loading state during initial data fetch', () => {
      const html = renderToStaticMarkup(
        React.createElement(
          CustomerShellProvider,
          { initialUser: MOCK_PLATINUM_USER, initialRoute: '/inventory/veh-1' },
          React.createElement(CustomerVehicleDetailPage, { slug: 'veh-1' })
        )
      );

      expect(html).toContain('Loading vehicle details...');
    });
  });
});
