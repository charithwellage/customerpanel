"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoicedRegistry = InvoicedRegistry;
exports.SoldOutRegistry = SoldOutRegistry;
exports.VehiclePaymentAllocations = VehiclePaymentAllocations;
exports.SalesmanTTApprovedBanner = SalesmanTTApprovedBanner;
const jsx_runtime_1 = require("react/jsx-runtime");
function InvoicedRegistry() {
    return ((0, jsx_runtime_1.jsxs)("div", { className: "bg-neutral-900 border border-neutral-800 rounded-xl p-6 text-white space-y-4", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-sm font-extrabold uppercase tracking-wider text-red-500", children: "Invoiced Registry" }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-neutral-400", children: "Archive of issued proforma invoices, payment statuses, and 72-hour timers." })] }));
}
function SoldOutRegistry() {
    return ((0, jsx_runtime_1.jsxs)("div", { className: "bg-neutral-900 border border-neutral-800 rounded-xl p-6 text-white space-y-4", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-sm font-extrabold uppercase tracking-wider text-red-500", children: "Sold Out Vehicle Registry" }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-neutral-400", children: "Historical archive of completed sales, final purchase prices, and customer destinations." })] }));
}
function VehiclePaymentAllocations() {
    return ((0, jsx_runtime_1.jsxs)("div", { className: "bg-neutral-900 border border-neutral-800 rounded-xl p-6 text-white space-y-4", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-sm font-extrabold uppercase tracking-wider text-red-500", children: "Vehicle Payment Allocations" }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-neutral-400", children: "Allocate TT bank transfer proofs to specific invoices without double-spending funds." })] }));
}
function SalesmanTTApprovedBanner() {
    return ((0, jsx_runtime_1.jsx)("div", { className: "bg-emerald-950 border border-emerald-800 text-emerald-300 p-4 rounded-xl flex items-center justify-between text-xs font-bold uppercase", children: (0, jsx_runtime_1.jsx)("span", { children: "TT Payment Approved by Finance \u2014 Vehicle Ready for Shipment Booking" }) }));
}
//# sourceMappingURL=InvoicedRegistry.js.map