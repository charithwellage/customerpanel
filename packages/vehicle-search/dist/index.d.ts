export interface VehicleSearchFilter {
    make?: string;
    model?: string;
    yearFrom?: number;
    yearTo?: number;
    maxPriceUsd?: number;
}
export declare function buildSearchQueryString(filter: VehicleSearchFilter): string;
export * from './VehicleCardPrimitive.js';
export * from './VehicleCollectionPrimitive.js';
export * from './SearchFilterBarPrimitive.js';
export * from './parser.js';
export * from './url-state.js';
//# sourceMappingURL=index.d.ts.map