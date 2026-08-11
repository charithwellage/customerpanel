'use client';

import React from 'react';
import type { VehicleDetail } from '@carchief/domain';
import {
  VehicleGalleryPrimitive,
  formatVehicleTitle,
  getEffectivePrice,
  getVisibleGalleryImages,
  isVehicleAvailable,
  serializeJsonLd,
} from '@carchief/vehicle-detail';

const TOAST_DISMISS_MS = 3000;

export interface VehicleDetailPageProps {
  vehicle: VehicleDetail;
}

/**
 * Public vehicle detail composition.
 *
 * Presentational only: the route resolves the vehicle through
 * `loadVehicleDetail` and answers 404s, so this component never fetches and has
 * no not-found or loading branch of its own. Gallery behaviour is consumed from
 * `@carchief/vehicle-detail` rather than reimplemented here.
 */
export default function VehicleDetailPage({ vehicle }: VehicleDetailPageProps) {
  const [copiedToast, setCopiedToast] = React.useState(false);
  const titleId = React.useId();

  const title = formatVehicleTitle(vehicle);
  const { priceText, isRequestPrice } = getEffectivePrice(vehicle);
  const available = isVehicleAvailable(vehicle.status);
  const isSold = vehicle.status === 'Sold';
  const galleryImages = getVisibleGalleryImages(vehicle.media);

  const specRows: { label: string; value: string | number | undefined }[] = [
    { label: 'Body Style', value: vehicle.bodyStyle },
    { label: 'Fuel Type', value: vehicle.fuelType },
    { label: 'Transmission', value: vehicle.transmission },
    { label: 'Drive Train', value: vehicle.driveTrain },
    { label: 'Mileage', value: vehicle.mileage !== undefined ? `${vehicle.mileage.toLocaleString()} km` : undefined },
    { label: 'Engine', value: vehicle.engineSize },
    { label: 'Color', value: vehicle.color },
    { label: 'Stock Type', value: vehicle.stockType },
    { label: 'Location', value: vehicle.locationStatus },
    { label: 'Destination', value: vehicle.destinationPort },
    { label: 'ETD', value: vehicle.etd },
    { label: 'ETA', value: vehicle.eta },
  ];

  const specs = specRows.filter(
    (spec): spec is { label: string; value: string | number } => spec.value !== undefined && spec.value !== '',
  );

  async function handleShare() {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text: `Check out this ${title} on CarChief!`, url });
        return;
      } catch {
        // The visitor dismissed the share sheet, or the platform refused it.
        // Fall through to the clipboard path rather than reporting a failure.
      }
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        setCopiedToast(true);
        setTimeout(() => setCopiedToast(false), TOAST_DISMISS_MS);
      } catch (error) {
        console.error('Clipboard copy failed', error);
      }
    }
  }

  const availabilityLabel = isSold ? 'Sold' : available ? 'Available' : vehicle.status;
  const availabilityVariant = isSold ? 'cc-badge--error' : available ? 'cc-badge--success' : 'cc-badge--warning';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Vehicle',
    name: title,
    description: `Buy ${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.bodyStyle ?? 'Vehicle'}). Mileage: ${vehicle.mileage ? vehicle.mileage.toLocaleString() + ' km' : 'N/A'}. Location: ${vehicle.locationStatus ?? 'In Stock'}. Stock ID: ${vehicle.slug}.`,
    vehicleModelDate: vehicle.year,
    brand: { '@type': 'Brand', name: vehicle.make },
    model: vehicle.model,
    bodyType: vehicle.bodyStyle,
    fuelType: vehicle.fuelType,
    vehicleEngine: vehicle.engineSize
      ? { '@type': 'EngineSpecification', engineDisplacement: vehicle.engineSize }
      : undefined,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'USD',
      price: vehicle.discountedPriceUsd ?? vehicle.priceUsd,
      availability: available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/UsedCondition',
    },
  };

  return (
    <article className="cc-vehicle-detail" aria-labelledby={titleId}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />

      <header className="cc-vehicle-detail__header">
        <h1 id={titleId} className="cc-vehicle-detail__title">
          {title}
        </h1>
        <div className="cc-vehicle-detail__badge-row" aria-label="Status badges">
          <span
            className={`cc-badge ${isRequestPrice ? 'cc-badge--info' : 'cc-badge--success'}`}
            aria-label={`Price: ${priceText}`}
          >
            {priceText}
          </span>
          <span className={`cc-badge ${availabilityVariant}`} aria-label={`Availability: ${availabilityLabel}`}>
            {availabilityLabel}
          </span>
          {vehicle.discountPercent !== undefined && vehicle.discountPercent > 0 && (
            <span className="cc-badge cc-badge--warning" aria-label={`Discount: ${vehicle.discountPercent}%`}>
              {vehicle.discountPercent}% off
            </span>
          )}
        </div>

        <div className="cc-vehicle-detail__utility-bar" aria-label="Page actions">
          <button
            type="button"
            className="cc-btn cc-btn--secondary cc-btn--sm"
            onClick={handleShare}
            aria-label="Share vehicle page"
          >
            Share
          </button>
          <button
            type="button"
            className="cc-btn cc-btn--secondary cc-btn--sm"
            onClick={() => typeof window !== 'undefined' && window.print()}
            aria-label="Print spec sheet"
          >
            Print Spec Sheet
          </button>
          {copiedToast && (
            <span className="cc-toast" role="status" aria-live="polite">
              Link copied to clipboard!
            </span>
          )}
        </div>
      </header>

      <section className="cc-vehicle-detail__gallery" aria-label="Vehicle media gallery">
        <h2 className="sr-only">Media Gallery</h2>
        <VehicleGalleryPrimitive images={galleryImages} title={title} />
      </section>

      {/* Contact intent actions (PUB-28). These declare intent only — the site
          never claims a message, call or hand-off completed (RULE-10). */}
      <section className="cc-vehicle-detail__cta" aria-label="Contact options">
        {isRequestPrice && (
          <p className="cc-vehicle-detail__cta-text">Contact us to get the best price for this vehicle.</p>
        )}
        <div className="cc-vehicle-detail__actions">
          <a
            href={`/contact?vehicle=${encodeURIComponent(vehicle.slug)}`}
            className="cc-btn cc-btn--primary"
            aria-label={isRequestPrice ? 'Request Price' : 'General Enquiry'}
          >
            {isRequestPrice ? 'Request Price' : 'General Enquiry'}
          </a>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`Enquiry about ${title} (${vehicle.slug})`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="cc-btn cc-btn--secondary"
            aria-label="WhatsApp Intent"
          >
            WhatsApp Intent
          </a>
          <a
            href={`mailto:info@carchief.example?subject=${encodeURIComponent(`Enquiry: ${title}`)}`}
            className="cc-btn cc-btn--secondary"
            aria-label="Email Intent"
          >
            Email Intent
          </a>
        </div>
      </section>

      {specs.length > 0 && (
        <section className="cc-vehicle-detail__specs" aria-label="Vehicle specifications">
          <h2 className="cc-vehicle-detail__section-heading">Specifications</h2>
          <dl className="cc-specs-list">
            {specs.map((spec) => (
              <div key={spec.label} className="cc-specs-list__item">
                <dt className="cc-specs-list__label">{spec.label}</dt>
                <dd className="cc-specs-list__value">{spec.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </article>
  );
}
