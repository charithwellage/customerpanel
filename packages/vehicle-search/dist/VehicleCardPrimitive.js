"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VehicleCardPrimitive = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const VehicleCardPrimitive = ({ vehicle, onSelect, actionHref, actionLabel = 'VIEW DETAILS', showDiscount = true, }) => {
    const primaryImage = vehicle.images?.[0];
    const hasDiscount = Boolean(showDiscount && vehicle.discountPercent && vehicle.discountPercent > 0);
    const discountedPrice = hasDiscount ? Math.round(vehicle.priceUsd * (1 - vehicle.discountPercent / 100)) : vehicle.priceUsd;
    const targetHref = actionHref || `/allstock/${vehicle.slug || vehicle.id}`;
    const handleCardClick = (e) => {
        if (onSelect) {
            onSelect(vehicle);
        }
    };
    const handleKeyDown = (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            if (onSelect) {
                event.preventDefault();
                onSelect(vehicle);
            }
        }
    };
    return ((0, jsx_runtime_1.jsxs)("article", { tabIndex: 0, role: "article", "aria-label": `${vehicle.year} ${vehicle.make} ${vehicle.model} - USD ${vehicle.priceUsd.toLocaleString()}`, onClick: handleCardClick, onKeyDown: handleKeyDown, "data-vehicle-id": vehicle.id, className: "cc-vehicle-card cc-vehicle-card--interactive", children: [(0, jsx_runtime_1.jsx)("a", { href: targetHref, className: "cc-vehicle-card__media-link", "aria-label": `View details for ${vehicle.year} ${vehicle.make} ${vehicle.model}`, children: (0, jsx_runtime_1.jsxs)("div", { className: "cc-vehicle-card__media", children: [primaryImage ? ((0, jsx_runtime_1.jsx)("img", { className: "cc-vehicle-card__image", src: primaryImage, alt: `${vehicle.make} ${vehicle.model}`, loading: "lazy", decoding: "async" })) : ((0, jsx_runtime_1.jsx)("div", { className: "cc-vehicle-card__image-fallback", children: (0, jsx_runtime_1.jsxs)("span", { className: "cc-vehicle-card__fallback-title", children: [vehicle.make, " ", vehicle.model] }) })), (0, jsx_runtime_1.jsx)("div", { className: "cc-vehicle-card__status", children: (0, jsx_runtime_1.jsxs)("span", { className: `cc-status-pill cc-status-pill--${(vehicle.status || 'Available').toLowerCase().replace(/\s+/g, '-')}`, children: [(0, jsx_runtime_1.jsx)("span", { className: "cc-status-pill__dot", children: "\u25CF" }), " ", vehicle.status.toUpperCase()] }) }), vehicle.locationStatus && (0, jsx_runtime_1.jsx)("span", { className: "cc-vehicle-card__location", children: vehicle.locationStatus })] }) }), (0, jsx_runtime_1.jsxs)("div", { className: "cc-vehicle-card__body", children: [(0, jsx_runtime_1.jsxs)("a", { href: targetHref, className: "cc-vehicle-card__title-link", children: [(0, jsx_runtime_1.jsxs)("span", { className: "cc-vehicle-card__eyebrow", children: [vehicle.year, " ", vehicle.make] }), (0, jsx_runtime_1.jsx)("h3", { className: "cc-vehicle-card__title", children: vehicle.model })] }), hasDiscount && (0, jsx_runtime_1.jsxs)("span", { className: "cc-vehicle-card__discount", children: ["-", vehicle.discountPercent, "% discount"] }), (0, jsx_runtime_1.jsxs)("div", { className: "cc-vehicle-card__footer", children: [(0, jsx_runtime_1.jsxs)("div", { className: "cc-vehicle-card__price-wrapper", children: [(0, jsx_runtime_1.jsx)("span", { className: "cc-vehicle-card__price-label", children: "Price" }), hasDiscount ? ((0, jsx_runtime_1.jsxs)("div", { className: "cc-vehicle-card__price-pair", children: [(0, jsx_runtime_1.jsxs)("span", { className: "cc-vehicle-card__price--original", children: ["$", vehicle.priceUsd.toLocaleString()] }), (0, jsx_runtime_1.jsxs)("span", { className: "cc-vehicle-card__price cc-vehicle-card__price--discounted", children: ["$", discountedPrice.toLocaleString()] })] })) : ((0, jsx_runtime_1.jsxs)("span", { className: "cc-vehicle-card__price", children: ["$", vehicle.priceUsd.toLocaleString()] }))] }), (0, jsx_runtime_1.jsxs)("a", { href: targetHref, className: "cc-vehicle-card__action-btn", children: [(0, jsx_runtime_1.jsx)("span", { children: actionLabel }), (0, jsx_runtime_1.jsxs)("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [(0, jsx_runtime_1.jsx)("line", { x1: "5", y1: "12", x2: "19", y2: "12" }), (0, jsx_runtime_1.jsx)("polyline", { points: "12 5 19 12 12 19" })] })] })] })] })] }));
};
exports.VehicleCardPrimitive = VehicleCardPrimitive;
//# sourceMappingURL=VehicleCardPrimitive.js.map