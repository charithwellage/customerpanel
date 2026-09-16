import React, { useState, useMemo } from 'react';
import type { CustomerPolymorphicInquiry } from '@carchief/domain';
import { useCustomerShell } from '../shell/index.js';
import { useCustomerInquiries } from './useCustomerInquiries.js';
import { InquiryMessageModal } from './components/InquiryMessageModal.js';
import { SearchGlassIcon, InquiriesChatIcon } from '../../components/Icons.js';
import './inquiries.css';

export interface PolymorphicInquiry extends CustomerPolymorphicInquiry {
  id: string;
  inquiryNumber: string;
  source: 'Stock' | 'WhatsApp' | 'Auction' | 'General';
  status: 'Pending Reply' | 'Replied';
  inquiryDate: string;
  make: string;
  model: string;
  yom: string;
  stockNumber?: string;
  chassisNumber?: string;
  lotNumber?: string;
  chassisModel?: string;
  viewsCount?: number;
  message: string;
  replyMessage?: string;
  repliedAt?: string;
  fobPriceUsd?: number;
  cfPriceUsd?: number;
  startPriceUsd?: number;
  minFobUsd?: number;
  maxFobUsd?: number;
  driveType?: string;
  mfgYearRange?: string;
  deliveryLocation?: string;
  inquirerCount?: number;
  auctionRemaining?: string;
  auctionFinished?: boolean;
  vehicleStatus?: 'AVAILABLE' | 'RESERVED' | 'SOLD' | string;
}

const COLOR_STUDIO_IMAGES: Record<string, string> = {
  white: '/images/cars/car-white.jpg',
  pearl: '/images/cars/car-white.jpg',
  black: '/images/cars/car-black.jpg',
  red: '/images/cars/car-red.jpg',
  blue: '/images/cars/car-blue.jpg',
  silver: '/images/cars/car-silver.jpg',
  gray: '/images/cars/car-gray.jpg',
  grey: '/images/cars/car-gray.jpg',
  green: '/images/cars/car-green.jpg',
};

const STUDIO_CAR_PALETTE = [
  '/images/cars/car-white.jpg',
  '/images/cars/car-red.jpg',
  '/images/cars/car-black.jpg',
  '/images/cars/car-blue.jpg',
  '/images/cars/car-silver.jpg',
  '/images/cars/car-gray.jpg',
  '/images/cars/car-pearl.jpg',
  '/images/cars/car-green.jpg',
];

export function resolveInquiryVehicleImage(inq: {
  imageUrl?: string;
  color?: string;
  id?: string;
  make?: string;
  model?: string;
}): string {
  // If vehicle already explicitly points to a white-background studio vehicle picture, use it
  if (inq.imageUrl && inq.imageUrl.startsWith('/images/cars/')) {
    return inq.imageUrl;
  }
  // Match by declared vehicle color if present
  const colorKey = (inq.color || '').toLowerCase().trim();
  if (colorKey) {
    for (const [key, path] of Object.entries(COLOR_STUDIO_IMAGES)) {
      if (colorKey.includes(key)) {
        return path;
      }
    }
  }
  // Deterministically rotate through the studio white-background car pictures
  const seedStr = inq.id || `${inq.make} ${inq.model}` || 'car';
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
  }
  return STUDIO_CAR_PALETTE[seed % STUDIO_CAR_PALETTE.length];
}

export const SEED_INQUIRIES: PolymorphicInquiry[] = [
  {
    id: 'inq-1',
    inquiryNumber: 'IN-0003',
    source: 'Stock',
    status: 'Pending Reply',
    inquiryDate: '26th Sep, 2024 13:45:00',
    make: 'Toyota',
    model: 'Corolla Fielder 1.5G',
    yom: '2021',
    stockNumber: 'J240111111',
    chassisNumber: 'NRE161-0091995',
    vehicleSlug: '2021-toyota-corolla-fielder-veh-inv-1',
    vehicleId: 'veh-inv-1',
    vehicleStatus: 'AVAILABLE',
    engineCc: 1500,
    mileage: 177000,
    fuelType: 'Petrol',
    transmission: 'Automatic',
    color: 'Pearl White',
    priceState: 'priced',
    priceUsd: 1400,
    viewsCount: 12,
    message: 'Could you please confirm the earliest vessel departure schedule for Mombasa?',
    fobPriceUsd: 1400,
    cfPriceUsd: 2400,
    deliveryLocation: 'Kenya-Mombasa',
    inquirerCount: 4,
    imageUrl: '/images/cars/car-white.jpg',
  },
  {
    id: 'inq-2',
    inquiryNumber: 'IN-0002',
    source: 'Auction',
    status: 'Replied',
    inquiryDate: '26th Sep, 2024 13:45:00',
    make: 'Toyota',
    model: 'Raize Z 4WD',
    yom: '2024',
    stockNumber: 'J240111112',
    lotNumber: '36071',
    chassisModel: 'A210A',
    chassisNumber: 'A210A-0048192',
    vehicleSlug: '2024-toyota-raize-veh-7',
    vehicleId: 'veh-7',
    vehicleStatus: 'RESERVED',
    engineCc: 1200,
    mileage: 18500,
    fuelType: 'Petrol',
    transmission: 'Automatic',
    color: 'Soul Red',
    viewsCount: 8,
    message: 'Inspection grade request and maximum auction bidding cap confirmation.',
    replyMessage: 'Grade 5.0 A condition verified. Starting bid placed at JAAI Yokohama.',
    repliedAt: '26th Sep, 2024 15:30:00',
    startPriceUsd: 1400,
    auctionRemaining: '2 hr 45 min',
    auctionFinished: false,
    deliveryLocation: 'Kenya',
    imageUrl: '/images/cars/car-red.jpg',
  },
  {
    id: 'inq-3',
    inquiryNumber: 'IN-0001',
    source: 'General',
    status: 'Replied',
    inquiryDate: '26th Sep, 2024 13:45:00',
    make: 'Toyota',
    model: 'Land Cruiser 250 ZX',
    yom: '2024',
    stockNumber: 'J240111113',
    chassisNumber: 'GDJ250W-001290',
    vehicleSlug: '2024-toyota-land-cruiser-250-veh-6',
    vehicleId: 'veh-6',
    vehicleStatus: 'SOLD',
    priceState: 'priced',
    priceUsd: 45000,
    viewsCount: 19,
    message: 'Looking for 2024 Land Cruiser 250 with sunroof, leather interior, and 7 seats.',
    replyMessage: 'We have reserved 2 units arriving at Yokohama port this week.',
    repliedAt: '26th Sep, 2024 16:00:00',
    driveType: 'RHD 4WD',
    mfgYearRange: '2022 To 2024',
    color: 'Diamond Black',
    minFobUsd: 1400,
    maxFobUsd: 3400,
    deliveryLocation: 'Kenya',
    imageUrl: '/images/cars/car-black.jpg',
  },
  {
    id: 'inq-4',
    inquiryNumber: 'IN-0004',
    source: 'Stock',
    status: 'Pending Reply',
    inquiryDate: '27th Sep, 2024 09:15:00',
    make: 'Honda',
    model: 'Vezel Hybrid Z',
    yom: '2022',
    stockNumber: 'J240111114',
    chassisNumber: 'RU3-1204910',
    vehicleSlug: '2022-honda-vezel-veh-4',
    vehicleId: 'veh-4',
    vehicleStatus: 'AVAILABLE',
    engineCc: 1500,
    mileage: 34000,
    fuelType: 'Hybrid',
    transmission: 'Automatic',
    color: 'Premium Blue',
    priceState: 'priced',
    priceUsd: 4850,
    viewsCount: 15,
    message: 'Please advise on insurance and C&F costs to Durban port.',
    fobPriceUsd: 4850,
    cfPriceUsd: 6100,
    deliveryLocation: 'South Africa-Durban',
    inquirerCount: 3,
    imageUrl: '/images/cars/car-blue.jpg',
  },
];

export const CustomerInquiriesPage: React.FC = () => {
  const { setActiveRoute } = useCustomerShell();
  const { inquiries: apiInquiries } = useCustomerInquiries();

  // Multi-source filter: Stock, Auction, General - All checked by default (FRD 6.3)
  const [sources, setSources] = useState<{ Stock: boolean; Auction: boolean; General: boolean }>({
    Stock: true,
    Auction: true,
    General: true,
  });

  const [keyword, setKeyword] = useState('');
  const [stockNumberFilter, setStockNumberFilter] = useState('');
  const [chassisNumberFilter, setChassisNumberFilter] = useState('');
  const [inquiryNumberFilter, setInquiryNumberFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Wishlist heart toggle state & Reservation state
  const [selectedMessageInquiry, setSelectedMessageInquiry] = useState<PolymorphicInquiry | null>(null);
  const [reservations, setReservations] = useState<{ vehicleId: string; timestamp: number }[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('carchief_48h_reservations');
        if (saved) return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return [];
  });

  const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;
  const activeReservations = useMemo(() => {
    const now = Date.now();
    return reservations.filter((r) => now - r.timestamp < FORTY_EIGHT_HOURS_MS);
  }, [reservations]);

  const reservedVehicleIds = useMemo(
    () => new Set(activeReservations.map((r) => r.vehicleId)),
    [activeReservations]
  );

  const remainingQuota = Math.max(0, 2 - activeReservations.length);

  const handleReserveVehicle = (vehicleId: string) => {
    if (reservedVehicleIds.has(vehicleId)) return;
    if (activeReservations.length >= 2) {
      alert('Reservation Limit Reached: You can reserve up to 2 vehicles within a 48-hour window.');
      return;
    }

    const next = [...activeReservations, { vehicleId, timestamp: Date.now() }];
    setReservations(next);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('carchief_48h_reservations', JSON.stringify(next));
      } catch {
        // ignore
      }
    }
  };

  const handleSourceChange = (key: 'Stock' | 'Auction' | 'General') => {
    setSources((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredInquiries = useMemo(() => {
    const dataSource = (apiInquiries && apiInquiries.length > 0) ? (apiInquiries as PolymorphicInquiry[]) : SEED_INQUIRIES;
    return dataSource.filter((inq) => {
      // Source filter
      const effectiveSource = inq.source === 'WhatsApp' ? 'Stock' : inq.source;
      if (!sources[effectiveSource as 'Stock' | 'Auction' | 'General']) {
        return false;
      }

      if (keyword.trim()) {
        const q = keyword.toLowerCase().trim();
        const match =
          inq.make.toLowerCase().includes(q) ||
          inq.model.toLowerCase().includes(q) ||
          inq.inquiryNumber.toLowerCase().includes(q) ||
          inq.message.toLowerCase().includes(q);
        if (!match) return false;
      }

      if (stockNumberFilter.trim() && inq.stockNumber) {
        if (!inq.stockNumber.toLowerCase().includes(stockNumberFilter.toLowerCase().trim())) return false;
      }

      if (chassisNumberFilter.trim() && inq.chassisNumber) {
        if (!inq.chassisNumber.toLowerCase().includes(chassisNumberFilter.toLowerCase().trim())) return false;
      }

      if (inquiryNumberFilter.trim()) {
        if (!inq.inquiryNumber.toLowerCase().includes(inquiryNumberFilter.toLowerCase().trim())) return false;
      }

      if (statusFilter !== 'ALL' && inq.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [sources, keyword, stockNumberFilter, chassisNumberFilter, inquiryNumberFilter, statusFilter]);

  const navigateToVehicle = (inquiry: PolymorphicInquiry) => {
    const slug = inquiry.vehicleSlug || inquiry.vehicleId || inquiry.stockNumber || inquiry.id;
    if (slug) {
      const isReserved = reservedVehicleIds.has(inquiry.vehicleId || inquiry.id) || inquiry.vehicleStatus === 'RESERVED';
      const isSold = inquiry.vehicleStatus === 'SOLD';
      const statusParam = isSold ? '&status=sold' : isReserved ? '&status=reserved' : '';
      setActiveRoute(`/inventory/${encodeURIComponent(slug)}?from=inquiries${statusParam}`);
    }
  };

  const handleVehicleKeyDown = (event: React.KeyboardEvent<HTMLElement>, inquiry: PolymorphicInquiry) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      navigateToVehicle(inquiry);
    }
  };
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (stockNumberFilter.trim()) count++;
    if (chassisNumberFilter.trim()) count++;
    if (inquiryNumberFilter.trim()) count++;
    if (keyword.trim()) count++;
    if (statusFilter !== 'ALL') count++;
    if (!sources.Stock || !sources.Auction || !sources.General) count++;
    return count;
  }, [stockNumberFilter, chassisNumberFilter, inquiryNumberFilter, keyword, statusFilter, sources]);

  const clearInquiryFilters = () => {
    setStockNumberFilter('');
    setChassisNumberFilter('');
    setInquiryNumberFilter('');
    setKeyword('');
    setStatusFilter('ALL');
    setSources({ Stock: true, Auction: true, General: true });
  };

  return (
    <div className="cc-inquiries-page" data-testid="customer-inquiries-page">
      {/* Page Header */}
      <div className="cc-inq-header">
        <div className="cc-inq-title-wrap">
          <h1 className="cc-inq-title">
            MY <span className="cc-inq-title-highlight">INQUIRIES &amp; QUOTES</span>
          </h1>
        </div>
      </div>

      {/* 1. UNIFIED FILTER CONTAINER (Matches Purchased Vehicles Filter UI) */}
      <section className="cc-pv-filter-container" aria-label="Filter Inquiries and Quotes">
        <div className="cc-pv-filter-header">
          <div className="cc-pv-filter-title">
            <span>Filter Inquiries &amp; Quotes</span>
            {activeFiltersCount > 0 && (
              <span className="cc-pv-active-count-badge">
                {activeFiltersCount} Active Filter{activeFiltersCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          {activeFiltersCount > 0 && (
            <button
              type="button"
              className="cc-orders-btn cc-orders-btn--clear"
              onClick={clearInquiryFilters}
            >
              Clear All Filters
            </button>
          )}
        </div>

        <div className="cc-pv-filter-grid">
          <div className="cc-pv-filter-item">
            <label htmlFor="inq-stock-input" className="cc-orders-filter-label">Stock Number</label>
            <input
              id="inq-stock-input"
              type="text"
              className="cc-orders-input"
              placeholder="e.g. J240111111"
              value={stockNumberFilter}
              onChange={(e) => setStockNumberFilter(e.target.value)}
            />
          </div>

          <div className="cc-pv-filter-item">
            <label htmlFor="inq-chassis-input" className="cc-orders-filter-label">Chassis Number</label>
            <input
              id="inq-chassis-input"
              type="text"
              className="cc-orders-input"
              placeholder="e.g. NRE161-0091995"
              value={chassisNumberFilter}
              onChange={(e) => setChassisNumberFilter(e.target.value)}
            />
          </div>

          <div className="cc-pv-filter-item">
            <label htmlFor="inq-num-input" className="cc-orders-filter-label">Inquiry Number</label>
            <input
              id="inq-num-input"
              type="text"
              className="cc-orders-input"
              placeholder="e.g. IN-0003"
              value={inquiryNumberFilter}
              onChange={(e) => setInquiryNumberFilter(e.target.value)}
            />
          </div>

          <div className="cc-pv-filter-item">
            <label htmlFor="inq-kw-input" className="cc-orders-filter-label">Keyword Search</label>
            <input
              id="inq-kw-input"
              type="search"
              className="cc-orders-input"
              placeholder="Search make, model, message..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>

          <div className="cc-pv-filter-item">
            <label htmlFor="inq-status-select" className="cc-orders-filter-label">Inquiry Status</label>
            <select
              id="inq-status-select"
              className="cc-orders-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="Pending Reply">Pending Reply</option>
              <option value="Replied">Replied</option>
            </select>
          </div>
        </div>

        {/* Source Checkboxes Row */}
        <div className="cc-inq-source-row">
          <div className="cc-inq-source-group">
            <span className="cc-inq-source-heading">Inquiry Source:</span>
            <label className={`cc-inq-source-label cc-inq-source-label--stock ${sources.Stock ? 'cc-inq-source-label--active' : ''}`}>
              <input
                type="checkbox"
                checked={sources.Stock}
                onChange={() => handleSourceChange('Stock')}
                data-testid="source-stock-checkbox"
              />
              <span>Stock &amp; WhatsApp</span>
            </label>
            <label className={`cc-inq-source-label cc-inq-source-label--auction ${sources.Auction ? 'cc-inq-source-label--active' : ''}`}>
              <input
                type="checkbox"
                checked={sources.Auction}
                onChange={() => handleSourceChange('Auction')}
                data-testid="source-auction-checkbox"
              />
              <span>Auction</span>
            </label>
            <label className={`cc-inq-source-label cc-inq-source-label--general ${sources.General ? 'cc-inq-source-label--active' : ''}`}>
              <input
                type="checkbox"
                checked={sources.General}
                onChange={() => handleSourceChange('General')}
                data-testid="source-general-checkbox"
              />
              <span>General</span>
            </label>
          </div>

          {activeFiltersCount === 0 && (
            <button
              type="button"
              className="cc-inq-reset-btn"
              onClick={clearInquiryFilters}
            >
              Reset Filters
            </button>
          )}
        </div>
      </section>

      {/* 2. TOTAL RECORDS FOUND (FRD 6.4) */}
      <div className="cc-inq-count-bar">
        <span className="cc-inq-count-text">
          Total Records Found: <strong>{filteredInquiries.length}</strong>
        </span>
      </div>

      {/* 3. INQUIRY CARDS LIST (FRD 6.7, 6.8, 6.9) */}
      <div className="cc-inq-cards-list cc-inq-cards-list--grid">
        {filteredInquiries.map((inq) => {
          const targetVehicleId = inq.vehicleId || inq.id;
          const isReserved = reservedVehicleIds.has(targetVehicleId) || inq.vehicleStatus === 'RESERVED';
          const isSold = inq.vehicleStatus === 'SOLD';
          const fobDisplayPrice = inq.fobPriceUsd || inq.startPriceUsd || inq.priceUsd || inq.minFobUsd || 1400;

          return (
            <article key={inq.id} className={`cc-inq-card cc-inq-card--${inq.source.toLowerCase()}`} data-testid={`inq-card-${inq.inquiryNumber}`}>
              {/* Tile Image Box with Badges */}
              <div
                className="cc-inq-card__image-box"
                onClick={() => navigateToVehicle(inq)}
                onKeyDown={(event) => handleVehicleKeyDown(event, inq)}
                role="button"
                tabIndex={0}
                title="Click to view complete vehicle details"
              >
                <img
                  src={resolveInquiryVehicleImage(inq)}
                  alt={`${inq.make} ${inq.model}`}
                  className="cc-inq-card__image"
                  loading="lazy"
                />
                <div className="cc-inq-tile-badges-top-left">
                  <span className="cc-inq-views-badge">👁️ {inq.viewsCount || 12} watching</span>
                </div>
                <span className={`cc-inq-status-tag cc-inq-status-tag--${isSold ? 'sold' : isReserved ? 'reserved' : inq.status.toLowerCase().replace(/\s+/g, '-')}`}>
                  {isSold ? 'SOLD' : isReserved ? 'RESERVED' : inq.status}
                </span>
              </div>

              {/* Card Body */}
              <div className="cc-inq-card__body">
                <div className="cc-inq-card__main-content">
                  <div className="cc-inq-card__header">
                    <h2
                      className="cc-inq-card__title cc-inq-card__title--clickable"
                      onClick={() => navigateToVehicle(inq)}
                      onKeyDown={(event) => handleVehicleKeyDown(event, inq)}
                      role="button"
                      tabIndex={0}
                      title="Click to view complete vehicle details"
                    >
                      {inq.yom} {inq.make.toUpperCase()} {inq.model.toUpperCase()}
                    </h2>
                  </div>

                  {/* Specifications Table */}
                  <div className="cc-cust-fleet-card__specs-table" aria-label="Vehicle specifications">
                    <div className="cc-cust-fleet-card__spec-row">
                      <span className="cc-cust-fleet-card__spec-label">Stock No:</span>
                      <span className="cc-cust-fleet-card__spec-value cc-cust-fleet-card__spec-value--mono">
                        {inq.stockNumber || (inq.lotNumber ? (inq.lotNumber.startsWith('J') ? inq.lotNumber : `J${inq.lotNumber}`) : 'J240111112')}
                      </span>
                    </div>
                    <div className="cc-cust-fleet-card__spec-row">
                      <span className="cc-cust-fleet-card__spec-label">Chassis No:</span>
                      <span className="cc-cust-fleet-card__spec-value cc-cust-fleet-card__spec-value--mono">
                        {inq.chassisNumber || inq.chassisModel || 'N/A'}
                      </span>
                    </div>
                    <div className="cc-cust-fleet-card__spec-row">
                      <span className="cc-cust-fleet-card__spec-label">Color / Spec:</span>
                      <span className="cc-cust-fleet-card__spec-value">
                        {inq.color || (inq.fuelType ? `${inq.fuelType} / ${inq.transmission || 'Auto'}` : 'Pearl White')}
                      </span>
                    </div>
                    <div className="cc-cust-fleet-card__spec-row">
                      <span className="cc-cust-fleet-card__spec-label">Mileage:</span>
                      <span className="cc-cust-fleet-card__spec-value">
                        {inq.mileage ? `${inq.mileage.toLocaleString()} KM` : '177,000 KM'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Financials & Action Buttons */}
                <div className="cc-inq-card__financials">
                  <div className="cc-inq-fob-price-header">
                    <div className="cc-inq-fob-price-box">
                      <span className="cc-inq-fob-price-label">
                        {inq.source === 'Auction' ? 'Start Price:' : 'FOB Price:'}
                      </span>
                      <span className="cc-inq-fob-price-val">
                        ${fobDisplayPrice.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="cc-inq-card__action-group">
                    <button
                      type="button"
                      className="cc-inq-action-btn cc-inq-action-btn--msg"
                      onClick={() => setSelectedMessageInquiry(inq)}
                      title="View inquiry message"
                      data-testid={`btn-msg-${inq.inquiryNumber}`}
                    >
                      ✉️ Message
                    </button>
                    {isSold ? (
                      <span className="cc-inq-action-badge cc-inq-action-badge--sold" style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #16a34a' }}>
                        ✓ Sold
                      </span>
                    ) : isReserved ? (
                      <span className="cc-inq-action-badge cc-inq-action-badge--reserved">
                        ✓ Reserved (48h)
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="cc-inq-action-btn cc-inq-action-btn--reserve"
                        onClick={() => handleReserveVehicle(targetVehicleId)}
                        disabled={remainingQuota <= 0}
                        title={
                          remainingQuota <= 0
                            ? 'Reservation limit reached: Max 2 vehicles within 48 hours'
                            : 'Reserve vehicle for 48 hours'
                        }
                        data-testid={`btn-reserve-${inq.inquiryNumber}`}
                      >
                        🔒 Reserve Now
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Message Modal Pop up (FRD 6.10) */}
      {selectedMessageInquiry && (
        <InquiryMessageModal
          isOpen={selectedMessageInquiry !== null}
          onClose={() => setSelectedMessageInquiry(null)}
          inquiryNumber={selectedMessageInquiry.inquiryNumber}
          source={selectedMessageInquiry.source}
          date={selectedMessageInquiry.inquiryDate}
          message={selectedMessageInquiry.message}
          replyMessage={selectedMessageInquiry.replyMessage}
          repliedAt={selectedMessageInquiry.repliedAt}
        />
      )}
    </div>
  );
};
