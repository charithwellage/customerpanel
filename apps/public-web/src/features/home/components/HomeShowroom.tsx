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

export const HomeShowroom: React.FC = () => {
  const [selectedMarket, setSelectedMarket] = useState<string>('UG');
  const [latestArrivals, setLatestArrivals] = useState<VehicleDomainSummary[]>([]);
  const [premiumTeaser, setPremiumTeaser] = useState<VehicleDomainSummary[]>([]);
  const [discountedStock, setDiscountedStock] = useState<VehicleDomainSummary[]>([]);
  const [latestTotal, setLatestTotal] = useState(0);
  const [premiumTotal, setPremiumTotal] = useState(0);
  const [discountedTotal, setDiscountedTotal] = useState(0);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const baseUrl = typeof window !== 'undefined' ? '' : process.env.API_BASE_URL || 'http://localhost:4000';
      const client = new HttpClient({ baseUrl });
      const service = new VehicleService(client);

      const [latestRes, premiumRes, discountedRes] = await Promise.all([
        service.getVehicles({ collection: 'latest_arrivals', market: selectedMarket, limit: 10 }),
        service.getVehicles({ collection: 'premium_teaser', market: selectedMarket, limit: 10 }),
        service.getVehicles({ collection: 'discounted', market: selectedMarket, limit: 10 }),
      ]);

      setLatestArrivals(latestRes.items);
      setLatestTotal(latestRes.total);
      setPremiumTeaser(premiumRes.items);
      setPremiumTotal(premiumRes.total);
      setDiscountedStock(discountedRes.items);
      setDiscountedTotal(discountedRes.total);
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
          {!isLoading && !error && discountedTotal > 10 && <HomeCollectionViewAll href="/clearance-stock" />}
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
        {!isLoading && !error && latestTotal > 10 && <HomeCollectionViewAll href="/allstock" />}
      </section>

      {/* Premium Stock Teaser Section */}
      <PremiumTeaserSection
        vehicles={premiumTeaser}
        total={premiumTotal}
        isLoading={isLoading}
        error={error}
        onRetry={loadData}
      />

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

const HomeCollectionViewAll: React.FC<{ href: string }> = ({ href }) => (
  <div className="home-collection-view-all">
    <a href={href} className="button primary" aria-label="View all vehicles in this collection">
      View All
    </a>
  </div>
);
