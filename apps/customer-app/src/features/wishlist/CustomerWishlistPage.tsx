import React, { useState, useMemo } from 'react';
import type { WishlistItem } from '@carchief/domain';
import { useCustomerShell } from '../shell/index.js';
import { useCustomerWishlist } from './useCustomerWishlist.js';
import './wishlist.css';

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

export interface WishlistAuctionItem {
  id: string;
  lotNumber: string;
  group: 'A' | 'B' | 'C' | 'D';
  make: string;
  model: string;
  yom: string;
  startPriceUsd: number;
  auctionRemaining: string;
  imageUrl: string;
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
    viewsCount: 12,
    fobPriceUsd: 1400,
    cfPriceUsd: 2400,
    inquirerCount: 4,
    imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600',
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
    viewsCount: 18,
    fobPriceUsd: 980,
    cfPriceUsd: 1980,
    inquirerCount: 2,
    imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600',
    specs: {
      engineCc: '1,300CC',
      mileage: '88,000 KM',
      fuel: 'Petrol',
      transmission: 'Automatic',
      color: 'Soul Red',
    },
  },
];

export const SEED_AUCTION_WISHLIST: WishlistAuctionItem[] = [
  {
    id: 'w-auc-1',
    lotNumber: '36071',
    group: 'A',
    make: 'Toyota',
    model: 'Raize Z 4WD',
    yom: '2024',
    startPriceUsd: 1400,
    auctionRemaining: '2 hr 45 min',
    imageUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600',
  },
  {
    id: 'w-auc-2',
    lotNumber: '50912',
    group: 'B',
    make: 'Nissan',
    model: 'X-Trail Hybrid',
    yom: '2023',
    startPriceUsd: 2200,
    auctionRemaining: 'Finished',
    imageUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600',
  },
];

export const CustomerWishlistPage: React.FC = () => {
  const { setActiveRoute } = useCustomerShell();
  const { removeItem } = useCustomerWishlist();

  // Category selection (FRD 8.2: Stock List vs Auction)
  const [activeCategory, setActiveCategory] = useState<'STOCK' | 'AUCTION'>('STOCK');
  const [selectedAuctionGroup, setSelectedAuctionGroup] = useState<'ALL' | 'A' | 'B' | 'C' | 'D'>('ALL');

  // Filtering & Pagination (FRD 8.3 & 8.5)
  const [keyword, setKeyword] = useState('');
  const [perPage, setPerPage] = useState<number>(10);

  // Local state for stock and auction wishlist items
  const [stockList, setStockList] = useState<WishlistStockItem[]>(SEED_STOCK_WISHLIST);
  const [auctionList, setAuctionList] = useState<WishlistAuctionItem[]>(SEED_AUCTION_WISHLIST);

  const handleRemoveStock = async (id: string, slug: string) => {
    setStockList((prev) => prev.filter((item) => item.id !== id));
    try {
      await removeItem(slug);
    } catch {
      // Ignored for demo state
    }
  };

  const handleRemoveAuction = (id: string) => {
    setAuctionList((prev) => prev.filter((item) => item.id !== id));
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

  // Filtered Auction items
  const filteredAuctionItems = useMemo(() => {
    let result = auctionList;
    if (selectedAuctionGroup !== 'ALL') {
      result = result.filter((item) => item.group === selectedAuctionGroup);
    }
    if (keyword.trim()) {
      const q = keyword.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.make.toLowerCase().includes(q) ||
          item.model.toLowerCase().includes(q) ||
          item.lotNumber.toLowerCase().includes(q)
      );
    }
    return result;
  }, [auctionList, selectedAuctionGroup, keyword]);

  const totalCount = activeCategory === 'STOCK' ? filteredStockItems.length : filteredAuctionItems.length;

  return (
    <div className="cc-wishlist-page" data-testid="customer-wishlist-page">
      {/* Category Tabs: Stock List vs Auction (FRD 8.2) */}
      <div className="cc-wishlist-tabs" role="tablist" aria-label="Wishlist category selection">
        <button
          type="button"
          role="tab"
          aria-selected={activeCategory === 'STOCK'}
          className={`cc-wishlist-tab-btn ${activeCategory === 'STOCK' ? 'cc-wishlist-tab-btn--active' : ''}`}
          onClick={() => setActiveCategory('STOCK')}
          data-testid="tab-stock-wishlist"
        >
          Stock List ({stockList.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeCategory === 'AUCTION'}
          className={`cc-wishlist-tab-btn ${activeCategory === 'AUCTION' ? 'cc-wishlist-tab-btn--active' : ''}`}
          onClick={() => setActiveCategory('AUCTION')}
          data-testid="tab-auction-wishlist"
        >
          Auction ({auctionList.length})
        </button>
      </div>

      {/* Auction Group Filter Pills (FRD 8.2: Group A, B, C, D) */}
      {activeCategory === 'AUCTION' && (
        <div className="cc-wishlist-auction-groups" role="group" aria-label="Auction groups">
          <span className="cc-wishlist-groups-label">Auction Groups:</span>
          {(['ALL', 'A', 'B', 'C', 'D'] as const).map((grp) => (
            <button
              key={grp}
              type="button"
              className={`cc-wishlist-group-pill ${selectedAuctionGroup === grp ? 'cc-wishlist-group-pill--active' : ''}`}
              onClick={() => setSelectedAuctionGroup(grp)}
            >
              {grp === 'ALL' ? 'All Groups' : `Group ${grp}`}
            </button>
          ))}
        </div>
      )}

      {/* Filter & Pagination Control Bar (FRD 8.3 & 8.5) */}
      <div className="cc-wishlist-controls-bar">
        <div className="cc-wishlist-search-box">
          <input
            type="search"
            className="cc-wishlist-search-input"
            placeholder={activeCategory === 'STOCK' ? 'Search make, model, stock, chassis...' : 'Search auction lot, model...'}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
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
              onChange={(e) => setPerPage(Number(e.target.value))}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content: Stock List Cards (FRD 8.6) */}
      {activeCategory === 'STOCK' ? (
        <div className="cc-wishlist-cards-grid">
          {filteredStockItems.length === 0 ? (
            <div className="cc-wishlist-empty">
              <span className="cc-wishlist-empty-icon">❤️</span>
              <h2 className="cc-wishlist-empty-title">No stock vehicles found</h2>
              <p className="cc-wishlist-empty-text">Add vehicles to your wishlist from the inventory list.</p>
              <button className="cc-wishlist-btn-browse" onClick={() => setActiveRoute('/inventory')}>
                Browse Inventory
              </button>
            </div>
          ) : (
            filteredStockItems.slice(0, perPage).map((item) => (
              <article key={item.id} className="cc-wishlist-card" data-testid={`wishlist-card-${item.stockNumber}`}>
                <div
                  className="cc-wishlist-card__image-box"
                  onClick={() => setActiveRoute(`/inventory/${item.vehicleSlug}`)}
                  role="button"
                  tabIndex={0}
                >
                  <img src={item.imageUrl} alt={`${item.make} ${item.model}`} className="cc-wishlist-card__image" loading="lazy" />
                  <span className="cc-wishlist-views-badge">👁️ {item.viewsCount} views</span>
                </div>

                <div className="cc-wishlist-card__body">
                  <div className="cc-wishlist-card__header">
                    <h2 className="cc-wishlist-card__title">
                      {item.make} + {item.model} + {item.yom}
                    </h2>
                    {/* FRD 8.9: REMOVE option */}
                    <button
                      type="button"
                      className="cc-wishlist-remove-link"
                      onClick={() => handleRemoveStock(item.id, item.vehicleSlug)}
                      aria-label="Remove vehicle from wishlist"
                      data-testid={`btn-remove-${item.stockNumber}`}
                    >
                      REMOVE ✕
                    </button>
                  </div>

                  <div className="cc-wishlist-card__meta">
                    <span className="cc-wishlist-meta-text">Stock: <strong>{item.stockNumber}</strong></span>
                    <span className="cc-wishlist-meta-text">Chassis: <strong>{item.chassisNumber}</strong></span>
                  </div>

                  <div className="cc-wishlist-card__specs">
                    <span className="cc-wishlist-spec-tag">⚙️ {item.specs.engineCc}</span>
                    <span className="cc-wishlist-spec-tag">⚡ {item.specs.mileage}</span>
                    <span className="cc-wishlist-spec-tag">⛽ {item.specs.fuel}</span>
                    <span className="cc-wishlist-spec-tag">🕹️ {item.specs.transmission}</span>
                    <span className="cc-wishlist-spec-tag">🎨 {item.specs.color}</span>
                  </div>

                  <div className="cc-wishlist-card__financials">
                    <div className="cc-wishlist-price-block">
                      <span className="cc-wishlist-price-label">FOB Price:</span>
                      <span className="cc-wishlist-price-val">${item.fobPriceUsd.toLocaleString()} USD</span>
                    </div>
                    <span className="cc-wishlist-inquirer-note">
                      {item.inquirerCount} people are inquiring
                    </span>
                  </div>

                  <div className="cc-wishlist-card__actions">
                    {/* FRD 8.7: WhatsApp Now */}
                    <button
                      type="button"
                      className="cc-wishlist-action-btn cc-wishlist-action-btn--whatsapp"
                      onClick={() => {
                        setActiveRoute(`/inventory/${item.vehicleSlug}`);
                        window.open(`https://wa.me/94715991619?text=Inquiry%20for%20${encodeURIComponent(item.stockNumber)}`, '_blank');
                      }}
                      data-testid={`btn-whatsapp-${item.stockNumber}`}
                    >
                      💬 WhatsApp Now
                    </button>

                    {/* FRD 8.8: Get Free Quote */}
                    <button
                      type="button"
                      className="cc-wishlist-action-btn cc-wishlist-action-btn--quote"
                      onClick={() => {
                        setActiveRoute(`/inventory/${item.vehicleSlug}`);
                        setTimeout(() => {
                          const quoteSection = document.getElementById('get-free-quote-section');
                          if (quoteSection) quoteSection.scrollIntoView({ behavior: 'smooth' });
                        }, 300);
                      }}
                      data-testid={`btn-quote-${item.stockNumber}`}
                    >
                      📋 Get Free Quote
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      ) : (
        /* Auction Cards List */
        <div className="cc-wishlist-cards-grid">
          {filteredAuctionItems.length === 0 ? (
            <div className="cc-wishlist-empty">
              <span className="cc-wishlist-empty-icon">🔨</span>
              <h2 className="cc-wishlist-empty-title">No auction vehicles found</h2>
              <p className="cc-wishlist-empty-text">No wishlisted auction items in the selected group.</p>
            </div>
          ) : (
            filteredAuctionItems.slice(0, perPage).map((item) => (
              <article key={item.id} className="cc-wishlist-card cc-wishlist-card--auction" data-testid={`wishlist-auc-${item.lotNumber}`}>
                <div className="cc-wishlist-card__image-box">
                  <img src={item.imageUrl} alt={`${item.make} ${item.model}`} className="cc-wishlist-card__image" loading="lazy" />
                  <span className="cc-wishlist-group-tag">Group {item.group}</span>
                </div>

                <div className="cc-wishlist-card__body">
                  <div className="cc-wishlist-card__header">
                    <h2 className="cc-wishlist-card__title">
                      {item.make} + {item.model} + {item.yom}
                    </h2>
                    <button
                      type="button"
                      className="cc-wishlist-remove-link"
                      onClick={() => handleRemoveAuction(item.id)}
                      aria-label="Remove auction vehicle from wishlist"
                    >
                      REMOVE ✕
                    </button>
                  </div>

                  <div className="cc-wishlist-card__meta">
                    <span className="cc-wishlist-meta-text">Lot No.: <strong>{item.lotNumber}</strong></span>
                  </div>

                  <div className="cc-wishlist-card__financials">
                    <div className="cc-wishlist-price-block">
                      <span className="cc-wishlist-price-label">Starting Price:</span>
                      <span className="cc-wishlist-price-val">${item.startPriceUsd.toLocaleString()} USD</span>
                    </div>
                    <span className="cc-wishlist-auction-timer">
                      {item.auctionRemaining}
                    </span>
                  </div>

                  <div className="cc-wishlist-card__actions">
                    <button
                      type="button"
                      className="cc-wishlist-action-btn cc-wishlist-action-btn--quote"
                      onClick={() => setActiveRoute('/inventory')}
                    >
                      View Live Auction Bids
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      )}
    </div>
  );
};
