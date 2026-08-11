import React, { useState, useRef } from 'react';

export interface VehicleGalleryPrimitiveProps {
  images: string[];
  title: string;
}

export function VehicleGalleryPrimitive({ images, title }: VehicleGalleryPrimitiveProps) {
  const [galleryIndex, setGalleryIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const totalImages = images.length;
  const activeIndex = totalImages > 0 && galleryIndex >= totalImages ? 0 : galleryIndex;

  if (totalImages === 0) {
    return (
      <section className="cc-gallery cc-gallery--empty" aria-label="No images available">
        <div className="cc-gallery__placeholder">
          <p className="cc-gallery__placeholder-text">No images available for this vehicle yet.</p>
        </div>
      </section>
    );
  }

  function prevImage() {
    setGalleryIndex((i: number) => (i === 0 ? totalImages - 1 : i - 1));
  }

  function nextImage() {
    setGalleryIndex((i: number) => (i === totalImages - 1 ? 0 : i + 1));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prevImage();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      nextImage();
    }
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
        <img
          src={images[activeIndex]}
          alt={`${title} — image ${activeIndex + 1} of ${totalImages}`}
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
          {images.map((src, idx) => (
            <button
              key={idx}
              type="button"
              role="tab"
              aria-selected={idx === activeIndex}
              aria-label={`Image ${idx + 1}`}
              className={`cc-gallery__thumb${idx === activeIndex ? ' cc-gallery__thumb--active' : ''}`}
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
  );
}
