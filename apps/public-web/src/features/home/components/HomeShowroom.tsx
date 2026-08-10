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
      </section>

      <BuyingProcessPreview />
      <TestimonialsPreview />
      <FaqPreview />
    </div>
  );
};
