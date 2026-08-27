import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CustomerShellProvider } from '../../shell/index.js';
import { CustomerInventoryPage } from '../CustomerInventoryPage.js';
import { CustomerVehicleDetailPage } from '../CustomerVehicleDetailPage.js';
import { CustomerInquiryModal } from '../CustomerInquiryModal.js';

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

function renderWithProviders(element: React.ReactElement, initialUser: any, initialRoute: string) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return renderToStaticMarkup(
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(
        CustomerShellProvider,
        { initialUser, initialRoute },
        element
      )
    )
  );
}

describe('Customer Inventory & Vehicle Detail Components (D02-P03-T003)', () => {
  describe('CustomerInventoryPage', () => {
    it('renders the portal inventory header and customer tier status for Platinum accounts', () => {
      const html = renderWithProviders(
        React.createElement(CustomerInventoryPage, {}),
        MOCK_PLATINUM_USER,
        '/inventory'
      );

      expect(html).toContain('Platinum Tier Account');
      expect(html).toContain('customer-tier-summary');
      expect(html).toContain('More information about Platinum tier pricing');
      expect(html).toContain('Vehicle Inventory');
      expect(html).toContain('CUSTOMER PORTAL / INVENTORY');
      expect(html).toContain('Search by keyword');
      expect(html).not.toContain('cc-allstock-hero');
      expect(html).not.toContain('FULL INVENTORY CATALOG');
      expect(html).toContain('sort-by-select');
      expect(html).toContain('Reset All');
      expect(html).toContain('customer-inventory-ai-search');
      expect(html).toContain('Search with AI');
    });

    it('renders customer tier status banner for Standard tier with standard stock terms', () => {
      const html = renderWithProviders(
        React.createElement(CustomerInventoryPage, {}),
        MOCK_STANDARD_USER,
        '/inventory'
      );

      expect(html).toContain('Standard Tier Account');
      expect(html).toContain('More information about Standard tier pricing');
    });

    it('loads tier description data through the existing public configuration API', async () => {
      const { readFile } = await import('node:fs/promises');
      const source = await readFile(new URL('../CustomerInventoryPage.tsx', import.meta.url), 'utf8');
      const hook = await readFile(new URL('../useCustomerTierBenefits.ts', import.meta.url), 'utf8');

      expect(source).toContain('tierBenefits');
      expect(source).toContain('customer-tier-description');
      expect(source).toContain('useCustomerTierBenefits');
      expect(hook).toContain('CustomerTierBenefitsService');
    });

    it('does not render the country compliance banner on the inventory page', () => {
      const html = renderWithProviders(
        React.createElement(CustomerInventoryPage, {}),
        MOCK_PLATINUM_USER,
        '/inventory'
      );

      expect(html).not.toContain('Import Compliance: Kenya');
      expect(html).not.toContain('compliance-localization-banner');
    });

    it('keeps the vehicle selection route and portal search controls wired', async () => {
      const { readFile } = await import('node:fs/promises');
      const source = await readFile(new URL('../CustomerInventoryPage.tsx', import.meta.url), 'utf8');

      expect(source).toContain('onSelectVehicle={onSelectVehicle}');
      expect(source).toContain('getVehicleHref={(v) => `/inventory/${v.slug || v.id}`}');
      expect(source).toContain('SearchFilterBar');
      expect(source).toContain('SearchPagination');
      expect(source).toContain('SearchResultsHeader');
      expect(source).not.toContain('onForceSync');
      expect(source).not.toContain('FORCE SYNC');
    });

    it('scopes portal styling to the customer inventory page', async () => {
      const { readFile } = await import('node:fs/promises');
      const styles = await readFile(new URL('../inventory.css', import.meta.url), 'utf8');

      expect(styles).toContain('.cc-cust-inventory-page .cc-search-filter-panel');
      expect(styles).toContain('.cc-cust-inventory-page .cc-vehicle-card');
      expect(styles).toContain('.cc-cust-inventory-page .cc-cust-inventory-header__title');
      expect(styles).toContain('.cc-cust-inventory-page .cc-filter-input::placeholder');
      expect(styles).toContain('font-family: var(--font-body);');
      expect(styles).toContain('font-family: var(--font-display);');
      expect(styles).toContain('font-family: var(--font-mono);');
      expect(styles).toContain('font-size: var(--font-size-2xl);');
      expect(styles).not.toContain('.cc-allstock-hero {');
    });
  });

  describe('CustomerVehicleDetailPage', () => {
    it('renders loading state when initial data is being fetched', () => {
      const html = renderWithProviders(
        React.createElement(CustomerVehicleDetailPage, { slug: 'veh-1' }),
        MOCK_PLATINUM_USER,
        '/inventory/veh-1'
      );

      expect(html).toContain('Loading vehicle details...');
    });
  });

  describe('Vehicle Inquiry, Wishlist and Compliance (D02-P13-T005 & D02-P14-T005)', () => {
    it('includes inquiry, wishlist, and compliance card elements in the component structure', async () => {
      const { readFile } = await import('node:fs/promises');
      const source = await readFile(new URL('../CustomerVehicleDetailPage.tsx', import.meta.url), 'utf8');

      expect(source).toContain('data-testid="submit-inquiry-btn"');
      expect(source).toContain('data-testid="wishlist-toggle-btn"');
      expect(source).toContain('data-testid="vehicle-compliance-card"');
      expect(source).toContain('CustomerInquiryModal');
      expect(source).toContain('requestPriceInquiry');
      expect(source).toContain('useCustomerTierBenefits');
      expect(source).toContain('reservation-capacity');
      expect(source).toContain('toggleWishlist');
    expect(source).toContain('Submit an Inquiry');
    expect(source).toContain('allocated-vehicle-notice');
    expect(source).toContain('inquiryEligibility');
      expect(source).not.toContain('Get Free Quote');
      expect(source).toContain('Add to Wishlist');
      expect(source).toContain('Remove from Wishlist');
      expect(source).toContain('Import Compliant for');
    });

    it('renders the accessible inquiry modal with server-owned contact fields', () => {
      const html = renderToStaticMarkup(
        React.createElement(CustomerInquiryModal, {
          isOpen: true,
          vehicleTitle: '2021 Toyota Corolla',
          customerName: 'Demo Buyer',
          customerEmail: 'demo@example.com',
          submitting: false,
          error: null,
          onClose: () => undefined,
          onSubmit: () => undefined,
        }),
      );

      expect(html).toContain('role="dialog"');
      expect(html).toContain('aria-modal="true"');
      expect(html).toContain('Submit an Inquiry');
      expect(html).toContain('Demo Buyer');
      expect(html).toContain('demo@example.com');
      expect(html).toContain('disabled=""');
      expect(html).toContain('<textarea');
      expect(html).toContain('Submit Inquiry');
    });

    it('renders loading state during initial data fetch', () => {
      const html = renderWithProviders(
        React.createElement(CustomerVehicleDetailPage, { slug: 'veh-1' }),
        MOCK_PLATINUM_USER,
        '/inventory/veh-1'
      );

      expect(html).toContain('Loading vehicle details...');
    });
  });
});
