"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VehicleCollectionPrimitive = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const VehicleCardPrimitive_js_1 = require("./VehicleCardPrimitive.js");
const VehicleCollectionPrimitive = ({ title, description, vehicles, isLoading = false, error = null, emptyTitle = 'No vehicles found', emptyDescription = 'No available stock matches the selected collection or market criteria.', onRetry, onSelectVehicle, getVehicleHref, }) => {
    const autoId = (0, react_1.useId)();
    const headingId = title
        ? `collection-heading-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${autoId.replace(/[^a-z0-9_-]/gi, '')}`
        : undefined;
    return ((0, jsx_runtime_1.jsxs)("section", { "aria-labelledby": headingId, className: "cc-vehicle-collection", children: [title && ((0, jsx_runtime_1.jsxs)("header", { className: "cc-vehicle-collection__header", children: [(0, jsx_runtime_1.jsx)("h2", { id: headingId, className: "cc-vehicle-collection__title", children: title }), description && (0, jsx_runtime_1.jsx)("p", { className: "cc-vehicle-collection__description", children: description })] })), isLoading && ((0, jsx_runtime_1.jsx)("div", { role: "status", "aria-live": "polite", className: "cc-vehicle-collection__state", children: "Loading vehicle collection..." })), !isLoading && error && ((0, jsx_runtime_1.jsxs)("div", { role: "alert", className: "cc-vehicle-collection__state cc-vehicle-collection__state--error", children: [(0, jsx_runtime_1.jsx)("strong", { children: "Error loading inventory:" }), (0, jsx_runtime_1.jsx)("span", { children: error }), onRetry && ((0, jsx_runtime_1.jsx)("button", { type: "button", onClick: onRetry, className: "cc-vehicle-collection__retry", children: "Retry" }))] })), !isLoading && !error && vehicles.length === 0 && ((0, jsx_runtime_1.jsxs)("div", { role: "region", "aria-label": "Empty vehicle collection", className: "cc-vehicle-collection__state cc-vehicle-collection__state--empty", children: [(0, jsx_runtime_1.jsx)("h3", { children: emptyTitle }), (0, jsx_runtime_1.jsx)("p", { children: emptyDescription })] })), !isLoading && !error && vehicles.length > 0 && ((0, jsx_runtime_1.jsx)("div", { className: "cc-vehicle-collection__grid", children: vehicles.map((vehicle) => ((0, jsx_runtime_1.jsx)(VehicleCardPrimitive_js_1.VehicleCardPrimitive, { vehicle: vehicle, onSelect: onSelectVehicle, actionHref: getVehicleHref?.(vehicle) }, vehicle.id))) }))] }));
};
exports.VehicleCollectionPrimitive = VehicleCollectionPrimitive;
//# sourceMappingURL=VehicleCollectionPrimitive.js.map