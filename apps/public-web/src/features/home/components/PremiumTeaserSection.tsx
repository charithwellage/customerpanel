import React from 'react';
import type { VehicleDomainSummary } from '@carchief/domain';
import { VehicleCollection } from '../../vehicles/components/VehicleCollection';

export interface PremiumTeaserSectionProps {
  vehicles: VehicleDomainSummary[];
  total?: number;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const PremiumTeaserSection: React.FC<PremiumTeaserSectionProps> = ({ vehicles, total = vehicles.length, isLoading, error, onRetry }) => {
  return (
    <section id="premium-stock" aria-labelledby="premium-banner-heading" className="premium-teaser-banner">
      <div className="home-section-header premium-section-header">
        <div className="premium-badge-tag">
          <span className="premium-badge-star" aria-hidden="true">👑</span>
          <span className="premium-badge-text">EXCLUSIVE VIP &amp; PERFORMANCE COLLECTION</span>
        </div>
        <h2 id="premium-banner-heading" className="home-section-title-lg premium-heading">
          Premium Stock Showcase
        </h2>
        <p className="home-section-subtitle premium-subtitle">
          Hand-picked, certified luxury SUVs, bespoke sports coupes, and executive flagship vehicles available for immediate international shipping.
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
        {total > 10 && (
          <a href="/premium-stock" className="button primary premium-teaser-link" aria-label="View all premium stock">
            <span>View All</span>
            <span aria-hidden="true">→</span>
          </a>
        )}
        <div className="premium-teaser-contact">
          <a
            href="https://wa.me/817092101426?text=Hello%20CarChief,%20I%20am%20interested%20in%20Premium%20Stock"
            target="_blank"
            rel="noopener noreferrer"
            className="whatsapp-link premium-whatsapp-btn"
          >
            <span aria-hidden="true">💬</span>
            <span>VIP Sales Concierge (+81-70-9210-1426)</span>
          </a>
        </div>
      </div>
    </section>
  );
};
