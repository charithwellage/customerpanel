import React from 'react';
import type { VehicleDomainSummary } from '@carchief/domain';
import { VehicleCollection } from '../../vehicles/components/VehicleCollection';

export interface PremiumTeaserSectionProps {
  vehicles: VehicleDomainSummary[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const PremiumTeaserSection: React.FC<PremiumTeaserSectionProps> = ({ vehicles, isLoading, error, onRetry }) => {
  return (
    <section aria-labelledby="premium-banner-heading" className="premium-teaser-banner">
      <div className="home-section-header">
        <span className="home-section-eyebrow">Exclusive Collection</span>
        <h2 id="premium-banner-heading" className="home-section-title-lg">
          Premium Stock Teaser
        </h2>
        <p className="home-section-subtitle">
          Browse up to 10 curated high-grade vehicles available for immediate reservation.
        </p>
      </div>

      <VehicleCollection
        vehicles={vehicles}
        isLoading={isLoading}
        error={error}
        onRetry={onRetry}
        emptyTitle="No Premium Vehicles Currently Available"
        emptyDescription="There are currently no vehicles matching the Premium criteria for the selected market."
      />

      <div className="premium-teaser-footer">
        <a href="/inventory?category=premium" className="button primary premium-teaser-link">
          Browse all Premium Stock
        </a>

        <div className="premium-teaser-contact">
          <a
            href="https://wa.me/256700000000?text=Hello%20CarChief,%20I%20am%20interested%20in%20Premium%20Stock"
            target="_blank"
            rel="noopener noreferrer"
            className="whatsapp-link"
          >
            💬 Chat with Sales on WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
};
