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
export * from './parser.js';
export * from './url-state.js';
export * from './VehicleSearchHero.js';
export * from './SearchFilterBar.js';
export * from './SearchResultsHeader.js';
export * from './SearchEmptyState.js';
export * from './SearchErrorState.js';
export * from './SearchPagination.js';
export * from './AiVehicleSearch.js';
export * from './useAiVehicleSearch.js';
//# sourceMappingURL=index.d.ts.map