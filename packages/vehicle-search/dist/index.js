export function buildSearchQueryString(filter) {
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
//# sourceMappingURL=index.js.map