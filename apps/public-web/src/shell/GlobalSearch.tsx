'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { serializeSearchQuery, parseUrlSearchQuery } from '@carchief/vehicle-search';
import type { SearchVehiclesQuery } from '@carchief/domain';

export interface GlobalSearchProps {
  isMobile?: boolean;
  onSearchComplete?: () => void;
}

const POPULAR_MAKES = [
  'Toyota',
  'Nissan',
  'Honda',
  'Mazda',
  'Subaru',
  'Mitsubishi',
  'Lexus',
  'Land Rover',
  'Mercedes-Benz',
  'BMW',
  'Suzuki',
  'Isuzu',
  'Volkswagen',
  'Audi',
  'Porsche',
];

const YEAR_OPTIONS = Array.from({ length: 27 }, (_, i) => 2026 - i);
const PRICE_OPTIONS = [
  { label: '$1,000', value: 1000 },
  { label: '$3,000', value: 3000 },
  { label: '$5,000', value: 5000 },
  { label: '$8,000', value: 8000 },
  { label: '$10,000', value: 10000 },
  { label: '$15,000', value: 15000 },
  { label: '$20,000', value: 20000 },
  { label: '$30,000', value: 30000 },
  { label: '$50,000', value: 50000 },
  { label: '$75,000', value: 75000 },
  { label: '$100,000', value: 100000 },
];
const MILEAGE_OPTIONS = [
  { label: 'Under 10,000 km', value: 10000 },
  { label: 'Under 30,000 km', value: 30000 },
  { label: 'Under 50,000 km', value: 50000 },
  { label: 'Under 80,000 km', value: 80000 },
  { label: 'Under 100,000 km', value: 100000 },
  { label: 'Under 150,000 km', value: 150000 },
  { label: 'Under 200,000 km', value: 200000 },
];
const DISCOUNT_OPTIONS = [
  { label: 'Any Deals', value: 0 },
  { label: '5% or more', value: 5 },
  { label: '10% or more', value: 10 },
  { label: '15% or more', value: 15 },
  { label: '20% or more', value: 20 },
];

function GlobalSearchInner({ isMobile = false, onSearchComplete }: GlobalSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [selectedMake, setSelectedMake] = useState('');
  const [model, setModel] = useState('');
  const [yearMin, setYearMin] = useState<number | undefined>();
  const [yearMax, setYearMax] = useState<number | undefined>();
  const [priceMin, setPriceMin] = useState<number | undefined>();
  const [priceMax, setPriceMax] = useState<number | undefined>();
  const [mileageMax, setMileageMax] = useState<number | undefined>();
  const [discountMin, setDiscountMin] = useState<number | undefined>();
  const [isClearance, setIsClearance] = useState(false);
  const [isDiscounted, setIsDiscounted] = useState(false);

  // Sync initial state from active URL query parameters
  useEffect(() => {
    if (searchParams) {
      const parsed = parseUrlSearchQuery(searchParams);
      if (parsed.searchQuery) setKeyword(parsed.searchQuery);
      if (parsed.make) setSelectedMake(parsed.make);
      if (parsed.model) setModel(parsed.model);
      if (parsed.yearMin) setYearMin(parsed.yearMin);
      if (parsed.yearMax) setYearMax(parsed.yearMax);
      if (parsed.priceMin) setPriceMin(parsed.priceMin);
      if (parsed.priceMax) setPriceMax(parsed.priceMax);
      if (parsed.mileageMax) setMileageMax(parsed.mileageMax);
      if (parsed.discountMin) setDiscountMin(parsed.discountMin);
      if (parsed.category === 'clearance') setIsClearance(true);
      if (parsed.discountMin && parsed.discountMin > 0) setIsDiscounted(true);
    }
  }, [searchParams]);

  // Handle outside click to dismiss advanced filter dropdown
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const executeSearch = (overrideQuery?: Partial<SearchVehiclesQuery>) => {
    const query: SearchVehiclesQuery = {
      searchQuery: keyword.trim() || undefined,
      make: selectedMake || undefined,
      model: model.trim() || undefined,
      yearMin: yearMin ? Number(yearMin) : undefined,
      yearMax: yearMax ? Number(yearMax) : undefined,
      priceMin: priceMin ? Number(priceMin) : undefined,
      priceMax: priceMax ? Number(priceMax) : undefined,
      mileageMax: mileageMax ? Number(mileageMax) : undefined,
      discountMin: isDiscounted ? (discountMin || 5) : (discountMin ? Number(discountMin) : undefined),
      category: isClearance ? 'clearance' : undefined,
      ...overrideQuery,
    };

    const params = serializeSearchQuery(query);
    const targetUrl = `/allstock?${params.toString()}`;
    router.push(targetUrl);
    setIsOpen(false);
    onSearchComplete?.();
  };

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch();
  };

  const handleReset = () => {
    setKeyword('');
    setSelectedMake('');
    setModel('');
    setYearMin(undefined);
    setYearMax(undefined);
    setPriceMin(undefined);
    setPriceMax(undefined);
    setMileageMax(undefined);
    setDiscountMin(undefined);
    setIsClearance(false);
    setIsDiscounted(false);
  };

  return (
    <div className={`cc-global-search ${isMobile ? 'cc-global-search--mobile' : ''}`} ref={dropdownRef}>
      {/* Primary E-Commerce Search Bar */}
      <form className="cc-search-bar-shell" onSubmit={handleQuickSubmit} role="search" aria-label="Global Vehicle Search">
        {/* Category / Filter Toggle Button */}
        <button
          type="button"
          className={`cc-search-filter-trigger ${isOpen ? 'cc-search-filter-trigger--active' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-label="Toggle advanced vehicle filters"
        >
          <span className="cc-filter-trigger-label">
            {selectedMake ? selectedMake : 'All Filters'}
          </span>
          <svg className={`cc-filter-trigger-icon ${isOpen ? 'cc-filter-trigger-icon--open' : ''}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {/* Search Input Box */}
        <div className="cc-search-input-wrap">
          <input
            type="text"
            className="cc-search-input"
            placeholder="Search by Make, Model, Chassis or Keyword..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onFocus={() => {
              // Optionally keep focus clean
            }}
            aria-label="Search used cars inventory"
          />
          {keyword && (
            <button
              type="button"
              className="cc-search-clear-btn"
              onClick={() => setKeyword('')}
              aria-label="Clear search input"
            >
              ✕
            </button>
          )}
        </div>

        {/* Red Action Search Button (Amazon/Noon E-commerce style) */}
        <button type="submit" className="cc-search-submit-btn" aria-label="Submit search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span className="cc-search-submit-text">Search</span>
        </button>
      </form>

      {/* Advanced Filter Mega Dropdown Panel (Faithful to Enterprise Red "Search for Cars" Panel) */}
      {isOpen && (
        <div className="cc-advanced-search-panel" role="region" aria-label="Advanced Search Filter Options">
          <div className="cc-filter-panel-header">
            <div className="cc-filter-panel-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span>Search for Cars</span>
            </div>
            <button type="button" className="cc-filter-panel-close" onClick={() => setIsOpen(false)} aria-label="Close search filters">
              ✕
            </button>
          </div>

          <div className="cc-filter-grid">
            {/* Make Filter */}
            <div className="cc-filter-field">
              <label className="cc-filter-label" htmlFor="filter-make">Make</label>
              <select
                id="filter-make"
                className="cc-filter-select"
                value={selectedMake}
                onChange={(e) => setSelectedMake(e.target.value)}
              >
                <option value="">All Makes</option>
                {POPULAR_MAKES.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Model Filter */}
            <div className="cc-filter-field">
              <label className="cc-filter-label" htmlFor="filter-model">Model</label>
              <input
                id="filter-model"
                type="text"
                className="cc-filter-input"
                placeholder="e.g. Corolla, Prado..."
                value={model}
                onChange={(e) => setModel(e.target.value)}
              />
            </div>

            {/* Year Range Filter */}
            <div className="cc-filter-field cc-filter-field--range">
              <label className="cc-filter-label">Year Range</label>
              <div className="cc-range-inputs">
                <select
                  className="cc-filter-select"
                  value={yearMin || ''}
                  onChange={(e) => setYearMin(e.target.value ? Number(e.target.value) : undefined)}
                  aria-label="Minimum Year"
                >
                  <option value="">From</option>
                  {YEAR_OPTIONS.map((y) => (
                    <option key={`ymin-${y}`} value={y}>{y}</option>
                  ))}
                </select>
                <span className="cc-range-separator">to</span>
                <select
                  className="cc-filter-select"
                  value={yearMax || ''}
                  onChange={(e) => setYearMax(e.target.value ? Number(e.target.value) : undefined)}
                  aria-label="Maximum Year"
                >
                  <option value="">To</option>
                  {YEAR_OPTIONS.map((y) => (
                    <option key={`ymax-${y}`} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Price Range Filter */}
            <div className="cc-filter-field cc-filter-field--range">
              <label className="cc-filter-label">Price Range (USD)</label>
              <div className="cc-range-inputs">
                <select
                  className="cc-filter-select"
                  value={priceMin || ''}
                  onChange={(e) => setPriceMin(e.target.value ? Number(e.target.value) : undefined)}
                  aria-label="Minimum Price"
                >
                  <option value="">From</option>
                  {PRICE_OPTIONS.map((p) => (
                    <option key={`pmin-${p.value}`} value={p.value}>{p.label}</option>
                  ))}
                </select>
                <span className="cc-range-separator">to</span>
                <select
                  className="cc-filter-select"
                  value={priceMax || ''}
                  onChange={(e) => setPriceMax(e.target.value ? Number(e.target.value) : undefined)}
                  aria-label="Maximum Price"
                >
                  <option value="">To</option>
                  {PRICE_OPTIONS.map((p) => (
                    <option key={`pmax-${p.value}`} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Mileage Filter */}
            <div className="cc-filter-field">
              <label className="cc-filter-label" htmlFor="filter-mileage">Max Mileage</label>
              <select
                id="filter-mileage"
                className="cc-filter-select"
                value={mileageMax || ''}
                onChange={(e) => setMileageMax(e.target.value ? Number(e.target.value) : undefined)}
              >
                <option value="">Any Mileage</option>
                {MILEAGE_OPTIONS.map((m) => (
                  <option key={`mil-${m.value}`} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            {/* Discount / Deals Filter */}
            <div className="cc-filter-field">
              <label className="cc-filter-label" htmlFor="filter-discount">Min Discount</label>
              <select
                id="filter-discount"
                className="cc-filter-select"
                value={discountMin || ''}
                onChange={(e) => setDiscountMin(e.target.value ? Number(e.target.value) : undefined)}
              >
                {DISCOUNT_OPTIONS.map((d) => (
                  <option key={`disc-${d.value}`} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Deals Checkboxes & Action Buttons */}
          <div className="cc-filter-footer">
            <div className="cc-deals-group">
              <span className="cc-deals-title">Deals:</span>
              <label className="cc-deal-checkbox-label">
                <input
                  type="checkbox"
                  checked={isClearance}
                  onChange={(e) => setIsClearance(e.target.checked)}
                  className="cc-deal-checkbox"
                />
                <span className="cc-deal-tag cc-deal-tag--clearance">CLEARANCE</span>
              </label>

              <label className="cc-deal-checkbox-label">
                <input
                  type="checkbox"
                  checked={isDiscounted}
                  onChange={(e) => setIsDiscounted(e.target.checked)}
                  className="cc-deal-checkbox"
                />
                <span className="cc-deal-tag cc-deal-tag--discounted">DISCOUNTED</span>
              </label>
            </div>

            <div className="cc-filter-actions">
              <button type="button" className="cc-btn-reset" onClick={handleReset}>
                Reset
              </button>
              <button type="button" className="cc-btn-apply" onClick={() => executeSearch()}>
                SEARCH
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const GlobalSearch: React.FC<GlobalSearchProps> = (props) => {
  return (
    <Suspense fallback={
      <div className={`cc-global-search ${props.isMobile ? 'cc-global-search--mobile' : ''}`}>
        <div className="cc-search-bar-shell">
          <div className="cc-search-filter-trigger">
            <span className="cc-filter-trigger-label">All Filters</span>
          </div>
          <div className="cc-search-input-wrap">
            <input type="text" className="cc-search-input" placeholder="Search by Make, Model, Chassis or Keyword..." readOnly />
          </div>
          <div className="cc-search-submit-btn">
            <span className="cc-search-submit-text">Search</span>
          </div>
        </div>
      </div>
    }>
      <GlobalSearchInner {...props} />
    </Suspense>
  );
};
