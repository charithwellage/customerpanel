import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SearchFilterBar } from '../features/vehicle-search/components/SearchFilterBar.js';
import { SearchResultsHeader } from '../features/vehicle-search/components/SearchResultsHeader.js';
import { SearchEmptyState } from '../features/vehicle-search/components/SearchEmptyState.js';
import { SearchErrorState } from '../features/vehicle-search/components/SearchErrorState.js';
import { SearchPagination } from '../features/vehicle-search/components/SearchPagination.js';
import { VehicleCardPrimitive } from '@carchief/vehicle-search';

describe('Search Components & Presentation Tests (PUB-04, PUB-07, RULE-09)', () => {
  const dummyFacets = {
    makes: [{ name: 'Toyota', count: 5 }, { name: 'Nissan', count: 3 }],
    bodyStyles: [{ name: 'SUV', count: 4 }, { name: 'Sedan', count: 4 }],
    fuelTypes: [{ name: 'Petrol', count: 6 }, { name: 'Hybrid', count: 2 }],
    transmissions: [{ name: 'Automatic', count: 7 }, { name: 'Manual', count: 1 }],
    driveTrains: [{ name: '2WD', count: 5 }, { name: '4WD', count: 3 }],
    models: [{ name: 'Corolla', count: 4 }],
    locationStatuses: [{ name: 'In Japan', count: 4 }],
    destinationPorts: [{ name: 'Mombasa', count: 4 }],
    yearRange: { min: 2018, max: 2023 },
    priceRange: { min: 7500, max: 49000 },
    mileageRange: { min: 1000, max: 90000 },
  };

  it('renders SearchFilterBar with search input and reset button', () => {
    const html = renderToStaticMarkup(
      React.createElement(SearchFilterBar, {
        query: { make: 'Toyota' },
        facets: dummyFacets,
        naturalPhrase: 'Toyota SUV under $20k',
        understoodTokens: [{ token: 'Toyota', field: 'make', label: 'Make: Toyota' }],
        onNaturalPhraseChange: vi.fn(),
        onApplyNaturalSearch: vi.fn(),
        onUpdateQuery: vi.fn(),
        onResetFilters: vi.fn(),
      })
    );

    expect(html).toContain('Toyota SUV under $20k');
    expect(html).toContain('Parsed criteria:');
    expect(html).toContain('✓ Make: Toyota');
    expect(html).toContain('Reset All');
  });

  it('renders transmission and drive train options from API facets', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../../../../packages/vehicle-search/src/SearchFilterBar.tsx'), 'utf8');
    expect(source).toContain('facets?.transmissions.map((item) => item.name)');
    expect(source).toContain('facets?.driveTrains.map((item) => item.name)');
    expect(source).not.toContain("options={['Automatic', 'Manual']}");
    expect(source).not.toContain("options={['2WD', '4WD', 'AWD']}");
  });

  it('renders SearchResultsHeader with result count and active filter chips', () => {
    const html = renderToStaticMarkup(
      React.createElement(SearchResultsHeader, {
        total: 12,
        itemCount: 4,
        query: { make: 'Toyota', bodyStyle: 'SUV' },
        onUpdateQuery: vi.fn(),
      })
    );

    expect(html).toContain('Showing 4 of 12 Vehicles');
    expect(html).toContain('Make: Toyota');
    expect(html).toContain('Body: SUV');
    expect(html).toContain('Sort: Newest Arrival');
  });

  it('renders SearchEmptyState matching phase1-search-empty-state requirement', () => {
    const html = renderToStaticMarkup(
      React.createElement(SearchEmptyState, {
        onResetFilters: vi.fn(),
      })
    );

    expect(html).toContain('No Vehicles Found');
    expect(html).toContain('No vehicles match your search criteria');
    expect(html).toContain('Reset Filters &amp; Show All');
  });

  it('renders SearchErrorState with accessible alert role and retry action', () => {
    const html = renderToStaticMarkup(
      React.createElement(SearchErrorState, {
        error: 'Network connection timeout',
        onRetry: vi.fn(),
      })
    );

    expect(html).toContain('role="alert"');
    expect(html).toContain('Search Temporarily Unavailable');
    expect(html).toContain('Network connection timeout');
    expect(html).toContain('Retry Search');
  });

  it('renders SearchPagination controls for multi-page results', () => {
    const html = renderToStaticMarkup(
      React.createElement(SearchPagination, {
        page: 2,
        totalPages: 3,
        total: 12,
        limit: 4,
        hasNextPage: true,
        hasPrevPage: true,
        onPageChange: vi.fn(),
      })
    );

    expect(html).toContain('Showing items 5–8 of 12');
    expect(html).toContain('← Prev');
    expect(html).toContain('Next →');
  });

  it('keeps the public inventory card link active when no selection callback is supplied', () => {
    const html = renderToStaticMarkup(
      React.createElement(VehicleCardPrimitive, {
        vehicle: {
          id: 'veh-1',
          slug: '2021-toyota-corolla-axio-veh-1',
          make: 'Toyota',
          model: 'Corolla Axio',
          year: 2021,
          status: 'Available',
          priceState: 'priced',
          priceUsd: 12500,
          requestPrice: false,
          images: [],
        },
      }),
    );

    expect(html).toContain('href="/allstock/2021-toyota-corolla-axio-veh-1"');
  });
});
