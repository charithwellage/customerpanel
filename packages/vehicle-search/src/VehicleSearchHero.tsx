import React from 'react';

export interface VehicleSearchHeroProps {
  title?: string;
  description?: string;
}

export function VehicleSearchHero({
  title = 'ALL STOCK INVENTORY',
  description = 'Search and dynamically filter our entire live vehicle inventory. Browse available models and connect with the CarChief team for a quotation.',
}: VehicleSearchHeroProps) {
  return (
    <section className="cc-allstock-hero">
      <div className="cc-allstock-hero__badge">FULL INVENTORY CATALOG</div>
      <h1 className="cc-allstock-hero__title">{title}</h1>
      <p className="cc-allstock-hero__description">{description}</p>
    </section>
  );
}
