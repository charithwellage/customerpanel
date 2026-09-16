import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
const DEFAULT_SWIPE_THRESHOLD_PX = 40;
/**
 * Accessible vehicle media gallery shared by every CarChief application.
 *
 * Applications supply the already-projected, visibility-filtered image list; this
 * primitive owns only presentation and interaction. It emits no fixed DOM `id`
 * and nests no interactive controls, so it is safe to render more than once on a
 * page.
 */
export function VehicleGalleryPrimitive({ images, title, badges, swipeThresholdPx = DEFAULT_SWIPE_THRESHOLD_PX, }) {
    const [galleryIndex, setGalleryIndex] = React.useState(0);
    const [failedImages, setFailedImages] = React.useState(new Set());
    const touchStartX = React.useRef(null);
    const totalImages = images.length;
    const activeIndex = totalImages > 0 && galleryIndex >= totalImages ? 0 : galleryIndex;
    const prevImage = React.useCallback(() => {
        setGalleryIndex((i) => (i === 0 ? totalImages - 1 : i - 1));
    }, [totalImages]);
    const nextImage = React.useCallback(() => {
        setGalleryIndex((i) => (i === totalImages - 1 ? 0 : i + 1));
    }, [totalImages]);
    function handleKeyDown(event) {
        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            prevImage();
        }
        else if (event.key === 'ArrowRight') {
            event.preventDefault();
            nextImage();
        }
    }
    function handleTouchStart(event) {
        touchStartX.current = event.touches[0]?.clientX ?? null;
    }
    function handleTouchEnd(event) {
        if (touchStartX.current === null)
            return;
        const delta = (event.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
        if (Math.abs(delta) > swipeThresholdPx) {
            if (delta < 0) {
                nextImage();
            }
            else {
                prevImage();
            }
        }
        touchStartX.current = null;
    }
    if (totalImages === 0) {
        return (_jsx("div", { className: "cc-gallery cc-gallery--empty", children: _jsx("div", { className: "cc-gallery__placeholder", children: _jsx("p", { className: "cc-gallery__placeholder-text", children: "No images available for this vehicle yet." }) }) }));
    }
    return (_jsxs("div", { className: "cc-gallery", role: "region", "aria-label": `Image ${activeIndex + 1} of ${totalImages}`, tabIndex: 0, onKeyDown: handleKeyDown, onTouchStart: handleTouchStart, onTouchEnd: handleTouchEnd, children: [_jsxs("div", { className: "cc-gallery__main", children: [badges && badges.length > 0 && (_jsx("div", { className: "cc-gallery__badges", "aria-label": "Vehicle status", children: badges.map((badge) => (_jsx("span", { className: `cc-gallery__badge cc-gallery__badge--${badge.tone ?? 'neutral'}`, children: badge.label }, `${badge.label}-${badge.tone ?? 'neutral'}`))) })), failedImages.has(activeIndex) ? (_jsx("div", { className: "cc-gallery__image-fallback", role: "img", "aria-label": `${title} image unavailable`, children: _jsx("span", { children: "Vehicle image unavailable" }) })) : (_jsx("img", { src: images[activeIndex], alt: `${title} — image ${activeIndex + 1} of ${totalImages}`, className: "cc-gallery__image", loading: "eager", onError: () => setFailedImages((current) => new Set(current).add(activeIndex)) })), totalImages > 1 && (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", className: "cc-gallery__nav cc-gallery__nav--prev", "aria-label": "Previous image", onClick: prevImage, children: _jsx("span", { "aria-hidden": "true", children: "\u2039" }) }), _jsx("button", { type: "button", className: "cc-gallery__nav cc-gallery__nav--next", "aria-label": "Next image", onClick: nextImage, children: _jsx("span", { "aria-hidden": "true", children: "\u203A" }) }), _jsx("div", { className: "cc-gallery__dots", role: "tablist", "aria-label": "Slide indicators", children: images.map((_, idx) => (_jsx("button", { type: "button", role: "tab", className: `cc-gallery__dot${idx === activeIndex ? ' cc-gallery__dot--active' : ''}`, "aria-label": `Slide to image ${idx + 1}`, "aria-selected": idx === activeIndex, onClick: (e) => {
                                        e.stopPropagation();
                                        setGalleryIndex(idx);
                                    } }, `slide-dot-${idx}`))) })] }))] }), totalImages > 1 && (_jsx("div", { className: "cc-gallery__thumbs", role: "tablist", "aria-label": "Gallery thumbnails", children: images.map((src, idx) => (_jsx("button", { type: "button", role: "tab", "aria-selected": idx === activeIndex, "aria-current": idx === activeIndex ? 'true' : undefined, "aria-label": `Image ${idx + 1}`, className: `cc-gallery__thumb${idx === activeIndex ? ' cc-gallery__thumb--active' : ''}`, onClick: () => setGalleryIndex(idx), children: _jsx("img", { src: src, alt: `${title} thumbnail ${idx + 1}`, className: "cc-gallery__thumb-img", loading: "lazy", onError: () => setFailedImages((current) => new Set(current).add(idx)) }) }, `${src}-${idx}`))) }))] }));
}
//# sourceMappingURL=VehicleGalleryPrimitive.js.map