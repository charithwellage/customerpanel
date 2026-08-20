import React, { useState, useMemo } from 'react';
import type { CustomerInquirySummary } from '@carchief/domain';
import { useCustomerShell } from '../shell/index.js';
import { useCustomerInquiries } from './useCustomerInquiries.js';
import { InquiryMessageModal } from './components/InquiryMessageModal.js';
import { SearchGlassIcon, InquiriesChatIcon } from '../../components/Icons.js';
import './inquiries.css';

export interface PolymorphicInquiry {
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
  imageUrl?: string;
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
    viewsCount: 12,
    message: 'Could you please confirm the earliest vessel departure schedule for Mombasa?',
    fobPriceUsd: 1400,
    cfPriceUsd: 2400,
    deliveryLocation: 'Kenya-Mombasa',
    inquirerCount: 4,
    imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600',
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
    lotNumber: '36071',
    chassisModel: 'A210A',
    viewsCount: 8,
    message: 'Inspection grade request and maximum auction bidding cap confirmation.',
    replyMessage: 'Grade 5.0 A condition verified. Starting bid placed at JAAI Yokohama.',
    repliedAt: '26th Sep, 2024 15:30:00',
    startPriceUsd: 1400,
    auctionRemaining: '2 hr 45 min',
    auctionFinished: false,
    deliveryLocation: 'Kenya',
    imageUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600',
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
    message: 'Looking for 2024 Land Cruiser 250 with sunroof, leather interior, and 7 seats.',
    replyMessage: 'We have reserved 2 units arriving at Yokohama port this week.',
    repliedAt: '26th Sep, 2024 16:00:00',
    driveType: 'RHD 4WD',
    mfgYearRange: '2022 To 2024',
    minFobUsd: 1400,
    maxFobUsd: 3400,
    deliveryLocation: 'Kenya',
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

  // Wishlist heart toggle state
  const [wishlistToggled, setWishlistToggled] = useState<Record<string, boolean>>({});
  // Selected inquiry for message modal (FRD 6.10)
  const [selectedMessageInquiry, setSelectedMessageInquiry] = useState<PolymorphicInquiry | null>(null);

  const toggleWishlist = (id: string) => {
    setWishlistToggled((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSourceChange = (key: 'Stock' | 'Auction' | 'General') => {
    setSources((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredInquiries = useMemo(() => {
    const dataSource = (apiInquiries && apiInquiries.length > 0) ? (apiInquiries as unknown as PolymorphicInquiry[]) : SEED_INQUIRIES;
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

  return (
    <div className="cc-inquiries-page" data-testid="customer-inquiries-page">
      {/* 1. FILTER TOOLBAR & SOURCE CHECKBOXES (FRD 6.2 & 6.3) */}
      <section className="cc-inq-filter-card" aria-label="Inquiry Filtration Controls">
        <div className="cc-inq-filter-grid">
          <div className="cc-inq-filter-field">
            <label htmlFor="inq-stock-input" className="cc-inq-field-label">Stock No.</label>
            <input
              id="inq-stock-input"
              type="text"
              className="cc-inq-input"
              placeholder="e.g. J240111111"
              value={stockNumberFilter}
              onChange={(e) => setStockNumberFilter(e.target.value)}
            />
          </div>

          <div className="cc-inq-filter-field">
            <label htmlFor="inq-chassis-input" className="cc-inq-field-label">Chassis No.</label>
            <input
              id="inq-chassis-input"
              type="text"
              className="cc-inq-input"
              placeholder="e.g. NRE161-0091995"
              value={chassisNumberFilter}
              onChange={(e) => setChassisNumberFilter(e.target.value)}
            />
          </div>

          <div className="cc-inq-filter-field">
            <label htmlFor="inq-num-input" className="cc-inq-field-label">Inquiry No.</label>
            <input
              id="inq-num-input"
              type="text"
              className="cc-inq-input"
              placeholder="e.g. IN-0003"
              value={inquiryNumberFilter}
              onChange={(e) => setInquiryNumberFilter(e.target.value)}
            />
          </div>

          <div className="cc-inq-filter-field">
            <label htmlFor="inq-kw-input" className="cc-inq-field-label">Keyword</label>
            <input
              id="inq-kw-input"
              type="search"
              className="cc-inq-input"
              placeholder="Search make, model, message..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>

          <div className="cc-inq-filter-field">
            <label htmlFor="inq-status-select" className="cc-inq-field-label">Inquiry Status</label>
            <select
              id="inq-status-select"
              className="cc-inq-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="Pending Reply">Pending Reply</option>
              <option value="Replied">Replied</option>
            </select>
          </div>
        </div>

        {/* Source Checkboxes - All checked by default (FRD 6.3) */}
        <div className="cc-inq-source-row">
          <span className="cc-inq-source-heading">Inquiry Source:</span>
          <label className="cc-inq-source-label">
            <input
              type="checkbox"
              checked={sources.Stock}
              onChange={() => handleSourceChange('Stock')}
              data-testid="source-stock-checkbox"
            />
            Stock &amp; WhatsApp
          </label>
          <label className="cc-inq-source-label">
            <input
              type="checkbox"
              checked={sources.Auction}
              onChange={() => handleSourceChange('Auction')}
              data-testid="source-auction-checkbox"
            />
            Auction
          </label>
          <label className="cc-inq-source-label">
            <input
              type="checkbox"
              checked={sources.General}
              onChange={() => handleSourceChange('General')}
              data-testid="source-general-checkbox"
            />
            General
          </label>

          <button
            type="button"
            className="cc-inq-reset-btn"
            onClick={() => {
              setSources({ Stock: true, Auction: true, General: true });
              setKeyword('');
              setStockNumberFilter('');
              setChassisNumberFilter('');
              setInquiryNumberFilter('');
              setStatusFilter('ALL');
            }}
          >
            Reset Filters
          </button>
        </div>
      </section>

      {/* 2. TOTAL RECORDS FOUND (FRD 6.4) */}
      <div className="cc-inq-count-bar">
        <span className="cc-inq-count-text">
          Total Records Found: <strong>{filteredInquiries.length}</strong>
        </span>
      </div>

      {/* 3. INQUIRY CARDS LIST (FRD 6.7, 6.8, 6.9) */}
      <div className="cc-inq-cards-list">
        {filteredInquiries.map((inq) => {
          const isWishlisted = Boolean(wishlistToggled[inq.id]);

          if (inq.source === 'Stock' || inq.source === 'WhatsApp') {
            return (
              <article key={inq.id} className="cc-inq-card cc-inq-card--stock" data-testid={`inq-card-${inq.inquiryNumber}`}>
                <div
                  className="cc-inq-card__image-box"
                  onClick={() => setActiveRoute('/inventory')}
                  role="button"
                  tabIndex={0}
                  title="Click to view in Browse Stock"
                >
                  <img
                    src={inq.imageUrl || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600'}
                    alt={`${inq.make} ${inq.model}`}
                    className="cc-inq-card__image"
                    loading="lazy"
                  />
                </div>

                <div className="cc-inq-card__body">
                  <div className="cc-inq-card__top">
                    <div className="cc-inq-card__title-row">
                      <h2 className="cc-inq-card__title">
                        {inq.make} + {inq.model} + {inq.yom}
                      </h2>
                      <span className="cc-inq-views">👁️ {inq.viewsCount || 12}</span>
                    </div>

                    <div className="cc-inq-card__status-wrap">
                      <span className={`cc-inq-status-pill cc-inq-status-pill--${inq.status.toLowerCase().replace(/\s+/g, '-')}`}>
                        {inq.status}
                      </span>
                      {/* Heart wishlist toggle (FRD 6.7.2) */}
                      <button
                        type="button"
                        className={`cc-inq-heart-btn ${isWishlisted ? 'cc-inq-heart-btn--active' : ''}`}
                        onClick={() => toggleWishlist(inq.id)}
                        aria-label="Add to Wishlist"
                        title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                      >
                        {isWishlisted ? '❤️' : '🤍'}
                      </button>
                    </div>
                  </div>

                  <div className="cc-inq-card__meta-grid">
                    <div className="cc-inq-meta-item">
                      <span className="cc-inq-meta-label">Inquiry No.:</span>
                      <span className="cc-inq-meta-val cc-inq-meta-val--mono">{inq.inquiryNumber}</span>
                      <button
                        type="button"
                        className="cc-inq-msg-icon-btn"
                        onClick={() => setSelectedMessageInquiry(inq)}
                        title="View message pop up"
                      >
                        ✉️
                      </button>
                    </div>
                    <div className="cc-inq-meta-item">
                      <span className="cc-inq-meta-label">Source:</span>
                      <span className="cc-inq-meta-val">{inq.source}</span>
                    </div>
                    <div className="cc-inq-meta-item">
                      <span className="cc-inq-meta-label">Inquired on:</span>
                      <span className="cc-inq-meta-val cc-inq-meta-val--mono">{inq.inquiryDate}</span>
                    </div>
                    <div className="cc-inq-meta-item">
                      <span className="cc-inq-meta-label">Ref# / Stock:</span>
                      <span className="cc-inq-meta-val cc-inq-meta-val--mono">{inq.stockNumber}</span>
                    </div>
                    <div className="cc-inq-meta-item">
                      <span className="cc-inq-meta-label">Chassis:</span>
                      <span className="cc-inq-meta-val cc-inq-meta-val--mono">{inq.chassisNumber}</span>
                    </div>
                  </div>

                  <div className="cc-inq-card__specs-row">
                    <span className="cc-inq-spec-chip">⚙️ 1,500CC</span>
                    <span className="cc-inq-spec-chip">⚡ 177,000 KM</span>
                    <span className="cc-inq-spec-chip">⛽ Petrol</span>
                    <span className="cc-inq-spec-chip">🕹️ Automatic</span>
                    <span className="cc-inq-spec-chip">🎨 Pearl White</span>
                  </div>

                  <div className="cc-inq-card__financials">
                    <div className="cc-inq-price-block">
                      <span className="cc-inq-price-label">FOB Price:</span>
                      <span className="cc-inq-price-val">${inq.fobPriceUsd?.toLocaleString()} USD</span>
                    </div>
                    <div className="cc-inq-price-block">
                      <span className="cc-inq-price-label">C&amp;F Price:</span>
                      <span className="cc-inq-price-val cc-inq-price-val--bold">${inq.cfPriceUsd?.toLocaleString()} USD</span>
                    </div>
                    <div className="cc-inq-delivery-block">
                      <span className="cc-inq-delivery-label">Deliver To:</span>
                      <span className="cc-inq-delivery-val">{inq.deliveryLocation}</span>
                      <span className="cc-inq-inquiring-count">{inq.inquirerCount || 4} people are inquiring</span>
                    </div>
                  </div>
                </div>
              </article>
            );
          }

          if (inq.source === 'Auction') {
            return (
              <article key={inq.id} className="cc-inq-card cc-inq-card--auction" data-testid={`inq-card-${inq.inquiryNumber}`}>
                <div
                  className="cc-inq-card__image-box"
                  onClick={() => setActiveRoute('/inventory')}
                  role="button"
                  tabIndex={0}
                  title="Click to view Auction details"
                >
                  <img
                    src={inq.imageUrl || 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600'}
                    alt={`${inq.make} ${inq.model}`}
                    className="cc-inq-card__image"
                    loading="lazy"
                  />
                </div>

                <div className="cc-inq-card__body">
                  <div className="cc-inq-card__top">
                    <div className="cc-inq-card__title-row">
                      <h2 className="cc-inq-card__title">
                        {inq.make} + {inq.model} + {inq.yom}
                      </h2>
                    </div>

                    <div className="cc-inq-card__status-wrap">
                      <span className={`cc-inq-status-pill cc-inq-status-pill--${inq.status.toLowerCase().replace(/\s+/g, '-')}`}>
                        {inq.status}
                      </span>
                      {/* Groups Wishlist selector (FRD 6.8.2) */}
                      <div className="cc-inq-groups-badges">
                        <span className="cc-inq-group-badge">A</span>
                        <span className="cc-inq-group-badge">B</span>
                        <span className="cc-inq-group-badge">C</span>
                        <span className="cc-inq-group-badge">D</span>
                      </div>
                    </div>
                  </div>

                  <div className="cc-inq-card__meta-grid">
                    <div className="cc-inq-meta-item">
                      <span className="cc-inq-meta-label">Inquiry No.:</span>
                      <span className="cc-inq-meta-val cc-inq-meta-val--mono">{inq.inquiryNumber}</span>
                      <button
                        type="button"
                        className="cc-inq-msg-icon-btn"
                        onClick={() => setSelectedMessageInquiry(inq)}
                        title="View message pop up"
                      >
                        ✉️
                      </button>
                    </div>
                    <div className="cc-inq-meta-item">
                      <span className="cc-inq-meta-label">Source:</span>
                      <span className="cc-inq-meta-val">Auction</span>
                    </div>
                    <div className="cc-inq-meta-item">
                      <span className="cc-inq-meta-label">Lot Number:</span>
                      <span className="cc-inq-meta-val cc-inq-meta-val--mono">{inq.lotNumber}</span>
                    </div>
                    <div className="cc-inq-meta-item">
                      <span className="cc-inq-meta-label">Chassis Model:</span>
                      <span className="cc-inq-meta-val cc-inq-meta-val--mono">{inq.chassisModel}</span>
                    </div>
                  </div>

                  <div className="cc-inq-card__financials">
                    <div className="cc-inq-price-block">
                      <span className="cc-inq-price-label">Start Price:</span>
                      <span className="cc-inq-price-val">${inq.startPriceUsd?.toLocaleString()} USD</span>
                    </div>
                    <div className="cc-inq-price-block">
                      <span className="cc-inq-price-label">Auction Date:</span>
                      <span className="cc-inq-price-val cc-inq-price-val--green">{inq.auctionRemaining || 'Finished'}</span>
                    </div>
                    <div className="cc-inq-delivery-block">
                      <span className="cc-inq-delivery-label">Deliver To:</span>
                      <span className="cc-inq-delivery-val">{inq.deliveryLocation}</span>
                    </div>
                  </div>
                </div>
              </article>
            );
          }

          // General Inquiry (FRD 6.9: No Image)
          return (
            <article key={inq.id} className="cc-inq-card cc-inq-card--general" data-testid={`inq-card-${inq.inquiryNumber}`}>
              <div className="cc-inq-card__no-image-box">
                <span className="cc-inq-no-image-text">No Image</span>
              </div>

              <div className="cc-inq-card__body">
                <div className="cc-inq-card__top">
                  <h2 className="cc-inq-card__title">
                    {inq.make} + {inq.model}
                  </h2>
                  <span className={`cc-inq-status-pill cc-inq-status-pill--${inq.status.toLowerCase().replace(/\s+/g, '-')}`}>
                    {inq.status}
                  </span>
                </div>

                <div className="cc-inq-card__meta-grid">
                  <div className="cc-inq-meta-item">
                    <span className="cc-inq-meta-label">Inquiry No.:</span>
                    <span className="cc-inq-meta-val cc-inq-meta-val--mono">{inq.inquiryNumber}</span>
                    <button
                      type="button"
                      className="cc-inq-msg-icon-btn"
                      onClick={() => setSelectedMessageInquiry(inq)}
                      title="View message pop up"
                    >
                      ✉️
                    </button>
                  </div>
                  <div className="cc-inq-meta-item">
                    <span className="cc-inq-meta-label">Source:</span>
                    <span className="cc-inq-meta-val">General</span>
                  </div>
                  <div className="cc-inq-meta-item">
                    <span className="cc-inq-meta-label">Drive Type:</span>
                    <span className="cc-inq-meta-val">{inq.driveType}</span>
                  </div>
                  <div className="cc-inq-meta-item">
                    <span className="cc-inq-meta-label">MFG Year:</span>
                    <span className="cc-inq-meta-val cc-inq-meta-val--mono">{inq.mfgYearRange}</span>
                  </div>
                </div>

                <div className="cc-inq-card__financials">
                  <div className="cc-inq-price-block">
                    <span className="cc-inq-price-label">Min FOB:</span>
                    <span className="cc-inq-price-val">${inq.minFobUsd?.toLocaleString()} USD</span>
                  </div>
                  <div className="cc-inq-price-block">
                    <span className="cc-inq-price-label">Max FOB:</span>
                    <span className="cc-inq-price-val">${inq.maxFobUsd?.toLocaleString()} USD</span>
                  </div>
                  <div className="cc-inq-delivery-block">
                    <span className="cc-inq-delivery-label">Deliver To:</span>
                    <span className="cc-inq-delivery-val">{inq.deliveryLocation}</span>
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
