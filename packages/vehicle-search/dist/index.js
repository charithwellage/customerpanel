"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSearchQueryString = buildSearchQueryString;
function buildSearchQueryString(filter) {
    const params = new URLSearchParams();
    if (filter.make)
        params.set('make', filter.make);
    if (filter.model)
        params.set('model', filter.model);
    if (filter.yearFrom)
        params.set('yearFrom', String(filter.yearFrom));
    if (filter.yearTo)
        params.set('yearTo', String(filter.yearTo));
    if (filter.maxPriceUsd)
        params.set('maxPriceUsd', String(filter.maxPriceUsd));
    return params.toString();
}
__exportStar(require("./VehicleCardPrimitive.js"), exports);
__exportStar(require("./VehicleCollectionPrimitive.js"), exports);
__exportStar(require("./SearchFilterBarPrimitive.js"), exports);
__exportStar(require("./parser.js"), exports);
__exportStar(require("./url-state.js"), exports);
//# sourceMappingURL=index.js.map