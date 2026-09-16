import type { SearchVehiclesQuery } from '@carchief/domain';
/**
 * Parses search query parameters from URLSearchParams or a query string.
 */
export declare function parseUrlSearchQuery(source: URLSearchParams | string): SearchVehiclesQuery;
/**
 * Serializes SearchVehiclesQuery into URLSearchParams while omitting empty or default values.
 * Preserves additional context parameters (e.g. market, country, destinationPort, category, collection).
 */
export declare function serializeSearchQuery(query: SearchVehiclesQuery, existingParams?: URLSearchParams): URLSearchParams;
//# sourceMappingURL=url-state.d.ts.map