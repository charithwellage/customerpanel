import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CustomerShellProvider } from '../../shell/index.js';
import { CustomerStatementPage } from '../CustomerStatementPage.js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const MOCK_USER = {
  id: 'usr-123',
  name: 'Charith Wellage',
  email: 'charith@carchief.com',
  company: 'charith wellage',
  tier: 'PREMIUM DEALER',
};

describe('CustomerStatementPage (FRD Section 3)', () => {
  it('renders statement page with date filtration, print/excel actions, totals, and running balance table', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(
          CustomerShellProvider,
          { initialUser: MOCK_USER, initialRoute: '/statement' },
          React.createElement(CustomerStatementPage)
        )
      )
    );

    expect(html).toContain('My Statement');
    expect(html).toContain('Print Statement');
    expect(html).toContain('Download Excel');
    expect(html).toContain('Transaction Date:');
    expect(html).toContain('Total Debits:');
    expect(html).toContain('Total Credits:');
    expect(html).toContain('Total Balance:');
    expect(html).toContain('Opening Balance');
    expect(html).toContain('data-testid="customer-statement-page"');
    expect(html).toContain('data-testid="statement-print-btn"');
    expect(html).toContain('data-testid="statement-excel-btn"');
  });
});
