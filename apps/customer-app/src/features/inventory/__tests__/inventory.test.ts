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
      expect(html).toContain('Search make, model, or try');
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
});
