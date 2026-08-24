import React, { useState, useMemo, useEffect } from 'react';
import type { WishlistItem } from '@carchief/domain';
import { useCustomerShell } from '../shell/index.js';
import { useCustomerWishlist } from './useCustomerWishlist.js';
import { ViewModeToggle, type ViewMode } from '../../components/ViewModeToggle.js';
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

export const CustomerWishlistPage: React.FC = () => {
  const { setActiveRoute } = useCustomerShell();
  const { items: serverWishlistItems, removeItem } = useCustomerWishlist();

  // Filtering & Pagination (FRD 8.3 & 8.5)
  const [keyword, setKeyword] = useState('');
  const [perPage, setPerPage] = useState<number>(10);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

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
        if (existing) return existing;

        const parts = slug.split('-');
        const year = parts[0]?.match(/^\d{4}$/) ? parts[0] : '2023';
        const make = parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : 'Toyota';
        const model = parts.slice(2).join(' ') || 'Luxury Vehicle';

        return {
          id: `w-dynamic-${idx}-${slug}`,
          vehicleSlug: slug,
          vehicleId: `veh-${idx + 10}`,
          make,
          model: model.toUpperCase(),
          yom: year,
          stockNumber: `J240${111110 + idx}`,
          chassisNumber: `${make.toUpperCase().slice(0, 3)}${year}-${100000 + idx}`,
          viewsCount: 24,
          fobPriceUsd: 12500,
          cfPriceUsd: 14200,
          inquirerCount: 6,
          imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600',
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

  return (
    <div className="cc-wishlist-page" data-testid="customer-wishlist-page">
      {/* Filter & Pagination Control Bar (FRD 8.3 & 8.5) */}
      <div className="cc-wishlist-controls-bar">
        <div className="cc-wishlist-search-box">
          <input
            type="search"
            className="cc-wishlist-search-input"
            placeholder="Search make, model, stock, chassis..."
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
          <ViewModeToggle value={viewMode} onChange={setViewMode} label="Wishlist vehicle view" />
        </div>
      </div>

      {/* Main Content: Stock List Cards (FRD 8.6) */}
      <div className={`cc-wishlist-cards-grid cc-wishlist-cards-grid--${viewMode}`}>
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

                </div>
              </article>
            ))
          )}
      </div>
    </div>
  );
};
