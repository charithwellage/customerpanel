'use client';

import React, { useState, useEffect } from 'react';
import type { VehicleDomainSummary } from '@carchief/domain';
import { HttpClient, VehicleService } from '@carchief/api-client';
import { MarketControls } from './MarketControls';
import { VehicleCollection } from '../../vehicles/components/VehicleCollection';
import { PremiumTeaserSection } from './PremiumTeaserSection';
import { PromotionsCountdown } from './PromotionsCountdown';
import { BuyingProcessPreview } from './BuyingProcessPreview';
import { TestimonialsPreview } from './TestimonialsPreview';
import { FaqPreview } from './FaqPreview';
import { GlobalLogisticsSection } from './GlobalLogisticsSection';
import { CorporateTrustShowcase } from './CorporateTrustShowcase';

export interface HomeShowroomProps {
  initialVehicles?: VehicleDomainSummary[];
}

export const HomeShowroom: React.FC<HomeShowroomProps> = ({ initialVehicles = [] }) => {
  const [selectedMarket, setSelectedMarket] = useState<string>('UG');
  const [latestArrivals, setLatestArrivals] = useState<VehicleDomainSummary[]>([]);
  const [premiumTeaser, setPremiumTeaser] = useState<VehicleDomainSummary[]>([]);
  const [discountedStock, setDiscountedStock] = useState<VehicleDomainSummary[]>([]);
  const [browseStock, setBrowseStock] = useState<VehicleDomainSummary[]>(initialVehicles);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const baseUrl = typeof window !== 'undefined' ? '' : process.env.API_BASE_URL || 'http://localhost:4000';
      const client = new HttpClient({ baseUrl });
      const service = new VehicleService(client);

      const [latestRes, premiumRes, discountedRes, browseRes] = await Promise.all([
        service.getVehicles({ collection: 'latest_arrivals', market: selectedMarket }),
        service.getVehicles({ collection: 'premium_teaser', market: selectedMarket, limit: 10 }),
        service.getVehicles({ collection: 'discounted', market: selectedMarket }),
        service.getVehicles({ collection: 'browse', market: selectedMarket }),
      ]);

      setLatestArrivals(latestRes);
      setPremiumTeaser(premiumRes);
      setDiscountedStock(discountedRes);
      setBrowseStock(browseRes);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load vehicle collections');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedMarket]);

  return (
    <div className="showroom" id="showroom">
      <div className="home-section-header">
        <MarketControls selectedMarket={selectedMarket} onMarketChange={setSelectedMarket} />
      </div>

      <PromotionsCountdown />

      {/* Discounted / Best Offer / Clearance Section */}
      {discountedStock.length > 0 && (
        <section className="home-section-compact">
          <VehicleCollection
            title="Discounted & Clearance Stock"
            description="Special pricing and clearance offers."
            vehicles={discountedStock}
            isLoading={isLoading}
            error={error}
            onRetry={loadData}
          />
        </section>
      )}

      {/* Latest Arrivals Section (5-day window, In Japan) */}
      <section className="home-section-compact">
        <VehicleCollection
          title="Latest Arrivals (In Japan)"
          description="Eligible stock created within the last 5 days."
          vehicles={latestArrivals}
          isLoading={isLoading}
          error={error}
          onRetry={loadData}
          emptyTitle="No Latest Arrivals in 5-day Window"
          emptyDescription="There are currently no new In Japan arrivals created in the last 5 days."
        />
      </section>

      {/* Premium Stock Teaser Section */}
      <PremiumTeaserSection vehicles={premiumTeaser} isLoading={isLoading} error={error} onRetry={loadData} />

      {/* Browse All Stock Section */}
      <section className="home-section-compact">
        <VehicleCollection
          title="Browse All Stock"
          description="Available inventory ordered by location (In Port -> In Transit -> In Japan)."
          vehicles={browseStock}
          isLoading={isLoading}
          error={error}
          onRetry={loadData}
        />

        {!isLoading && !error && browseStock.length > 0 && (
          <div className="cc-browse-all-container">
            <a
              href="/allstock"
              className="cc-load-more-pill-btn"
              id="home-browse-all-stock-btn"
              aria-label="Browse all vehicles in stock"
            >
              <svg
                className="cc-pill-car-icon"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                <circle cx="7" cy="17" r="2" />
                <path d="M9 17h6" />
                <circle cx="17" cy="17" r="2" />
              </svg>
              <span className="cc-pill-btn-label">LOAD MORE VEHICLES (33 REMAINING)</span>
              <svg
                className="cc-pill-chevron-icon"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </a>
            <div className="cc-browse-all-subtext">
              Showing {browseStock.length > 0 ? browseStock.length : 12} of 45 total models
            </div>
          </div>
        )}
      </section>

      {/* Global Logistics Pipeline & Tailored Export Solutions */}
      <GlobalLogisticsSection />

      {/* Ultimate Sourcing Trust & Corporate Statement */}
      <CorporateTrustShowcase />

      <BuyingProcessPreview />
      <TestimonialsPreview />
      <FaqPreview />
    </div>
  );
};
