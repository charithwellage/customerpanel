'use client';

import React from 'react';
import { VehicleService } from '@carchief/api-client';
import type { VehicleDetail } from '@carchief/domain';
import {
  formatVehicleTitle,
  getEffectivePrice,
  isVehicleAvailable,
} from '@carchief/vehicle-detail';

/**
 * VehicleDetailPage renders details for a single vehicle.
 * It handles loading, error, not-found and success states.
 * The UI follows COMMON_FRONTEND_RULES and is fully accessible.
 */
export default function VehicleDetailPage({ idOrSlug }: { idOrSlug: string }) {
  const [vehicle, setVehicle] = React.useState<VehicleDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [galleryIndex, setGalleryIndex] = React.useState(0);
  const touchStartX = React.useRef<number | null>(null);

  React.useEffect(() => {
    const service = new VehicleService();
    service
      .getVehicleDetail(idOrSlug)
      .then((data) => {
        setVehicle(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Unable to load vehicle details. Please try again later.');
        setLoading(false);
      });
  }, [idOrSlug]);

  if (loading) {
    return (
      <section aria-label="Vehicle detail loading" className="cc-vehicle-detail__loading">
        <div className="cc-spinner" role="status" aria-label="Loading vehicle details">
          <span className="cc-spinner__ring" aria-hidden="true" />
          <span className="sr-only">Loading&hellip;</span>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section aria-live="polite" className="cc-vehicle-detail__error">
        <p role="alert" className="cc-vehicle-detail__error-text">
          {error}
        </p>
        <a href="/vehicles" className="cc-vehicle-detail__back-link">
          Back to inventory
        </a>
      </section>
    );
  }

  if (!vehicle) {
    return (
      <section aria-live="polite" className="cc-vehicle-detail__not-found">
        <p role="alert" className="cc-vehicle-detail__not-found-text">
          Vehicle not found.
        </p>
        <a href="/vehicles" className="cc-vehicle-detail__back-link">
          Browse all vehicles
        </a>
      </section>
    );
  }

  const title = formatVehicleTitle(vehicle);
  const { priceText, isRequestPrice } = getEffectivePrice(vehicle);
  const available = isVehicleAvailable(vehicle.status);
  const isSold = vehicle.status === 'Sold';

  const galleryImages: string[] = vehicle.media.gallery ?? [];

  const specsRaw: { label: string; value: string | number | undefined }[] = [
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
  const specs = specsRaw.filter(
    (s): s is { label: string; value: string | number } =>
      s.value !== undefined && s.value !== '',
  );

  const totalImages = galleryImages.length;

  function prevImage() {
    setGalleryIndex((i) => (i === 0 ? totalImages - 1 : i - 1));
  }

  function nextImage() {
    setGalleryIndex((i) => (i === totalImages - 1 ? 0 : i + 1));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'ArrowLeft') { e.preventDefault(); prevImage(); }
    if (e.key === 'ArrowRight') { e.preventDefault(); nextImage(); }
  }

  function handleTouchStart(e: React.TouchEvent<HTMLDivElement>) {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd(e: React.TouchEvent<HTMLDivElement>) {
    if (touchStartX.current === null) return;
    const delta = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
    if (Math.abs(delta) > 40) {
      delta < 0 ? nextImage() : prevImage();
    }
    touchStartX.current = null;
  }

  const availabilityLabel = isSold ? 'Sold' : available ? 'Available' : vehicle.status;
  const availabilityVariant = isSold ? 'cc-badge--error' : available ? 'cc-badge--success' : 'cc-badge--warning';

  return (
    <article className="cc-vehicle-detail" aria-labelledby="vehicle-title">
      {/* Header */}
      <header className="cc-vehicle-detail__header">
        <h1 id="vehicle-title" className="cc-vehicle-detail__title">
          {title}
        </h1>
        <div className="cc-vehicle-detail__badge-row" aria-label="Status badges">
          <span
            className={`cc-badge ${isRequestPrice ? 'cc-badge--info' : 'cc-badge--success'}`}
            aria-label={`Price: ${priceText}`}
          >
            {priceText}
          </span>
          <span
            className={`cc-badge ${availabilityVariant}`}
            aria-label={`Availability: ${availabilityLabel}`}
          >
            {availabilityLabel}
          </span>
          {vehicle.discountPercent !== undefined && vehicle.discountPercent > 0 && (
            <span className="cc-badge cc-badge--warning" aria-label={`Discount: ${vehicle.discountPercent}%`}>
              {vehicle.discountPercent}% off
            </span>
          )}
        </div>
      </header>

      {/* Media Gallery */}
      <section className="cc-vehicle-detail__gallery" aria-label="Vehicle media gallery">
        <h2 className="sr-only">Media Gallery</h2>
        {totalImages > 0 ? (
          <div
            className="cc-gallery"
            role="region"
            aria-label={`Image ${galleryIndex + 1} of ${totalImages}`}
            tabIndex={0}
            onKeyDown={handleKeyDown}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className="cc-gallery__main">
              <img
                src={galleryImages[galleryIndex]}
                alt={`${title} — image ${galleryIndex + 1} of ${totalImages}`}
                className="cc-gallery__image"
                loading="eager"
              />
              {totalImages > 1 && (
                <>
                  <button
                    type="button"
                    className="cc-gallery__nav cc-gallery__nav--prev"
                    aria-label="Previous image"
                    onClick={prevImage}
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    className="cc-gallery__nav cc-gallery__nav--next"
                    aria-label="Next image"
                    onClick={nextImage}
                  >
                    ›
                  </button>
                </>
              )}
            </div>
            {totalImages > 1 && (
              <div className="cc-gallery__thumbs" role="tablist" aria-label="Gallery thumbnails">
                {galleryImages.map((src, idx) => (
                  <button
                    key={idx}
                    type="button"
                    role="tab"
                    aria-selected={idx === galleryIndex}
                    aria-label={`Image ${idx + 1}`}
                    className={`cc-gallery__thumb${idx === galleryIndex ? ' cc-gallery__thumb--active' : ''}`}
                    onClick={() => setGalleryIndex(idx)}
                  >
                    <img
                      src={src}
                      alt={`${title} thumbnail ${idx + 1}`}
                      className="cc-gallery__thumb-img"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="cc-gallery cc-gallery--empty" aria-label="No images available">
            <img
              src="/static/placeholder-vehicle.png"
              alt={`${title} — no images available`}
              className="cc-gallery__image cc-gallery__image--placeholder"
            />
          </div>
        )}
      </section>

      {/* Price CTA for request_price vehicles */}
      {isRequestPrice && (
        <section className="cc-vehicle-detail__cta" aria-label="Price enquiry">
          <p className="cc-vehicle-detail__cta-text">
            Contact us to get the best price for this vehicle.
          </p>
          <a
            href={`/contact?vehicle=${encodeURIComponent(vehicle.slug)}`}
            className="cc-btn cc-btn--primary"
            aria-label={`Request price for ${title}`}
          >
            Request Price
          </a>
        </section>
      )}

      {/* Specifications */}
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
