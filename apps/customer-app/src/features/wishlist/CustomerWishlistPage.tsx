import React, { useState, useMemo, useEffect } from 'react';
import type { VehicleDomainSummary, WishlistItem } from '@carchief/domain';
import { useCustomerShell } from '../shell/index.js';
import { useCustomerWishlist } from './useCustomerWishlist.js';
import './wishlist.css';
import { useTranslation } from '../../i18n/index.js';

export interface WishlistStockItem {
  id: string;
  vehicleSlug: string;
  vehicleId: string;
  make: string;
  model: string;
  yom: string;
  stockNumber: string;
  chassisNumber: string;
  viewsCount: number;
  fobPriceUsd: number;
  cfPriceUsd?: number;
  inquirerCount: number;
  imageUrl: string;
  specs: {
    engineCc: string;
    mileage: string;
    fuel: string;
    transmission: string;
    color: string;
  };
}

/**
 * Calculates dynamic inquiring count:
 * - Starts at a base number > 20
 * - Automatically adds 5 inquiring people per day based on calendar time
 */
export function calculateDynamicInquirers(baseCount: number, seedOffsetDays = 0): number {
  const initialBase = Math.max(21, baseCount);
  const anchorDate = new Date('2026-09-01T00:00:00Z').getTime();
  const now = Date.now();
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysElapsed = Math.max(0, Math.floor((now - anchorDate) / msPerDay)) + seedOffsetDays;
  return initialBase + (daysElapsed * 5);
}

/**
 * Calculates dynamic vehicle views:
 * Always scales significantly higher than inquirerCount.
 */
export function calculateDynamicViews(inquirerCount: number, seedOffset = 0): number {
  const multiplier = 4.5 + (seedOffset % 3);
  return Math.round(inquirerCount * multiplier + 120 + (seedOffset * 15));
}

export const SEED_STOCK_WISHLIST: WishlistStockItem[] = [
  {
    id: 'w-stock-1',
    vehicleSlug: 'toyota-corolla-fielder-2021',
    vehicleId: 'veh-1',
    make: 'Toyota',
    model: 'Corolla Fielder 1.5G',
    yom: '2021',
    stockNumber: 'J240111111',
    chassisNumber: 'NRE161-0091995',
    inquirerCount: calculateDynamicInquirers(24, 0),
    viewsCount: calculateDynamicViews(calculateDynamicInquirers(24, 0), 0),
    fobPriceUsd: 1400,
    cfPriceUsd: 2400,
    imageUrl: '/images/cars/car-white.jpg',
    specs: {
      engineCc: '1,500CC',
      mileage: '177,000 KM',
      fuel: 'Petrol',
      transmission: 'Automatic',
      color: 'Pearl White',
    },
  },
  {
    id: 'w-stock-2',
    vehicleSlug: 'mazda-demio-2019',
    vehicleId: 'veh-2',
    make: 'Mazda',
    model: 'Demio 13S',
    yom: '2019',
    stockNumber: 'J240111112',
    chassisNumber: 'DE3FS-884021',
    inquirerCount: calculateDynamicInquirers(28, 1),
    viewsCount: calculateDynamicViews(calculateDynamicInquirers(28, 1), 1),
    fobPriceUsd: 980,
    cfPriceUsd: 1980,
    imageUrl: '/images/cars/car-red.jpg',
    specs: {
      engineCc: '1,300CC',
      mileage: '88,000 KM',
      fuel: 'Petrol',
      transmission: 'Automatic',
      color: 'Soul Red',
    },
  },
  {
    id: 'w-stock-3',
    vehicleSlug: 'nissan-x-trail-2020',
    vehicleId: 'veh-3',
    make: 'Nissan',
    model: 'X-Trail 20X Hybrid',
    yom: '2020',
    stockNumber: 'J240111113',
    chassisNumber: 'NT32-514022',
    inquirerCount: calculateDynamicInquirers(35, 2),
    viewsCount: calculateDynamicViews(calculateDynamicInquirers(35, 2), 2),
    fobPriceUsd: 3200,
    cfPriceUsd: 4400,
    imageUrl: '/images/cars/car-black.jpg',
    specs: {
      engineCc: '2,000CC',
      mileage: '62,000 KM',
      fuel: 'Hybrid / Petrol',
      transmission: 'Automatic',
      color: 'Diamond Black',
    },
  },
  {
    id: 'w-stock-4',
    vehicleSlug: 'honda-vezel-2022',
    vehicleId: 'veh-4',
    make: 'Honda',
    model: 'Vezel Hybrid Z',
    yom: '2022',
    stockNumber: 'J240111114',
    chassisNumber: 'RU3-1204910',
    inquirerCount: calculateDynamicInquirers(42, 3),
    viewsCount: calculateDynamicViews(calculateDynamicInquirers(42, 3), 3),
    fobPriceUsd: 4850,
    cfPriceUsd: 6100,
    imageUrl: '/images/cars/car-blue.jpg',
    specs: {
      engineCc: '1,500CC',
      mileage: '34,000 KM',
      fuel: 'Hybrid',
      transmission: 'Automatic',
      color: 'Premium Blue',
    },
  },
];

export const CustomerWishlistPage: React.FC = () => {
  const { t } = useTranslation();
  const { setActiveRoute } = useCustomerShell();
  const { items: serverWishlistItems, removeItem } = useCustomerWishlist();

  // Filtering & Pagination (FRD 8.3 & 8.5)
  const [keyword, setKeyword] = useState('');
  const [perPage, setPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Reservation State (Max 2 vehicles per 48 hours)
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

  // Reservation Modal State
  const [reserveModalItem, setReserveModalItem] = useState<WishlistStockItem | null>(null);
  const [reserveSuccess, setReserveSuccess] = useState(false);

  // Inquiry Modal State
  const [inquiryModalItem, setInquiryModalItem] = useState<WishlistStockItem | null>(null);
  const [inquirySent, setInquirySent] = useState(false);
  const [inquiryNote, setInquiryNote] = useState('');
  const [destinationPort, setDestinationPort] = useState('Mombasa, Kenya');

  // Active reservations within 48h (48 * 3600 * 1000 ms)
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

  const handleReserveVehicle = (item: WishlistStockItem) => {
    if (reservedVehicleIds.has(item.vehicleId)) return;
    if (activeReservations.length >= 2) return;

    const next = [...activeReservations, { vehicleId: item.vehicleId, timestamp: Date.now() }];
    setReservations(next);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('carchief_48h_reservations', JSON.stringify(next));
      } catch {
        // ignore
      }
    }
  };

  const handleOpenReserveModal = (item: WishlistStockItem) => {
    setReserveModalItem(item);
    setReserveSuccess(false);
  };

  const handleConfirmReservation = (item: WishlistStockItem) => {
    handleReserveVehicle(item);
    setReserveSuccess(true);
  };

  const handleOpenInquiryModal = (item: WishlistStockItem) => {
    setInquiryModalItem(item);
    setInquirySent(false);
    setInquiryNote(`Requesting FOB & C&F pricing for ${item.make} ${item.model} (${item.stockNumber}).`);
  };

  const handleSendInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInquirySent(true);
  };

  // Local state for stock wishlist items
  const [stockList, setStockList] = useState<WishlistStockItem[]>(SEED_STOCK_WISHLIST);

  useEffect(() => {
    const combinedSlugs: string[] = [];
    if (typeof window !== 'undefined') {
      try {
        const localSlugs: string[] = JSON.parse(localStorage.getItem('carchief_wishlist') || '[]');
        combinedSlugs.push(...localSlugs);
      } catch {
        // ignore
      }
    }
    if (serverWishlistItems && serverWishlistItems.length > 0) {
      for (const item of serverWishlistItems) {
        if (!combinedSlugs.includes(item.vehicleSlug)) {
          combinedSlugs.push(item.vehicleSlug);
        }
      }
    }

    if (combinedSlugs.length > 0) {
      const newItems: WishlistStockItem[] = combinedSlugs.map((slug, idx) => {
        const existing = SEED_STOCK_WISHLIST.find((s) => s.vehicleSlug === slug);
        const serverItem = serverWishlistItems?.find((item) => item.vehicleSlug === slug);
        if (existing) return existing;

        const parts = slug.split('-');
        const year = parts[0]?.match(/^\d{4}$/) ? parts[0] : '2023';
        const make = parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : 'Toyota';
        const model = parts.slice(2).join(' ') || 'Luxury Vehicle';

        const inquirers = calculateDynamicInquirers(21 + ((idx * 7) % 20), idx);

        return {
          id: `w-dynamic-${idx}-${slug}`,
          vehicleSlug: slug,
          vehicleId: serverItem?.vehicleId || `veh-${idx + 10}`,
          make,
          model: model.toUpperCase(),
          yom: year,
          stockNumber: `J240${111110 + idx}`,
          chassisNumber: `${make.toUpperCase().slice(0, 3)}${year}-${100000 + idx}`,
          inquirerCount: inquirers,
          viewsCount: calculateDynamicViews(inquirers, idx),
          fobPriceUsd: 12500,
          cfPriceUsd: 14200,
          imageUrl: '/images/cars/car-white.jpg',
          specs: {
            engineCc: '2,000CC',
            mileage: '45,000 KM',
            fuel: 'Hybrid / Petrol',
            transmission: 'Automatic',
            color: 'Pearl Black',
          },
        };
      });

      for (const seed of SEED_STOCK_WISHLIST) {
        if (!newItems.find((n) => n.vehicleSlug === seed.vehicleSlug)) {
          newItems.push(seed);
        }
      }
      setStockList(newItems);
    }
  }, [serverWishlistItems]);

  const handleRemoveStock = async (id: string, slug: string) => {
    setStockList((prev) => prev.filter((item) => item.id !== id && item.vehicleSlug !== slug));
    if (typeof window !== 'undefined') {
      try {
        const localSlugs: string[] = JSON.parse(localStorage.getItem('carchief_wishlist') || '[]');
        const next = localSlugs.filter((s) => s !== slug);
        localStorage.setItem('carchief_wishlist', JSON.stringify(next));
      } catch {
        // ignore
      }
    }
    try {
      await removeItem(slug);
    } catch {
      // Ignored for demo state
    }
  };

  // Filtered Stock items
  const filteredStockItems = useMemo(() => {
    if (!keyword.trim()) return stockList;
    const q = keyword.toLowerCase().trim();
    return stockList.filter(
      (item) =>
        item.make.toLowerCase().includes(q) ||
        item.model.toLowerCase().includes(q) ||
        item.stockNumber.toLowerCase().includes(q) ||
        item.chassisNumber.toLowerCase().includes(q)
    );
  }, [stockList, keyword]);

  const totalCount = filteredStockItems.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / perPage));
  const visibleStockItems = filteredStockItems.slice((currentPage - 1) * perPage, currentPage * perPage);

  const changePage = (page: number) => {
    const nextPage = Math.max(1, Math.min(totalPages, page));
    setCurrentPage(nextPage);
  };

  return (
    <div className="cc-wishlist-page" data-testid="customer-wishlist-page">
      {/* Page Header */}
      <div className="cc-wishlist-header">
        <div className="cc-wishlist-title-wrap">
          <h1 className="cc-wishlist-title">
            MY <span className="cc-wishlist-title-highlight">WISHLIST</span>
          </h1>
          {/* 48-Hour Reservation Quota Pill */}
          <span className="cc-wishlist-reservation-quota-badge" title="Customers can reserve up to 2 vehicles within 48 hours">
            🔒 48h Hold Quota: <strong>{remainingQuota} of 2 available</strong>
          </span>
        </div>
      </div>

      {/* Filter & Pagination Control Bar (FRD 8.3 & 8.5) */}
      <div className="cc-wishlist-controls-bar">
        <div className="cc-wishlist-search-box">
          <input
            type="search"
            className="cc-wishlist-search-input"
            placeholder="Search make, model, stock, chassis..."
            value={keyword}
            onChange={(e) => { setCurrentPage(1); setKeyword(e.target.value); }}
            data-testid="wishlist-search-input"
          />
        </div>

        <div className="cc-wishlist-counts-wrap">
          {/* FRD 8.5: Found: {count} */}
          <span className="cc-wishlist-found-badge">
            Found: <strong>{totalCount}</strong>
          </span>

          {/* FRD 8.5: Per Page limit (10, 20, 50) */}
          <div className="cc-wishlist-per-page">
            <label htmlFor="wishlist-per-page-select" className="cc-wishlist-per-page-label">
              Per Page:
            </label>
            <select
              id="wishlist-per-page-select"
              className="cc-wishlist-per-page-select"
              value={perPage}
              onChange={(e) => { setCurrentPage(1); setPerPage(Number(e.target.value)); }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content: Stock List Cards (FRD 8.6) */}
      <div className="cc-wishlist-cards-grid cc-wishlist-cards-grid--grid">
          {filteredStockItems.length === 0 ? (
            <div className="cc-wishlist-empty">
              <span className="cc-wishlist-empty-icon">♡</span>
              <h2 className="cc-wishlist-empty-title">No stock vehicles found</h2>
              <p className="cc-wishlist-empty-text">Add vehicles to your wishlist from the inventory list.</p>
              <button className="cc-wishlist-btn-browse" onClick={() => setActiveRoute('/inventory')}>
                Browse Inventory
              </button>
            </div>
          ) : (
            visibleStockItems.map((item) => {
              const isReserved = reservedVehicleIds.has(item.vehicleId);

              return (
                <article key={item.id} className="cc-wishlist-card" data-testid={`wishlist-card-${item.stockNumber}`}>
                  <div
                    className="cc-wishlist-card__image-box"
                    onClick={() => setActiveRoute(`/wishlist/${encodeURIComponent(item.vehicleId || item.vehicleSlug)}`)}
                    role="button"
                    tabIndex={0}
                  >
                    <img src={item.imageUrl} alt={`${item.make} ${item.model}`} className="cc-wishlist-card__image" loading="lazy" />
                    <div className="cc-wishlist-tile-badges-top-left">
                      <span className="cc-wishlist-views-badge">👁️ {item.viewsCount}</span>
                      <span className="cc-wishlist-inquirer-tile-badge">🔥 {item.inquirerCount} inquiring</span>
                      {isReserved && (
                        <span className="cc-wishlist-reserved-tag">🔒 Reserved</span>
                      )}
                    </div>
                    {/* FRD 8.9: REMOVE option on top of tile */}
                    <button
                      type="button"
                      className="cc-wishlist-remove-tile-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveStock(item.id, item.vehicleSlug);
                      }}
                      aria-label="Remove vehicle from wishlist"
                      data-testid={`btn-remove-${item.stockNumber}`}
                      title="Remove from wishlist"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="cc-wishlist-card__body">
                    <div className="cc-wishlist-card__main-content">
                      <div className="cc-wishlist-card__header">
                        <h2
                          className="cc-wishlist-card__title"
                          onClick={() => setActiveRoute(`/wishlist/${encodeURIComponent(item.vehicleId || item.vehicleSlug)}`)}
                          style={{ cursor: 'pointer' }}
                        >
                          {item.yom} {item.make.toUpperCase()} {item.model.toUpperCase()}
                        </h2>
                      </div>

                      {/* Specifications Table (Stock No, Chassis No, Specs, FOB) */}
                      <div className="cc-cust-fleet-card__specs-table" aria-label="Vehicle specifications">
                        <div className="cc-cust-fleet-card__spec-row">
                          <span className="cc-cust-fleet-card__spec-label">Stock No:</span>
                          <span className="cc-cust-fleet-card__spec-value cc-cust-fleet-card__spec-value--mono">
                            {item.stockNumber}
                          </span>
                        </div>
                        <div className="cc-cust-fleet-card__spec-row">
                          <span className="cc-cust-fleet-card__spec-label">Chassis No:</span>
                          <span className="cc-cust-fleet-card__spec-value cc-cust-fleet-card__spec-value--mono">
                            {item.chassisNumber}
                          </span>
                        </div>
                        <div className="cc-cust-fleet-card__spec-row">
                          <span className="cc-cust-fleet-card__spec-label">Color / Spec:</span>
                          <span className="cc-cust-fleet-card__spec-value" title={item.specs.color}>
                            {item.specs.color}
                          </span>
                        </div>
                        <div className="cc-cust-fleet-card__spec-row">
                          <span className="cc-cust-fleet-card__spec-label">Mileage:</span>
                          <span className="cc-cust-fleet-card__spec-value">{item.specs.mileage}</span>
                        </div>
                      </div>
                    </div>

                    {/* Customer Actions & Right Column Financials */}
                    <div className="cc-wishlist-card__financials">
                      <div className="cc-wishlist-fob-price-header">
                        <div className="cc-wishlist-fob-price-box">
                          <span className="cc-wishlist-fob-price-label">FOB Price:</span>
                          <span className="cc-wishlist-fob-price-val">${item.fobPriceUsd.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="cc-wishlist-card__action-group">
                        <button
                          type="button"
                          className="cc-wishlist-action-btn cc-wishlist-action-btn--inquire"
                          onClick={() => handleOpenInquiryModal(item)}
                          data-testid={`btn-inquire-${item.stockNumber}`}
                        >
                          <span className="cc-wishlist-btn-text--desktop">💬 Inquire Vehicle</span>
                          <span className="cc-wishlist-btn-text--mobile">Inquire</span>
                        </button>

                        {isReserved ? (
                          <span className="cc-wishlist-action-badge cc-wishlist-action-badge--reserved">
                            <span className="cc-wishlist-btn-text--desktop">✓ Reserved (48h)</span>
                            <span className="cc-wishlist-btn-text--mobile">Reserved</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="cc-wishlist-action-btn cc-wishlist-action-btn--reserve"
                            onClick={() => handleOpenReserveModal(item)}
                            disabled={remainingQuota <= 0}
                            title={
                              remainingQuota <= 0
                                ? 'Reservation limit reached: Max 2 vehicles within 48 hours'
                                : 'Reserve vehicle for 48 hours'
                            }
                            data-testid={`btn-reserve-${item.stockNumber}`}
                          >
                            <span className="cc-wishlist-btn-text--desktop">🔒 Reserve Now</span>
                            <span className="cc-wishlist-btn-text--mobile">Reserve Now</span>
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                </article>
              );
            })
          )}
      </div>

      {totalPages > 1 && (
        <nav className="cc-wishlist-pagination" aria-label="Wishlist pagination">
          <button type="button" onClick={() => changePage(currentPage - 1)} disabled={currentPage === 1}>
            {t('customer.previous', undefined, 'Previous')}
          </button>
          <span aria-live="polite">
            {t('customer.pageOf', { page: currentPage, total: totalPages }, `Page ${currentPage} of ${totalPages}`)}
          </span>
          <button type="button" onClick={() => changePage(currentPage + 1)} disabled={currentPage === totalPages}>
            {t('customer.next', undefined, 'Next')}
          </button>
        </nav>
      )}

      {/* Vehicle Inquiry Modal Dialog */}
      {inquiryModalItem && (
        <div className="cc-wishlist-modal-overlay" onClick={() => setInquiryModalItem(null)}>
          <div className="cc-wishlist-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="cc-wishlist-modal-header">
              <h3 className="cc-wishlist-modal-title">
                <span>💬</span> Inquire Vehicle — {inquiryModalItem.make} {inquiryModalItem.model}
              </h3>
              <button
                type="button"
                className="cc-wishlist-modal-close"
                onClick={() => setInquiryModalItem(null)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="cc-wishlist-modal-body">
              {inquirySent ? (
                <div className="cc-wishlist-modal-success">
                  <div className="cc-wishlist-modal-success-icon">✓</div>
                  <h4 className="cc-wishlist-modal-success-title">Inquiry Sent Successfully!</h4>
                  <div className="cc-wishlist-modal-success-badge">
                    Inquiry Reference: {inquiryModalItem.stockNumber}
                  </div>
                  <p className="cc-wishlist-modal-success-desc">
                    Our sales team will contact you shortly with full FOB &amp; freight quotation for your destination port ({destinationPort}).
                  </p>
                  <div className="cc-wishlist-modal-actions" style={{ borderTop: 'none', justifyContent: 'center', width: '100%', marginTop: 8 }}>
                    <button
                      type="button"
                      className="cc-wishlist-modal-btn cc-wishlist-modal-btn--primary"
                      onClick={() => setInquiryModalItem(null)}
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSendInquirySubmit} className="cc-wishlist-form">
                  <div className="cc-wishlist-modal-vehicle-summary">
                    <img src={inquiryModalItem.imageUrl} alt={inquiryModalItem.model} className="cc-wishlist-modal-vehicle-thumb" />
                    <div className="cc-wishlist-modal-vehicle-info">
                      <div className="cc-wishlist-modal-vehicle-name">{inquiryModalItem.yom} {inquiryModalItem.make} {inquiryModalItem.model}</div>
                      <div className="cc-wishlist-modal-vehicle-meta">Stock: {inquiryModalItem.stockNumber} | Chassis: {inquiryModalItem.chassisNumber}</div>
                      <div className="cc-wishlist-modal-vehicle-price"><span>FOB Price:</span> ${inquiryModalItem.fobPriceUsd.toLocaleString()} USD</div>
                    </div>
                  </div>

                  <div className="cc-wishlist-form-group">
                    <label htmlFor="inquiry-destination" className="cc-wishlist-form-label">
                      Destination Discharge Port:
                    </label>
                    <input
                      id="inquiry-destination"
                      type="text"
                      className="cc-wishlist-form-input"
                      value={destinationPort}
                      onChange={(e) => setDestinationPort(e.target.value)}
                      required
                    />
                  </div>

                  <div className="cc-wishlist-form-group">
                    <label htmlFor="inquiry-note" className="cc-wishlist-form-label">
                      Inquiry Message &amp; Requirements:
                    </label>
                    <textarea
                      id="inquiry-note"
                      className="cc-wishlist-form-textarea"
                      rows={3}
                      value={inquiryNote}
                      onChange={(e) => setInquiryNote(e.target.value)}
                      required
                    />
                  </div>

                  <div className="cc-wishlist-modal-actions">
                    <button
                      type="button"
                      className="cc-wishlist-modal-btn cc-wishlist-modal-btn--secondary"
                      onClick={() => setInquiryModalItem(null)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="cc-wishlist-modal-btn cc-wishlist-modal-btn--primary">
                      Send Inquiry Now →
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Vehicle Reserve Confirmation Modal Dialog */}
      {reserveModalItem && (
        <div className="cc-wishlist-modal-overlay" onClick={() => setReserveModalItem(null)}>
          <div className="cc-wishlist-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="cc-wishlist-modal-header">
              <h3 className="cc-wishlist-modal-title">
                <span>🔒</span> Confirm 48-Hour Vehicle Reservation
              </h3>
              <button
                type="button"
                className="cc-wishlist-modal-close"
                onClick={() => setReserveModalItem(null)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="cc-wishlist-modal-body">
              {reserveSuccess ? (
                <div className="cc-wishlist-modal-success">
                  <div className="cc-wishlist-modal-success-icon">✓</div>
                  <h4 className="cc-wishlist-modal-success-title">Vehicle Reserved Successfully!</h4>
                  <div className="cc-wishlist-modal-success-badge">
                    🔒 48:00:00 Priority Hold Active
                  </div>
                  <p className="cc-wishlist-modal-success-desc">
                    Your 48-hour reservation hold for <strong>{reserveModalItem.yom} {reserveModalItem.make} {reserveModalItem.model}</strong> ({reserveModalItem.stockNumber}) is now active.
                  </p>
                  <p className="cc-wishlist-reserve-callout-subtext" style={{ textAlign: 'center' }}>
                    You can view and track your hold in <strong>MY ORDERS &gt; Reserved Vehicles</strong>.
                  </p>
                  <div className="cc-wishlist-modal-actions" style={{ borderTop: 'none', justifyContent: 'center', width: '100%', marginTop: 8 }}>
                    <button
                      type="button"
                      className="cc-wishlist-modal-btn cc-wishlist-modal-btn--primary"
                      onClick={() => setReserveModalItem(null)}
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="cc-wishlist-modal-vehicle-summary">
                    <img src={reserveModalItem.imageUrl} alt={reserveModalItem.model} className="cc-wishlist-modal-vehicle-thumb" />
                    <div className="cc-wishlist-modal-vehicle-info">
                      <div className="cc-wishlist-modal-vehicle-name">{reserveModalItem.yom} {reserveModalItem.make} {reserveModalItem.model}</div>
                      <div className="cc-wishlist-modal-vehicle-meta">Stock: {reserveModalItem.stockNumber} | Chassis: {reserveModalItem.chassisNumber}</div>
                      <div className="cc-wishlist-modal-vehicle-price"><span>FOB Price:</span> ${reserveModalItem.fobPriceUsd.toLocaleString()} USD</div>
                    </div>
                  </div>

                  <div className="cc-wishlist-reserve-callout">
                    <div className="cc-wishlist-reserve-callout-header">
                      <span>Free 48-Hour Priority Hold</span>
                      <span>Quota: {remainingQuota} of 2 Remaining</span>
                    </div>
                    <p className="cc-wishlist-reserve-callout-text">
                      Reserving this vehicle places an exclusive 48-hour hold for your account without any upfront payment. You can hold up to 2 vehicles simultaneously.
                    </p>
                    <p className="cc-wishlist-reserve-callout-subtext">
                      Once confirmed, our sales team will verify inventory availability and prepare your Proforma Invoice.
                    </p>
                  </div>

                  <div className="cc-wishlist-modal-actions">
                    <button
                      type="button"
                      className="cc-wishlist-modal-btn cc-wishlist-modal-btn--secondary"
                      onClick={() => setReserveModalItem(null)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="cc-wishlist-modal-btn cc-wishlist-modal-btn--reserve"
                      onClick={() => handleConfirmReservation(reserveModalItem)}
                    >
                      🔒 Confirm 48h Hold
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function mapAiVehicleToWishlistItem(vehicle: VehicleDomainSummary): WishlistStockItem {
  const inquirers = calculateDynamicInquirers(22 + (vehicle.id.length % 15));
  return {
    id: vehicle.id,
    vehicleId: vehicle.id,
    vehicleSlug: vehicle.slug || vehicle.id,
    make: vehicle.make,
    model: vehicle.model,
    yom: String(vehicle.year),
    stockNumber: vehicle.stockLocation || vehicle.id,
    chassisNumber: vehicle.chassisNumber,
    inquirerCount: inquirers,
    viewsCount: calculateDynamicViews(inquirers, vehicle.id.length),
    fobPriceUsd: vehicle.tierPricing?.tierPriceUsd ?? vehicle.priceUsd,
    imageUrl: vehicle.images?.[0] || '',
    specs: {
      engineCc: vehicle.engineCc ? `${vehicle.engineCc.toLocaleString()}CC` : '—',
      mileage: vehicle.mileage !== undefined ? `${vehicle.mileage.toLocaleString()} KM` : '—',
      fuel: vehicle.fuelType || '—',
      transmission: vehicle.transmission || '—',
      color: vehicle.color || '—',
    },
  };
}
