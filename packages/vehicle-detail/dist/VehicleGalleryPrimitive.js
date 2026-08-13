"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VehicleGalleryPrimitive = VehicleGalleryPrimitive;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importDefault(require("react"));
const DEFAULT_SWIPE_THRESHOLD_PX = 40;
/**
 * Accessible vehicle media gallery shared by every CarChief application.
 *
 * Applications supply the already-projected, visibility-filtered image list; this
 * primitive owns only presentation and interaction. It emits no fixed DOM `id`
 * and nests no interactive controls, so it is safe to render more than once on a
 * page.
 */
function VehicleGalleryPrimitive({ images, title, swipeThresholdPx = DEFAULT_SWIPE_THRESHOLD_PX, }) {
    const [galleryIndex, setGalleryIndex] = react_1.default.useState(0);
    const touchStartX = react_1.default.useRef(null);
    const totalImages = images.length;
    const activeIndex = totalImages > 0 && galleryIndex >= totalImages ? 0 : galleryIndex;
    const prevImage = react_1.default.useCallback(() => {
        setGalleryIndex((i) => (i === 0 ? totalImages - 1 : i - 1));
    }, [totalImages]);
    const nextImage = react_1.default.useCallback(() => {
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
        return ((0, jsx_runtime_1.jsx)("div", { className: "cc-gallery cc-gallery--empty", children: (0, jsx_runtime_1.jsx)("div", { className: "cc-gallery__placeholder", children: (0, jsx_runtime_1.jsx)("p", { className: "cc-gallery__placeholder-text", children: "No images available for this vehicle yet." }) }) }));
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: "cc-gallery", role: "region", "aria-label": `Image ${activeIndex + 1} of ${totalImages}`, tabIndex: 0, onKeyDown: handleKeyDown, onTouchStart: handleTouchStart, onTouchEnd: handleTouchEnd, children: [(0, jsx_runtime_1.jsxs)("div", { className: "cc-gallery__main", children: [(0, jsx_runtime_1.jsx)("img", { src: images[activeIndex], alt: `${title} — image ${activeIndex + 1} of ${totalImages}`, className: "cc-gallery__image", loading: "eager" }), totalImages > 1 && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("button", { type: "button", className: "cc-gallery__nav cc-gallery__nav--prev", "aria-label": "Previous image", onClick: prevImage, children: (0, jsx_runtime_1.jsx)("span", { "aria-hidden": "true", children: "\u2039" }) }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: "cc-gallery__nav cc-gallery__nav--next", "aria-label": "Next image", onClick: nextImage, children: (0, jsx_runtime_1.jsx)("span", { "aria-hidden": "true", children: "\u203A" }) })] }))] }), totalImages > 1 && ((0, jsx_runtime_1.jsx)("div", { className: "cc-gallery__thumbs", role: "tablist", "aria-label": "Gallery thumbnails", children: images.map((src, idx) => ((0, jsx_runtime_1.jsx)("button", { type: "button", role: "tab", "aria-selected": idx === activeIndex, "aria-label": `Image ${idx + 1}`, className: `cc-gallery__thumb${idx === activeIndex ? ' cc-gallery__thumb--active' : ''}`, onClick: () => setGalleryIndex(idx), children: (0, jsx_runtime_1.jsx)("img", { src: src, alt: `${title} thumbnail ${idx + 1}`, className: "cc-gallery__thumb-img", loading: "lazy" }) }, `${src}-${idx}`))) }))] }));
}
//# sourceMappingURL=VehicleGalleryPrimitive.js.map