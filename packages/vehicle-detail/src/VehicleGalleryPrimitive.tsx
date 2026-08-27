import React from 'react';

export interface VehicleGalleryPrimitiveProps {
  images: string[];
  title: string;
  badges?: Array<{ label: string; tone?: 'neutral' | 'success' | 'warning' | 'error' | 'info' }>;
  /** Minimum horizontal travel, in pixels, before a touch gesture counts as a swipe. */
  swipeThresholdPx?: number;
}

const DEFAULT_SWIPE_THRESHOLD_PX = 40;

/**
 * Accessible vehicle media gallery shared by every CarChief application.
 *
 * Applications supply the already-projected, visibility-filtered image list; this
 * primitive owns only presentation and interaction. It emits no fixed DOM `id`
 * and nests no interactive controls, so it is safe to render more than once on a
 * page.
 */
export function VehicleGalleryPrimitive({
  images,
  title,
  badges,
  swipeThresholdPx = DEFAULT_SWIPE_THRESHOLD_PX,
}: VehicleGalleryPrimitiveProps) {
  const [galleryIndex, setGalleryIndex] = React.useState(0);
  const [failedImages, setFailedImages] = React.useState<Set<number>>(new Set());
  const touchStartX = React.useRef<number | null>(null);

  const totalImages = images.length;
  const activeIndex = totalImages > 0 && galleryIndex >= totalImages ? 0 : galleryIndex;

  const prevImage = React.useCallback(() => {
    setGalleryIndex((i) => (i === 0 ? totalImages - 1 : i - 1));
  }, [totalImages]);

  const nextImage = React.useCallback(() => {
    setGalleryIndex((i) => (i === totalImages - 1 ? 0 : i + 1));
  }, [totalImages]);

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      prevImage();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      nextImage();
    }
  }

  function handleTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    if (touchStartX.current === null) return;
    const delta = (event.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
    if (Math.abs(delta) > swipeThresholdPx) {
      if (delta < 0) {
        nextImage();
      } else {
        prevImage();
      }
    }
    touchStartX.current = null;
  }

  if (totalImages === 0) {
    return (
      <div className="cc-gallery cc-gallery--empty">
        <div className="cc-gallery__placeholder">
          <p className="cc-gallery__placeholder-text">No images available for this vehicle yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="cc-gallery"
      role="region"
      aria-label={`Image ${activeIndex + 1} of ${totalImages}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="cc-gallery__main">
        {badges && badges.length > 0 && (
          <div className="cc-gallery__badges" aria-label="Vehicle status">
            {badges.map((badge) => (
              <span key={`${badge.label}-${badge.tone ?? 'neutral'}`} className={`cc-gallery__badge cc-gallery__badge--${badge.tone ?? 'neutral'}`}>
                {badge.label}
              </span>
            ))}
          </div>
        )}
        {failedImages.has(activeIndex) ? (
          <div className="cc-gallery__image-fallback" role="img" aria-label={`${title} image unavailable`}>
            <span>Vehicle image unavailable</span>
          </div>
        ) : (
          <img
            src={images[activeIndex]}
            alt={`${title} — image ${activeIndex + 1} of ${totalImages}`}
            className="cc-gallery__image"
            loading="eager"
            onError={() => setFailedImages((current) => new Set(current).add(activeIndex))}
          />
        )}
        {totalImages > 1 && (
          <>
            <button
              type="button"
              className="cc-gallery__nav cc-gallery__nav--prev"
              aria-label="Previous image"
              onClick={prevImage}
            >
              <span aria-hidden="true">&lsaquo;</span>
            </button>
            <button
              type="button"
              className="cc-gallery__nav cc-gallery__nav--next"
              aria-label="Next image"
              onClick={nextImage}
            >
              <span aria-hidden="true">&rsaquo;</span>
            </button>
            <div className="cc-gallery__dots" role="tablist" aria-label="Slide indicators">
              {images.map((_, idx) => (
                <button
                  key={`slide-dot-${idx}`}
                  type="button"
                  role="tab"
                  className={`cc-gallery__dot${idx === activeIndex ? ' cc-gallery__dot--active' : ''}`}
                  aria-label={`Slide to image ${idx + 1}`}
                  aria-selected={idx === activeIndex}
                  onClick={(e) => {
                    e.stopPropagation();
                    setGalleryIndex(idx);
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>
      {totalImages > 1 && (
        <div className="cc-gallery__thumbs" role="tablist" aria-label="Gallery thumbnails">
          {images.map((src, idx) => (
            <button
              key={`${src}-${idx}`}
              type="button"
              role="tab"
              aria-selected={idx === activeIndex}
              aria-current={idx === activeIndex ? 'true' : undefined}
              aria-label={`Image ${idx + 1}`}
              className={`cc-gallery__thumb${idx === activeIndex ? ' cc-gallery__thumb--active' : ''}`}
              onClick={() => setGalleryIndex(idx)}
            >
              <img
                src={src}
                alt={`${title} thumbnail ${idx + 1}`}
                className="cc-gallery__thumb-img"
                loading="lazy"
                onError={() => setFailedImages((current) => new Set(current).add(idx))}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
