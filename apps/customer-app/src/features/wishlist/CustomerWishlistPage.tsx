import React, { useState, useMemo, useEffect } from 'react';
import type { VehicleDomainSummary, WishlistItem } from '@carchief/domain';
import { AiVehicleSearchService } from '@carchief/api-client';
import { AiVehicleSearch, useAiVehicleSearch } from '@carchief/vehicle-search';
import { useCustomerShell } from '../shell/index.js';
import { useHttpClient } from '../account/index.js';
import { useCustomerWishlist } from './useCustomerWishlist.js';
import { ViewModeToggle, type ViewMode } from '../../components/ViewModeToggle.js';
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
  const { t } = useTranslation();
  const { setActiveRoute } = useCustomerShell();
  const httpClient = useHttpClient();
  const { items: serverWishlistItems, removeItem } = useCustomerWishlist();

  // Filtering & Pagination (FRD 8.3 & 8.5)
  const [keyword, setKeyword] = useState('');
  const [perPage, setPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Local state for stock wishlist items
  const [stockList, setStockList] = useState<WishlistStockItem[]>(SEED_STOCK_WISHLIST);
  const aiService = useMemo(() => httpClient ? new AiVehicleSearchService(httpClient) : null, [httpClient]);
  const ai = useAiVehicleSearch({
    service: aiService,
    request: {
      scope: 'customerWishlist',
      page: currentPage,
      limit: perPage,
      constraints: { vehicleIds: stockList.map((item) => item.vehicleId) },
    },
  });

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

        return {
          id: `w-dynamic-${idx}-${slug}`,
          vehicleSlug: slug,
          vehicleId: serverItem?.vehicleId || `veh-${idx + 10}`,
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
    ai.clear();
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
  const aiStockItems = useMemo(() => {
    if (ai.result?.scope !== 'customerWishlist') return null;
    return (ai.result.items as VehicleDomainSummary[]).map(mapAiVehicleToWishlistItem);
  }, [ai.result]);

  const filteredStockItems = useMemo(() => {
    const source = aiStockItems || stockList;
    if (aiStockItems || !keyword.trim()) return source;
    const q = keyword.toLowerCase().trim();
    return source.filter(
      (item) =>
        item.make.toLowerCase().includes(q) ||
        item.model.toLowerCase().includes(q) ||
        item.stockNumber.toLowerCase().includes(q) ||
        item.chassisNumber.toLowerCase().includes(q)
    );
  }, [aiStockItems, stockList, keyword]);

  const totalCount = ai.isActive ? ai.result?.total || 0 : filteredStockItems.length;
  const totalPages = Math.max(1, ai.isActive
    ? ai.result?.totalPages || 1
    : Math.ceil(totalCount / perPage));
  const visibleStockItems = ai.isActive
    ? filteredStockItems
    : filteredStockItems.slice((currentPage - 1) * perPage, currentPage * perPage);

  const changePage = (page: number) => {
    const nextPage = Math.max(1, Math.min(totalPages, page));
    setCurrentPage(nextPage);
    if (ai.isActive) void ai.search({ page: nextPage, limit: perPage });
  };

  return (
    <div className="cc-wishlist-page" data-testid="customer-wishlist-page">
      <AiVehicleSearch
        id="customer-wishlist-ai-search"
        value={ai.prompt}
        onChange={ai.setPrompt}
        onSubmit={() => { setCurrentPage(1); void ai.search({ page: 1, limit: perPage }); }}
        onClear={() => { setCurrentPage(1); ai.clear(); }}
        isLoading={ai.isLoading}
        isActive={ai.isActive}
        unavailable={ai.unavailable}
        error={ai.error}
        summary={ai.result?.interpretation.summary}
        appliedConstraints={ai.result?.interpretation.appliedConstraints}
        copy={{
          label: t('aiSearch.label', undefined, 'AI Search'),
          placeholder: t('aiSearch.wishlistPlaceholder', undefined, 'Ask AI to find a vehicle in your wishlist'),
          submit: t('aiSearch.submit', undefined, 'Search with AI'),
          submitting: t('aiSearch.submitting', undefined, 'Searching…'),
          clear: t('aiSearch.clear', undefined, 'Clear AI search'),
          unavailable: t('aiSearch.unavailable', undefined, 'AI search is not yet available in this environment. Try the regular vehicle search and filters.'),
          resultsLabel: t('aiSearch.results', undefined, 'AI search results'),
        }}
      />
      {/* Filter & Pagination Control Bar (FRD 8.3 & 8.5) */}
      <div className="cc-wishlist-controls-bar">
        <div className="cc-wishlist-search-box">
          <input
            type="search"
            className="cc-wishlist-search-input"
            placeholder="Search make, model, stock, chassis..."
            value={keyword}
            onChange={(e) => { ai.clear(); setCurrentPage(1); setKeyword(e.target.value); }}
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
              onChange={(e) => { ai.clear(); setCurrentPage(1); setPerPage(Number(e.target.value)); }}
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
            visibleStockItems.map((item) => (
              <article key={item.id} className="cc-wishlist-card" data-testid={`wishlist-card-${item.stockNumber}`}>
                <div
                  className="cc-wishlist-card__image-box"
                  onClick={() => setActiveRoute(`/inventory/${encodeURIComponent(item.vehicleId || item.vehicleSlug)}`)}
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

                  <div className="cc-cust-fleet-card__specs-table" aria-label="Vehicle specifications">
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
                    <div className="cc-cust-fleet-card__spec-divider" />
                    <div className="cc-cust-fleet-card__spec-row">
                      <span className="cc-cust-fleet-card__spec-label cc-cust-fleet-card__spec-label--fob">Selling Price:</span>
                      <span className="cc-cust-fleet-card__spec-value cc-cust-fleet-card__spec-value--fob">
                        ${item.fobPriceUsd.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="cc-wishlist-card__financials">
                    <div className="cc-wishlist-price-block">
                      <span className="cc-wishlist-price-label">Selling Price:</span>
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
    </div>
  );
};

function mapAiVehicleToWishlistItem(vehicle: VehicleDomainSummary): WishlistStockItem {
  return {
    id: vehicle.id,
    vehicleId: vehicle.id,
    vehicleSlug: vehicle.slug || vehicle.id,
    make: vehicle.make,
    model: vehicle.model,
    yom: String(vehicle.year),
    stockNumber: vehicle.stockLocation || vehicle.id,
    chassisNumber: vehicle.chassisNumber,
    viewsCount: 0,
    fobPriceUsd: vehicle.tierPricing?.tierPriceUsd ?? vehicle.priceUsd,
    inquirerCount: 0,
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
