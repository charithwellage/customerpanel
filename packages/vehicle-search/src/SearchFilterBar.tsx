'use client';

import React, { useState } from 'react';
import type { SearchVehiclesQuery, VehicleFacets } from '@carchief/domain';
import type { UnderstoodToken } from './parser.js';

export interface SearchFilterBarProps {
  query: SearchVehiclesQuery;
  facets?: VehicleFacets;
  naturalPhrase: string;
  understoodTokens: UnderstoodToken[];
  onNaturalPhraseChange: (phrase: string) => void;
  onApplyNaturalSearch: () => void;
  onUpdateQuery: (updates: Partial<SearchVehiclesQuery>) => void;
  onResetFilters: () => void;
  layout?: 'top' | 'sidebar';
  aiValue?: string;
  onAiChange?: (value: string) => void;
  onAiSubmit?: () => void;
  onAiClear?: () => void;
  isAiLoading?: boolean;
  isAiActive?: boolean;
  aiId?: string;
  perPageSizes?: number[];
}

const DEFAULT_MAKES = [
  'Toyota', 'Honda', 'Nissan', 'Mazda', 'Mitsubishi', 'Subaru',
  'Suzuki', 'Isuzu', 'Lexus', 'BMW', 'Mercedes-Benz', 'Audi',
  'Porsche', 'Land Rover', 'Volvo', 'Volkswagen'
];

const DEFAULT_TYPES = [
  'SUV', 'Sedan', 'Hatchback', 'Coupe', 'Minivan', 'Van',
  'Truck', 'Wagon', 'Convertible', 'Bus', 'Machinery'
];

const DEFAULT_COLORS = [
  'White', 'Black', 'Silver', 'Pearl', 'Blue', 'Red',
  'Gray', 'Green', 'Brown', 'Gold', 'Yellow', 'Orange'
];

const DEFAULT_LOCATIONS = [
  'Kobe', 'Yokohama', 'Tokyo', 'Nagoya', 'Osaka', 'Fukuoka', 'Kawasaki', 'Hakata'
];

const TAG_OPTIONS = [
  { key: 'hot_deals', label: 'HOT DEALS' },
  { key: 'commercial', label: 'COMMERCIAL STOCK' },
  { key: 'special_discount', label: 'Special DISCOUNT' },
  { key: 'nearly_new', label: 'NEARLY NEW' },
  { key: 'prime_seller', label: 'prime seller' },
  { key: 'deluxe_cars', label: 'DELUXE CARS' },
  { key: '3rd_party', label: '3RD PARTY seller' },
  { key: 'bf_stock', label: 'BF STOCK' },
  { key: 'gcc_cars', label: 'GCC CARS' },
  { key: 'todays_offer', label: "TODAY'S OFFER !!" },
  { key: 'bf_exclusive', label: 'BF Exclusive' },
  { key: 'time_sale', label: 'TIME SALE' },
  { key: 'bf_uk_stocks', label: 'BF UK STOCKS' },
  { key: 'salvage', label: 'SALVAGE' },
];

const ACCESSORIES_OPTIONS = [
  { key: 'cd_player', label: 'CD Player' },
  { key: 'sun_roof', label: 'Sun Roof' },
  { key: 'leather_seat', label: 'Leather Seat' },
  { key: 'alloy_wheels', label: 'Alloy Wheels' },
  { key: 'power_steering', label: 'Power Steering' },
  { key: 'power_window', label: 'Power Window' },
  { key: 'ac', label: 'A/C' },
  { key: 'abs', label: 'ABS' },
  { key: 'airbag', label: 'Airbag' },
  { key: 'radio', label: 'Radio' },
  { key: 'cd_changer', label: 'CD Changer' },
  { key: 'dvd', label: 'DVD' },
  { key: 'tv', label: 'TV' },
  { key: 'back_tire', label: 'Back Tire' },
  { key: 'grill_guard', label: 'Grill Guard' },
  { key: 'rear_spoiler', label: 'Rear Spoiler' },
  { key: 'central_locking', label: 'Central Locking' },
  { key: 'wheel_spanner', label: 'Wheel Spanner' },
  { key: 'fog_lights', label: 'Fog Lights' },
  { key: 'back_camera', label: 'Back Camera' },
  { key: 'push_start', label: 'Push Start' },
  { key: 'keyless_entry', label: 'Keyless Entry' },
  { key: 'esc', label: 'ESC' },
  { key: 'camera_360', label: '360 Degree Camera' },
  { key: 'body_kit', label: 'Body Kit' },
  { key: 'side_airbag', label: 'Side Airbag' },
  { key: 'power_mirror', label: 'Power Mirror' },
  { key: 'side_skirts', label: 'Side Skirts' },
  { key: 'front_lip_spoiler', label: 'Front Lip Spoiler' },
  { key: 'navigation', label: 'Navigation' },
  { key: 'turbo', label: 'Turbo' },
  { key: 'non_smoker', label: 'Non Smoker' },
  { key: 'one_owner', label: 'One Owner' },
  { key: 'power_slide_door', label: 'Power Slide Door' },
];

export function SearchFilterBar({
  query,
  facets,
  naturalPhrase,
  understoodTokens,
  onNaturalPhraseChange,
  onApplyNaturalSearch,
  onUpdateQuery,
  onResetFilters,
  layout = 'top',
  aiValue,
  onAiChange,
  onAiSubmit,
  onAiClear,
  isAiLoading = false,
  isAiActive = false,
  aiId = 'customer-inventory-ai-search',
  perPageSizes,
}: SearchFilterBarProps) {
  const [isMinimized, setIsMinimized] = useState(true);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showAccessories, setShowAccessories] = useState(false);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      onApplyNaturalSearch();
    }
  };

  const selectedTags = new Set(query.tags || []);
  const selectedFeatures = new Set(query.features || []);

  const years = Array.from({ length: 37 }, (_, i) => 2026 - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const prices = [1000, 2000, 3000, 5000, 8000, 10000, 15000, 20000, 25000, 30000, 40000, 50000, 75000, 100000, 150000, 200000];
  const engineCcList = [600, 800, 1000, 1200, 1500, 1800, 2000, 2500, 3000, 3500, 4000, 5000, 6000];
  const mileages = [5000, 10000, 20000, 30000, 50000, 75000, 100000, 150000, 200000];
  const seats = [2, 4, 5, 7, 8, 9, 10];
  const capacities = [250, 500, 750, 1000, 1500, 2000, 3000, 5000];

  const activeMoreOptionsCount = [
    query.driveTrain, query.seatsMin, query.seatsMax, query.loadCapacityMin,
    query.loadCapacityMax, query.vehicleSubType, query.stockCountry,
    query.stockLocation, (query.tags?.length || 0) > 0 ? 1 : 0
  ].filter(Boolean).length;

  const activeAccessoriesCount = query.features?.length || 0;

  const chips: Array<{ key: keyof SearchVehiclesQuery; label: string }> = [];
  if (query.make) chips.push({ key: 'make', label: `Make: ${query.make}` });
  if (query.bodyStyle) chips.push({ key: 'bodyStyle', label: `Body: ${query.bodyStyle}` });
  if (query.fuelType) chips.push({ key: 'fuelType', label: `Fuel: ${query.fuelType}` });
  if (query.transmission) chips.push({ key: 'transmission', label: `Transmission: ${query.transmission}` });
  if (query.driveTrain) chips.push({ key: 'driveTrain', label: `Drive: ${query.driveTrain}` });
  if (query.locationStatus) chips.push({ key: 'locationStatus', label: `Location: ${query.locationStatus}` });
  if (query.model) chips.push({ key: 'model', label: `Model: ${query.model}` });
  if (query.modelCode) chips.push({ key: 'modelCode', label: `Model Code: ${query.modelCode}` });
  if (query.vehicleSubType) chips.push({ key: 'vehicleSubType', label: `Sub Type: ${query.vehicleSubType}` });
  if (query.overdrive) chips.push({ key: 'overdrive', label: `O Drive: ${query.overdrive}` });
  if (query.color) chips.push({ key: 'color', label: `Color: ${query.color}` });
  if (query.exteriorGrade) chips.push({ key: 'exteriorGrade', label: `Ext. Grade: ${query.exteriorGrade}` });
  if (query.destinationPort) chips.push({ key: 'destinationPort', label: `Port: ${query.destinationPort}` });
  if (query.yearMin !== undefined) chips.push({ key: 'yearMin', label: `Year from: ${query.yearMin}` });
  if (query.yearMax !== undefined) chips.push({ key: 'yearMax', label: `Year to: ${query.yearMax}` });
  if (query.priceMin !== undefined) chips.push({ key: 'priceMin', label: `Price from: $${query.priceMin.toLocaleString()}` });
  if (query.priceMax !== undefined) chips.push({ key: 'priceMax', label: `Price to: $${query.priceMax.toLocaleString()}` });
  if (query.mileageMin !== undefined) chips.push({ key: 'mileageMin', label: `Mileage from: ${query.mileageMin.toLocaleString()}` });
  if (query.mileageMax !== undefined) chips.push({ key: 'mileageMax', label: `Mileage to: ${query.mileageMax.toLocaleString()}` });
  if (query.engineCcMin !== undefined) chips.push({ key: 'engineCcMin', label: `Engine from: ${query.engineCcMin.toLocaleString()} cc` });
  if (query.engineCcMax !== undefined) chips.push({ key: 'engineCcMax', label: `Engine to: ${query.engineCcMax.toLocaleString()} cc` });
  if (query.steering) chips.push({ key: 'steering', label: `Steering: ${query.steering}` });
  if (query.stockCountry) chips.push({ key: 'stockCountry', label: `Stock country: ${query.stockCountry}` });
  if (query.stockLocation) chips.push({ key: 'stockLocation', label: `Stock location: ${query.stockLocation}` });
  if (query.seatsMin !== undefined) chips.push({ key: 'seatsMin', label: `Seats from: ${query.seatsMin}` });
  if (query.seatsMax !== undefined) chips.push({ key: 'seatsMax', label: `Seats to: ${query.seatsMax}` });
  if (query.loadCapacityMin !== undefined) chips.push({ key: 'loadCapacityMin', label: `Load from: ${query.loadCapacityMin}` });
  if (query.loadCapacityMax !== undefined) chips.push({ key: 'loadCapacityMax', label: `Load to: ${query.loadCapacityMax}` });
  if (query.features?.length) {
    const labels = query.features.map((key) => facets?.features.find((feature) => feature.key === key)?.label || key);
    chips.push({ key: 'features', label: `Equipment: ${labels.join(', ')}` });
  }

  return (
    <section className={`cc-adv-search-panel${layout === 'sidebar' ? ' cc-adv-search-panel--sidebar' : ''}`} aria-label="Advanced vehicle search and filters">
      {/* Single Light-Colored Top Control Row: Keyword Search + AI Search + Advanced Filters Toggle */}
      <div className="cc-adv-top-bar cc-adv-top-bar--light">
        {/* 1. Keyword Search Input (First) */}
        <div className="cc-adv-search-box">
          <span className="cc-adv-search-icon">🔍</span>
          <input
            id="adv-search-keyword"
            type="search"
            className="cc-adv-search-input"
            placeholder="Search by Keyword, Make, Model, Stock #..."
            value={naturalPhrase}
            onChange={(e) => onNaturalPhraseChange(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {naturalPhrase && (
            <button
              type="button"
              className="cc-adv-search-clear-btn"
              onClick={() => onNaturalPhraseChange('')}
              aria-label="Clear keyword search"
            >
              ✕
            </button>
          )}
        </div>

        {/* 2. AI Search Input (Second) */}
        {(onAiChange || onAiSubmit) && (
          <div className="cc-adv-ai-box">
            <span className="cc-adv-ai-icon">✨</span>
            <input
              id={aiId}
              type="search"
              className="cc-adv-ai-input"
              placeholder="Ask AI, e.g. Hybrid SUV under $20k"
              value={aiValue || ''}
              disabled={isAiLoading}
              onChange={(e) => onAiChange?.(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && onAiSubmit) {
                  e.preventDefault();
                  if (!aiValue?.trim() && onAiChange) {
                    onAiChange('Hybrid SUV under $20,000');
                  }
                  onAiSubmit();
                }
              }}
            />
            {aiValue && onAiClear && (
              <button
                type="button"
                className="cc-adv-search-clear-btn"
                onClick={onAiClear}
                aria-label="Clear AI search"
              >
                ✕
              </button>
            )}
            <button
              type="button"
              className="cc-adv-ai-submit-btn"
              disabled={isAiLoading}
              onClick={() => {
                if (!aiValue?.trim() && onAiChange) {
                  onAiChange('Hybrid SUV under $20,000');
                }
                onAiSubmit?.();
              }}
            >
              {isAiLoading ? 'Searching…' : 'Search with AI'}
            </button>
          </div>
        )}

        {/* 3. Action Group: Sorting + Advanced Filters Toggle & Reset */}
        <div className="cc-adv-top-actions">
          {/* Sorting Dropdown */}
          <div className="cc-adv-sort-box">
            <label htmlFor="sort-by-select" className="sr-only">Sort vehicles by</label>
            <select
              id="sort-by-select"
              className="cc-adv-sort-select"
              value={query.sortBy || 'newest'}
              onChange={(event) => onUpdateQuery({ sortBy: event.target.value as SearchVehiclesQuery['sortBy'] })}
              aria-label="Sort vehicles by"
            >
              <option value="newest">Sort: Newest Arrival</option>
              <option value="price_asc">Sort: Price (Low to High)</option>
              <option value="price_desc">Sort: Price (High to Low)</option>
              <option value="year_desc">Sort: Year (Newest First)</option>
              <option value="year_asc">Sort: Year (Oldest First)</option>
              <option value="mileage_asc">Sort: Mileage (Lowest First)</option>
            </select>
          </div>


          <button
            type="button"
            className={`cc-adv-search-toggle-btn ${!isMinimized ? 'cc-adv-search-toggle-btn--active' : ''}`}
            onClick={() => setIsMinimized((prev) => !prev)}
            aria-expanded={!isMinimized}
            aria-label="Advanced filters"
            title={isMinimized ? 'Click to open Advanced Filters' : 'Click to hide Advanced Filters'}
          >
            <svg className="cc-adv-search-toggle-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            <span className="cc-adv-toggle-text">ADVANCED FILTERS</span>
            {activeMoreOptionsCount > 0 && (
              <span className="cc-adv-filter-badge">{activeMoreOptionsCount}</span>
            )}
            <span className="cc-adv-toggle-chevron">{isMinimized ? '▼' : '▲'}</span>
          </button>

          <button type="button" className="cc-adv-search-reset-btn" onClick={onResetFilters} aria-label="Reset filters">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
            Reset
          </button>
        </div>
      </div>

      {/* Active Filter Chips */}
      {chips.length > 0 && (
        <div className="cc-active-chips cc-adv-active-chips" aria-label="Active filter chips">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              className="cc-chip-remove"
              onClick={() => onUpdateQuery({ [chip.key]: undefined })}
            >
              {chip.label} ✕
            </button>
          ))}
        </div>
      )}

      {/* Understood Natural Language Search Chips */}
      {understoodTokens.length > 0 && (
        <div className="cc-understood-tokens" role="region" aria-label="Understood search tokens">
          <span className="cc-understood-token-label">Parsed criteria:</span>
          {understoodTokens.map((token, index) => (
            <span key={`${token.field}-${index}`} className="cc-understood-token-chip">✓ {token.label}</span>
          ))}
        </div>
      )}

      {!isMinimized && (
        <div className="cc-adv-search-body">
          {/* Primary Filter Grid (2 per row compact space utilization) */}
          <div className="cc-adv-form-stack">

            {/* Make */}
            <div className="cc-adv-field">
              <label htmlFor="adv-select-make" className="cc-adv-label">Make</label>
              <select
                id="adv-select-make"
                className="cc-adv-select"
                value={query.make || ''}
                onChange={(e) => onUpdateQuery({ make: e.target.value || undefined, model: undefined })}
              >
                <option value="">All Makes</option>
                {(facets?.makes.map((m) => m.name) || DEFAULT_MAKES).map((make) => (
                  <option key={make} value={make}>{make}</option>
                ))}
              </select>
            </div>

            {/* Model */}
            <div className="cc-adv-field">
              <label htmlFor="adv-select-model" className="cc-adv-label">Model</label>
              <select
                id="adv-select-model"
                className="cc-adv-select"
                value={query.model || ''}
                onChange={(e) => onUpdateQuery({ model: e.target.value || undefined })}
              >
                <option value="">All Models</option>
                {facets?.models.map((m) => m.name).map((model) => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>

            {/* Model Code */}
            <div className="cc-adv-field">
              <label htmlFor="adv-select-model-code" className="cc-adv-label">Model Code</label>
              <select
                id="adv-select-model-code"
                className="cc-adv-select"
                value={query.modelCode || ''}
                onChange={(e) => onUpdateQuery({ modelCode: e.target.value || undefined })}
              >
                <option value="">All</option>
                {facets?.modelCodes.map((m) => m.name).map((mc) => (
                  <option key={mc} value={mc}>{mc}</option>
                ))}
              </select>
            </div>

            {/* Type (Body Style) */}
            <div className="cc-adv-field">
              <label htmlFor="adv-select-type" className="cc-adv-label">Type</label>
              <select
                id="adv-select-type"
                className="cc-adv-select"
                value={query.bodyStyle || ''}
                onChange={(e) => onUpdateQuery({ bodyStyle: e.target.value || undefined })}
              >
                <option value="">All</option>
                {(facets?.vehicleTypes.map((t) => t.name) || DEFAULT_TYPES).map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Year Range */}
            <div className="cc-adv-field">
              <label className="cc-adv-label">Year</label>
              <div className="cc-adv-dual-select">
                <select
                  className="cc-adv-select"
                  aria-label="Minimum Year"
                  value={query.yearMin || ''}
                  onChange={(e) => onUpdateQuery({ yearMin: e.target.value ? Number(e.target.value) : undefined })}
                >
                  <option value="">Min</option>
                  {years.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
                <span className="cc-adv-dual-dash">-</span>
                <select
                  className="cc-adv-select"
                  aria-label="Maximum Year"
                  value={query.yearMax || ''}
                  onChange={(e) => onUpdateQuery({ yearMax: e.target.value ? Number(e.target.value) : undefined })}
                >
                  <option value="">Max</option>
                  {years.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

            {/* Month Range */}
            <div className="cc-adv-field">
              <label className="cc-adv-label">Month</label>
              <div className="cc-adv-dual-select">
                <select
                  className="cc-adv-select"
                  aria-label="Minimum Month"
                  value={query.monthMin || ''}
                  onChange={(e) => onUpdateQuery({ monthMin: e.target.value ? Number(e.target.value) : undefined })}
                >
                  <option value="">Min</option>
                  {months.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                <span className="cc-adv-dual-dash">-</span>
                <select
                  className="cc-adv-select"
                  aria-label="Maximum Month"
                  value={query.monthMax || ''}
                  onChange={(e) => onUpdateQuery({ monthMax: e.target.value ? Number(e.target.value) : undefined })}
                >
                  <option value="">Max</option>
                  {months.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            {/* Price USD */}
            <div className="cc-adv-field">
              <label className="cc-adv-label">Price USD</label>
              <div className="cc-adv-dual-select">
                <select
                  className="cc-adv-select"
                  aria-label="Minimum Price USD"
                  value={query.priceMin || ''}
                  onChange={(e) => onUpdateQuery({ priceMin: e.target.value ? Number(e.target.value) : undefined })}
                >
                  <option value="">Min</option>
                  {prices.map((p) => <option key={p} value={p}>${p.toLocaleString()}</option>)}
                </select>
                <span className="cc-adv-dual-dash">-</span>
                <select
                  className="cc-adv-select"
                  aria-label="Maximum Price USD"
                  value={query.priceMax || ''}
                  onChange={(e) => onUpdateQuery({ priceMax: e.target.value ? Number(e.target.value) : undefined })}
                >
                  <option value="">Max</option>
                  {prices.map((p) => <option key={p} value={p}>${p.toLocaleString()}</option>)}
                </select>
              </div>
            </div>

            {/* Steering */}
            <div className="cc-adv-field">
              <label htmlFor="adv-select-steering" className="cc-adv-label">Steering</label>
              <select
                id="adv-select-steering"
                className="cc-adv-select"
                value={query.steering || ''}
                onChange={(e) => onUpdateQuery({ steering: e.target.value || undefined })}
              >
                <option value="">All</option>
                <option value="Right">Right</option>
                <option value="Left">Left</option>
              </select>
            </div>

            {/* Fuel */}
            <div className="cc-adv-field">
              <label htmlFor="adv-select-fuel" className="cc-adv-label">Fuel</label>
              <select
                id="adv-select-fuel"
                className="cc-adv-select"
                value={query.fuelType || ''}
                onChange={(e) => onUpdateQuery({ fuelType: e.target.value || undefined })}
              >
                <option value="">All</option>
                <option value="Petrol">Petrol</option>
                <option value="Diesel">Diesel</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Electric">Electric</option>
                <option value="LPG">LPG</option>
              </select>
            </div>

            {/* Mission (Transmission Buttons) */}
            <div className="cc-adv-field">
              <label className="cc-adv-label">Mission</label>
              <div className="cc-adv-segment-buttons">
                <button
                  type="button"
                  className={`cc-adv-segment-btn ${!query.transmission ? 'cc-adv-segment-btn--active' : ''}`}
                  onClick={() => onUpdateQuery({ transmission: undefined })}
                >
                  Any
                </button>
                <button
                  type="button"
                  className={`cc-adv-segment-btn ${query.transmission === 'Automatic' || query.transmission === 'AT' ? 'cc-adv-segment-btn--active' : ''}`}
                  onClick={() => onUpdateQuery({ transmission: 'Automatic' })}
                >
                  AT
                </button>
                <button
                  type="button"
                  className={`cc-adv-segment-btn ${query.transmission === 'Manual' || query.transmission === 'MT' ? 'cc-adv-segment-btn--active' : ''}`}
                  onClick={() => onUpdateQuery({ transmission: 'Manual' })}
                >
                  MT
                </button>
              </div>
            </div>

            {/* Engine cc */}
            <div className="cc-adv-field">
              <label className="cc-adv-label">Engine cc</label>
              <div className="cc-adv-dual-select">
                <select
                  className="cc-adv-select"
                  aria-label="Minimum Engine CC"
                  value={query.engineCcMin || ''}
                  onChange={(e) => onUpdateQuery({ engineCcMin: e.target.value ? Number(e.target.value) : undefined })}
                >
                  <option value="">Min</option>
                  {engineCcList.map((cc) => <option key={cc} value={cc}>{cc} cc</option>)}
                </select>
                <span className="cc-adv-dual-dash">-</span>
                <select
                  className="cc-adv-select"
                  aria-label="Maximum Engine CC"
                  value={query.engineCcMax || ''}
                  onChange={(e) => onUpdateQuery({ engineCcMax: e.target.value ? Number(e.target.value) : undefined })}
                >
                  <option value="">Max</option>
                  {engineCcList.map((cc) => <option key={cc} value={cc}>{cc} cc</option>)}
                </select>
              </div>
            </div>

            {/* Mileage km */}
            <div className="cc-adv-field">
              <label className="cc-adv-label">Mileage km</label>
              <div className="cc-adv-dual-select">
                <select
                  className="cc-adv-select"
                  aria-label="Minimum Mileage KM"
                  value={query.mileageMin || ''}
                  onChange={(e) => onUpdateQuery({ mileageMin: e.target.value ? Number(e.target.value) : undefined })}
                >
                  <option value="">Min</option>
                  {mileages.map((m) => <option key={m} value={m}>{m.toLocaleString()} km</option>)}
                </select>
                <span className="cc-adv-dual-dash">-</span>
                <select
                  className="cc-adv-select"
                  aria-label="Maximum Mileage KM"
                  value={query.mileageMax || ''}
                  onChange={(e) => onUpdateQuery({ mileageMax: e.target.value ? Number(e.target.value) : undefined })}
                >
                  <option value="">Max</option>
                  {mileages.map((m) => <option key={m} value={m}>{m.toLocaleString()} km</option>)}
                </select>
              </div>
            </div>

            {/* Color */}
            <div className="cc-adv-field">
              <label htmlFor="adv-select-color" className="cc-adv-label">Color</label>
              <select
                id="adv-select-color"
                className="cc-adv-select"
                value={query.color || ''}
                onChange={(e) => onUpdateQuery({ color: e.target.value || undefined })}
              >
                <option value="">All</option>
                {(facets?.colors.map((c) => c.name) || DEFAULT_COLORS).map((color) => (
                  <option key={color} value={color}>{color}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 1 Toggle Bar: MORE OPTIONS */}
          <button
            type="button"
            className="cc-adv-toggle-bar"
            onClick={() => setShowMoreOptions((prev) => !prev)}
            aria-expanded={showMoreOptions}
          >
            <span>{showMoreOptions ? `HIDE MORE OPTIONS (${activeMoreOptionsCount})` : `SHOW MORE OPTIONS (${activeMoreOptionsCount})`}</span>
            <span className="cc-adv-toggle-arrow">{showMoreOptions ? '▲' : '▼'}</span>
          </button>

          {showMoreOptions && (
            <div className="cc-adv-collapsible-content">
              {/* Drivetrain Segment Buttons */}
              <div className="cc-adv-field">
                <label className="cc-adv-label">Drivetrain</label>
                <div className="cc-adv-segment-buttons">
                  <button
                    type="button"
                    className={`cc-adv-segment-btn ${!query.driveTrain ? 'cc-adv-segment-btn--active' : ''}`}
                    onClick={() => onUpdateQuery({ driveTrain: undefined })}
                  >
                    Any
                  </button>
                  <button
                    type="button"
                    className={`cc-adv-segment-btn ${query.driveTrain === '2WD' ? 'cc-adv-segment-btn--active' : ''}`}
                    onClick={() => onUpdateQuery({ driveTrain: '2WD' })}
                  >
                    2WD
                  </button>
                  <button
                    type="button"
                    className={`cc-adv-segment-btn ${query.driveTrain === '4WD' || query.driveTrain === 'AWD' ? 'cc-adv-segment-btn--active' : ''}`}
                    onClick={() => onUpdateQuery({ driveTrain: '4WD' })}
                  >
                    4WD
                  </button>
                </div>
              </div>

              {/* Number of Seats */}
              <div className="cc-adv-field">
                <label className="cc-adv-label">Number of Seats</label>
                <div className="cc-adv-dual-select">
                  <select
                    className="cc-adv-select"
                    aria-label="Minimum Seats"
                    value={query.seatsMin || ''}
                    onChange={(e) => onUpdateQuery({ seatsMin: e.target.value ? Number(e.target.value) : undefined })}
                  >
                    <option value="">Min</option>
                    {seats.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <span className="cc-adv-dual-dash">-</span>
                  <select
                    className="cc-adv-select"
                    aria-label="Maximum Seats"
                    value={query.seatsMax || ''}
                    onChange={(e) => onUpdateQuery({ seatsMax: e.target.value ? Number(e.target.value) : undefined })}
                  >
                    <option value="">Max</option>
                    {seats.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Load Cap kg */}
              <div className="cc-adv-field">
                <label className="cc-adv-label">Load Cap kg</label>
                <div className="cc-adv-dual-select">
                  <select
                    className="cc-adv-select"
                    aria-label="Minimum Load Capacity"
                    value={query.loadCapacityMin || ''}
                    onChange={(e) => onUpdateQuery({ loadCapacityMin: e.target.value ? Number(e.target.value) : undefined })}
                  >
                    <option value="">Min</option>
                    {capacities.map((c) => <option key={c} value={c}>{c} kg</option>)}
                  </select>
                  <span className="cc-adv-dual-dash">-</span>
                  <select
                    className="cc-adv-select"
                    aria-label="Maximum Load Capacity"
                    value={query.loadCapacityMax || ''}
                    onChange={(e) => onUpdateQuery({ loadCapacityMax: e.target.value ? Number(e.target.value) : undefined })}
                  >
                    <option value="">Max</option>
                    {capacities.map((c) => <option key={c} value={c}>{c} kg</option>)}
                  </select>
                </div>
              </div>

              {/* Sub Body Type */}
              <div className="cc-adv-field">
                <label htmlFor="adv-select-sub-type" className="cc-adv-label">Sub Body Type</label>
                <select
                  id="adv-select-sub-type"
                  className="cc-adv-select"
                  value={query.vehicleSubType || ''}
                  onChange={(e) => onUpdateQuery({ vehicleSubType: e.target.value || undefined })}
                >
                  <option value="">All</option>
                  {facets?.vehicleSubTypes.map((st) => st.name).map((subType) => (
                    <option key={subType} value={subType}>{subType}</option>
                  ))}
                </select>
              </div>

              {/* Stock Country */}
              <div className="cc-adv-field">
                <label htmlFor="adv-select-country" className="cc-adv-label">Stock Country</label>
                <select
                  id="adv-select-country"
                  className="cc-adv-select"
                  value={query.stockCountry || ''}
                  onChange={(e) => onUpdateQuery({ stockCountry: e.target.value || undefined })}
                >
                  <option value="">All</option>
                  <option value="Japan">Japan 🇯🇵</option>
                  <option value="UK">United Kingdom 🇬🇧</option>
                </select>
              </div>

              {/* Stock Location */}
              <div className="cc-adv-field">
                <label htmlFor="adv-select-location" className="cc-adv-label">Stock Location</label>
                <select
                  id="adv-select-location"
                  className="cc-adv-select"
                  value={query.stockLocation || ''}
                  onChange={(e) => onUpdateQuery({ stockLocation: e.target.value || undefined })}
                >
                  <option value="">All</option>
                  {(facets?.stockLocations.map((l) => l.name) || DEFAULT_LOCATIONS).map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              {/* Tags Checkbox Grid (Full width) */}
              <div className="cc-adv-field cc-adv-field--full">
                <label className="cc-adv-label">Tags</label>
                <div className="cc-adv-checkbox-scroll-box">
                  <div className="cc-adv-checkbox-grid">
                    {TAG_OPTIONS.map((tag) => (
                      <label key={tag.key} className="cc-adv-checkbox-label">
                        <input
                          type="checkbox"
                          checked={selectedTags.has(tag.key)}
                          onChange={(e) => {
                            const next = new Set(selectedTags);
                            if (e.target.checked) next.add(tag.key);
                            else next.delete(tag.key);
                            onUpdateQuery({ tags: Array.from(next) });
                          }}
                        />
                        <span>{tag.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 2 Toggle Bar: ACCESSORIES */}
          <button
            type="button"
            className="cc-adv-toggle-bar"
            onClick={() => setShowAccessories((prev) => !prev)}
            aria-expanded={showAccessories}
          >
            <span>{showAccessories ? `HIDE ACCESSORIES (${activeAccessoriesCount})` : `SHOW ACCESSORIES (${activeAccessoriesCount})`}</span>
            <span className="cc-adv-toggle-arrow">{showAccessories ? '▲' : '▼'}</span>
          </button>

          {showAccessories && (
            <div className="cc-adv-collapsible-content">
              <div className="cc-adv-checkbox-scroll-box cc-adv-field--full">
                <div className="cc-adv-checkbox-grid">
                  {ACCESSORIES_OPTIONS.map((acc) => (
                    <label key={acc.key} className="cc-adv-checkbox-label">
                      <input
                        type="checkbox"
                        checked={selectedFeatures.has(acc.key)}
                        onChange={(e) => {
                          const next = new Set(selectedFeatures);
                          if (e.target.checked) next.add(acc.key);
                          else next.delete(acc.key);
                          onUpdateQuery({ features: Array.from(next) });
                        }}
                      />
                      <span>{acc.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Section 3 Bottom Action Row: SEARCH VEHICLES */}
          <div className="cc-adv-bottom-actions">
            <button
              type="button"
              className="cc-adv-body-reset-btn"
              onClick={onResetFilters}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
              Reset Filters
            </button>

            <button
              type="button"
              className="cc-adv-body-search-btn"
              onClick={() => setIsMinimized(true)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              Search Vehicles
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
