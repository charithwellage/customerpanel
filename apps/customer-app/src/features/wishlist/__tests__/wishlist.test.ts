import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CustomerShellProvider } from '../../shell/index.js';
import { HttpClientProvider } from '../../account/index.js';
import { CustomerWishlistPage } from '../CustomerWishlistPage.js';

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

describe('FRD Section 8: Customer Wishlist UI', () => {
  it('renders the stock wishlist directly without category tabs', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(
          CustomerShellProvider,
          { initialUser: MOCK_USER, initialRoute: '/wishlist' },
          React.createElement(
            HttpClientProvider,
            { apiBaseUrl: 'http://127.0.0.1:4000' },
            React.createElement(CustomerWishlistPage)
          )
        )
      )
    );

    expect(html).toContain('data-testid="customer-wishlist-page"');
    expect(html).not.toContain('data-testid="tab-stock-wishlist"');
    expect(html).not.toContain('data-testid="tab-auction-wishlist"');
    expect(html).not.toContain('Auction');
    expect(html).toContain('Found:');
    expect(html).toContain('Per Page:');
    expect(html).toContain('data-testid="wishlist-card-J240111111"');
    expect(html).not.toContain('WhatsApp Now');
    expect(html).not.toContain('Get Free Quote');
    expect(html).not.toContain('data-testid="btn-whatsapp-J240111111"');
    expect(html).not.toContain('data-testid="btn-quote-J240111111"');
    expect(html).toContain('data-testid="btn-remove-J240111111"');
    expect(html).toContain('people are inquiring');
  });
});
