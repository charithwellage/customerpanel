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
    <section
      aria-labelledby="premium-banner-heading"
      style={{
        margin: '3rem 0',
        padding: '2rem 1.5rem',
        backgroundColor: 'var(--color-surface-dark, #171717)',
        color: 'var(--color-text-on-dark, #fafafa)',
        borderRadius: 'var(--radius-lg, 0.75rem)',
        border: '1px solid var(--color-border, #333333)',
      }}
    >
      <div style={{ marginBottom: '1.5rem' }}>
        <span
          style={{
            fontSize: '0.75rem',
            fontFamily: 'var(--font-mono, monospace)',
            fontWeight: 700,
            color: 'var(--color-primary, #dc2626)',
            textTransform: 'uppercase',
            display: 'block',
          }}
        >
          Exclusive Collection
        </span>
        <h2
          id="premium-banner-heading"
          style={{
            fontFamily: 'var(--font-display, sans-serif)',
            fontSize: '1.75rem',
            fontWeight: 800,
            margin: '0.25rem 0 0.5rem 0',
          }}
        >
          Premium Stock Teaser
        </h2>
        <p
          style={{
            fontSize: '0.9rem',
            color: '#a3a3a3',
            maxWidth: '650px',
            margin: 0,
          }}
        >
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

      <div
        style={{
          marginTop: '1.5rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <a
          href="/inventory?category=premium"
          className="button primary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            textDecoration: 'none',
          }}
        >
          Browse all Premium Stock
        </a>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <a
            href="https://wa.me/256700000000?text=Hello%20CarChief,%20I%20am%20interested%20in%20Premium%20Stock"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#25D366',
              fontWeight: 700,
              fontSize: '0.875rem',
              textDecoration: 'none',
            }}
          >
            💬 Chat with Sales on WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
};
